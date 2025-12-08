# Digital Signature Feature - Setup Guide

## Quick Start (Demo Mode)

The digital signature feature works **out of the box** in DEMO mode without any NSDL credentials!

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Create Database Tables

```bash
python scripts/create_signature_tables.py
```

### 3. Start the Server

```bash
python app.py
```

### 4. Test in Demo Mode

The service will automatically run in demo mode. Use:
- **OTP**: `123456` (works for any Aadhaar number in demo mode)
- Documents will be signed with a demo digital signature

---

## Production Setup (NSDL e-Sign)

### Step 1: Register with NSDL e-Sign

1. Visit: https://www.nsdl.co.in/esign/
2. Register for e-Sign services
3. Complete KYC verification
4. Get your API credentials:
   - Client ID
   - Client Secret
   - API URL (production or sandbox)

**Cost**: ~₹10,000-50,000 setup fee + ₹5-15 per signature

### Step 2: Configure Environment Variables

Copy the signature configuration:

```bash
cat .env.signature.example >> .env
```

Edit `.env` and add your credentials:

```env
NSDL_CLIENT_ID=your_client_id_here
NSDL_CLIENT_SECRET=your_client_secret_here
NSDL_API_URL=https://esign.nsdl.com/api/v2
NSDL_CALLBACK_URL=https://yourapp.com/api/signature/callback
```

### Step 3: Test Production Mode

Restart the server. You should see:

```
✅ NSDL e-Sign service initialized in PRODUCTION MODE
```

---

## API Endpoints

### 1. Check Service Status

```bash
GET /api/signature/status
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "service": "NSDL e-Sign",
  "status": "active",
  "mode": "demo",
  "configured": false,
  "message": "Demo mode active - use OTP 123456"
}
```

### 2. Initiate Signature

```bash
POST /api/signature/initiate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "document_id": 123,
  "aadhaar_number": "234567890123",
  "signer_details": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210"
  }
}
```

Response:
```json
{
  "signature_id": 456,
  "transaction_id": "TXN_20251207_ABC123",
  "status": "otp_sent",
  "expires_at": "2025-12-07T14:30:00Z",
  "message": "DEMO MODE: OTP sent (use 123456)",
  "demo_otp": "123456",
  "masked_aadhaar": "XXXX-XXXX-0123"
}
```

### 3. Verify OTP

```bash
POST /api/signature/verify-otp
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "signature_id": 456,
  "otp": "123456"
}
```

Response:
```json
{
  "verified": true,
  "signature_id": 456,
  "signer_name": "John Doe",
  "message": "OTP verified successfully. Ready to sign."
}
```

### 4. Apply Signature

```bash
POST /api/signature/apply
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "signature_id": 456
}
```

Response:
```json
{
  "signed": true,
  "signature_id": 456,
  "signed_document_url": "/api/signature/download/456",
  "certificate_id": "DEMO-CERT-2025",
  "signed_at": "2025-12-07T14:15:00Z",
  "signer_name": "John Doe"
}
```

### 5. Download Signed Document

```bash
GET /api/signature/download/456
Authorization: Bearer <jwt_token>
```

Returns: PDF file with digital signature

### 6. Get Signature History

```bash
GET /api/signature/history/123
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "signatures": [
    {
      "signature_id": 456,
      "status": "signed",
      "signer_name": "John Doe",
      "created_at": "2025-12-07T14:00:00Z",
      "signed_at": "2025-12-07T14:15:00Z",
      "certificate_id": "DEMO-CERT-2025"
    }
  ]
}
```

---

## Testing Workflow

### Complete End-to-End Test

```python
# 1. Check service status
GET /api/signature/status

# 2. Initiate signature
POST /api/signature/initiate
{
  "document_id": 1,
  "aadhaar_number": "234567890123",
  "signer_details": {
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+919876543210"
  }
}

# 3. Verify OTP (use 123456 in demo mode)
POST /api/signature/verify-otp
{
  "signature_id": <from_previous_response>,
  "otp": "123456"
}

# 4. Apply signature
POST /api/signature/apply
{
  "signature_id": <from_previous_response>
}

# 5. Download signed document
GET /api/signature/download/<signature_id>
```

---

## Security Features

### ✅ Implemented

1. **Aadhaar Protection**
   - Never stores plain Aadhaar numbers
   - Uses SHA-256 hashing
   - Shows only last 4 digits to users

2. **OTP Security**
   - 10-minute expiry
   - Maximum 3 retry attempts
   - One-time use only

3. **Document Integrity**
   - SHA-256 hash before signing
   - SHA-256 hash after signing
   - Detects tampering

4. **Audit Trail**
   - Complete event logging
   - IP address tracking
   - Device fingerprinting
   - Timestamp for all actions

5. **Authentication**
   - JWT required for all endpoints
   - User-specific signatures
   - Role-based access (if needed)

---

## Compliance

### Legal Framework

1. **IT Act 2000**
   - Digital signatures are legally valid
   - Same legal status as physical signatures

2. **Aadhaar Act 2016**
   - Secure handling of Aadhaar data
   - No plain text storage
   - Purpose limitation

3. **UIDAI Guidelines**
   - Follows eSign ASP requirements
   - NSDL is certified eSign provider

---

## Troubleshooting

### Demo Mode Not Working?

Check:
```bash
# View logs
python app.py

# Should see:
# ⚠️  NSDL e-Sign running in DEMO MODE (no credentials configured)
```

### Production Mode Issues?

1. **Invalid Credentials**
   ```
   Error: Authentication failed
   ```
   Solution: Verify `NSDL_CLIENT_ID` and `NSDL_CLIENT_SECRET`

2. **Network Error**
   ```
   Error: Unable to connect to NSDL e-Sign service
   ```
   Solution: Check `NSDL_API_URL` and internet connectivity

3. **Callback Not Received**
   ```
   Error: Callback timeout
   ```
   Solution: Ensure `NSDL_CALLBACK_URL` is publicly accessible

### Database Issues?

```bash
# Re-create tables
python scripts/create_signature_tables.py

# Check tables exist
python scripts/check_user_documents_table.py
```

---

## Cost Estimation

### Development (Demo Mode)
- **Cost**: ₹0 (completely free)
- **Limitations**: Demo watermark on signatures

### Production (NSDL e-Sign)
- **Setup Fee**: ₹10,000 - ₹50,000 (one-time)
- **Per Signature**: ₹5 - ₹15
- **Monthly Minimum**: ₹5,000 (typically 500 signatures)
- **Storage**: ₹500/month (Azure/S3 for signed PDFs)

### ROI Calculation
For 1000 signatures/month:
- Cost: ~₹15,000/month
- Revenue (if charging ₹50/signature): ₹50,000/month
- **Profit**: ₹35,000/month

---

## Next Steps

### Phase 1: Testing (Current)
- [x] Demo mode working
- [ ] Test all API endpoints
- [ ] Test signature workflow
- [ ] Verify PDF signatures

### Phase 2: Production Setup
- [ ] Register with NSDL
- [ ] Configure production credentials
- [ ] Set up callback URLs
- [ ] Configure email/SMS notifications

### Phase 3: Frontend Integration
- [ ] Create signature UI components
- [ ] Add signature button to document editor
- [ ] Implement workflow management
- [ ] Add signature status tracking

### Phase 4: Advanced Features
- [ ] Multi-party signing
- [ ] Sequential workflows
- [ ] Signature templates
- [ ] Bulk signing

---

## Support

### NSDL e-Sign Support
- Website: https://www.nsdl.co.in/esign/
- Email: esign@nsdl.co.in
- Phone: 1800-222-990

### Documentation
- API Docs: `docs/DIGITAL_SIGNATURE_PLAN.md`
- Architecture: `docs/ARCHITECTURE.md`

---

**Last Updated**: December 7, 2025  
**Version**: 1.0  
**Status**: Demo Mode Ready ✅
