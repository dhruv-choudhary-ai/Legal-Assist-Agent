"""
Check Vector Database Status
"""

import os
import sys

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from ai.vectordb_manager import vector_db

print("=" * 80)
print("📊 VECTOR DATABASE STATUS")
print("=" * 80)

# Get stats
stats = vector_db.get_stats()

print(f"\n✅ Collection: {stats.get('collection_name', 'N/A')}")
print(f"📚 Total Documents: {stats.get('total_documents', 0)}")

# Try a sample query
if stats.get('total_documents', 0) > 0:
    print("\n🔍 Testing search...")
    results = vector_db.search(
        query_text="Indian Constitution",
        n_results=3
    )
    
    print(f"\nFound {len(results)} results for 'Indian Constitution':")
    for i, result in enumerate(results, 1):
        source = result.get('metadata', {}).get('source', 'Unknown')
        score = result.get('score', 0)
        preview = result.get('text', '')[:100] + "..."
        print(f"\n{i}. {source} (score: {score:.4f})")
        print(f"   {preview}")

print("\n" + "=" * 80)
print("✅ Check complete!")
print("=" * 80)
