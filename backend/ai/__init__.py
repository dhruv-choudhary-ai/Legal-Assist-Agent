"""
AI Service Layer for Legal Documentation Assistant

This module provides modern AI capabilities including:
- Azure OpenAI integration (GPT-4o-mini for chat)
- Hugging Face embeddings (legal-bge-m3 for vectors)
- Conversation management
- Legal-specific prompt templates
- Document analysis
- RAG (Retrieval Augmented Generation)
- Vector database (ChromaDB)
- Document processing and chunking
"""

from .azure_openai_service import AzureOpenAIService, ai_service
from .embedding_service import EmbeddingService, embedding_service
from .conversation_manager import ConversationManager, conversation_manager
from .prompt_templates import PromptTemplates
from .config import AIConfig
from .vectordb_manager import VectorDBManager, vector_db
from .document_processor import DocumentProcessor, doc_processor
from .rag_pipeline import RAGPipeline, rag_pipeline

__all__ = [
    'AzureOpenAIService',
    'ai_service',
    'EmbeddingService',
    'embedding_service',
    'ConversationManager',
    'conversation_manager',
    'PromptTemplates',
    'AIConfig',
    'VectorDBManager',
    'vector_db',
    'DocumentProcessor',
    'doc_processor',
    'RAGPipeline',
    'rag_pipeline'
]

__version__ = '2.0.0'
