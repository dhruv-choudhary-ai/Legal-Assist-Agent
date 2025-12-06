"""
Direct test of vector database
"""

import os
import sys

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from ai.vectordb_manager import vector_db

print("=" * 80)
print("🧪 DIRECT VECTOR DB TEST")
print("=" * 80)

# Test 1: Add a simple document
print("\n📝 Test 1: Adding a test document...")
test_docs = ["The Indian Constitution was adopted on 26th January 1950. It is the supreme law of India."]
test_meta = [{"source": "test", "type": "constitution"}]

success = vector_db.add_documents(test_docs, test_meta)
print(f"   Result: {'✅ Success' if success else '❌ Failed'}")

# Test 2: Check stats
print("\n📊 Test 2: Checking stats...")
stats = vector_db.get_stats()
print(f"   Collection: {stats.get('collection_name')}")
print(f"   Total Documents: {stats.get('total_documents')}")

# Test 3: Search
if stats.get('total_documents', 0) > 0:
    print("\n🔍 Test 3: Testing search...")
    results = vector_db.search("Indian Constitution", n_results=1)
    print(f"   Found {len(results)} results")
    if results:
        print(f"   Text: {results[0]['text'][:100]}...")
        print(f"   Score: {results[0].get('score', 0):.4f}")

print("\n" + "=" * 80)
print("✅ Test complete!")
print("=" * 80)
