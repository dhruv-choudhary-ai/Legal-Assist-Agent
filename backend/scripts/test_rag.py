"""
Test RAG Pipeline
Tests the complete Retrieval-Augmented Generation system
"""

import os
import sys
import logging
import json

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from ai.rag_pipeline import rag_pipeline
from ai.vectordb_manager import vector_db

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_search():
    """Test semantic search"""
    logger.info("\n" + "=" * 60)
    logger.info("🔍 TEST 1: Semantic Search")
    logger.info("=" * 60)
    
    queries = [
        "What are the requirements for property sale?",
        "How to register a company?",
        "Copyright protection duration",
        "NDA key clauses"
    ]
    
    for query in queries:
        logger.info(f"\n📝 Query: {query}")
        
        try:
            results = rag_pipeline.search_knowledge_base(query, n_results=2)
            
            if results:
                logger.info(f"✅ Found {len(results)} relevant documents")
                
                for i, result in enumerate(results, 1):
                    logger.info(f"\n  Result {i}:")
                    logger.info(f"    Score: {result['score']:.3f}")
                    logger.info(f"    Source: {result.get('source', 'N/A')}")
                    logger.info(f"    Type: {result.get('type', 'N/A')}")
                    preview = result['text'][:150].replace('\n', ' ')
                    logger.info(f"    Preview: {preview}...")
            else:
                logger.warning(f"⚠️ No relevant results found")
        
        except Exception as e:
            logger.error(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()


def test_rag_query():
    """Test RAG query with answer generation"""
    logger.info("\n" + "=" * 60)
    logger.info("💬 TEST 2: RAG Query with Answer Generation")
    logger.info("=" * 60)
    
    questions = [
        "What documents are required for property sale above ₹100?",
        "What are the minimum requirements to start a private company in India?",
        "How long does copyright protection last?",
        "What should be included in an employment contract?"
    ]
    
    for question in questions:
        logger.info(f"\n❓ Question: {question}")
        
        try:
            result = rag_pipeline.query_with_rag(
                query=question,
                conversation_id="test_rag_query",
                n_results=3
            )
            
            if result['success']:
                logger.info(f"\n✅ Answer Generated:")
                logger.info(f"{result['answer']}\n")
                
                if result.get('sources'):
                    logger.info(f"📚 Sources ({len(result['sources'])}):")
                    for i, source in enumerate(result['sources'], 1):
                        logger.info(f"  {i}. {source.get('source', 'Unknown')} (score: {source.get('score', 0):.3f})")
                
                logger.info(f"\n📊 Context Documents Used: {result.get('num_contexts', 0)}")
                logger.info(f"💰 Tokens Used: {result.get('tokens_used', 0)}")
            else:
                logger.error(f"❌ Query failed: {result.get('error')}")
        
        except Exception as e:
            logger.error(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()


def test_conversation_rag():
    """Test multi-turn RAG conversation"""
    logger.info("\n" + "=" * 60)
    logger.info("💬 TEST 3: Multi-turn RAG Conversation")
    logger.info("=" * 60)
    
    conversation = [
        "What is required for a valid contract under Indian law?",
        "Can you explain more about lawful consideration?",
        "What happens if there's no free consent?"
    ]
    
    conversation_id = "test_multiturn_rag"
    
    for i, question in enumerate(conversation, 1):
        logger.info(f"\n--- Turn {i} ---")
        logger.info(f"❓ Question: {question}")
        
        try:
            result = rag_pipeline.query_with_rag(
                query=question,
                conversation_id=conversation_id,
                n_results=2
            )
            
            if result['success']:
                logger.info(f"✅ Answer: {result['answer'][:300]}...")
            else:
                logger.error(f"❌ Failed: {result.get('error')}")
        
        except Exception as e:
            logger.error(f"❌ Error: {e}")


def test_stats():
    """Test knowledge base statistics"""
    logger.info("\n" + "=" * 60)
    logger.info("📊 TEST 4: Knowledge Base Statistics")
    logger.info("=" * 60)
    
    try:
        stats = vector_db.get_stats()
        
        logger.info(f"\n✅ Knowledge Base Stats:")
        logger.info(f"   Collection: {stats.get('collection_name')}")
        logger.info(f"   Total Documents: {stats.get('total_documents')}")
        logger.info(f"   Distance Metric: {stats.get('distance_metric')}")
        logger.info(f"   Embedding Model: {stats.get('embedding_model')}")
        
        if stats.get('sample_metadata'):
            logger.info(f"\n📝 Sample Document Metadata:")
            for key, value in stats['sample_metadata'].items():
                logger.info(f"   {key}: {value}")
    
    except Exception as e:
        logger.error(f"❌ Error getting stats: {e}")


def test_document_add():
    """Test adding a new document"""
    logger.info("\n" + "=" * 60)
    logger.info("📄 TEST 5: Add New Document")
    logger.info("=" * 60)
    
    test_doc = """
Power of Attorney in India:
A Power of Attorney (POA) is a legal document that allows one person (principal) to authorize another person (agent/attorney) to act on their behalf.

Types:
1. General Power of Attorney: Broad powers for all matters
2. Special Power of Attorney: Limited to specific transactions
3. Durable Power of Attorney: Continues even if principal becomes incapacitated

Requirements:
- Must be in writing
- Signed by the principal
- Notarized (recommended)
- Registration required for immovable property transactions

Powers That Can Be Granted:
- Property management
- Financial transactions
- Legal proceedings
- Business operations
- Health care decisions

Important: POA is automatically revoked on death of principal.
    """
    
    metadata = {
        'source': 'Legal Documentation Guide',
        'type': 'Guide',
        'category': 'Power of Attorney',
        'domain': 'legal',
        'added_by': 'test_script'
    }
    
    try:
        result = rag_pipeline.add_document_to_knowledge_base(
            text=test_doc,
            metadata=metadata
        )
        
        if result['success']:
            logger.info(f"✅ Document added successfully!")
            logger.info(f"   Document ID: {result.get('document_id')}")
            logger.info(f"   Chunks Created: {result.get('num_chunks')}")
            
            # Test search for the new document
            logger.info("\n🔍 Searching for newly added document...")
            search_results = rag_pipeline.search_knowledge_base("power of attorney", n_results=1)
            
            if search_results:
                logger.info(f"✅ Found in search!")
                logger.info(f"   Source: {search_results[0].get('source')}")
        else:
            logger.error(f"❌ Failed: {result.get('error')}")
    
    except Exception as e:
        logger.error(f"❌ Error: {e}")


def run_all_tests():
    """Run all RAG tests"""
    logger.info("\n" + "=" * 80)
    logger.info("🚀 RUNNING RAG PIPELINE TESTS")
    logger.info("=" * 80)
    
    try:
        # Check if knowledge base has documents
        stats = vector_db.get_stats()
        total_docs = stats.get('total_documents', 0)
        
        if total_docs == 0:
            logger.warning("⚠️  Knowledge base is empty!")
            logger.info("   Run: python populate_vectordb.py --samples")
            return
        
        logger.info(f"✅ Knowledge base has {total_docs} documents\n")
        
        # Run tests
        test_stats()
        test_search()
        test_rag_query()
        test_conversation_rag()
        test_document_add()
        
        logger.info("\n" + "=" * 80)
        logger.info("✅ ALL TESTS COMPLETED!")
        logger.info("=" * 80)
    
    except Exception as e:
        logger.error(f"❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Test RAG Pipeline')
    parser.add_argument('--test', type=str, choices=['search', 'rag', 'conversation', 'stats', 'add', 'all'],
                        default='all', help='Which test to run')
    
    args = parser.parse_args()
    
    if args.test == 'search':
        test_search()
    elif args.test == 'rag':
        test_rag_query()
    elif args.test == 'conversation':
        test_conversation_rag()
    elif args.test == 'stats':
        test_stats()
    elif args.test == 'add':
        test_document_add()
    else:
        run_all_tests()
