"""
Conversation Manager
Handles conversation history and context for multi-turn dialogues
"""

import json
import time
import logging
from typing import List, Dict, Optional
from collections import defaultdict
from .config import AIConfig

logger = logging.getLogger(__name__)


class ConversationManager:
    """
    Manages conversation history for multi-turn dialogues
    
    Features:
    - In-memory storage (can be extended to Redis for production)
    - Session management
    - Context trimming
    - Conversation metadata
    - Session timeout handling
    """
    
    def __init__(self, use_redis: bool = False):
        """
        Initialize conversation manager
        
        Args:
            use_redis: Whether to use Redis for storage (future enhancement)
        """
        self.use_redis = use_redis and AIConfig.USE_REDIS
        self.conversations = defaultdict(list)
        self.metadata = defaultdict(dict)
        
        if self.use_redis:
            self._init_redis()
        
        logger.info(f"💬 Conversation Manager initialized (Redis: {self.use_redis})")
    
    def _init_redis(self):
        """Initialize Redis connection (for future enhancement)"""
        try:
            import redis
            self.redis_client = redis.Redis(
                host=AIConfig.REDIS_HOST,
                port=AIConfig.REDIS_PORT,
                db=AIConfig.REDIS_DB,
                password=AIConfig.REDIS_PASSWORD,
                decode_responses=True
            )
            self.redis_client.ping()
            logger.info("✅ Redis connected successfully")
        except Exception as e:
            logger.warning(f"⚠️  Redis connection failed: {e}. Falling back to in-memory storage.")
            self.use_redis = False
            self.redis_client = None
    
    def create_session(self, session_id: str, user_id: Optional[str] = None, metadata: Optional[Dict] = None) -> str:
        """
        Create a new conversation session
        
        Args:
            session_id: Unique session identifier
            user_id: Optional user identifier
            metadata: Optional session metadata
        
        Returns:
            Session ID
        """
        self.metadata[session_id] = {
            'user_id': user_id,
            'created_at': time.time(),
            'last_activity': time.time(),
            'message_count': 0,
            'metadata': metadata or {}
        }
        
        logger.info(f"📝 New session created: {session_id}")
        return session_id
    
    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict] = None
    ):
        """
        Add a message to conversation history
        
        Args:
            session_id: Session identifier
            role: Message role ('user', 'assistant', 'system')
            content: Message content
            metadata: Optional message metadata
        """
        # Create session if it doesn't exist
        if session_id not in self.metadata:
            self.create_session(session_id)
        
        message = {
            'role': role,
            'content': content,
            'timestamp': time.time(),
            'metadata': metadata or {}
        }
        
        if self.use_redis and self.redis_client:
            self._add_message_redis(session_id, message)
        else:
            self._add_message_memory(session_id, message)
        
        # Update session metadata
        self.metadata[session_id]['last_activity'] = time.time()
        self.metadata[session_id]['message_count'] += 1
    
    def _add_message_memory(self, session_id: str, message: Dict):
        """Add message to in-memory storage"""
        self.conversations[session_id].append(message)
        
        # Trim if exceeds max history
        if len(self.conversations[session_id]) > AIConfig.MAX_CONVERSATION_HISTORY * 2:  # *2 for user+assistant
            self.conversations[session_id] = self.conversations[session_id][-AIConfig.MAX_CONVERSATION_HISTORY * 2:]
    
    def _add_message_redis(self, session_id: str, message: Dict):
        """Add message to Redis storage"""
        try:
            key = f"conversation:{session_id}"
            self.redis_client.lpush(key, json.dumps(message))
            self.redis_client.ltrim(key, 0, AIConfig.MAX_CONVERSATION_HISTORY * 2 - 1)
            self.redis_client.expire(key, AIConfig.CONVERSATION_TIMEOUT)
        except Exception as e:
            logger.error(f"Redis error: {e}. Falling back to memory.")
            self._add_message_memory(session_id, message)
    
    def get_history(
        self,
        session_id: str,
        max_messages: Optional[int] = None,
        include_system: bool = False
    ) -> List[Dict[str, str]]:
        """
        Get conversation history for a session
        
        Args:
            session_id: Session identifier
            max_messages: Maximum number of messages to return
            include_system: Whether to include system messages
        
        Returns:
            List of messages
        """
        if self.use_redis and self.redis_client:
            messages = self._get_history_redis(session_id)
        else:
            messages = self._get_history_memory(session_id)
        
        # Filter out system messages if requested
        if not include_system:
            messages = [m for m in messages if m.get('role') != 'system']
        
        # Limit number of messages
        max_msgs = max_messages or AIConfig.MAX_CONVERSATION_HISTORY
        if len(messages) > max_msgs:
            messages = messages[-max_msgs:]
        
        # Return only role and content (remove metadata and timestamp)
        return [{'role': m['role'], 'content': m['content']} for m in messages]
    
    def _get_history_memory(self, session_id: str) -> List[Dict]:
        """Get history from in-memory storage"""
        return list(self.conversations.get(session_id, []))
    
    def _get_history_redis(self, session_id: str) -> List[Dict]:
        """Get history from Redis storage"""
        try:
            key = f"conversation:{session_id}"
            messages = self.redis_client.lrange(key, 0, -1)
            return [json.loads(msg) for msg in reversed(messages)]
        except Exception as e:
            logger.error(f"Redis error: {e}. Falling back to memory.")
            return self._get_history_memory(session_id)
    
    def get_context_string(self, session_id: str, max_messages: int = 5) -> str:
        """
        Get conversation history as a formatted string
        
        Args:
            session_id: Session identifier
            max_messages: Maximum number of messages to include
        
        Returns:
            Formatted conversation history
        """
        messages = self.get_history(session_id, max_messages)
        
        if not messages:
            return ""
        
        context = "Previous conversation:\n\n"
        for msg in messages:
            role = msg['role'].capitalize()
            content = msg['content']
            context += f"{role}: {content}\n\n"
        
        return context
    
    def clear_session(self, session_id: str):
        """
        Clear conversation history for a session
        
        Args:
            session_id: Session identifier
        """
        if self.use_redis and self.redis_client:
            try:
                self.redis_client.delete(f"conversation:{session_id}")
            except Exception as e:
                logger.error(f"Redis error: {e}")
        
        if session_id in self.conversations:
            del self.conversations[session_id]
        
        if session_id in self.metadata:
            del self.metadata[session_id]
        
        logger.info(f"🗑️  Session cleared: {session_id}")
    
    def get_session_info(self, session_id: str) -> Optional[Dict]:
        """
        Get session metadata
        
        Args:
            session_id: Session identifier
        
        Returns:
            Session metadata or None if session doesn't exist
        """
        return self.metadata.get(session_id)
    
    def is_session_active(self, session_id: str) -> bool:
        """
        Check if session is still active (not timed out)
        
        Args:
            session_id: Session identifier
        
        Returns:
            True if active, False otherwise
        """
        if session_id not in self.metadata:
            return False
        
        last_activity = self.metadata[session_id].get('last_activity', 0)
        elapsed = time.time() - last_activity
        
        return elapsed < AIConfig.CONVERSATION_TIMEOUT
    
    def cleanup_expired_sessions(self):
        """Remove expired sessions from memory"""
        expired_sessions = []
        
        for session_id, meta in self.metadata.items():
            if not self.is_session_active(session_id):
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            self.clear_session(session_id)
        
        if expired_sessions:
            logger.info(f"🗑️  Cleaned up {len(expired_sessions)} expired sessions")
    
    def get_all_sessions(self) -> List[str]:
        """Get list of all active session IDs"""
        return list(self.metadata.keys())
    
    def get_session_stats(self, session_id: str) -> Dict:
        """
        Get statistics for a session
        
        Args:
            session_id: Session identifier
        
        Returns:
            Session statistics
        """
        if session_id not in self.metadata:
            return {}
        
        meta = self.metadata[session_id]
        messages = self.get_history(session_id, max_messages=1000)
        
        user_messages = [m for m in messages if m.get('role') == 'user']
        assistant_messages = [m for m in messages if m.get('role') == 'assistant']
        
        duration = time.time() - meta.get('created_at', time.time())
        
        return {
            'session_id': session_id,
            'user_id': meta.get('user_id'),
            'created_at': meta.get('created_at'),
            'last_activity': meta.get('last_activity'),
            'duration_seconds': duration,
            'total_messages': len(messages),
            'user_messages': len(user_messages),
            'assistant_messages': len(assistant_messages),
            'is_active': self.is_session_active(session_id)
        }


# Create singleton instance
conversation_manager = ConversationManager()
