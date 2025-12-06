# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently, authentication is not enforced. User authentication system is planned for future releases.

---

## Endpoints

### 1. Chat & Conversation

#### `POST /api/chat`
Send a message in conversational document assembly.

**Request Body:**
```json
{
  "message": "I need a rental agreement for my property in Mumbai",
  "session_id": "unique-session-id",
  "context": {
    "template_name": "rental_agreement"
  }
}
```

**Response:**
```json
{
  "response": "I'll help you create a rental agreement. What is the landlord's full name?",
  "extracted_variables": {
    "property_location": "Mumbai"
  },
  "missing_variables": ["landlord_name", "tenant_name", "rent_amount"],
  "session_id": "unique-session-id"
}
```

#### `POST /api/chat/clear`
Clear chat history for a session.

**Request Body:**
```json
{
  "session_id": "unique-session-id"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Chat history cleared"
}
```

---

### 2. Document Assembly

#### `POST /api/assemble`
Generate a document from a template with provided variables.

**Request Body:**
```json
{
  "template_name": "rental_agreement",
  "variables": {
    "landlord_name": "Rajesh Kumar",
    "tenant_name": "Priya Sharma",
    "property_address": "123 MG Road, Mumbai",
    "rent_amount": "25000",
    "lease_start_date": "2024-01-01",
    "lease_duration": "11 months"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "document_url": "/generated_documents/rental_agreement_20241201_123456.docx",
  "filename": "rental_agreement_20241201_123456.docx"
}
```

#### `POST /api/smart-assemble`
Conversational document assembly with smart variable extraction.

**Request Body:**
```json
{
  "template_name": "rental_agreement",
  "user_input": "I am Rajesh Kumar and I want to rent my property at MG Road to Priya Sharma for Rs 25,000 per month",
  "session_id": "unique-session-id"
}
```

**Response:**
```json
{
  "status": "success",
  "extracted_variables": {
    "landlord_name": "Rajesh Kumar",
    "tenant_name": "Priya Sharma",
    "property_address": "MG Road",
    "rent_amount": "25000"
  },
  "missing_variables": ["lease_start_date", "lease_duration"],
  "next_question": "What is the lease start date?",
  "document_url": null
}
```

---

### 3. Template Management

#### `GET /api/templates`
List all available templates (system + user templates).

**Response:**
```json
{
  "templates": [
    {
      "name": "rental_agreement",
      "display_name": "Rental Agreement (11 months)",
      "category": "property",
      "description": "Standard rental agreement for residential property",
      "variables": ["landlord_name", "tenant_name", "property_address", "rent_amount"],
      "is_user_template": false
    },
    {
      "name": "nda",
      "display_name": "Non-Disclosure Agreement",
      "category": "business",
      "description": "Confidentiality agreement between parties",
      "variables": ["party1_name", "party2_name", "effective_date"],
      "is_user_template": false
    }
  ]
}
```

#### `GET /api/template/<template_name>/schema`
Get variable schema for a specific template.

**Response:**
```json
{
  "template_name": "rental_agreement",
  "variables": {
    "landlord_name": {
      "type": "text",
      "required": true,
      "description": "Full name of the landlord"
    },
    "rent_amount": {
      "type": "number",
      "required": true,
      "description": "Monthly rent amount in INR"
    },
    "lease_start_date": {
      "type": "date",
      "required": true,
      "description": "Lease commencement date"
    }
  }
}
```

#### `POST /api/template/upload-and-analyze`
Upload a document and analyze placeholders.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (DOCX file)

**Response:**
```json
{
  "status": "success",
  "filename": "my_template.docx",
  "detected_placeholders": [
    {
      "original": "________",
      "suggested_name": "party_name",
      "type": "text",
      "count": 2
    },
    {
      "original": "[DATE]",
      "suggested_name": "agreement_date",
      "type": "date",
      "count": 1
    }
  ],
  "placeholder_types": ["underscores", "brackets"],
  "total_placeholders": 3
}
```

#### `POST /api/template/convert`
Convert analyzed template to Jinja2 format.

**Request Body:**
```json
{
  "filename": "my_template.docx",
  "variable_mapping": {
    "________": "party_name",
    "[DATE]": "agreement_date"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "converted_file": "temp/my_template_converted.docx",
  "variables_detected": ["party_name", "agreement_date"]
}
```

#### `POST /api/template/save-to-library`
Save converted template to user library.

**Request Body:**
```json
{
  "filename": "my_template_converted.docx",
  "template_name": "partnership_agreement",
  "display_name": "Partnership Agreement",
  "category": "business",
  "description": "Agreement between business partners",
  "variables": {
    "partner1_name": {"type": "text", "required": true},
    "partner2_name": {"type": "text", "required": true},
    "agreement_date": {"type": "date", "required": true}
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Template saved to library",
  "template_name": "partnership_agreement"
}
```

#### `GET /api/template/user-templates`
List all user-uploaded templates.

**Response:**
```json
{
  "templates": [
    {
      "name": "partnership_agreement",
      "display_name": "Partnership Agreement",
      "category": "business",
      "created_at": "2024-12-01T10:30:00"
    }
  ]
}
```

#### `DELETE /api/template/delete/<template_name>`
Delete a user template.

**Response:**
```json
{
  "status": "success",
  "message": "Template deleted successfully"
}
```

---

### 4. RAG & Legal Knowledge

#### `POST /api/rag/search`
Search legal knowledge base.

**Request Body:**
```json
{
  "query": "What are the requirements for a valid rental agreement?",
  "top_k": 5
}
```

**Response:**
```json
{
  "results": [
    {
      "text": "A rental agreement must include...",
      "source": "legal_knowledge/property_law.txt",
      "score": 0.89
    }
  ]
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "status": "error",
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `INVALID_INPUT` - Missing or invalid request parameters
- `TEMPLATE_NOT_FOUND` - Requested template doesn't exist
- `VARIABLE_MISSING` - Required variables not provided
- `FILE_UPLOAD_ERROR` - File upload failed
- `CONVERSION_ERROR` - Template conversion failed
- `ASSEMBLY_ERROR` - Document assembly failed
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting

Currently not implemented. Planned for future releases.

---

## File Download

Generated documents are accessible via:
```
http://localhost:5000/generated_documents/<filename>
```

Files are automatically cleaned up after 24 hours.
