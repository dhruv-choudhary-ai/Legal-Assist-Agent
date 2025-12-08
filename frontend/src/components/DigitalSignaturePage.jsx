import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignaturePanel from './SignaturePanel';
import DocumentSelector from './DocumentSelector';
import './DigitalSignaturePage.css';

const DigitalSignaturePage = () => {
  const navigate = useNavigate();
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const handleDocumentSelect = (document) => {
    console.log('Document selected:', document);
    setSelectedDocument(document);
    setShowDocumentSelector(false);
    setShowSignaturePanel(true);
  };

  const handleSignatureComplete = (signatureData) => {
    console.log('Signature completed:', signatureData);
    // Keep the signature panel visible to show completion message
    // User can navigate away using the "Sign Another Document" button
  };

  return (
    <div className="digital-signature-page">
      <div className="signature-page-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Dashboard
        </button>
        <h1>Digital Signature Service</h1>
        <p className="subtitle">Securely sign your legal documents with eSign/Aadhaar-based digital signatures</p>
      </div>

      <div className="signature-page-content">
        {!showSignaturePanel ? (
          <div className="signature-welcome">
            <div className="signature-features">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Secure & Legal</h3>
                <p>All signatures are legally binding and compliant with IT Act 2000</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>Fast & Simple</h3>
                <p>Complete the signing process in just a few minutes</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Verified Identity</h3>
                <p>Aadhaar-based verification ensures authentic signatures</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>Audit Trail</h3>
                <p>Complete tracking and verification of all signed documents</p>
              </div>
            </div>

            <div className="signature-cta">
              <button 
                className="start-signing-btn"
                onClick={() => setShowDocumentSelector(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 14.66V20C20 21.1 19.1 22 18 22H4C2.9 22 2 21.1 2 20V6C2 4.9 2.9 4 4 4H9.34C9.84 2.84 10.79 2 12 2C13.21 2 14.16 2.84 14.66 4H20C21.1 4 22 4.9 22 6V12.34L20 14.34V6H18V9H6V6H4V20H18V16.66L20 14.66ZM12 5C11.45 5 11 4.55 11 4C11 3.45 11.45 3 12 3C12.55 3 13 3.45 13 4C13 4.55 12.55 5 12 5Z" fill="currentColor"/>
                  <path d="M13.46 11.88L14.88 13.3L20 8.18L21.42 9.6L14.88 16.14L11.46 12.72L13.46 11.88Z" fill="currentColor"/>
                </svg>
                Start Digital Signing
              </button>
              
              <div className="info-note">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="8" r="1" fill="currentColor"/>
                </svg>
                <p>You'll need your Aadhaar number and registered mobile number to complete the signing process</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="signature-panel-container">
            <SignaturePanel 
              documentId={selectedDocument?.id}
              onSignatureComplete={handleSignatureComplete}
            />
          </div>
        )}
      </div>

      {/* Document Selector Modal */}
      {showDocumentSelector && (
        <DocumentSelector
          onDocumentSelect={handleDocumentSelect}
          onCancel={() => setShowDocumentSelector(false)}
        />
      )}
    </div>
  );
};

export default DigitalSignaturePage;
