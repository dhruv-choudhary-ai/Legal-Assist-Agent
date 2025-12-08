# 🚀 Advanced Signature Features - Quick Reference

## 📋 Table of Contents
- [Installation](#installation)
- [Features Overview](#features-overview)
- [API Endpoints](#api-endpoints)
- [Component Usage](#component-usage)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Installation

### Quick Setup:
```bash
# Run automated setup
python setup_advanced_signature.py
```

### Manual Setup:
```bash
# Install frontend dependency
cd frontend
npm install qrcode.react

# Install backend dependencies (already included)
cd ../backend
pip install -r requirements.txt
```

---

## ✨ Features Overview

### 1. Multi-Party Signature Workflow
- **Purpose**: Coordinate signatures from multiple parties
- **Access**: Click "👥 Workflow" button in export stage
- **Modes**: Parallel or Sequential signing

### 2. Signed Document Viewer
- **Purpose**: View certificates, verify signatures, audit trail
- **Access**: Click "🔍 View Certificate" after signing
- **Tabs**: Certificate | Verify | Audit Trail

### 3. Bulk Operations
- **Purpose**: Sign multiple documents at once
- **Access**: API endpoint only
- **Method**: POST to `/api/signature/bulk/initiate`

---

## 🔌 API Endpoints

### Workflow Management

#### Create Workflow
```http
POST /api/signature/workflow/create
Authorization: Bearer <token>

{
  "document_id": 123,
  "signatories": [
    {
      "email": "signer@example.com",
      "name": "John Doe",
      "phone": "+919876543210",
      "role": "party_1"
    }
  ],
  "signing_order": "parallel",
  "reminder_enabled": true
}
```

#### Get Workflow Status
```http
GET /api/signature/workflow/{workflow_id}/status
Authorization: Bearer <token>
```

#### Add Signatory
```http
POST /api/signature/workflow/{workflow_id}/signatory
Authorization: Bearer <token>

{
  "email": "new@example.com",
  "name": "Jane Smith",
  "role": "witness"
}
```

#### Remove Signatory
```http
DELETE /api/signature/workflow/{workflow_id}/signatory/{signatory_id}
Authorization: Bearer <token>
```

#### Send Signature Request
```http
POST /api/signature/workflow/{workflow_id}/request/{signatory_id}
Authorization: Bearer <token>
```

#### Send Reminders
```http
POST /api/signature/workflow/{workflow_id}/reminders
Authorization: Bearer <token>
```

### Bulk Operations

#### Bulk Initiate
```http
POST /api/signature/bulk/initiate
Authorization: Bearer <token>

{
  "document_ids": [123, 124, 125],
  "aadhaar_number": "123456789012",
  "signer_info": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Audit & Verification

#### Get Audit Trail
```http
GET /api/signature/audit/{signature_id}
Authorization: Bearer <token>
```

---

## 🎨 Component Usage

### SignatureWorkflow Component

```jsx
import SignatureWorkflow from './components/SignatureWorkflow';

<SignatureWorkflow 
  documentId={123}
  onClose={() => setShowWorkflow(false)}
/>
```

**Props**:
- `documentId` (required): Document to create workflow for
- `onClose` (required): Callback when modal closes

**Features**:
- Add/remove signatories
- Configure signing order
- Send requests/reminders
- Real-time progress tracking

---

### SignedDocumentViewer Component

```jsx
import SignedDocumentViewer from './components/SignedDocumentViewer';

<SignedDocumentViewer 
  signatureId={789}
  documentId={123}
  onClose={() => setShowViewer(false)}
/>
```

**Props**:
- `signatureId` (required): Signature to view
- `documentId` (required): Associated document
- `onClose` (required): Callback when modal closes

**Features**:
- View certificate
- Generate QR code
- Download signed PDF
- Audit trail timeline

---

## 🔄 Common Workflows

### Workflow 1: Multi-Party Agreement

1. **Create Workflow**:
   - Click "👥 Workflow"
   - Add signatories (e.g., Party 1, Party 2, Witness)
   - Select "Sequential" order
   - Enable reminders

2. **Send Requests**:
   - Click "📤 Send Request" for first party
   - Wait for signature
   - System auto-notifies next party

3. **Track Progress**:
   - View progress bar
   - Check signatory status
   - Send manual reminders if needed

4. **Complete**:
   - All parties sign
   - Workflow marked complete
   - Download final document

---

### Workflow 2: Bulk Document Signing

1. **Prepare Documents**:
   - Generate multiple documents
   - Note document IDs

2. **Initiate Bulk**:
   ```javascript
   POST /api/signature/bulk/initiate
   {
     "document_ids": [101, 102, 103],
     "aadhaar_number": "123456789012",
     "signer_info": {...}
   }
   ```

3. **Sign Each**:
   - System initiates signature for each
   - Use same credentials
   - Returns results array

4. **Verify**:
   - Check `initiated` vs `failed` count
   - Review `results` for details

---

### Workflow 3: Document Verification

1. **Sign Document**:
   - Complete signature process
   - Note signature ID

2. **View Certificate**:
   - Click "🔍 View Certificate"
   - Review certificate details
   - Check validity badge

3. **Share for Verification**:
   - Go to "Verify" tab
   - Copy verification URL
   - OR generate QR code
   - Share with verifier

4. **Audit Review**:
   - Go to "Audit Trail" tab
   - Review event timeline
   - Check IP addresses
   - Verify timestamps

---

## 🐛 Troubleshooting

### Issue: QR Code Not Showing

**Cause**: `qrcode.react` not installed

**Solution**:
```bash
cd frontend
npm install qrcode.react
npm start
```

---

### Issue: Workflow Button Not Visible

**Cause**: Not in export stage

**Solution**:
- Complete document editing
- Validate document
- Navigate to export stage
- Buttons will appear in header

---

### Issue: "Signature not found" Error

**Cause**: User doesn't own the signature/document

**Solution**:
- Ensure correct user is logged in
- Verify document ownership
- Check signature was created by current user

---

### Issue: Reminders Not Sending

**Cause**: Email/SMS not configured

**Solution**:
- Configure SMTP settings in `.env`
- Add Twilio credentials for SMS
- See `backend/ai/signature/notification_service.py`

**Demo Mode**: Reminders are logged but not sent

---

### Issue: Can't Remove Signatory

**Cause**: Signatory already signed

**Solution**:
- Can't remove signatories who completed signature
- Only pending signatories can be removed
- Create new workflow if needed

---

### Issue: Audit Trail Empty

**Cause**: Signature not yet initiated

**Solution**:
- Audit trail starts when signature initiated
- Complete at least OTP request step
- Refresh viewer to see updates

---

## 📊 Status Indicators

### Signatory Status:
- **Pending** (Yellow): Not yet notified
- **Notified** (Blue): Request sent, not viewed
- **Viewed** (Purple): Opened signature page
- **Signed** (Green): Successfully signed
- **Declined** (Red): Refused to sign
- **Expired** (Gray): OTP expired

### Workflow Status:
- **Active** (Blue): In progress
- **Partially Signed** (Yellow): Some signatures complete
- **Completed** (Green): All signatures done
- **Cancelled** (Red): Workflow terminated

---

## 🔐 Security Notes

### Best Practices:
- ✅ Always verify email addresses before adding signatories
- ✅ Use sequential signing for legal agreements
- ✅ Enable reminders for time-sensitive documents
- ✅ Review audit trail for suspicious activity
- ✅ Verify QR codes before sharing externally

### Data Protection:
- Aadhaar numbers are hashed (SHA-256)
- IP addresses logged for audit
- All API calls require JWT authentication
- Document hashes prevent tampering

---

## 📞 Quick Commands

### Start Backend:
```bash
cd backend
python app.py
```

### Start Frontend:
```bash
cd frontend
npm start
```

### Check Workflow Status:
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/signature/workflow/123/status
```

### Send Reminders:
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/signature/workflow/123/reminders
```

---

## 📚 Documentation Links

- [Full Implementation Guide](docs/ADVANCED_SIGNATURE_FEATURES.md)
- [Planning Document](docs/DIGITAL_SIGNATURE_PLAN.md)
- [Setup Guide](docs/SIGNATURE_SETUP.md)
- [Quick Start](QUICK_START_SIGNATURE.md)

---

## 🎯 Feature Comparison

| Feature | Single Signature | Multi-Party Workflow |
|---------|-----------------|---------------------|
| Signatories | 1 | Unlimited |
| Signing Order | N/A | Parallel/Sequential |
| Progress Tracking | Status only | Real-time bar |
| Reminders | Manual | Automated |
| Notifications | None | Email/SMS |
| Use Case | Personal docs | Agreements, Contracts |

---

**Last Updated**: December 7, 2025  
**Version**: 2.0  
**Branch**: digi_sig

