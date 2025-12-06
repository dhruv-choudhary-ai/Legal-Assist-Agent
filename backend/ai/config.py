"""
AI Configuration Management
Centralized configuration for all AI services
"""

import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()


class AIConfig:
    """Configuration class for AI services"""
    
    # ===================================
    # AZURE OPENAI CONFIGURATION
    # ===================================
    AZURE_OPENAI_API_KEY: str = os.getenv('AZURE_OPENAI_API_KEY', '')
    AZURE_OPENAI_ENDPOINT: str = os.getenv('AZURE_OPENAI_ENDPOINT', '')
    AZURE_OPENAI_API_VERSION: str = os.getenv('AZURE_OPENAI_API_VERSION', '2024-08-01-preview')
    
    # Model Deployments
    AZURE_OPENAI_CHAT_DEPLOYMENT: str = os.getenv('AZURE_OPENAI_CHAT_DEPLOYMENT', 'gpt-4o-mini')
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT: str = os.getenv('AZURE_OPENAI_EMBEDDING_DEPLOYMENT', 'legal-bge-m3')
    AZURE_OPENAI_FINETUNED_DEPLOYMENT: Optional[str] = os.getenv('AZURE_OPENAI_FINETUNED_DEPLOYMENT', None)
    
    # ===================================
    # CHAT CONFIGURATION
    # ===================================
    MAX_TOKENS: int = int(os.getenv('MAX_TOKENS', '2000'))
    TEMPERATURE: float = float(os.getenv('TEMPERATURE', '0.7'))
    TOP_P: float = float(os.getenv('TOP_P', '0.95'))
    FREQUENCY_PENALTY: float = float(os.getenv('FREQUENCY_PENALTY', '0.0'))
    PRESENCE_PENALTY: float = float(os.getenv('PRESENCE_PENALTY', '0.0'))
    
    # ===================================
    # CONVERSATION CONFIGURATION
    # ===================================
    MAX_CONVERSATION_HISTORY: int = int(os.getenv('MAX_CONVERSATION_HISTORY', '10'))
    CONVERSATION_TIMEOUT: int = int(os.getenv('CONVERSATION_TIMEOUT', '3600'))  # 1 hour
    
    # ===================================
    # VECTOR DATABASE CONFIGURATION
    # ===================================
    CHROMA_PERSIST_DIRECTORY: str = os.getenv('CHROMA_PERSIST_DIRECTORY', './chroma_db')
    COLLECTION_NAME: str = os.getenv('COLLECTION_NAME', 'legal_documents')
    TOP_K_RETRIEVAL: int = int(os.getenv('TOP_K_RETRIEVAL', '5'))
    
    # ===================================
    # EMBEDDING CONFIGURATION
    # ===================================
    USE_LOCAL_EMBEDDINGS: bool = os.getenv('USE_LOCAL_EMBEDDINGS', 'true').lower() == 'true'
    EMBEDDING_MODEL_NAME: str = os.getenv('EMBEDDING_MODEL_NAME', 'BAAI/bge-m3')
    
    # Legal-specific embedding models (recommended for legal document analysis)
    LEGAL_EMBEDDING_MODELS = {
        'bge-m3': 'BAAI/bge-m3',  # Multilingual, works well for Indian legal content
        'inlegalbert': 'law-ai/InLegalBERT',  # India-specific legal BERT
        'legalbert': 'nlpaueb/legal-bert-base-uncased',  # General legal BERT
        'longformer': 'allenai/longformer-base-4096',  # For long documents
        'sentence-transformers': 'sentence-transformers/all-MiniLM-L6-v2'  # General purpose (fallback)
    }
    
    # Get active legal embedding model
    ACTIVE_LEGAL_MODEL: str = LEGAL_EMBEDDING_MODELS.get(
        os.getenv('LEGAL_EMBEDDING_TYPE', 'bge-m3'),
        LEGAL_EMBEDDING_MODELS['bge-m3']
    )
    
    # ===================================
    # DOCUMENT PROCESSING
    # ===================================
    CHUNK_SIZE: int = int(os.getenv('CHUNK_SIZE', '1000'))
    CHUNK_OVERLAP: int = int(os.getenv('CHUNK_OVERLAP', '200'))
    
    # ===================================
    # REDIS CONFIGURATION (For caching)
    # ===================================
    REDIS_HOST: str = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT: int = int(os.getenv('REDIS_PORT', '6379'))
    REDIS_DB: int = int(os.getenv('REDIS_DB', '0'))
    REDIS_PASSWORD: Optional[str] = os.getenv('REDIS_PASSWORD', None)
    USE_REDIS: bool = os.getenv('USE_REDIS', 'false').lower() == 'true'
    
    # ===================================
    # FEATURE FLAGS
    # ===================================
    ENABLE_STREAMING: bool = os.getenv('ENABLE_STREAMING', 'true').lower() == 'true'
    ENABLE_RAG: bool = os.getenv('ENABLE_RAG', 'true').lower() == 'true'
    ENABLE_FINETUNED_MODEL: bool = os.getenv('ENABLE_FINETUNED_MODEL', 'false').lower() == 'true'
    
    # ===================================
    # LOGGING
    # ===================================
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    LOG_AI_REQUESTS: bool = os.getenv('LOG_AI_REQUESTS', 'true').lower() == 'true'
    
    # ===================================
    # RATE LIMITING
    # ===================================
    MAX_REQUESTS_PER_MINUTE: int = int(os.getenv('MAX_REQUESTS_PER_MINUTE', '60'))
    MAX_TOKENS_PER_DAY: int = int(os.getenv('MAX_TOKENS_PER_DAY', '1000000'))
    
    @classmethod
    def validate(cls) -> bool:
        """Validate that all required configuration is present"""
        required_fields = [
            'AZURE_OPENAI_API_KEY',
            'AZURE_OPENAI_ENDPOINT',
            'AZURE_OPENAI_CHAT_DEPLOYMENT',
            'AZURE_OPENAI_EMBEDDING_DEPLOYMENT'
        ]
        
        missing_fields = []
        for field in required_fields:
            value = getattr(cls, field)
            if not value or value == '':
                missing_fields.append(field)
        
        if missing_fields:
            print(f"⚠️  WARNING: Missing required configuration: {', '.join(missing_fields)}")
            print("Please update your .env file with Azure OpenAI credentials")
            return False
        
        return True
    
    @classmethod
    def get_summary(cls) -> dict:
        """Get configuration summary (safe for logging)"""
        return {
            'chat_model': cls.AZURE_OPENAI_CHAT_DEPLOYMENT,
            'embedding_model': cls.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
            'max_tokens': cls.MAX_TOKENS,
            'temperature': cls.TEMPERATURE,
            'conversation_history': cls.MAX_CONVERSATION_HISTORY,
            'streaming_enabled': cls.ENABLE_STREAMING,
            'rag_enabled': cls.ENABLE_RAG,
            'finetuned_enabled': cls.ENABLE_FINETUNED_MODEL,
            'redis_enabled': cls.USE_REDIS
        }
