import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import './SignedDocumentViewer.css';

const SignedDocumentViewer = ({ signatureId, documentId, onClose }) => {
  const [signatureData, setSignatureData] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('certificate'); // certificate, audit, verify

  useEffect(() => {
    loadSignatureData();
    loadAuditLog();
  }, [signatureId]);

  const loadSignatureData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/signature/status?signature_id=${signatureId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSignatureData(data);
      } else {
        setError(data.error || 'Failed to load signature data');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLog = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/signature/audit/${signatureId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAuditLog(data.audit_log || []);
      }
    } catch (err) {
      console.error('Failed to load audit log:', err);
    }
  };

  const handleDownloadSignedDocument = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/signature/download/${signatureId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `signed_document_${signatureId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to download document');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const getEventIcon = (eventType) => {
    const icons = {
      'signature_initiated': '🚀',
      'otp_requested': '📱',
      'otp_verified': '✅',
      'document_signed': '✍️',
      'document_downloaded': '⬇️',
      'signature_verified': '🔍'
    };
    return icons[eventType] || '📄';
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#fbbf24',
      'otp_sent': '#3b82f6',
      'verified': '#10b981',
      'signed': '#059669',
      'failed': '#dc2626',
      'expired': '#6b7280'
    };
    return colors[status] || '#9ca3af';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  if (loading) {
    return (
      <div className="signed-document-viewer">
        <div className="viewer-header">
          <h2>Signed Document Viewer</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading signature details...</p>
        </div>
      </div>
    );
  }

  if (error && !signatureData) {
    return (
      <div className="signed-document-viewer">
        <div className="viewer-header">
          <h2>Signed Document Viewer</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const metadata = signatureData?.signature_metadata || {};
  const verificationUrl = `${window.location.origin}/verify/${signatureId}`;

  return (
    <div className="signed-document-viewer">
      <div className="viewer-header">
        <div className="header-content">
          <h2>Signed Document Viewer</h2>
          <div className="signature-status">
            <span 
              className="status-indicator" 
              style={{ backgroundColor: getStatusColor(signatureData?.signature_status) }}
            />
            <span className="status-text">{signatureData?.signature_status}</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-bar">
        <button 
          className="download-btn"
          onClick={handleDownloadSignedDocument}
          disabled={signatureData?.signature_status !== 'signed'}
        >
          <span>⬇️</span> Download Signed Document
        </button>
        <button className="share-btn">
          <span>📤</span> Share
        </button>
      </div>

      {/* Tabs */}
      <div className="viewer-tabs">
        <button 
          className={`tab ${activeTab === 'certificate' ? 'active' : ''}`}
          onClick={() => setActiveTab('certificate')}
        >
          📜 Certificate
        </button>
        <button 
          className={`tab ${activeTab === 'verify' ? 'active' : ''}`}
          onClick={() => setActiveTab('verify')}
        >
          🔍 Verify
        </button>
        <button 
          className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          📋 Audit Trail
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* CERTIFICATE TAB */}
        {activeTab === 'certificate' && (
          <div className="certificate-view">
            <div className="certificate-card">
              <div className="certificate-header">
                <div className="cert-icon">🏆</div>
                <h3>Digital Signature Certificate</h3>
                <p className="cert-subtitle">Issued by NSDL e-Sign Authority</p>
              </div>

              <div className="certificate-body">
                <div className="cert-field">
                  <label>Certificate ID</label>
                  <div className="cert-value">
                    {metadata.certificate_id || signatureData?.signature_id || 'N/A'}
                  </div>
                </div>

                <div className="cert-field">
                  <label>Signer Name</label>
                  <div className="cert-value">
                    {metadata.signer_name || 'Not available'}
                  </div>
                </div>

                <div className="cert-field">
                  <label>Aadhaar Number (Hashed)</label>
                  <div className="cert-value hash">
                    {signatureData?.aadhaar_hash?.substring(0, 16)}...
                  </div>
                </div>

                <div className="cert-field">
                  <label>Signed At</label>
                  <div className="cert-value">
                    {formatTimestamp(signatureData?.signed_at)}
                  </div>
                </div>

                <div className="cert-field">
                  <label>Document Hash (SHA-256)</label>
                  <div className="cert-value hash">
                    {metadata.document_hash?.substring(0, 32)}...
                  </div>
                </div>

                <div className="cert-field">
                  <label>IP Address</label>
                  <div className="cert-value">
                    {metadata.ip_address || 'Not recorded'}
                  </div>
                </div>

                <div className="cert-field">
                  <label>eSign Response ID</label>
                  <div className="cert-value">
                    {metadata.esign_response_id || 'N/A'}
                  </div>
                </div>

                {metadata.esign_certificate && (
                  <div className="cert-field full-width">
                    <label>eSign Provider Certificate</label>
                    <div className="cert-value certificate-text">
                      {metadata.esign_certificate}
                    </div>
                  </div>
                )}
              </div>

              <div className="certificate-footer">
                <div className="validity-badge">
                  <span className="badge-icon">✓</span>
                  <span>Digitally Valid</span>
                </div>
                <div className="issuer-info">
                  <small>Issued by NSDL e-Governance Infrastructure Limited</small>
                  <small>Compliant with IT Act 2000 & Aadhaar Act 2016</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VERIFY TAB */}
        {activeTab === 'verify' && (
          <div className="verify-view">
            <div className="verify-section">
              <h3>Signature Verification</h3>
              <p className="verify-description">
                Scan the QR code or use the verification URL to validate this signature
              </p>

              <div className="verification-methods">
                {/* QR Code */}
                <div className="qr-card">
                  <h4>Scan QR Code</h4>
                  <div className="qr-code-container">
                    <QRCode 
                      value={verificationUrl}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="qr-hint">Scan with any QR code reader</p>
                </div>

                {/* Verification URL */}
                <div className="url-card">
                  <h4>Verification URL</h4>
                  <div className="url-input-group">
                    <input 
                      type="text" 
                      value={verificationUrl}
                      readOnly
                    />
                    <button 
                      className="copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(verificationUrl);
                        alert('URL copied to clipboard!');
                      }}
                    >
                      📋 Copy
                    </button>
                  </div>
                  <p className="url-hint">Share this URL to verify the signature</p>
                </div>
              </div>

              {/* Verification Details */}
              <div className="verification-details">
                <h4>Verification Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Signature ID</span>
                    <span className="detail-value">{signatureId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Document ID</span>
                    <span className="detail-value">{documentId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Algorithm</span>
                    <span className="detail-value">SHA-256</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Provider</span>
                    <span className="detail-value">NSDL e-Sign</span>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              {signatureData?.signature_status === 'signed' && (
                <div className="verification-status success">
                  <span className="status-icon">✅</span>
                  <div className="status-content">
                    <h4>Signature is Valid</h4>
                    <p>This document has been digitally signed and the signature is verified.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AUDIT TRAIL TAB */}
        {activeTab === 'audit' && (
          <div className="audit-view">
            <div className="audit-section">
              <h3>Complete Audit Trail</h3>
              <p className="audit-description">
                Chronological record of all signature-related events
              </p>

              {auditLog.length === 0 ? (
                <div className="no-audit-data">
                  <span className="no-data-icon">📋</span>
                  <p>No audit log entries found</p>
                </div>
              ) : (
                <div className="audit-timeline">
                  {auditLog.map((entry, index) => (
                    <div key={index} className="audit-entry">
                      <div className="entry-marker">
                        <span className="marker-icon">{getEventIcon(entry.event_type)}</span>
                      </div>
                      <div className="entry-content">
                        <div className="entry-header">
                          <h4>{entry.event_type.replace(/_/g, ' ').toUpperCase()}</h4>
                          <span className="entry-time">{formatTimestamp(entry.timestamp)}</span>
                        </div>
                        <div className="entry-details">
                          {entry.ip_address && (
                            <div className="detail-row">
                              <span className="detail-icon">🌐</span>
                              <span>IP: {entry.ip_address}</span>
                            </div>
                          )}
                          {entry.user_agent && (
                            <div className="detail-row">
                              <span className="detail-icon">💻</span>
                              <span className="user-agent">{entry.user_agent}</span>
                            </div>
                          )}
                          {entry.event_data && Object.keys(entry.event_data).length > 0 && (
                            <div className="event-data">
                              <strong>Event Data:</strong>
                              <pre>{JSON.stringify(entry.event_data, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary Stats */}
              {auditLog.length > 0 && (
                <div className="audit-summary">
                  <div className="summary-stat">
                    <span className="stat-value">{auditLog.length}</span>
                    <span className="stat-label">Total Events</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-value">
                      {formatTimestamp(auditLog[0]?.timestamp)}
                    </span>
                    <span className="stat-label">First Event</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-value">
                      {formatTimestamp(auditLog[auditLog.length - 1]?.timestamp)}
                    </span>
                    <span className="stat-label">Last Event</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignedDocumentViewer;
