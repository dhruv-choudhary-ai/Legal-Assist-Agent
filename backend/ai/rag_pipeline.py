"""
RAG Pipeline
Retrieval Augmented Generation for legal documents
"""

import logging
from typing import List, Dict, Optional, Union, Generator

from .azure_openai_service import ai_service
from .vectordb_manager import vector_db
from .document_processor import doc_processor
from .prompt_templates import PromptTemplates
from .config import AIConfig

logger = logging.getLogger(__name__)


class RAGPipeline:
    """
    Complete RAG pipeline for legal assistant
    
    Flow:
    1. User query
    2. Retrieve relevant documents from vector DB
    3. Augment prompt with retrieved context
    4. Generate response with GPT-4o-mini
    5. Return response with citations
    """
    
    def __init__(self):
        """Initialize RAG pipeline"""
        self.enabled = AIConfig.ENABLE_RAG
        logger.info(f"🔗 RAG Pipeline initialized (enabled={self.enabled})")
    
    def query_with_rag(
        self,
        user_query: str,
        conversation_history: Optional[List[Dict]] = None,
        n_results: int = None,
        stream: bool = False,
        include_citations: bool = True
    ) -> Union[str, Dict, Generator]:
        """
        Query with RAG
        
        Args:
            user_query: User's question
            conversation_history: Previous messages
            n_results: Number of documents to retrieve
            stream: Whether to stream response
            include_citations: Include source citations
        
        Returns:
            Response (string, dict with citations, or generator)
        """
        if not self.enabled:
            logger.info("RAG disabled, using standard chat")
            return ai_service.legal_chat(user_query, conversation_history, stream=stream)
        
        try:
            # Step 1: Retrieve relevant documents
            logger.info(f"🔍 RAG Query: {user_query[:50]}...")
            context = vector_db.get_context_for_query(
                user_query,
                n_results=n_results or AIConfig.TOP_K_RETRIEVAL
            )
            
            if not context:
                logger.info("No relevant documents found, proceeding without RAG")
                response = ai_service.legal_chat(user_query, conversation_history, stream=stream)
                
                if include_citations:
                    return {
                        'response': response,
                        'sources': [],
                        'used_rag': False
                    }
                return response
            
            # Step 2: Build enhanced prompt with context
            enhanced_prompt = self._build_rag_prompt(user_query, context)
            
            # Step 3: Build messages
            messages = [
                {"role": "system", "content": PromptTemplates.LEGAL_ASSISTANT_SYSTEM}
            ]
            
            if conversation_history:
                messages.extend(conversation_history[-AIConfig.MAX_CONVERSATION_HISTORY:])
            
            messages.append({"role": "user", "content": enhanced_prompt})
            
            # Step 4: Generate response
            response = ai_service.chat_completion(messages, stream=stream)
            
            # Step 5: Format response with citations
            if include_citations and not stream:
                search_results = vector_db.search(user_query, n_results)
                sources = self._format_sources(search_results)
                
                return {
                    'response': response,
                    'sources': sources,
                    'used_rag': True,
                    'num_sources': len(sources)
                }
            
            return response
        
        except Exception as e:
            logger.error(f"❌ RAG query failed: {e}")
            # Fallback to standard chat
            return ai_service.legal_chat(user_query, conversation_history, stream=stream)
    
    def _build_rag_prompt(self, query: str, context: str) -> str:
        """Build prompt with retrieved context"""
        return f"""{context}

---

Based on the above legal information and your expertise in Indian law, please answer the following question:

**Question:** {query}

**Instructions:**
1. Use the provided context when relevant
2. Cite specific laws, acts, or sections mentioned in the context
3. If the context doesn't fully answer the question, use your knowledge of Indian law
4. Be specific and accurate
5. Provide actionable advice where appropriate
6. Mention if professional legal consultation is recommended"""
    
    def _format_sources(self, search_results: Dict) -> List[Dict]:
        """Format search results as sources with better metadata"""
        sources = []
        
        if not search_results or 'documents' not in search_results:
            return sources
        
        documents = search_results.get('documents', [])
        metadatas = search_results.get('metadatas', [])
        distances = search_results.get('distances', [])
        
        for doc, metadata, distance in zip(documents, metadatas, distances):
            # Calculate similarity score (ChromaDB uses L2 distance, lower is better)
            similarity = max(0, 1 - (distance / 2))  # Normalize to 0-1 range
            
            # Only include highly relevant sources (>60% similarity)
            if similarity >= 0.6:
                sources.append({
                    'text': doc[:300] + "..." if len(doc) > 300 else doc,
                    'source': metadata.get('source', metadata.get('file_name', 'Legal Document')),
                    'type': metadata.get('type', metadata.get('document_type', 'Document')),
                    'score': round(similarity, 2),
                    'relevance': f"{int(similarity * 100)}%"
                })
        
        # Sort by relevance (highest first)
        sources.sort(key=lambda x: x['score'], reverse=True)
        
        return sources[:5]  # Return top 5 most relevant sources
    
    def add_document_to_knowledge_base(
        self,
        file_path: str,
        document_type: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Add a document to the knowledge base
        
        Args:
            file_path: Path to document
            document_type: Type of document
            metadata: Additional metadata
        
        Returns:
            Status dict
        """
        try:
            # Process document
            chunks = doc_processor.process_document_for_rag(
                file_path,
                document_type=document_type
            )
            
            if not chunks:
                return {
                    'success': False,
                    'error': 'No content extracted from document'
                }
            
            # Add custom metadata
            if metadata:
                for chunk in chunks:
                    chunk['metadata'].update(metadata)
            
            # Add to vector DB
            documents = [chunk['text'] for chunk in chunks]
            metadatas = [chunk['metadata'] for chunk in chunks]
            
            success = vector_db.add_documents(documents, metadatas)
            
            if success:
                logger.info(f"✅ Added {file_path} to knowledge base ({len(chunks)} chunks)")
                return {
                    'success': True,
                    'num_chunks': len(chunks),
                    'file': file_path
                }
            else:
                return {
                    'success': False,
                    'error': 'Failed to add to vector DB'
                }
        
        except Exception as e:
            logger.error(f"❌ Failed to add document: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def populate_knowledge_base(
        self,
        directory: str,
        recursive: bool = True,
        file_extensions: Optional[List[str]] = None
    ) -> Dict:
        """
        Populate knowledge base from directory
        
        Args:
            directory: Path to directory
            recursive: Search subdirectories
            file_extensions: File types to process
        
        Returns:
            Status dict
        """
        try:
            logger.info(f"📚 Populating knowledge base from {directory}")
            
            # Process all documents
            all_chunks = doc_processor.process_directory(
                directory,
                file_extensions=file_extensions,
                recursive=recursive
            )
            
            if not all_chunks:
                return {
                    'success': False,
                    'error': 'No documents found or processed'
                }
            
            # Add to vector DB in batches
            batch_size = 100
            total_added = 0
            
            for i in range(0, len(all_chunks), batch_size):
                batch = all_chunks[i:i + batch_size]
                documents = [chunk['text'] for chunk in batch]
                metadatas = [chunk['metadata'] for chunk in batch]
                
                if vector_db.add_documents(documents, metadatas):
                    total_added += len(batch)
            
            logger.info(f"✅ Populated knowledge base: {total_added} chunks from {directory}")
            
            return {
                'success': True,
                'total_chunks': total_added,
                'directory': directory
            }
        
        except Exception as e:
            logger.error(f"❌ Failed to populate knowledge base: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def search_knowledge_base(
        self,
        query: str,
        n_results: int = 10,
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Search knowledge base
        
        Args:
            query: Search query
            n_results: Number of results
            filters: Metadata filters
        
        Returns:
            List of search results
        """
        results = vector_db.search(query, n_results, where=filters)
        return self._format_sources(results)
    
    def get_stats(self) -> Dict:
        """Get RAG pipeline statistics"""
        return {
            'rag_enabled': self.enabled,
            'vector_db_stats': vector_db.get_stats(),
            'chunk_size': AIConfig.CHUNK_SIZE,
            'chunk_overlap': AIConfig.CHUNK_OVERLAP,
            'top_k_retrieval': AIConfig.TOP_K_RETRIEVAL
        }


# Singleton instance
rag_pipeline = RAGPipeline()
