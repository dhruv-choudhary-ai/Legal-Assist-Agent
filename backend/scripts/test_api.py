"""
Quick API test script
"""
import requests
import json

BASE_URL = "http://localhost:5000"

print("\n" + "="*60)
print("🧪 TESTING BACKEND APIs")
print("="*60 + "\n")

# Test 1: List templates
print("1️⃣ Testing /api/templates/list...")
try:
    response = requests.get(f"{BASE_URL}/api/templates/list")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS: Found {data['count']} templates")
        for template in data['templates'][:3]:
            print(f"   - {template['name']} ({template['category']}) - {template['variable_count']} variables")
    else:
        print(f"❌ FAILED: {response.status_code}")
except Exception as e:
    print(f"❌ ERROR: {e}")

# Test 2: Get template metadata
print("\n2️⃣ Testing /api/templates/employment/nda/metadata...")
try:
    response = requests.get(f"{BASE_URL}/api/templates/employment/nda/metadata")
    if response.status_code == 200:
        data = response.json()
        template = data['template']
        print(f"✅ SUCCESS: {template['name']}")
        print(f"   Variables: {list(template['variables'].keys())[:5]}...")
    else:
        print(f"❌ FAILED: {response.status_code}")
except Exception as e:
    print(f"❌ ERROR: {e}")

# Test 3: Extract variables
print("\n3️⃣ Testing /api/variables/extract...")
try:
    payload = {
        "template_id": "employment/nda",
        "description": "Create NDA between TechCorp and John Doe on Jan 15, 2025 in Mumbai for AI project"
    }
    response = requests.post(f"{BASE_URL}/api/variables/extract", json=payload)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS: Extracted {len(data['extracted_variables'])} variables")
        for var, info in list(data['extracted_variables'].items())[:3]:
            print(f"   - {var}: {info['value']}")
    else:
        print(f"❌ FAILED: {response.status_code} - {response.text}")
except Exception as e:
    print(f"❌ ERROR: {e}")

# Test 4: Legacy API (basic chat)
print("\n4️⃣ Testing /api/chat (legacy)...")
try:
    payload = {
        "message": "What is an NDA?",
        "user_id": "test_user"
    }
    response = requests.post(f"{BASE_URL}/api/chat", json=payload)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS: {data['response'][:100]}...")
    else:
        print(f"❌ FAILED: {response.status_code}")
except Exception as e:
    print(f"❌ ERROR: {e}")

print("\n" + "="*60)
print("✅ API TESTS COMPLETE")
print("="*60 + "\n")
