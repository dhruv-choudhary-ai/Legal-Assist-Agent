import React, { useState, useEffect } from 'react';
import './SignaturePanel.css';

const SignaturePanel = ({ documentId, onSignatureComplete }) => {
  const [step, setStep] = useState('init'); // init, otp, verify, complete
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceMode, setServiceMode] = useState('demo');
  
  // Form data
  const [formData, setFormData] = useState({
    aadhaarNumber: '',
    name: '',
    email: '',
    phone: ''
  });
  
  // Signature data
  const [signatureId, setSignatureId] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [demoOtp, setDemoOtp] = useState(null);
  const [otp, setOtp] = useState('');
  const [signedDocumentUrl, setSignedDocumentUrl] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [certificateUrl, setCertificateUrl] = useState(null);
  
  useEffect(() => {
    checkServiceStatus();
  }, []);
  
  const checkServiceStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/signature/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setServiceMode(data.mode);
      }
    } catch (err) {
      console.error('Failed to check service status:', err);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };
  
  const validateAadhaar = (aadhaar) => {
    // Remove spaces and hyphens
    const cleaned = aadhaar.replace(/[\s-]/g, '');
    
    // Check if 12 digits
    if (!/^\d{12}$/.test(cleaned)) {
      return false;
    }
    
    // Check if starts with 0 or 1
    if (cleaned[0] === '0' || cleaned[0] === '1') {
      return false;
    }
    
    return true;
  };
  
  const initiateSignature = async () => {
    // Check if document ID is available
    if (!documentId) {
      setError('Document ID not found. Please generate a document first.');
      console.error('Missing document ID. documentId:', documentId);
      return;
    }
    
    // Validate inputs
    if (!validateAadhaar(formData.aadhaarNumber)) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Initiating signature with document_id:', documentId);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/signature/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          document_id: documentId,
          aadhaar_number: formData.aadhaarNumber.replace(/[\s-]/g, ''),
          signer_details: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone
          }
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSignatureId(data.signature_id);
        setTransactionId(data.transaction_id);
        setDemoOtp(data.demo_otp);
        setStep('otp');
      } else {
        setError(data.error || 'Failed to initiate signature');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/signature/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          signature_id: signatureId,
          otp: otp
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSignerName(data.signer_name);
        setStep('verify');
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const applySignature = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/signature/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          signature_id: signatureId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSignedDocumentUrl(data.signed_document_url);
        setSignerName(data.signer_name || '');
        setCertificateUrl(`/api/signature/certificate/download/${signatureId}`);
        setStep('complete');
        
        if (onSignatureComplete) {
          onSignatureComplete(data);
        }
      } else {
        setError(data.error || 'Failed to apply signature');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const downloadSignedDocument = () => {
    const token = localStorage.getItem('token');
    const url = `http://localhost:5000${signedDocumentUrl}?token=${token}`;
    window.open(url, '_blank');
  };
  
  const resetSignature = () => {
    // Reload the page to go back to document selection
    window.location.reload();
  };
  
  return (
    <div className="signature-panel">
      <div className="signature-panel-header">
        <div className="signature-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 14.66V20C20 21.1 19.1 22 18 22H4C2.9 22 2 21.1 2 20V6C2 4.9 2.9 4 4 4H9.34C9.84 2.84 10.79 2 12 2C13.21 2 14.16 2.84 14.66 4H20C21.1 4 22 4.9 22 6V12.34L20 14.34V6H18V9H6V6H4V20H18V16.66L20 14.66ZM12 5C11.45 5 11 4.55 11 4C11 3.45 11.45 3 12 3C12.55 3 13 3.45 13 4C13 4.55 12.55 5 12 5Z" fill="currentColor"/>
            <path d="M13.46 11.88L14.88 13.3L20 8.18L21.42 9.6L14.88 16.14L11.46 12.72L13.46 11.88Z" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <h2>Digital Signature</h2>
          <p>Aadhaar-based e-Sign Service</p>
        </div>
      </div>
      
      {serviceMode === 'demo' && (
        <div className="info-box demo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16V12M12 8h.01" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <p><strong>Demo Mode Active</strong></p>
            <p className="info-text">No NSDL credentials configured. Use OTP <strong>123456</strong> for testing.</p>
          </div>
        </div>
      )}
      
      {/* Progress Indicator */}
      <div className="signature-progress">
        <div className={`progress-step ${step === 'init' || step === 'otp' || step === 'verify' || step === 'complete' ? 'active' : ''} ${step === 'otp' || step === 'verify' || step === 'complete' ? 'completed' : ''}`}>
          <div className="progress-circle">1</div>
          <span>Details</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step === 'otp' || step === 'verify' || step === 'complete' ? 'active' : ''} ${step === 'verify' || step === 'complete' ? 'completed' : ''}`}>
          <div className="progress-circle">2</div>
          <span>Verify OTP</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step === 'verify' || step === 'complete' ? 'active' : ''} ${step === 'complete' ? 'completed' : ''}`}>
          <div className="progress-circle">3</div>
          <span>Sign</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step === 'complete' ? 'active completed' : ''}`}>
          <div className="progress-circle">
            {step === 'complete' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : '4'}
          </div>
          <span>Complete</span>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Step 1: Initial Form */}
      {step === 'init' && (
        <div className="signature-section">
          <h3>Signer Information</h3>
          
          <div className="form-group">
            <label>Aadhaar Number</label>
            <input
              type="text"
              name="aadhaarNumber"
              value={formData.aadhaarNumber}
              onChange={handleInputChange}
              placeholder="XXXX-XXXX-XXXX"
              maxLength="14"
            />
            <div className="form-help">12-digit Aadhaar number</div>
          </div>
          
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="As per Aadhaar"
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
            />
          </div>
          
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
          
          <div className="signature-buttons">
            <button
              className="btn-signature btn-primary"
              onClick={initiateSignature}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Requesting OTP...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <path d="M12 18h.01"/>
                  </svg>
                  Request OTP
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Step 2: OTP Entry */}
      {step === 'otp' && (
        <div className="signature-section">
          <div className="signature-status status-otp-sent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            OTP Sent
          </div>
          
          <h3>Enter Verification Code</h3>
          
          {demoOtp && (
            <div className="info-box demo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16V12M12 8h.01" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <p><strong>Demo OTP:</strong> {demoOtp}</p>
              </div>
            </div>
          )}
          
          <div className="info-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <div>
              <p>An OTP has been sent to your Aadhaar-linked mobile number.</p>
              <p><strong>Transaction ID:</strong> {transactionId}</p>
            </div>
          </div>
          
          <div className="form-group">
            <label>6-Digit OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }}
            />
          </div>
          
          <div className="signature-buttons">
            <button
              className="btn-signature btn-secondary"
              onClick={resetSignature}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn-signature btn-primary"
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Verifying...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Verify OTP
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Step 3: Verify & Sign */}
      {step === 'verify' && (
        <div className="signature-section">
          <div className="signature-status status-verified">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            OTP Verified
          </div>
          
          <h3>Ready to Sign</h3>
          
          <div className="info-box success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div>
              <p><strong>Signer:</strong> {signerName}</p>
              <p>Your identity has been verified. Click below to apply your digital signature.</p>
            </div>
          </div>
          
          <div className="signature-buttons">
            <button
              className="btn-signature btn-secondary"
              onClick={resetSignature}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn-signature btn-success"
              onClick={applySignature}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Signing Document...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                    <path d="M2 2l7.586 7.586"/>
                    <circle cx="11" cy="11" r="2"/>
                  </svg>
                  Sign Document
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Step 4: Complete */}
      {step === 'complete' && (
        <div className="signature-section">
          <div className="signature-status status-signed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Document Signed Successfully
          </div>
          
          <div className="signature-preview">
            <div className="signature-preview-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h4>Signature Applied Successfully</h4>
            <p>Your document has been digitally signed and is legally valid.</p>
          </div>
          
          <div className="success-message">
            <div className="success-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Digital signature certificate applied</span>
            </div>
            <div className="success-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Document integrity sealed with SHA-256 hash</span>
            </div>
            <div className="success-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Compliant with IT Act 2000</span>
            </div>
          </div>
          
          <button
            className="btn-signature btn-primary"
            onClick={downloadSignedDocument}
            style={{ width: '100%' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Signed Document
          </button>
          
          {certificateUrl && (
            <button
              className="btn-signature btn-secondary"
              onClick={() => {
                const token = localStorage.getItem('token');
                const url = `http://localhost:5000${certificateUrl}`;
                window.open(url, '_blank');
              }}
              style={{ width: '100%', marginTop: '12px' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download Certificate with QR Code
            </button>
          )}
          
          <div className="signature-buttons" style={{ marginTop: '12px' }}>
            <button
              className="btn-signature btn-secondary"
              onClick={resetSignature}
              style={{ width: '100%' }}
            >
              Sign Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignaturePanel;
