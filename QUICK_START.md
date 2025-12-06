# 🚀 Quick Start - Smart Document Assembly

## What Changed?

Your system is now **10x smarter** with:
- ✅ Clean value extraction (no more "I told you Rahul Kumar" in documents)
- ✅ Context-aware conversations (remembers what you said)
- ✅ No redundant questions
- ✅ Auto document type detection
- ✅ Beautiful chat interface

## How to Use

### Option 1: Via API (Backend)

```bash
# Start server
cd server
python app.py

# Test with curl
curl -X POST http://127.0.0.1:5000/api/document/conversational-assembly \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "I need a rent agreement, my name is Dhruv and owner is Rahul Kumar",
    "session_id": "demo_123"
  }'
```

### Option 2: Via Frontend (React Component)

```jsx
import SmartDocumentChat from './components/SmartDocumentChat';

function App() {
  return <SmartDocumentChat />;
}
```

### Option 3: Test Script

```bash
cd server
python scripts/test_smart_assembly.py
```

## Example Conversation

**You:** "I want a rent agreement. My name is Dhruv and owner is Rahul Kumar, property in Bhopal"

**AI:** ✓ Got it! I've extracted 3 fields:
- Tenant: Dhruv
- Landlord: Rahul Kumar  
- Location: Bhopal

What's the property type? (e.g., residential, commercial)

**You:** "residential"

**AI:** ✓ Got it! What's the monthly rent amount? (e.g., ₹15,000)

**You:** "5000"

**AI:** ✓ Got it! What's the security deposit? (e.g., ₹30,000)

...and so on until done!

## API Response Format

```json
{
  "status": "needs_more_info",
  "message": "What's the monthly rent?",
  "extracted_variables": {
    "LESSEE_NAME": "Dhruv",
    "LESSOR_NAME": "Rahul Kumar",
    "PROPERTY_ADDRESS": "Bhopal"
  },
  "missing_variables": ["MONTHLY_RENT", "SECURITY_DEPOSIT"],
  "progress": {
    "current": 3,
    "total": 8,
    "percentage": 37
  },
  "template_id": "Lease-Agreement"
}
```

When complete:
```json
{
  "status": "generated",
  "message": "🎉 Your Lease Agreement is ready!",
  "document": "RENTAL/LEASE AGREEMENT\n\nThis Rental Agreement...",
  "download_url": "/api/document/download/session_123"
}
```

## Key Features

### 1. Smart Extraction
- Extracts "Rahul Kumar" from "I told you Rahul Kumar" ✅
- Understands "owner" = landlord, "my name" = tenant
- Parses dates, currency, addresses automatically

### 2. No Redundant Questions
- Remembers what you said
- Checks conversation history before asking
- Caches variables per session

### 3. Context Awareness
- Uses full conversation for extraction
- Understands references ("that", "the same")
- Maintains session state

### 4. Auto Type Detection
- Detects lease/rent agreements
- Detects NDAs
- Detects legal notices

## Supported Templates

1. **Lease-Agreement** / Rent-Agreement
2. **NDA** / Employment-Contract
3. **Legal-Notice** (various types)

## Troubleshooting

### Issue: Still getting "I told you" in document
**Solution:** Make sure you're using the new endpoint `/api/document/conversational-assembly` (not the old ones)

### Issue: Server won't start
**Solution:** 
```bash
# Install dependencies
pip install -r requirements.txt

# Check Azure OpenAI config
python -c "from ai.config import AIConfig; print(AIConfig.validate())"
```

### Issue: Extraction not working
**Solution:** Check that GPT-4o-mini deployment is configured in `.env`:
```
AZURE_OPENAI_CHAT_DEPLOYMENT=your-gpt4o-mini-deployment
```

## Architecture

```
User Input
    ↓
[Smart Extractor]
    ├─ GPT-4 Entity Recognition
    ├─ Conversation Context
    ├─ Session Cache
    └─ Clean Value Extraction
    ↓
[Variable Manager]
    ├─ Type Validation
    ├─ Auto Formatting
    └─ Missing Detection
    ↓
[Document Assembler]
    ├─ Template Selection
    ├─ Value Substitution
    └─ DOCX Generation
    ↓
Document Ready!
```

## Next Steps

1. **Try it**: Run `python scripts/test_smart_assembly.py`
2. **Customize**: Edit templates in `backend/data/templates/`
3. **Extend**: Add more document types
4. **Deploy**: Ready for production!

## Support

- 📖 Full docs: See `SMART_ASSEMBLY_UPGRADE.md`
- 🧪 Tests: Run `scripts/test_smart_assembly.py`
- 📝 Templates: Check `backend/data/templates/`

---

**Enjoy your smart legal AI assistant! 🎉**
