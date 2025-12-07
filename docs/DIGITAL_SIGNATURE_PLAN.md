# Digital Signature Feature - Implementation Plan

## 🎯 Overview
Add Aadhaar-based digital signature capability to the Legal Documentation Assistant platform, similar to Leegality, allowing users to digitally sign generated legal documents using Aadhaar OTP verification.

**Branch**: `digi_sig`  
**Target Integration**: Post-document generation workflow  
**Legal Compliance**: IT Act 2000, Aadhaar Act 2016

---

## 📋 Feature Requirements

### Core Functionality
1. **Aadhaar-based eSign** - Government-approved digital signature using Aadhaar authentication
2. **OTP Verification** - Secure 6-digit OTP sent to Aadhaar-linked mobile
3. **Multi-party Signing** - Support for multiple signatories on same document
4. **Signature Workflow** - Request → Send → Track → Complete
5. **Document Integrity** - Cryptographic hash to prevent tampering
6. **Audit Trail** - Complete signing history with timestamps
7. **Certificate Management** - Digital signature certificates (DSC)

### User Workflow
```
Generate Document → Review → Request Signature → 
Aadhaar Verification → OTP Validation → Apply Signature → 
Download Signed PDF
```

---

## 🏗️ Architecture Design

### 1. **eSign Service Providers (Choose One)**

#### Option A: NSDL e-Sign (Recommended)
- **Provider**: NSDL e-Governance Infrastructure Limited
- **Compliance**: Government certified ASP (Application Service Provider)
- **Pricing**: Pay-per-signature (₹5-15 per signature)
- **Features**: 
  - Aadhaar-based authentication
  - Digital Signature Certificate (DSC)
  - Timestamp authority
  - PKI infrastructure
- **API Documentation**: https://www.nsdl.co.in/esign/

#### Option B: eMudhra eSign
- **Provider**: eMudhra Limited
- **Compliance**: Licensed Certifying Authority
- **Pricing**: Subscription + per-signature
- **Features**: Similar to NSDL + additional verification layers

#### Option C: Digio API (Leegality Alternative)
- **Provider**: Digio (Used by major startups)
- **Compliance**: UIDAI certified eSign provider
- **Pricing**: API-based pricing
- **Features**:
  - Simple REST API
  - Webhooks for status updates
  - Multi-party signing
  - Template support

### 2. **Database Schema**

```sql
-- Digital Signatures Table
CREATE TABLE digital_signatures (
    signature_id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES user_documents(doc_id),
    user_id INTEGER REFERENCES users(user_id),
    aadhaar_number_hash VARCHAR(64) NOT NULL, -- Hashed, never store plain
    signature_status VARCHAR(50) DEFAULT 'pending',
    -- Status: pending, otp_sent, verified, signed, failed, expired
    
    -- Aadhaar Verification
    transaction_id VARCHAR(100) UNIQUE, -- eSign provider transaction ID
    otp_request_time TIMESTAMP,
    otp_verified_time TIMESTAMP,
    aadhaar_verified BOOLEAN DEFAULT FALSE,
    
    -- Signature Details
    signature_certificate_url TEXT, -- URL to digital certificate
    signed_document_url TEXT, -- URL to signed PDF
    signature_metadata JSONB, -- Contains signer name, location, etc
    
    -- Security
    document_hash VARCHAR(64), -- SHA-256 hash before signing
    signed_document_hash VARCHAR(64), -- SHA-256 hash after signing
    ip_address VARCHAR(45),
    device_info JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signed_at TIMESTAMP,
    expires_at TIMESTAMP, -- OTP/request expiry
    
    -- Audit
    retry_count INTEGER DEFAULT 0,
    error_message TEXT
);

-- Signature Workflow Table (Multi-party signing)
CREATE TABLE signature_workflows (
    workflow_id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES user_documents(doc_id),
    created_by INTEGER REFERENCES users(user_id),
    workflow_status VARCHAR(50) DEFAULT 'active',
    -- Status: active, partially_signed, completed, cancelled
    
    total_signatories INTEGER,
    signed_count INTEGER DEFAULT 0,
    
    -- Workflow settings
    signing_order VARCHAR(20) DEFAULT 'parallel', -- parallel or sequential
    reminder_enabled BOOLEAN DEFAULT TRUE,
    auto_reminder_hours INTEGER DEFAULT 24,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Signatories Table
CREATE TABLE signatories (
    signatory_id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES signature_workflows(workflow_id),
    signature_id INTEGER REFERENCES digital_signatures(signature_id),
    
    -- Signatory info
    user_id INTEGER REFERENCES users(user_id), -- If registered user
    email VARCHAR(255),
    name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50), -- 'party_1', 'party_2', 'witness', 'notary'
    
    -- Signing order (for sequential)
    signing_order INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, notified, viewed, signed, declined, expired
    
    -- Notifications
    invitation_sent_at TIMESTAMP,
    last_reminder_at TIMESTAMP,
    signed_at TIMESTAMP,
    
    UNIQUE(workflow_id, email)
);

-- Signature Audit Log
CREATE TABLE signature_audit_log (
    log_id SERIAL PRIMARY KEY,
    signature_id INTEGER REFERENCES digital_signatures(signature_id),
    event_type VARCHAR(50), -- otp_requested, otp_verified, document_signed, etc
    event_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_signatures_document ON digital_signatures(document_id);
CREATE INDEX idx_signatures_user ON digital_signatures(user_id);
CREATE INDEX idx_signatures_status ON digital_signatures(signature_status);
CREATE INDEX idx_workflows_document ON signature_workflows(document_id);
CREATE INDEX idx_signatories_workflow ON signatories(workflow_id);
CREATE INDEX idx_signatories_email ON signatories(email);
CREATE INDEX idx_audit_signature ON signature_audit_log(signature_id);
```

### 3. **Backend API Structure**

```
backend/
├── ai/
│   └── signature/
│       ├── __init__.py
│       ├── esign_service.py          # eSign provider integration
│       ├── aadhaar_validator.py      # Aadhaar number validation
│       ├── signature_manager.py      # Signature workflow logic
│       ├── pdf_processor.py          # PDF manipulation & signing
│       └── notification_service.py   # Email/SMS notifications
│
├── api/
│   └── signature_routes.py           # Signature API endpoints
│
└── config/
    └── esign_config.py               # eSign provider credentials
```

### 4. **API Endpoints**

```python
# Signature Initiation
POST /api/signature/initiate
{
    "document_id": 123,
    "aadhaar_number": "XXXX-XXXX-1234",  # Last 4 digits visible
    "signer_details": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+919876543210"
    }
}
Response: {
    "signature_id": 456,
    "transaction_id": "TXN123456",
    "status": "otp_sent",
    "expires_at": "2025-12-07T14:30:00Z"
}

# OTP Verification
POST /api/signature/verify-otp
{
    "signature_id": 456,
    "transaction_id": "TXN123456",
    "otp": "123456"
}
Response: {
    "verified": true,
    "signature_status": "verified",
    "proceed_to_sign": true
}

# Apply Signature
POST /api/signature/apply
{
    "signature_id": 456,
    "transaction_id": "TXN123456"
}
Response: {
    "signed": true,
    "signed_document_url": "/api/documents/download/signed_123.pdf",
    "certificate_url": "/api/signature/certificate/456",
    "signed_at": "2025-12-07T14:15:00Z"
}

# Multi-party Workflow
POST /api/signature/workflow/create
{
    "document_id": 123,
    "signatories": [
        {
            "email": "party1@example.com",
            "name": "Party 1",
            "role": "party_1",
            "order": 1
        },
        {
            "email": "party2@example.com",
            "name": "Party 2",
            "role": "party_2",
            "order": 2
        }
    ],
    "signing_order": "sequential"
}

GET /api/signature/workflow/:workflow_id/status
Response: {
    "workflow_id": 789,
    "status": "partially_signed",
    "total_signatories": 2,
    "signed_count": 1,
    "pending_signatories": ["party2@example.com"]
}

# Signature History
GET /api/signature/document/:document_id/history
Response: {
    "signatures": [
        {
            "signer_name": "John Doe",
            "signed_at": "2025-12-07T14:15:00Z",
            "status": "completed",
            "certificate_id": "CERT123"
        }
    ]
}
```

---

## 🎨 Frontend Components

### 1. **SignaturePanel Component**
Location: `frontend/src/components/SignaturePanel.jsx`

```jsx
// Features:
- Display document ready for signature
- Aadhaar number input (with masking)
- OTP input screen
- Signature preview
- Multi-party invitation interface
- Signing status tracker
```

### 2. **SignatureWorkflow Component**
Location: `frontend/src/components/SignatureWorkflow.jsx`

```jsx
// Features:
- Add multiple signatories
- Set signing order (parallel/sequential)
- Send signature requests
- Track signing progress
- Reminders management
```

### 3. **SignedDocumentViewer Component**
Location: `frontend/src/components/SignedDocumentViewer.jsx`

```jsx
// Features:
- Display signed PDF
- Show signature certificates
- Verify signature validity
- Download signed document
- View audit trail
```

### 4. **Update UnifiedWorkspace**
Add signature button in document editor toolbar:
```jsx
<button className="signature-btn" onClick={handleRequestSignature}>
  <SignatureIcon /> Request Signature
</button>
```

---

## 🔐 Security Considerations

### 1. **Data Protection**
- ✅ Never store plain Aadhaar numbers (use SHA-256 hash)
- ✅ Encrypt OTP in transit (HTTPS mandatory)
- ✅ OTP expiry: 10 minutes
- ✅ Maximum 3 OTP retry attempts
- ✅ Store minimal PII, comply with IT Act
- ✅ Secure document storage (encrypted S3/Azure Blob)

### 2. **Compliance**
- ✅ UIDAI eSign guidelines compliance
- ✅ IT Act 2000 (Digital Signature)
- ✅ Aadhaar Act 2016 (Data protection)
- ✅ GDPR-like data handling for user consent

### 3. **Authentication**
- ✅ JWT token required for all signature APIs
- ✅ Rate limiting: 5 signature requests per hour per user
- ✅ IP-based fraud detection
- ✅ Device fingerprinting

---

## 💰 Cost Estimation

### eSign Provider Costs (NSDL/Digio)
- Setup fee: ₹10,000 - ₹50,000 (one-time)
- Per signature: ₹5 - ₹15
- Monthly minimum: ₹5,000 (typically 500 signatures)

### Infrastructure Costs
- PDF processing: Existing infrastructure
- Storage (signed documents): ~₹500/month (100GB Azure Blob)
- SMS/Email notifications: ~₹0.10 per notification

### Development Effort
- Backend API: 40 hours
- Frontend UI: 30 hours
- Testing & Integration: 20 hours
- **Total**: ~90 hours (2-3 weeks)

---

## 📝 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up eSign provider account (NSDL/Digio)
- [ ] Create database schema and migrations
- [ ] Implement basic signature models
- [ ] Create signature_routes.py with basic endpoints
- [ ] Build esign_service.py wrapper

### Phase 2: Core Features (Week 2)
- [ ] Implement Aadhaar validation
- [ ] Build OTP request/verification flow
- [ ] PDF signing integration
- [ ] Create SignaturePanel component
- [ ] Test single-user signing flow

### Phase 3: Advanced Features (Week 3)
- [ ] Multi-party workflow implementation
- [ ] SignatureWorkflow component
- [ ] Email/SMS notifications
- [ ] Signature audit trail
- [ ] SignedDocumentViewer component

### Phase 4: Polish & Production (Week 4)
- [ ] Security audit
- [ ] Error handling & edge cases
- [ ] Performance optimization
- [ ] Documentation
- [ ] Production deployment

---

## 🧪 Testing Strategy

### Unit Tests
- Aadhaar number validation
- OTP generation/verification logic
- PDF hashing and integrity checks
- Signature status state machine

### Integration Tests
- eSign provider API integration
- End-to-end signing workflow
- Multi-party signing scenarios
- Webhook handling

### Security Tests
- Penetration testing for OTP bypass
- SQL injection in signature APIs
- XSS in signature display
- Rate limiting validation

### User Acceptance Tests
- Single signer workflow
- Multiple signers (parallel)
- Multiple signers (sequential)
- Signature verification
- Document download

---

## 🔄 User Flow Diagrams

### Single Signer Flow
```
User generates document
    ↓
Clicks "Sign Document"
    ↓
Enters Aadhaar number
    ↓
System sends OTP via eSign provider
    ↓
User enters OTP
    ↓
System verifies with UIDAI
    ↓
Digital signature applied to PDF
    ↓
Signed document stored & available for download
```

### Multi-party Flow
```
User creates signature workflow
    ↓
Adds signatories (emails)
    ↓
Sets signing order
    ↓
System sends signature invitations
    ↓
Each signatory receives email/SMS
    ↓
Signatory clicks link → Aadhaar OTP flow
    ↓
Once all sign → Final document generated
    ↓
All parties receive signed copy
```

---

## 📚 Technical Dependencies

### Python Packages
```txt
# backend/requirements.txt additions
PyPDF2==3.0.1              # PDF manipulation
reportlab==4.0.7           # PDF generation
cryptography==41.0.7       # Encryption & hashing
requests==2.31.0           # API calls to eSign provider
pillow==10.1.0            # Image handling for signatures
python-magic==0.4.27       # File type validation
```

### Frontend Packages
```json
// frontend/package.json additions
{
  "dependencies": {
    "react-signature-canvas": "^1.0.6",  // Signature drawing
    "pdfjs-dist": "^3.11.174",           // PDF preview
    "qrcode.react": "^3.1.0"             // QR codes for verification
  }
}
```

---

## 🚀 Quick Start for Development

### 1. Set up eSign Provider (Sandbox)
```bash
# Register for NSDL eSign sandbox account
# Get API credentials: client_id, client_secret, API endpoint
```

### 2. Environment Variables
```bash
# Add to .env
ESIGN_PROVIDER=nsdl
ESIGN_CLIENT_ID=your_client_id
ESIGN_CLIENT_SECRET=your_client_secret
ESIGN_API_URL=https://esign-sandbox.nsdl.co.in/api
ESIGN_CALLBACK_URL=https://yourapp.com/api/signature/callback
```

### 3. Database Setup
```bash
cd backend
python scripts/create_signature_tables.py
```

### 4. Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

---

## 🎯 Success Metrics

### Functional Metrics
- ✅ Successfully sign document with Aadhaar OTP
- ✅ Multi-party workflow completes without errors
- ✅ Signed PDF verifiable with certificate
- ✅ 99.9% signature success rate (no provider failures)

### Performance Metrics
- OTP delivery: < 30 seconds
- Signature application: < 5 seconds
- Document download: < 3 seconds

### Business Metrics
- User adoption rate
- Cost per signature
- Support tickets related to signing

---

## 🤝 Alternatives & Comparisons

| Feature | Leegality | Digio | Our Implementation |
|---------|-----------|-------|-------------------|
| Aadhaar eSign | ✅ | ✅ | ✅ |
| Multi-party | ✅ | ✅ | ✅ |
| Workflow automation | ✅ | ✅ | ✅ |
| Pricing | ₹15-20/sign | ₹10-15/sign | ₹5-15/sign |
| Custom branding | ❌ | Limited | ✅ Full control |
| AI integration | ❌ | ❌ | ✅ (our USP) |

**Our Competitive Advantage**: 
- Integrated with AI document generation
- No context switching (generate → sign in one flow)
- Lower cost (direct provider integration)
- Full customization and white-labeling

---

## 📞 Next Steps & Discussion Points

### Questions to Resolve:
1. **eSign Provider Selection**: NSDL vs Digio vs eMudhra?
   - Budget available for setup?
   - Expected monthly volume?

2. **Scope for MVP**:
   - Start with single-signer or include multi-party?
   - Sequential signing needed in MVP?

3. **Pricing Strategy**:
   - Free tier with limited signatures?
   - Pay-per-signature or subscription?

4. **Legal Review**:
   - Do we need legal consultation for compliance?
   - Terms of service updates?

5. **Infrastructure**:
   - Where to store signed documents? (Azure Blob, S3, local?)
   - Backup and retention policy?

### Immediate Action Items:
- [ ] Choose eSign provider and register account
- [ ] Set up sandbox environment
- [ ] Review and approve database schema
- [ ] Assign development tasks
- [ ] Create detailed frontend mockups

---

## 📖 References

- [UIDAI eSign Documentation](https://uidai.gov.in/esign.html)
- [IT Act 2000 - Digital Signatures](https://www.indiacode.nic.in/handle/123456789/1999)
- [NSDL eSign Developer Guide](https://www.nsdl.co.in/esign/)
- [Digio API Documentation](https://www.digio.in/developers/)

---

**Document Version**: 1.0  
**Last Updated**: December 7, 2025  
**Author**: AI Development Team  
**Branch**: digi_sig
