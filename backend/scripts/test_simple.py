"""
Simple Test - No Chaos, Just Works
"""

import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_simple_flow():
    """Test the SIMPLE flow"""
    
    print("\n" + "="*80)
    print("🧪 Testing SIMPLE Document Assembly")
    print("="*80 + "\n")
    
    session_id = "test_simple"
    conversation = []
    
    # Test messages (same as your example)
    messages = [
        "create rent agreement for Dhruv, owner is Rahul and the Lease is 5000 for 11 months",
        "Rahul Kumar",  # If asked for landlord name
        "Bhopal",  # If asked for location
        "residential",  # If asked for property type
        "2024-01-05",  # If asked for start date
    ]
    
    for i, msg in enumerate(messages, 1):
        print(f"\n{'='*80}")
        print(f"Step {i}: User → \"{msg}\"")
        print("="*80)
        
        # Send message
        response = requests.post(
            f"{BASE_URL}/api/document/simple-chat",
            json={
                "message": msg,
                "session_id": session_id,
                "conversation": conversation
            }
        )
        
        if response.status_code != 200:
            print(f"❌ Error: {response.text}")
            break
        
        data = response.json()
        
        # Add to conversation
        conversation.append({"role": "user", "content": msg})
        conversation.append({"role": "assistant", "content": data.get("message", "")})
        
        # Show results
        print(f"\n🤖 Assistant → {data.get('message')}")
        print(f"\n📊 Status: {data.get('status')}")
        print(f"📝 Template: {data.get('template', 'Not detected yet')}")
        
        if data.get('extracted'):
            print(f"\n✅ Extracted ({len(data['extracted'])} fields):")
            for k, v in data['extracted'].items():
                print(f"   • {k}: {v}")
        
        if data.get('missing'):
            print(f"\n⚠️  Missing ({len(data['missing'])} fields):")
            for field in data['missing'][:5]:  # Show first 5
                print(f"   • {field}")
        
        if data.get('progress'):
            p = data['progress']
            print(f"\n📈 Progress: {p['done']}/{p['total']} ({p['percent']}%)")
        
        # If document is ready
        if data.get('status') == 'ready':
            print(f"\n{'='*80}")
            print("🎉 DOCUMENT READY!")
            print("="*80)
            
            doc_preview = data.get('document', '')[:500]
            print(f"\n📄 Preview:\n{doc_preview}")
            
            # Check for artifacts
            if "I told you" in data.get('document', '') or "my name is" in data.get('document', '').lower():
                print("\n❌ FAIL: Document has extraction artifacts!")
            else:
                print("\n✅ PASS: Clean document!")
            
            if data.get('rag_suggestions'):
                print(f"\n💡 RAG Suggestions (BGE-M3):\n{data['rag_suggestions'][:300]}...")
            
            break
    
    print(f"\n{'='*80}\n")


if __name__ == "__main__":
    print("\n🚀 Starting SIMPLE test...\n")
    test_simple_flow()
    print("✅ Test complete\n")
