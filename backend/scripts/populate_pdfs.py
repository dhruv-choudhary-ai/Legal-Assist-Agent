"""
Populate Vector DB with better error handling
"""

import os
import sys
import logging

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from ai.document_processor import DocumentProcessor
from ai.vectordb_manager import vector_db
from ai.embedding_service import embedding_service

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def populate_pdfs():
    """Populate from PDF files with detailed logging"""
    
    pdf_dir = os.path.join(parent_dir, 'data', 'legal_knowledge')
    logger.info(f"📁 Reading PDFs from: {pdf_dir}")
    
    # Initialize processor
    processor = DocumentProcessor()
    
    # Get all PDF files
    pdf_files = [f for f in os.listdir(pdf_dir) if f.endswith('.pdf')]
    logger.info(f"Found {len(pdf_files)} PDF files")
    
    all_documents = []
    all_metadatas = []
    
    for pdf_file in pdf_files:
        pdf_path = os.path.join(pdf_dir, pdf_file)
        logger.info(f"\n📄 Processing: {pdf_file}")
        
        try:
            # Read and chunk the PDF
            chunks = processor.process_document_for_rag(
                file_path=pdf_path,
                document_type='Legal Document'
            )
            
            if chunks:
                logger.info(f"   ✅ Created {len(chunks)} chunks")
                
                # Add to batch
                for chunk in chunks:
                    all_documents.append(chunk['text'])
                    all_metadatas.append({
                        'source': pdf_file,
                        'type': 'Legal Document',
                        'domain': 'indian_law',
                        **chunk.get('metadata', {})
                    })
            else:
                logger.warning(f"   ⚠️ No chunks created")
                
        except Exception as e:
            logger.error(f"   ❌ Failed to process {pdf_file}: {e}")
            import traceback
            traceback.print_exc()
    
    # Add all documents to vector DB
    if all_documents:
        logger.info(f"\n📊 Total chunks to add: {len(all_documents)}")
        logger.info(f"🔄 Adding to vector database...")
        
        try:
            success = vector_db.add_documents(all_documents, all_metadatas)
            
            if success:
                logger.info(f"✅ Successfully added {len(all_documents)} chunks to vector DB")
                
                # Verify
                stats = vector_db.get_stats()
                logger.info(f"\n📊 Vector DB Stats:")
                logger.info(f"   Total Documents: {stats.get('total_documents', 0)}")
                
                # Test search
                logger.info(f"\n🔍 Testing search...")
                results = vector_db.search("Indian Constitution", n_results=3)
                logger.info(f"   Found {len(results)} results")
                
                for i, result in enumerate(results, 1):
                    source = result.get('metadata', {}).get('source', 'Unknown')
                    score = result.get('score', 0)
                    logger.info(f"   {i}. {source} (score: {score:.4f})")
                
                return True
            else:
                logger.error("❌ Failed to add documents")
                return False
                
        except Exception as e:
            logger.error(f"❌ Vector DB error: {e}")
            import traceback
            traceback.print_exc()
            return False
    else:
        logger.error("❌ No documents to add")
        return False

if __name__ == "__main__":
    print("=" * 80)
    print("📚 POPULATING VECTOR DATABASE WITH LEGAL KNOWLEDGE")
    print("=" * 80)
    
    success = populate_pdfs()
    
    if success:
        print("\n" + "=" * 80)
        print("✅ POPULATION COMPLETE!")
        print("=" * 80)
    else:
        print("\n" + "=" * 80)
        print("❌ POPULATION FAILED")
        print("=" * 80)
