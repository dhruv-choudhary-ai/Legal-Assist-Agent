"""
Check Azure OpenAI Deployments
"""
import os
from dotenv import load_dotenv
from openai import AzureOpenAI

load_dotenv()

client = AzureOpenAI(
    api_key=os.getenv('AZURE_OPENAI_API_KEY'),
    api_version=os.getenv('AZURE_OPENAI_API_VERSION'),
    azure_endpoint=os.getenv('AZURE_OPENAI_ENDPOINT')
)

print("=" * 60)
print("AZURE OPENAI DEPLOYMENT CHECK")
print("=" * 60)
print(f"Endpoint: {os.getenv('AZURE_OPENAI_ENDPOINT')}")
print(f"API Version: {os.getenv('AZURE_OPENAI_API_VERSION')}")
print("=" * 60)

# Try to list deployments
try:
    # This endpoint might not be available in all API versions
    print("\nAttempting to list deployments...")
    print("Note: If this fails, you need to check Azure Portal manually")
    print("\nTo find your deployment names:")
    print("1. Go to https://portal.azure.com")
    print("2. Navigate to your Azure OpenAI resource")
    print("3. Click 'Model deployments' or 'Deployments'")
    print("4. Note the deployment names (not model names)")
    print("=" * 60)
    
except Exception as e:
    print(f"\nCouldn't list deployments automatically: {e}")

# Try common deployment names
print("\n🔍 Testing common deployment names...")
print("=" * 60)

test_deployments = [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-35-turbo',
    'gpt-4',
    'text-embedding-ada-002',
    'text-embedding-3-large',
    'legal-bge-m3'
]

for deployment_name in test_deployments:
    try:
        response = client.chat.completions.create(
            model=deployment_name,
            messages=[{"role": "user", "content": "test"}],
            max_tokens=5
        )
        print(f"✅ {deployment_name} - FOUND")
    except Exception as e:
        error_str = str(e)
        if 'DeploymentNotFound' in error_str:
            print(f"❌ {deployment_name} - NOT FOUND")
        elif 'embeddings' in deployment_name.lower():
            # Try as embedding model
            try:
                response = client.embeddings.create(
                    model=deployment_name,
                    input="test"
                )
                print(f"✅ {deployment_name} - FOUND (Embedding)")
            except:
                print(f"❌ {deployment_name} - NOT FOUND")
        else:
            print(f"⚠️  {deployment_name} - ERROR: {error_str[:100]}")

print("\n" + "=" * 60)
print("RECOMMENDATION:")
print("Update your .env file with the correct deployment names")
print("=" * 60)
