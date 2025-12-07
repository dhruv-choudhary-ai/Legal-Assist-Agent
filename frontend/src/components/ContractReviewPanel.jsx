import React, { useState, useRef } from 'react';
import './ContractReviewPanel.css';

const ContractReviewPanel = () => {
  const [reviewResult, setReviewResult] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewType, setReviewType] = useState('general');
  const fileInputRef = useRef(null);

  const reviewTypes = [
    { value: 'general', label: 'General Contract', icon: '📄' },
    { value: 'employment', label: 'Employment', icon: '👥' },
    { value: 'commercial', label: 'Commercial', icon: '🏢' },
    { value: 'lease', label: 'Lease/Rental', icon: '🏠' },
    { value: 'service', label: 'Service Agreement', icon: '🤝' },
    { value: 'nda', label: 'NDA/Confidentiality', icon: '🔒' }
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('review_type', reviewType);

    setIsReviewing(true);
    setReviewResult(null);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/quick-actions/contract-review', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setReviewResult(data);
      } else {
        throw new Error(data.error || 'Review failed');
      }
    } catch (error) {
      console.error('Review error:', error);
      alert('Failed to review contract. Please try again.');
    } finally {
      setIsReviewing(false);
    }
  };

  const resetReview = () => {
    setReviewResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="contract-review-container">
      <div className="contract-review-header">
        <div className="header-content">
          <div className="header-icon">⚖️</div>
          <div>
            <h2>Contract Review Assistant</h2>
            <p>AI-powered contract analysis and risk assessment</p>
          </div>
        </div>
        {reviewResult && (
          <button className="reset-btn" onClick={resetReview}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Review
          </button>
        )}
      </div>

      {!reviewResult ? (
        <div className="upload-section">
          <div className="review-type-selector">
            <h3>Select Contract Type</h3>
            <div className="type-grid">
              {reviewTypes.map((type) => (
                <button
                  key={type.value}
                  className={`type-btn ${reviewType === type.value ? 'active' : ''}`}
                  onClick={() => setReviewType(type.value)}
                >
                  <span className="type-icon">{type.icon}</span>
                  <span className="type-label">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="upload-card">
            <div className="upload-icon">📋</div>
            <h3>Upload Contract for Review</h3>
            <p>Get comprehensive analysis including risks, missing clauses, and compliance issues</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={isReviewing}
            />
            <button
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isReviewing}
            >
              {isReviewing ? (
                <>
                  <span className="spinner"></span>
                  Analyzing Contract...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10l5-5m0 0l5 5m-5-5v12M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Upload & Review Contract
                </>
              )}
            </button>
            <div className="supported-formats">
              Supported formats: PDF, DOCX • Selected type: {reviewTypes.find(t => t.value === reviewType)?.label}
            </div>
          </div>
        </div>
      ) : (
        <div className="review-results">
          <div className="result-header">
            <div className="result-file">📄 {reviewResult.filename}</div>
            <div className="result-type-badge">{reviewTypes.find(t => t.value === reviewResult.review_type)?.label}</div>
          </div>

          <div className="results-grid">
            <div className="result-card summary-card">
              <div className="card-header">
                <div className="card-icon">📊</div>
                <h3>Summary</h3>
              </div>
              <div className="card-content">
                <p className="summary-text">{reviewResult.summary}</p>
              </div>
            </div>

            <div className="result-card clauses-card">
              <div className="card-header">
                <div className="card-icon">📝</div>
                <h3>Key Clauses</h3>
              </div>
              <div className="card-content">
                <pre className="clause-text">{reviewResult.key_clauses}</pre>
              </div>
            </div>

            <div className="result-card risks-card">
              <div className="card-header">
                <div className="card-icon">⚠️</div>
                <h3>Risk Assessment</h3>
              </div>
              <div className="card-content">
                <pre className="risk-text">{reviewResult.risks}</pre>
              </div>
            </div>

            <div className="result-card missing-card">
              <div className="card-header">
                <div className="card-icon">❓</div>
                <h3>Missing Clauses</h3>
              </div>
              <div className="card-content">
                <pre className="missing-text">{reviewResult.missing_clauses}</pre>
              </div>
            </div>

            <div className="result-card compliance-card">
              <div className="card-header">
                <div className="card-icon">✅</div>
                <h3>Compliance Check</h3>
              </div>
              <div className="card-content">
                <pre className="compliance-text">{reviewResult.compliance_issues}</pre>
              </div>
            </div>
          </div>

          <div className="disclaimer-box">
            <strong>⚠️ Legal Disclaimer:</strong> This AI-generated review is for informational purposes only and does not constitute legal advice. Always consult with a qualified attorney before signing any contract.
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractReviewPanel;
