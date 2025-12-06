"""
Lawyer Feedback System
Captures corrections and improvements from legal professionals
Enables continuous learning and model improvement
"""

import psycopg2
from psycopg2 import pool
import logging
from datetime import datetime
from typing import List, Dict, Optional
import json

logger = logging.getLogger(__name__)


class LawyerFeedbackSystem:
    """
    System for capturing and managing lawyer feedback
    
    Features:
    - Document correction tracking
    - AI suggestion rating
    - Quality scoring
    - Training data generation
    """
    
    def __init__(self, db_config: Dict):
        """Initialize feedback system with database connection"""
        try:
            self.connection_pool = pool.SimpleConnectionPool(
                1, 10,
                host=db_config.get('host', 'localhost'),
                port=db_config.get('port', 5432),
                database=db_config.get('database', 'legal_assistant'),
                user=db_config.get('user', 'postgres'),
                password=db_config.get('password', '')
            )
            logger.info("✅ Lawyer feedback system initialized")
            self._create_tables()
        except Exception as e:
            logger.error(f"❌ Failed to initialize feedback system: {e}")
            raise
    
    def _create_tables(self):
        """Create feedback tables if they don't exist"""
        conn = self.connection_pool.getconn()
        try:
            cursor = conn.cursor()
            
            # 1. Document Corrections Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS feedback_corrections (
                    id SERIAL PRIMARY KEY,
                    document_id INTEGER REFERENCES user_documents(doc_id),
                    user_id INTEGER REFERENCES users(id),
                    original_text TEXT NOT NULL,
                    corrected_text TEXT NOT NULL,
                    correction_type VARCHAR(50),
                    correction_category VARCHAR(50),
                    severity VARCHAR(20),
                    explanation TEXT,
                    applicable_law TEXT,
                    lawyer_id INTEGER,
                    lawyer_name VARCHAR(255),
                    verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # 2. AI Suggestion Ratings Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ai_suggestion_ratings (
                    id SERIAL PRIMARY KEY,
                    suggestion_type VARCHAR(100),
                    original_query TEXT,
                    ai_response TEXT,
                    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                    feedback_text TEXT,
                    was_helpful BOOLEAN,
                    accuracy_score INTEGER CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
                    user_id INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # 3. Clause Feedback Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS clause_feedback (
                    id SERIAL PRIMARY KEY,
                    clause_text TEXT NOT NULL,
                    clause_type VARCHAR(100),
                    document_type VARCHAR(100),
                    is_legally_sound BOOLEAN,
                    risk_level VARCHAR(20),
                    enforceability_rating INTEGER CHECK (enforceability_rating >= 0 AND enforceability_rating <= 100),
                    improvement_suggestion TEXT,
                    applicable_laws TEXT[],
                    lawyer_id INTEGER,
                    verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # 4. Training Data Queue Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS training_data_queue (
                    id SERIAL PRIMARY KEY,
                    data_type VARCHAR(50),
                    question TEXT,
                    correct_answer TEXT,
                    source_correction_id INTEGER REFERENCES feedback_corrections(id),
                    metadata JSONB,
                    used_in_training BOOLEAN DEFAULT FALSE,
                    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # 5. Model Performance Tracking
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS model_performance_log (
                    id SERIAL PRIMARY KEY,
                    model_version VARCHAR(50),
                    test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    accuracy_score FLOAT,
                    precision_score FLOAT,
                    recall_score FLOAT,
                    f1_score FLOAT,
                    total_tests INTEGER,
                    passed_tests INTEGER,
                    failed_tests INTEGER,
                    test_dataset_id VARCHAR(100),
                    notes TEXT
                );
            """)
            
            # Create indexes for better query performance
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_corrections_user ON feedback_corrections(user_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_corrections_date ON feedback_corrections(created_at);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_ratings_type ON ai_suggestion_ratings(suggestion_type);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_training_used ON training_data_queue(used_in_training);")
            
            conn.commit()
            logger.info("✅ Feedback tables created successfully")
        
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ Failed to create feedback tables: {e}")
            raise
        finally:
            self.connection_pool.putconn(conn)
    
    def submit_correction(
        self,
        document_id: int,
        user_id: int,
        original_text: str,
        corrected_text: str,
        correction_type: str,
        explanation: Optional[str] = None,
        applicable_law: Optional[str] = None,
        lawyer_name: Optional[str] = None,
        severity: str = "medium"
    ) -> int:
        """
        Submit a correction from a lawyer
        
        Args:
            document_id: ID of the document
            user_id: User who submitted
            original_text: AI-generated text
            corrected_text: Lawyer-corrected text
            correction_type: Type of correction (grammar, legal, factual, etc.)
            explanation: Why the correction was needed
            applicable_law: Relevant law citation
            lawyer_name: Name of reviewing lawyer
            severity: critical, high, medium, low
        
        Returns:
            Correction ID
        """
        conn = self.connection_pool.getconn()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO feedback_corrections 
                (document_id, user_id, original_text, corrected_text, correction_type, 
                 explanation, applicable_law, lawyer_name, severity)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (document_id, user_id, original_text, corrected_text, correction_type,
                  explanation, applicable_law, lawyer_name, severity))
            
            correction_id = cursor.fetchone()[0]
            conn.commit()
            
            logger.info(f"✅ Correction submitted: ID={correction_id}, Type={correction_type}")
            
            # Auto-generate training data if high quality
            if severity in ['critical', 'high']:
                self._generate_training_data_from_correction(correction_id, conn)
            
            return correction_id
        
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ Failed to submit correction: {e}")
            raise
        finally:
            self.connection_pool.putconn(conn)
    
    def rate_ai_suggestion(
        self,
        suggestion_type: str,
        original_query: str,
        ai_response: str,
        rating: int,
        feedback_text: Optional[str] = None,
        accuracy_score: Optional[int] = None,
        user_id: Optional[int] = None
    ) -> int:
        """
        Rate an AI suggestion (1-5 stars)
        
        Args:
            suggestion_type: Type of AI suggestion
            original_query: User's original query
            ai_response: AI's response
            rating: 1-5 stars
            feedback_text: Optional textual feedback
            accuracy_score: 0-100 accuracy rating
            user_id: User ID
        
        Returns:
            Rating ID
        """
        conn = self.connection_pool.getconn()
        try:
            cursor = conn.cursor()
            was_helpful = rating >= 3
            
            cursor.execute("""
                INSERT INTO ai_suggestion_ratings 
                (suggestion_type, original_query, ai_response, rating, 
                 feedback_text, was_helpful, accuracy_score, user_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (suggestion_type, original_query, ai_response, rating,
                  feedback_text, was_helpful, accuracy_score, user_id))
            
            rating_id = cursor.fetchone()[0]
            conn.commit()
            
            logger.info(f"✅ AI suggestion rated: ID={rating_id}, Rating={rating}/5")
            return rating_id
        
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ Failed to rate suggestion: {e}")
            raise
        finally:
            self.connection_pool.putconn(conn)
    
    def submit_clause_feedback(
        self,
        clause_text: str,
        clause_type: str,
        document_type: str,
        is_legally_sound: bool,
        risk_level: str,
        enforceability_rating: int,
        improvement_suggestion: Optional[str] = None,
        applicable_laws: Optional[List[str]] = None,
        lawyer_id: Optional[int] = None
    ) -> int:
        """
        Submit feedback on a specific clause
        
        Returns:
            Feedback ID
        """
        conn = self.connection_pool.getconn()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO clause_feedback 
                (clause_text, clause_type, document_type, is_legally_sound,
                 risk_level, enforceability_rating, improvement_suggestion,
                 applicable_laws, lawyer_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (clause_text, clause_type, document_type, is_legally_sound,
                  risk_level, enforceability_rating, improvement_suggestion,
                  applicable_laws, lawyer_id))
            
            feedback_id = cursor.fetchone()[0]
            conn.commit()
            
            logger.info(f"✅ Clause feedback submitted: ID={feedback_id}")
            return feedback_id
        
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ Failed to submit clause feedback: {e}")
            raise
        finally:
            self.connection_pool.putconn(conn)
    
    def _generate_training_data_from_correction(self, correction_id: int, conn):
        """Generate training data from correction"""
        try:
            cursor = conn.cursor()
            
            # Get correction details
            cursor.execute("""
                SELECT original_text, corrected_text, correction_type, explanation, applicable_law
                FROM feedback_corrections WHERE id = %s;
            """, (correction_id,))
            
            row = cursor.fetchone()
            if not row:
                return
            
            original, corrected, corr_type, explanation, law = row
            
            # Create training data entry
            question = f"Review this text for {corr_type} correctness: {original}"
            correct_answer = f"Corrected: {corrected}\n\nReason: {explanation or 'Legal correction'}"
            
            metadata = {
                "correction_type": corr_type,
                "applicable_law": law,
                "source": "lawyer_correction"
            }
            
            cursor.execute("""
                INSERT INTO training_data_queue
                (data_type, question, correct_answer, source_correction_id, metadata, quality_score)
                VALUES (%s, %s, %s, %s, %s, %s);
            """, ('correction', question, correct_answer, correction_id, json.dumps(metadata), 90))
            
            conn.commit()
            logger.info(f"✅ Training data generated from correction {correction_id}")
        
        except Exception as e:
            logger.error(f"❌ Failed to generate training data: {e}")
    
    def get_training_data_batch(self, batch_size: int = 100) -> List[Dict]:
        """
        Get batch of training data for model fine-tuning
        
        Returns:
            List of training examples in OpenAI fine-tuning format
        """
        conn = self.connection_pool.getconn()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, question, correct_answer, metadata
                FROM training_data_queue
                WHERE used_in_training = FALSE AND quality_score >= 70
                ORDER BY quality_score DESC, created_at DESC
                LIMIT %s;
            """, (batch_size,))
            
            rows = cursor.fetchall()
            
            training_data = []
            for row_id, question, answer, metadata in rows:
                training_data.append({
                    "messages": [
                        {"role": "system", "content": "You are a qualified Indian legal assistant."},
                        {"role": "user", "content": question},
                        {"role": "assistant", "content": answer}
                    ],
                    "metadata": metadata
                })
                
                # Mark as used
                cursor.execute("""
                    UPDATE training_data_queue 
                    SET used_in_training = TRUE 
                    WHERE id = %s;
                """, (row_id,))
            
            conn.commit()
            logger.info(f"✅ Retrieved {len(training_data)} training examples")
            return training_data
        
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ Failed to get training data: {e}")
            return []
        finally:
            self.connection_pool.putconn(conn)
    
    def get_feedback_stats(self) -> Dict:
        """Get feedback statistics"""
        conn = self.connection_pool.getconn()
        try:
            cursor = conn.cursor()
            
            stats = {}
            
            # Total corrections
            cursor.execute("SELECT COUNT(*) FROM feedback_corrections;")
            stats['total_corrections'] = cursor.fetchone()[0]
            
            # Corrections by severity
            cursor.execute("""
                SELECT severity, COUNT(*) 
                FROM feedback_corrections 
                GROUP BY severity;
            """)
            stats['by_severity'] = dict(cursor.fetchall())
            
            # Average AI rating
            cursor.execute("SELECT AVG(rating) FROM ai_suggestion_ratings;")
            avg_rating = cursor.fetchone()[0]
            stats['average_ai_rating'] = round(float(avg_rating), 2) if avg_rating else 0
            
            # Total ratings
            cursor.execute("SELECT COUNT(*) FROM ai_suggestion_ratings;")
            stats['total_ratings'] = cursor.fetchone()[0]
            
            # Training data available
            cursor.execute("""
                SELECT COUNT(*) FROM training_data_queue 
                WHERE used_in_training = FALSE;
            """)
            stats['training_data_available'] = cursor.fetchone()[0]
            
            return stats
        
        except Exception as e:
            logger.error(f"❌ Failed to get stats: {e}")
            return {}
        finally:
            self.connection_pool.putconn(conn)


# Example usage
if __name__ == "__main__":
    # Initialize with database config
    db_config = {
        'host': 'localhost',
        'port': 5432,
        'database': 'legal_assistant',
        'user': 'postgres',
        'password': 'password'
    }
    
    feedback_system = LawyerFeedbackSystem(db_config)
    
    # Get stats
    stats = feedback_system.get_feedback_stats()
    print("Feedback System Stats:", json.dumps(stats, indent=2))
