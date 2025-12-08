import React, { useState } from 'react';
import './VerifySignature.css';

const VerifySignature = () => {
  const [step, setStep] = useState('upload'); // upload, verifying, result
  const [selectedFile, setSelectedFile] = useState(null);
  const [qrData, setQrData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a PDF file');
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a PDF file');
      }
    }
  };

  const verifyDocument = async () => {
    if (!selectedFile) {
      setError('Please select a document to verify');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('verifying');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Add QR data if provided
      if (qrData.trim()) {
        formData.append('qr_data', qrData.trim());
      }

      const response = await fetch('http://localhost:5000/api/signature/verify', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationResult(data);
        setStep('result');
      } else {
        setError(data.error || 'Verification failed');
        setStep('upload');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify document. Please try again.');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setSelectedFile(null);
    setQrData('');
    setError(null);
    setVerificationResult(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="verify-signature-container">
      <div className="verify-header">
        <div className="verify-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2>Verify Digital Signature</h2>
        <p className="verify-subtitle">Upload a signed document to verify its authenticity</p>
      </div>

      {step === 'upload' && (
        <div className="verify-content">
          {/* File Upload Area */}
          <div
            className={`upload-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload-verify').click()}
          >
            <input
              id="file-upload-verify"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {selectedFile ? (
              <div className="file-selected">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="file-info">
                  <strong>{selectedFile.name}</strong>
                  <span>{(selectedFile.size / 1024).toFixed(2)} KB</span>
                </div>
                <button
                  className="remove-file-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6L18 18" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 18C5.17107 18.4117 4 19.0443 4 19.7537C4 20.9943 7.58172 22 12 22C16.4183 22 20 20.9943 20 19.7537C20 19.0443 18.8289 18.4117 17 18M12 15V3M12 3L8 7M12 3L16 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p><strong>Click to upload</strong> or drag and drop</p>
                <span>PDF files only</span>
              </div>
            )}
          </div>

          {/* Optional QR Code Data */}
          <div className="qr-data-section">
            <label htmlFor="qr-data-input">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7V5C3 3.89543 3.89543 3 5 3H7M3 17V19C3 20.1046 3.89543 21 5 21H7M17 3H19C20.1046 3 21 3.89543 21 5V7M17 21H19C20.1046 21 21 20.1046 21 19V17M8 8H10V10H8V8ZM14 8H16V10H14V8ZM8 14H10V16H8V14ZM14 14H16V16H14V14Z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              QR Code Data (Optional)
            </label>
            <textarea
              id="qr-data-input"
              placeholder="Paste QR code data here if you scanned the certificate QR code..."
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              rows={4}
            />
            <p className="qr-help-text">
              If you have the certificate, scan its QR code and paste the data here for enhanced verification
            </p>
          </div>

          {error && (
            <div className="verify-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {error}
            </div>
          )}

          <button
            className="verify-btn"
            onClick={verifyDocument}
            disabled={!selectedFile || loading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Verify Signature
          </button>
        </div>
      )}

      {step === 'verifying' && (
        <div className="verify-loading">
          <div className="spinner-large"></div>
          <h3>Verifying Document...</h3>
          <p>Please wait while we verify the digital signature</p>
        </div>
      )}

      {step === 'result' && verificationResult && (
        <div className="verify-result">
          <div className={`result-header ${verificationResult.valid ? 'valid' : 'invalid'}`}>
            <div className="result-icon">
              {verificationResult.valid ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 14L12 12M12 12L14 10M12 12L10 10M12 12L14 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <h3>{verificationResult.message}</h3>
          </div>

          {verificationResult.valid && verificationResult.details && (
            <div className="result-details">
              <div className="detail-card">
                <div className="detail-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="detail-content">
                  <label>Document Name</label>
                  <strong>{verificationResult.details.document_name || 'N/A'}</strong>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7ZM12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="detail-content">
                  <label>Signer Name</label>
                  <strong>{verificationResult.details.signer_name || 'N/A'}</strong>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="detail-content">
                  <label>Signed On</label>
                  <strong>{formatDate(verificationResult.details.signed_at)}</strong>
                </div>
              </div>

              {verificationResult.details.certificate_id && (
                <div className="detail-card">
                  <div className="detail-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="detail-content">
                    <label>Certificate ID</label>
                    <strong className="mono">{verificationResult.details.certificate_id}</strong>
                  </div>
                </div>
              )}

              {verificationResult.details.transaction_id && (
                <div className="detail-card">
                  <div className="detail-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 8H17M7 12H17M7 16H12M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 5V19C3 20.1046 3.89543 21 5 21Z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="detail-content">
                    <label>Transaction ID</label>
                    <strong className="mono">{verificationResult.details.transaction_id}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="result-actions">
            <button className="verify-another-btn" onClick={reset}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Verify Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifySignature;
