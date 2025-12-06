"""
Simple test to add documents to vector DB
"""

import os
import sys

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from ai.vectordb_manager import vector_db

print("=" * 80)
print("🧪 SIMPLE VECTOR DB TEST")
print("=" * 80)

# Test 1: Add a simple document
print("\n1️⃣ Adding test document...")
test_docs = [
    "The Indian Constitution was adopted on 26th November 1949 and came into effect on 26th January 1950.",
    "Article 21 of the Indian Constitution provides the Right to Life and Personal Liberty.",
    "The Indian Contract Act 1872 governs contracts in India."
]

test_metadata = [
    {'source': 'test_constitution', 'type': 'test'},
    {'source': 'test_article21', 'type': 'test'},
    {'source': 'test_contract_act', 'type': 'test'}
]

try:
    success = vector_db.add_documents(test_docs, test_metadata)
    print(f"   Result: {'✅ Success' if success else '❌ Failed'}")
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()

# Test 2: Check stats
print("\n2️⃣ Checking database stats...")
try:
    stats = vector_db.get_stats()
    print(f"   Collection: {stats.get('collection_name')}")
    print(f"   Total Documents: {stats.get('total_documents')}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Search
print("\n3️⃣ Testing search...")
try:
    results = vector_db.search("Indian Constitution", n_results=2)
    print(f"   Found {len(results)} results")
    for i, result in enumerate(results, 1):
        print(f"\n   Result {i}:")
        print(f"   - Source: {result.get('metadata', {}).get('source')}")
        print(f"   - Score: {result.get('score', 0):.4f}")
        print(f"   - Text: {result.get('text', '')[:100]}...")
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("✅ Test Complete")
print("=" * 80)
