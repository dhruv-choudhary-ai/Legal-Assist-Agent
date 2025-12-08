"""
Digital Signature Feature README
Complete implementation of Aadhaar-based e-Sign using NSDL
"""

# 🔐 Digital Signature Module

## Overview

This module provides **Aadhaar-based digital signature** functionality using NSDL e-Sign infrastructure. It works in two modes:

1. **Demo Mode** (Default) - Works without NSDL credentials for testing
2. **Production Mode** - Connects to NSDL e-Sign for legal digital signatures

## Features

✅ **Aadhaar OTP Verification** - Secure authentication using Aadhaar-linked mobile  
✅ **Digital Signature Certificate** - Government-certified DSC  
✅ **Document Integrity** - SHA-256 hashing prevents tampering  
✅ **Audit Trail** - Complete logging of all signature events  
✅ **Multi-party Support** - Ready for sequential/parallel signing workflows  
✅ **Demo Mode** - Test without real credentials  

## Architecture

```
backend/
├── ai/signature/
│   ├── __init__.py
│   ├── esign_service.py         # NSDL API integration + Demo mode
│   ├── signature_manager.py     # Signature workflow orchestration
│   ├── pdf_processor.py         # PDF handling and hashing
│   ├── aadhaar_validator.py     # Aadhaar number validation
│   └── notification_service.py  # Email/SMS notifications
│
├── api/
│   └── signature_routes.py      # REST API endpoints
│
└── scripts/
    └── create_signature_tables.py  # Database migration
```

## Database Schema

### Tables Created

1. **digital_signatures** - Core signature data
   - signature_id, document_id, user_id
   - aadhaar_number_hash (SHA-256)
   - transaction_id, esign_request_id
   - signature_status, document_hash
   - signed_document_url, certificate_url
   - created_at, signed_at, expires_at

2. **signature_workflows** - Multi-party signing
   - workflow_id, document_id
   - total_signatories, signed_count
   - signing_order (parallel/sequential)
   - workflow_status

3. **signatories** - Individual signers
   - signatory_id, workflow_id
   - email, name, phone, role
   - status, invitation_token
   - signed_at

4. **signature_audit_log** - Complete audit trail
   - log_id, signature_id
   - event_type, event_data
   - ip_address, user_agent
   - created_at

## API Endpoints

### Service Status
```http
GET /api/signature/status
```

### Signature Workflow
```http
POST /api/signature/initiate        # Step 1: Request OTP
POST /api/signature/verify-otp      # Step 2: Verify OTP
POST /api/signature/apply           # Step 3: Apply signature
```

### Document Management
```http
GET /api/signature/status/:id       # Get signature status
GET /api/signature/download/:id     # Download signed PDF
GET /api/signature/history/:doc_id  # Get signature history
```

All endpoints require JWT authentication.

## Usage Example

```python
# 1. Initiate signature
response = requests.post(
    'http://localhost:5000/api/signature/initiate',
    headers={'Authorization': f'Bearer {jwt_token}'},
    json={
        'document_id': 123,
        'aadhaar_number': '234567890123',
        'signer_details': {
            'name': 'John Doe',
            'email': 'john@example.com',
            'phone': '+919876543210'
        }
    }
)
signature_id = response.json()['signature_id']
demo_otp = response.json()['demo_otp']  # "123456" in demo mode

# 2. Verify OTP
requests.post(
    'http://localhost:5000/api/signature/verify-otp',
    headers={'Authorization': f'Bearer {jwt_token}'},
    json={
        'signature_id': signature_id,
        'otp': demo_otp
    }
)

# 3. Apply signature
response = requests.post(
    'http://localhost:5000/api/signature/apply',
    headers={'Authorization': f'Bearer {jwt_token}'},
    json={'signature_id': signature_id}
)

# 4. Download signed document
download_url = response.json()['signed_document_url']
```

## Security Features

### ✅ Data Protection
- Aadhaar numbers hashed with SHA-256 (never stored plain)
- OTP expires after 10 minutes
- Maximum 3 OTP retry attempts
- Document hash verification prevents tampering
- IP and device tracking for audit

### ✅ Legal Compliance
- IT Act 2000 (Digital Signatures)
- Aadhaar Act 2016 (Data Protection)
- UIDAI eSign Guidelines
- NSDL Certified ASP

## Configuration

### Demo Mode (Default)
No configuration needed. Leave NSDL credentials empty in `.env`:

```env
NSDL_CLIENT_ID=
NSDL_CLIENT_SECRET=
```

System automatically uses demo mode with:
- Fixed OTP: `123456`
- Demo signature watermark
- No external API calls

### Production Mode
Add NSDL credentials to `.env`:

```env
NSDL_CLIENT_ID=your_client_id
NSDL_CLIENT_SECRET=your_client_secret
NSDL_API_URL=https://esign.nsdl.com/api/v2
NSDL_CALLBACK_URL=https://yourapp.com/api/signature/callback
```

## Installation

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Create database tables
python scripts/create_signature_tables.py

# 3. (Optional) Configure NSDL credentials in .env

# 4. Start server
python app.py
```

## Testing

```bash
# Check service status
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:5000/api/signature/status

# Run database migration
python scripts/create_signature_tables.py

# Test signature workflow (see API docs)
```

## Next Steps

### Frontend Integration (✅ COMPLETE)
- [x] SignaturePanel component
- [x] SignatureWorkflow component  
- [x] SignedDocumentViewer component
- [x] Integrated into UnifiedWorkspace

### Advanced Features (✅ COMPLETE)
- [x] Multi-party workflows
- [x] Sequential signing
- [x] Workflow management (add/remove signatories)
- [x] Bulk signing
- [x] Audit trail viewer
- [x] QR code verification

### Future Enhancements
- [ ] Mobile app integration
- [ ] Signature templates
- [ ] Advanced analytics dashboard

## Cost Estimation

### Demo Mode
- **Cost**: Free
- **Use**: Development and testing

### Production Mode  
- **Setup**: ₹10,000-50,000 (one-time)
- **Per Signature**: ₹5-15
- **Monthly Min**: ₹5,000 (500 signatures)

## Support

- **Documentation**: `docs/SIGNATURE_SETUP.md`
- **Planning**: `docs/DIGITAL_SIGNATURE_PLAN.md`
- **NSDL Support**: esign@nsdl.co.in

## License

Same as parent project

---

**Status**: Backend Complete ✅  
**Mode**: Demo Ready ✅  
**Production**: Configure NSDL credentials  
**Last Updated**: December 7, 2025
