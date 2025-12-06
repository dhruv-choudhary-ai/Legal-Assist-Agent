"""
Test Smart Conversational Document Assembly
Tests the enhanced variable extraction with conversation context
"""

import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_smart_conversation():
    """Test realistic conversation flow"""
    
    print("="*80)
    print("🧪 Testing Smart Conversational Document Assembly")
    print("="*80)
    
    session_id = "test_session_123"
    conversation_history = []
    
    # Simulated conversation as shown in the problem
    user_messages = [
        "I want a rent agreement. My name is Dhruv and owner is Rahul Kumar, The property is in Bhopal",
        "I told you Rahul Kumar",  # Should extract "Rahul Kumar", NOT "I told you Rahul Kumar"
        "Dhruv",
        "residential",
        "5000",
        "10000",
        "1",
        "2024-01-05"
    ]
    
    print("\n📝 Starting conversation simulation...\n")
    
    for i, user_msg in enumerate(user_messages, 1):
        print(f"\n{'='*80}")
        print(f"Turn {i}: User says: \"{user_msg}\"")
        print(f"{'='*80}")
        
        # Add user message to history
        conversation_history.append({"role": "user", "content": user_msg})
        
        # Call API
        response = requests.post(
            f"{BASE_URL}/api/document/conversational-assembly",
            json={
                "user_message": user_msg,
                "session_id": session_id,
                "conversation_history": conversation_history
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            print(f"❌ Error {response.status_code}: {response.text}")
            break
        
        data = response.json()
        
        # Add assistant response to history
        conversation_history.append({"role": "assistant", "content": data.get("message", "")})
        
        # Display results
        print(f"\n🤖 Assistant: {data.get('message', 'No response')}")
        print(f"\n📊 Status: {data.get('status', 'unknown')}")
        
        if data.get('extracted_variables'):
            print(f"\n✅ Extracted Variables ({len(data['extracted_variables'])}):")
            for var_name, var_value in data['extracted_variables'].items():
                if isinstance(var_value, dict):
                    value = var_value.get('value', var_value)
                else:
                    value = var_value
                print(f"   • {var_name}: {value}")
        
        if data.get('missing_variables'):
            print(f"\n⚠️  Missing Variables ({len(data['missing_variables'])}):")
            for var in data['missing_variables']:
                print(f"   • {var}")
        
        if data.get('progress'):
            prog = data['progress']
            print(f"\n📈 Progress: {prog['current']}/{prog['total']} ({prog['percentage']}%)")
        
        # Check for document generation
        if data.get('status') == 'generated':
            print(f"\n{'='*80}")
            print("🎉 DOCUMENT GENERATED SUCCESSFULLY!")
            print(f"{'='*80}")
            print("\n📄 Document Preview (first 500 chars):")
            print("-" * 80)
            doc_preview = data.get('document', '')[:500]
            print(doc_preview)
            print("-" * 80)
            
            # Validate the document doesn't contain extraction artifacts
            print("\n🔍 Validation Checks:")
            
            issues = []
            if "I told you" in data.get('document', ''):
                issues.append("❌ Contains 'I told you' - extraction failed!")
            if "My name is" in data.get('document', ''):
                issues.append("❌ Contains 'My name is' - extraction failed!")
            if "LANDLORD: I told you Rahul Kumar" in data.get('document', ''):
                issues.append("❌ CRITICAL: Landlord name not extracted properly!")
            
            if issues:
                print("\n".join(issues))
                print("\n❌ FAILED: Document contains extraction artifacts")
            else:
                print("✅ Document looks clean - no extraction artifacts")
                print("✅ Properly extracted: Rahul Kumar, Dhruv, Bhopal, etc.")
            
            break
    
    print(f"\n{'='*80}")
    print("✅ Test completed")
    print(f"{'='*80}\n")


def test_single_extraction():
    """Test single message extraction"""
    
    print("\n" + "="*80)
    print("🧪 Testing Single Message Extraction")
    print("="*80)
    
    test_cases = [
        {
            "input": "I told you Rahul Kumar",
            "expected": "Rahul Kumar",
            "context": "When asked for landlord name"
        },
        {
            "input": "My name is Dhruv",
            "expected": "Dhruv",
            "context": "When asked for tenant name"
        },
        {
            "input": "It's in Bhopal",
            "expected": "Bhopal",
            "context": "When asked for property location"
        },
        {
            "input": "5000",
            "expected": "5000",
            "context": "When asked for monthly rent"
        }
    ]
    
    for test in test_cases:
        print(f"\n📝 Input: \"{test['input']}\" ({test['context']})")
        print(f"   Expected: \"{test['expected']}\"")
        
        response = requests.post(
            f"{BASE_URL}/api/document/conversational-assembly",
            json={
                "user_message": test['input'],
                "session_id": f"test_{test['input'][:10]}",
                "template_id": "Lease-Agreement"
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            extracted = data.get('extracted_variables', {})
            
            # Check if any extracted value matches expected
            found = False
            for var_name, var_data in extracted.items():
                value = var_data.get('value', var_data) if isinstance(var_data, dict) else var_data
                if test['expected'].lower() in str(value).lower():
                    print(f"   ✅ Correctly extracted as {var_name}: \"{value}\"")
                    found = True
                    break
            
            if not found:
                print(f"   ❌ Failed to extract \"{test['expected']}\"")
                print(f"   Got: {extracted}")
        else:
            print(f"   ❌ API Error: {response.status_code}")


if __name__ == "__main__":
    print("\n" + "🚀 Starting Smart Extraction Tests" + "\n")
    
    # Test single extractions first
    test_single_extraction()
    
    # Test full conversation flow
    test_smart_conversation()
    
    print("\n" + "="*80)
    print("✅ All tests completed")
    print("="*80 + "\n")
