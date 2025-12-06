"""
Vector Database Manager
Handles ChromaDB for RAG (Retrieval Augmented Generation)
Enables semantic search across legal documents
"""

import os
import logging
from typing import List, Dict, Optional, Union
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions

from .config import AIConfig
from .embedding_service import embedding_service

logger = logging.getLogger(__name__)


class VectorDBManager:
    """
    Manages ChromaDB for semantic search and RAG
    
    Features:
    - Persistent vector storage
    - Hugging Face embeddings (legal-bge-m3)
    - Semantic similarity search
    - Document metadata management
    - Collection management
    """
    
    def __init__(self):
        """Initialize ChromaDB client"""
        self.persist_directory = AIConfig.CHROMA_PERSIST_DIRECTORY
        
        # Ensure directory exists
        os.makedirs(self.persist_directory, exist_ok=True)
        
        # Initialize ChromaDB client
        try:
            self.client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            logger.info(f"✅ ChromaDB initialized at {self.persist_directory}")
        except Exception as e:
            logger.error(f"❌ ChromaDB initialization failed: {e}")
            self.client = None
        
        # Initialize collection
        self.collection = None
        self._init_collection()
    
    def _init_collection(self):
        """Initialize or get existing collection"""
        if not self.client:
            return
        
        try:
            # Create custom embedding function using Hugging Face legal-bge-m3
            # Using DefaultEmbeddingFunction wrapper for ChromaDB compatibility
            from chromadb.api.types import EmbeddingFunction
            
            class LegalBGEEmbeddings(EmbeddingFunction):
                """Custom embedding function for ChromaDB using legal-bge-m3"""
                
                def __call__(self, input: Union[List[str], str]) -> List[List[float]]:
                    """Generate embeddings for texts"""
                    try:
                        texts = [input] if isinstance(input, str) else input
                        embeddings = embedding_service.get_embeddings(texts)
                        # Ensure proper format: list of lists
                        if embeddings and isinstance(embeddings[0], list):
                            return embeddings
                        elif embeddings and isinstance(embeddings[0], (int, float)):
                            return [embeddings]
                        return embeddings
                    except Exception as e:
                        logger.error(f"❌ Embedding generation error: {e}")
                        # Return zero vectors as fallback (BGE-M3 has 1024 dimensions)
                        texts_list = [input] if isinstance(input, str) else input
                        return [[0.0] * 1024 for _ in texts_list]
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name=AIConfig.COLLECTION_NAME,
                embedding_function=LegalBGEEmbeddings(),
                metadata={"description": "Legal documents for RAG", "embedding_model": "BAAI/bge-m3"}
            )
            
            doc_count = self.collection.count()
            logger.info(f"📚 Collection '{AIConfig.COLLECTION_NAME}' loaded with {doc_count} documents")
        
        except Exception as e:
            logger.error(f"❌ Collection initialization failed: {e}")
            self.collection = None
    
    def add_documents(
        self,
        documents: List[str],
        metadatas: Optional[List[Dict]] = None,
        ids: Optional[List[str]] = None
    ) -> bool:
        """
        Add documents to the vector database
        
        Args:
            documents: List of document texts
            metadatas: Optional metadata for each document
            ids: Optional unique IDs for documents
        
        Returns:
            Success status
        """
        if not self.collection:
            logger.error("Collection not initialized")
            return False
        
        try:
            # Generate IDs if not provided
            if not ids:
                import uuid
                ids = [str(uuid.uuid4()) for _ in documents]
            
            # Generate default metadata if not provided
            if not metadatas:
                metadatas = [{"source": "manual_upload"} for _ in documents]
            
            # Add to collection
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            
            logger.info(f"✅ Added {len(documents)} documents to collection")
            return True
        
        except Exception as e:
            logger.error(f"❌ Failed to add documents: {e}")
            return False
    
    def search(
        self,
        query: str,
        n_results: int = None,
        where: Optional[Dict] = None,
        include_distances: bool = True
    ) -> Dict:
        """
        Search for similar documents
        
        Args:
            query: Search query
            n_results: Number of results to return
            where: Metadata filter
            include_distances: Include similarity scores
        
        Returns:
            Search results with documents, metadatas, and distances
        """
        if not self.collection:
            logger.error("Collection not initialized")
            return {"documents": [], "metadatas": [], "distances": []}
        
        try:
            n_results = n_results or AIConfig.TOP_K_RETRIEVAL
            
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where,
                include=['documents', 'metadatas', 'distances']
            )
            
            # Flatten results (ChromaDB returns nested lists)
            flattened = {
                'documents': results['documents'][0] if results['documents'] else [],
                'metadatas': results['metadatas'][0] if results['metadatas'] else [],
                'distances': results['distances'][0] if results['distances'] else []
            }
            
            logger.info(f"🔍 Search: '{query[:50]}...' | Found {len(flattened['documents'])} results")
            return flattened
        
        except Exception as e:
            logger.error(f"❌ Search failed: {e}")
            return {"documents": [], "metadatas": [], "distances": []}
    
    def get_context_for_query(
        self,
        query: str,
        n_results: int = None,
        max_tokens: int = 2000
    ) -> str:
        """
        Get relevant context for a query (for RAG)
        
        Args:
            query: User query
            n_results: Number of documents to retrieve
            max_tokens: Maximum tokens in context
        
        Returns:
            Formatted context string
        """
        results = self.search(query, n_results)
        
        if not results['documents']:
            return ""
        
        context = "**Relevant Legal Information:**\n\n"
        
        for i, (doc, metadata, distance) in enumerate(zip(
            results['documents'],
            results['metadatas'],
            results['distances']
        ), 1):
            # Calculate similarity score (1 - distance for cosine similarity)
            similarity = 1 - distance
            
            # Only include high-quality results
            if similarity < 0.7:
                continue
            
            source = metadata.get('source', 'Unknown')
            doc_type = metadata.get('type', 'Document')
            
            context += f"**{i}. {doc_type}** (Source: {source}, Relevance: {similarity:.1%})\n"
            context += f"{doc}\n\n"
            
            # Check token limit (rough estimate)
            if len(context) > max_tokens * 4:  # ~4 chars per token
                break
        
        if context == "**Relevant Legal Information:**\n\n":
            return ""
        
        return context
    
    def delete_collection(self) -> bool:
        """Delete the entire collection"""
        if not self.client:
            return False
        
        try:
            self.client.delete_collection(AIConfig.COLLECTION_NAME)
            logger.info(f"🗑️  Collection '{AIConfig.COLLECTION_NAME}' deleted")
            self._init_collection()
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete collection: {e}")
            return False
    
    def get_stats(self) -> Dict:
        """Get collection statistics"""
        if not self.collection:
            return {"error": "Collection not initialized"}
        
        try:
            count = self.collection.count()
            
            # Get sample documents to show types
            sample = self.collection.peek(10)
            doc_types = set()
            sources = set()
            
            for metadata in sample.get('metadatas', []):
                if metadata:
                    doc_types.add(metadata.get('type', 'Unknown'))
                    sources.add(metadata.get('source', 'Unknown'))
            
            return {
                'total_documents': count,
                'collection_name': AIConfig.COLLECTION_NAME,
                'document_types': list(doc_types),
                'sources': list(sources),
                'persist_directory': self.persist_directory
            }
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {"error": str(e)}


# Singleton instance
vector_db = VectorDBManager()
