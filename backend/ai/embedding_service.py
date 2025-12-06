"""
Embedding Service
Supports both Azure OpenAI and Hugging Face embeddings
"""

import logging
from typing import List, Union
import numpy as np

from .config import AIConfig

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Unified embedding service supporting multiple backends:
    - Hugging Face models (legal-bge-m3, sentence-transformers)
    - Azure OpenAI embeddings
    """
    
    def __init__(self, use_local_model: bool = True, model_name: str = "BAAI/bge-m3"):
        """
        Initialize embedding service
        
        Args:
            use_local_model: Use local Hugging Face model (True) or Azure OpenAI (False)
            model_name: Name of the Hugging Face model (default: BAAI/bge-m3)
        """
        self.use_local_model = use_local_model
        self.model_name = model_name
        self.model = None
        
        if use_local_model:
            self._init_local_model()
        else:
            self._init_azure_embeddings()
    
    def _init_local_model(self):
        """Initialize local Hugging Face embedding model"""
        try:
            from sentence_transformers import SentenceTransformer
            
            logger.info(f"📥 Loading Hugging Face model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"✅ Loaded {self.model_name} successfully")
            logger.info(f"📊 Model details:")
            logger.info(f"   - Max sequence length: {self.model.max_seq_length}")
            logger.info(f"   - Embedding dimension: {self.model.get_sentence_embedding_dimension()}")
            
        except ImportError:
            logger.error("❌ sentence-transformers not installed. Run: pip install sentence-transformers")
            raise
        except Exception as e:
            logger.error(f"❌ Failed to load local embedding model: {e}")
            raise
    
    def _init_azure_embeddings(self):
        """Initialize Azure OpenAI embeddings"""
        try:
            from .azure_openai_service import ai_service
            self.azure_service = ai_service
            logger.info("✅ Using Azure OpenAI for embeddings")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Azure embeddings: {e}")
            raise
    
    def get_embeddings(self, texts: Union[str, List[str]]) -> List[List[float]]:
        """
        Get embeddings for text(s)
        
        Args:
            texts: Single text string or list of texts
        
        Returns:
            List of embedding vectors
        """
        # Convert single string to list
        if isinstance(texts, str):
            texts = [texts]
        
        if self.use_local_model:
            return self._get_local_embeddings(texts)
        else:
            return self._get_azure_embeddings(texts)
    
    def _get_local_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings using local Hugging Face model"""
        try:
            if not self.model:
                raise RuntimeError("Local model not initialized")
            
            # Generate embeddings
            embeddings = self.model.encode(
                texts,
                convert_to_numpy=True,
                show_progress_bar=False,
                normalize_embeddings=True  # Important for cosine similarity
            )
            
            # Fix: BGE-M3 returns 3D array [batch, tokens, dims], we need [batch, dims]
            # Take the mean across the token dimension or use the [CLS] token
            if len(embeddings.shape) == 3:
                logger.info(f"⚠️ 3D embeddings detected: {embeddings.shape}, converting to 2D")
                embeddings = embeddings[:, 0, :]  # Take first token ([CLS] token)
            
            # Convert numpy arrays to lists
            if len(texts) == 1:
                return [embeddings[0].tolist()]
            else:
                return embeddings.tolist()
        
        except Exception as e:
            logger.error(f"❌ Local embedding generation failed: {e}")
            raise
    
    def _get_azure_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings using Azure OpenAI"""
        try:
            return self.azure_service.get_embeddings(texts)
        except Exception as e:
            logger.error(f"❌ Azure embedding generation failed: {e}")
            raise
    
    def get_embedding_dimension(self) -> int:
        """Get embedding vector dimension"""
        if self.use_local_model:
            return self.model.get_sentence_embedding_dimension()
        else:
            # Azure text-embedding-3-large has 3072 dimensions
            # But legal-bge-m3 has 1024 dimensions
            return 1024  # BGE-M3 dimension
    
    def similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
        
        Returns:
            Similarity score (0-1)
        """
        try:
            # Convert to numpy arrays
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Cosine similarity
            similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
            return float(similarity)
        
        except Exception as e:
            logger.error(f"❌ Similarity calculation failed: {e}")
            return 0.0


# Global embedding service instance
# Use local legal-bge-m3 by default (better for legal documents)
try:
    embedding_service = EmbeddingService(
        use_local_model=AIConfig.USE_LOCAL_EMBEDDINGS,
        model_name=AIConfig.EMBEDDING_MODEL_NAME
    )
    model_type = "local (Hugging Face)" if AIConfig.USE_LOCAL_EMBEDDINGS else "Azure OpenAI"
    logger.info(f"🚀 Embedding service initialized with {AIConfig.EMBEDDING_MODEL_NAME} ({model_type})")
except Exception as e:
    logger.warning(f"⚠️ Failed to initialize local embeddings, falling back to Azure: {e}")
    try:
        embedding_service = EmbeddingService(use_local_model=False)
    except Exception as e2:
        logger.error(f"❌ All embedding services failed: {e2}")
        embedding_service = None
