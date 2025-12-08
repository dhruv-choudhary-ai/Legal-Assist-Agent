# 🚀 Quick Start - Digital Signature Feature

## Instant Demo (No Configuration Needed!)

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Create Database Tables
```bash
python scripts/create_signature_tables.py
```

### 3. Start Backend
```bash
python app.py
```

You should see:
```
✅ Digital Signature API routes registered
⚠️  NSDL e-Sign running in DEMO MODE (no credentials configured)
```

### 4. Start Frontend (in another terminal)
```bash
cd frontend
npm start
```

### 5. Test It!

1. Navigate to any document in your workspace
2. Look for the **"✍️ Sign Document"** button in the header
3. Click it to open the signature panel
4. Fill in the form:
   - Aadhaar: Any 12-digit number starting with 2-9
   - Name, Email, Phone
5. Click "Request OTP"
6. Use OTP: **123456** (works for any Aadhaar in demo mode)
7. Click "Verify OTP"
8. Click "Sign Document"
9. Download your signed PDF!

---

## What Just Happened?

✅ Document was "signed" with a demo digital signature  
✅ SHA-256 hash calculated for document integrity  
✅ Signature certificate added (demo mode)  
✅ Audit trail logged in database  
✅ Signed PDF ready for download  

**Note**: Demo signatures have a watermark. For real signatures, configure NSDL credentials.

---

## Production Setup (When Ready)

### 1. Register with NSDL
- Visit: https://www.nsdl.co.in/esign/
- Complete registration (₹10,000-50,000 setup fee)
- Get credentials: Client ID, Client Secret

### 2. Add to .env
```bash
cd backend
cat .env.signature.example >> .env
```

Edit `.env` and add:
```env
NSDL_CLIENT_ID=your_actual_client_id
NSDL_CLIENT_SECRET=your_actual_client_secret
NSDL_API_URL=https://esign.nsdl.com/api/v2
NSDL_CALLBACK_URL=https://yourapp.com/api/signature/callback
```

### 3. Restart Backend
```bash
python app.py
```

Now you'll see:
```
✅ NSDL e-Sign service initialized in PRODUCTION MODE
```

Real Aadhaar OTPs will now be sent! 🎉

---

## API Testing (cURL Examples)

### Check Service Status
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:5000/api/signature/status
```

### Initiate Signature
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": 1,
    "aadhaar_number": "234567890123",
    "signer_details": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+919876543210"
    }
  }' \
  http://localhost:5000/api/signature/initiate
```

Response includes `signature_id` and `demo_otp: "123456"`

### Verify OTP
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "signature_id": 1,
    "otp": "123456"
  }' \
  http://localhost:5000/api/signature/verify-otp
```

### Apply Signature
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "signature_id": 1
  }' \
  http://localhost:5000/api/signature/apply
```

### Download Signed Document
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:5000/api/signature/download/1 \
  --output signed_document.pdf
```

---

## Troubleshooting

### Backend won't start?
```bash
# Check if all dependencies installed
pip install -r backend/requirements.txt

# Check database connection
python backend/test_db_connection.py
```

### Database tables not created?
```bash
# Re-run migration
python backend/scripts/create_signature_tables.py
```

### Frontend signature button not showing?
- Ensure document is in 'export' stage
- Check browser console for errors
- Verify SignaturePanel.jsx is imported

### OTP verification failing?
In demo mode, OTP is always **123456**. If it fails:
- Check signature_id is correct
- Ensure OTP hasn't expired (10 min)
- Check backend logs

---

## Documentation

📚 **Complete Guides:**
- Setup: `docs/SIGNATURE_SETUP.md`
- Planning: `docs/DIGITAL_SIGNATURE_PLAN.md`
- Summary: `DIGITAL_SIGNATURE_SUMMARY.md`

🔧 **Code:**
- Backend: `backend/ai/signature/`
- API Routes: `backend/api/signature_routes.py`
- Frontend: `frontend/src/components/SignaturePanel.jsx`

---

## Features Checklist

### ✅ Implemented
- [x] NSDL e-Sign integration
- [x] Demo mode (no credentials needed)
- [x] OTP workflow
- [x] Aadhaar validation
- [x] PDF signing
- [x] Document hashing
- [x] Audit trail
- [x] JWT authentication
- [x] Frontend UI
- [x] Download signed PDFs

### 🔄 Future (Optional)
- [ ] Multi-party workflows
- [ ] Sequential signing
- [ ] Email/SMS notifications
- [ ] Bulk signing
- [ ] Signature position selection

---

## Cost

### Demo Mode
**FREE** ✅ - Unlimited signatures for testing

### Production Mode
- Setup: ₹10,000-50,000 (one-time)
- Per Signature: ₹5-15
- Monthly Min: ₹5,000 (500 signatures)

---

## Support

**NSDL e-Sign:**
- Website: https://www.nsdl.co.in/esign/
- Email: esign@nsdl.co.in
- Phone: 1800-222-990

**Issues?**
- Check backend logs: `python app.py`
- Check database: `python backend/check_user_documents_table.py`
- Review docs: `docs/SIGNATURE_SETUP.md`

---

🎊 **You're all set!** Your platform now has professional digital signature capabilities!
