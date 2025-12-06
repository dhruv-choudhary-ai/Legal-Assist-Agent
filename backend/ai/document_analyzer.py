"""
Document Analyzer for Legal Documents
Uses BGE-M3 embeddings for efficient token usage
"""

import logging
import uuid
from typing import List, Dict, Any, Optional
from pathlib import Path
import pdfplumber
from docx import Document as DocxDocument
from ai.embedding_service import embedding_service
from ai.azure_openai_service import ai_service

logger = logging.getLogger(__name__)

class DocumentAnalyzer:
    """Analyzes uploaded legal documents efficiently using RAG"""
    
    def __init__(self):
        self.documents = {}  # Session-based storage: {doc_id: {chunks, metadata}}
        self.chunk_size = 800  # tokens per chunk
        self.chunk_overlap = 100  # overlap for context continuity
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF using pdfplumber"""
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    page_text = page.extract_text() or ""
                    text += f"\n--- Page {page_num} ---\n{page_text}"
            
            logger.info(f"✅ Extracted {len(text)} characters from PDF")
            return text
        except Exception as e:
            logger.error(f"❌ PDF extraction error: {e}")
            raise
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX"""
        try:
            doc = DocxDocument(file_path)
            text = ""
            for para_num, para in enumerate(doc.paragraphs, 1):
                if para.text.strip():
                    text += f"{para.text}\n"
            
            logger.info(f"✅ Extracted {len(text)} characters from DOCX")
            return text
        except Exception as e:
            logger.error(f"❌ DOCX extraction error: {e}")
            raise
    
    def chunk_text(self, text: str) -> List[Dict[str, Any]]:
        """Split text into overlapping chunks for efficient retrieval"""
        words = text.split()
        chunks = []
        
        # Approximate: 1 token ≈ 0.75 words
        words_per_chunk = int(self.chunk_size * 0.75)
        overlap_words = int(self.chunk_overlap * 0.75)
        
        start = 0
        chunk_id = 0
        
        while start < len(words):
            end = min(start + words_per_chunk, len(words))
            chunk_text = ' '.join(words[start:end])
            
            chunks.append({
                'chunk_id': chunk_id,
                'text': chunk_text,
                'start_word': start,
                'end_word': end,
                'length': len(chunk_text)
            })
            
            chunk_id += 1
            start += words_per_chunk - overlap_words
        
        logger.info(f"📦 Created {len(chunks)} chunks")
        return chunks
    
    def process_document(self, file_path: str, filename: str) -> str:
        """
        Process uploaded document and prepare for analysis
        
        Returns:
            document_id: Unique ID for session-based queries
        """
        try:
            file_ext = Path(filename).suffix.lower()
            
            # Extract text based on file type
            if file_ext == '.pdf':
                text = self.extract_text_from_pdf(file_path)
            elif file_ext in ['.docx', '.doc']:
                text = self.extract_text_from_docx(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_ext}")
            
            # Chunk the document
            chunks = self.chunk_text(text)
            
            # Generate embeddings for each chunk using BGE-M3
            logger.info("🔄 Generating BGE-M3 embeddings...")
            for chunk in chunks:
                embedding = embedding_service.get_embeddings(chunk['text'])
                chunk['embedding'] = embedding
            
            # Store in session memory
            doc_id = str(uuid.uuid4())[:8]
            self.documents[doc_id] = {
                'filename': filename,
                'full_text': text,
                'chunks': chunks,
                'total_chunks': len(chunks),
                'word_count': len(text.split()),
                'char_count': len(text)
            }
            
            logger.info(f"✅ Document processed: {filename} → ID: {doc_id}")
            return doc_id
            
        except Exception as e:
            logger.error(f"❌ Document processing error: {e}")
            raise
    
    def retrieve_relevant_chunks(self, doc_id: str, query: str, top_k: int = 5) -> List[Dict]:
        """
        Retrieve most relevant chunks using BGE-M3 similarity
        
        This is where we save tokens - only send relevant chunks to GPT!
        """
        if doc_id not in self.documents:
            raise ValueError(f"Document {doc_id} not found in session")
        
        # Generate query embedding
        query_embedding = embedding_service.get_embeddings(query)
        
        # Calculate cosine similarity with all chunks
        chunks = self.documents[doc_id]['chunks']
        
        # Simple cosine similarity
        import numpy as np
        
        scored_chunks = []
        for chunk in chunks:
            chunk_emb = np.array(chunk['embedding'])
            query_emb = np.array(query_embedding)
            
            # Cosine similarity
            similarity = np.dot(chunk_emb, query_emb) / (
                np.linalg.norm(chunk_emb) * np.linalg.norm(query_emb)
            )
            
            scored_chunks.append({
                'chunk_id': chunk['chunk_id'],
                'text': chunk['text'],
                'similarity': float(similarity)
            })
        
        # Sort by similarity and return top_k
        scored_chunks.sort(key=lambda x: x['similarity'], reverse=True)
        top_chunks = scored_chunks[:top_k]
        
        logger.info(f"🎯 Retrieved {len(top_chunks)} relevant chunks for query")
        return top_chunks
    
    def answer_question(self, doc_id: str, question: str) -> Dict[str, Any]:
        """Answer question about the document using RAG"""
        try:
            # Retrieve relevant chunks
            relevant_chunks = self.retrieve_relevant_chunks(doc_id, question, top_k=5)
            
            # Build context from chunks
            context = "\n\n".join([
                f"[Chunk {chunk['chunk_id']} - Relevance: {chunk['similarity']:.2f}]\n{chunk['text']}"
                for chunk in relevant_chunks
            ])
            
            # Create prompt
            prompt = f"""You are a legal document analyst. Answer the user's question based on the provided document excerpts.

**Document Excerpts:**
{context}

**User Question:**
{question}

**Instructions:**
- Answer based ONLY on the provided excerpts
- If information is not in the excerpts, say "I don't have enough information"
- Cite which chunk(s) support your answer
- Be precise and professional

**Answer:**"""

            # Call GPT (only sending relevant chunks - efficient!)
            response = ai_service.chat_completion([
                {"role": "system", "content": "You are a legal document analyst. Provide accurate, cite-based answers."},
                {"role": "user", "content": prompt}
            ], temperature=0.3, max_tokens=500)
            
            return {
                'answer': response,
                'sources': [{'chunk_id': c['chunk_id'], 'similarity': c['similarity']} for c in relevant_chunks],
                'chunks_used': len(relevant_chunks)
            }
            
        except Exception as e:
            logger.error(f"❌ Question answering error: {e}")
            raise
    
    def summarize_document(self, doc_id: str) -> Dict[str, Any]:
        """Generate document summary"""
        try:
            doc = self.documents[doc_id]
            
            # Use first few chunks for summary (not entire doc)
            chunks_for_summary = doc['chunks'][:5]  # First 5 chunks
            context = "\n\n".join([chunk['text'] for chunk in chunks_for_summary])
            
            prompt = f"""Summarize this legal document in 3-5 bullet points:

{context}

**Summary (key points only):**"""

            summary = ai_service.chat_completion([
                {"role": "system", "content": "You are a legal document summarizer. Be concise."},
                {"role": "user", "content": prompt}
            ], temperature=0.3, max_tokens=300)
            
            return {
                'summary': summary,
                'chunks_analyzed': len(chunks_for_summary),
                'total_chunks': doc['total_chunks']
            }
            
        except Exception as e:
            logger.error(f"❌ Summarization error: {e}")
            raise
    
    def extract_key_clauses(self, doc_id: str) -> Dict[str, Any]:
        """Extract important legal clauses"""
        try:
            # Retrieve chunks likely to contain clauses (using keywords)
            clause_keywords = "clause liability indemnity termination payment obligations rights"
            relevant_chunks = self.retrieve_relevant_chunks(doc_id, clause_keywords, top_k=8)
            
            context = "\n\n".join([chunk['text'] for chunk in relevant_chunks])
            
            prompt = f"""Extract key legal clauses from this document:

{context}

**List the most important clauses with brief explanations:**"""

            clauses = ai_service.chat_completion([
                {"role": "system", "content": "You are a legal clause extractor."},
                {"role": "user", "content": prompt}
            ], temperature=0.2, max_tokens=500)
            
            return {
                'clauses': clauses,
                'chunks_analyzed': len(relevant_chunks)
            }
            
        except Exception as e:
            logger.error(f"❌ Clause extraction error: {e}")
            raise
    
    def analyze_risks(self, doc_id: str) -> Dict[str, Any]:
        """Identify potential legal risks"""
        try:
            # Retrieve chunks likely to contain risky clauses
            risk_keywords = "liability risk penalty termination breach default obligation indemnity"
            relevant_chunks = self.retrieve_relevant_chunks(doc_id, risk_keywords, top_k=6)
            
            context = "\n\n".join([chunk['text'] for chunk in relevant_chunks])
            
            prompt = f"""Analyze potential legal risks in this document:

{context}

**Identify risks and assign severity (High/Medium/Low):**"""

            risks = ai_service.chat_completion([
                {"role": "system", "content": "You are a legal risk analyst."},
                {"role": "user", "content": prompt}
            ], temperature=0.3, max_tokens=500)
            
            return {
                'risks': risks,
                'chunks_analyzed': len(relevant_chunks)
            }
            
        except Exception as e:
            logger.error(f"❌ Risk analysis error: {e}")
            raise
    
    def get_document_info(self, doc_id: str) -> Optional[Dict]:
        """Get document metadata"""
        return self.documents.get(doc_id)
    
    def clear_document(self, doc_id: str):
        """Remove document from session"""
        if doc_id in self.documents:
            del self.documents[doc_id]
            logger.info(f"🗑️ Document {doc_id} removed from session")


# Global instance
document_analyzer = DocumentAnalyzer()
