import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignedDocuments.css';

const SignedDocuments = () => {
  const navigate = useNavigate();
  const [signedDocs, setSignedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, with-certificate, no-certificate

  useEffect(() => {
    fetchSignedDocuments();
  }, []);

  const fetchSignedDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/documents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const signed = (data.documents || []).filter(doc => doc.is_signed);
        setSignedDocs(signed);
      }
    } catch (error) {
      console.error('Error fetching signed documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadCertificate = async (signatureId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/signature/certificate/download/${signatureId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${signatureId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(error.error || 'Certificate not found');
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate');
    }
  };

  const handleViewDocument = async (docId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/document/download/${docId}`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        window.open(`http://localhost:5000/api/document/download/${docId}`, '_blank');
      } else {
        alert('Document not found or unavailable');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to view document');
    }
  };

  const handleDownloadDocument = async (docId, docName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/document/download/${docId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `${docName}_signed.pdf`; // Default to signed PDF
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=(['"]?)([^'"\n]*?)\1/.exec(contentDisposition);
          if (matches != null && matches[2]) {
            filename = matches[2];
          }
        }
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } else {
        const error = await response.json();
        alert(error.error || 'Document not found');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const filteredDocs = signedDocs.filter(doc => {
    if (filter === 'with-certificate') return doc.has_certificate;
    if (filter === 'no-certificate') return !doc.has_certificate;
    return true;
  });

  return (
    <div className="signed-documents-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Dashboard
        </button>
        <div className="header-content">
          <div className="header-main">
            <div className="header-text">
              <h1>Digitally Signed Documents</h1>
              <p className="subtitle">Manage and download your signed documents and certificates</p>
            </div>
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-value">{signedDocs.length}</span>
                <span className="stat-label">Total Signed</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{signedDocs.filter(d => d.has_certificate).length}</span>
                <span className="stat-label">With Certificate</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{signedDocs.filter(d => !d.has_certificate).length}</span>
                <span className="stat-label">No Certificate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Signed ({signedDocs.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'with-certificate' ? 'active' : ''}`}
            onClick={() => setFilter('with-certificate')}
          >
            With Certificate ({signedDocs.filter(d => d.has_certificate).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'no-certificate' ? 'active' : ''}`}
            onClick={() => setFilter('no-certificate')}
          >
            No Certificate ({signedDocs.filter(d => !d.has_certificate).length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading signed documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>No signed documents yet</h3>
          <p>Start signing documents to see them here</p>
        </div>
      ) : (
        <div className="documents-grid">
          {filteredDocs.map((doc) => (
            <div key={doc.doc_id} className="signed-doc-card">
              <div className="card-header">
                <div className="doc-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {doc.has_certificate && (
                  <div className="certificate-badge" title="Certificate Available">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 15L8 17L9 12.5L5.5 9.5L10 9L12 5L14 9L18.5 9.5L15 12.5L16 17L12 15Z"/>
                    </svg>
                  </div>
                )}
              </div>

              <div className="card-body">
                <h3 className="doc-title">{doc.form_name}</h3>
                
                <div className="doc-info">
                  <div className="info-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 7V3M16 7V3M7 11H17M5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21Z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div>
                      <span className="info-label">Signed On</span>
                      <span className="info-value">{formatDate(doc.signed_at)}</span>
                    </div>
                  </div>

                  {doc.signer_name && (
                    <div className="info-row">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div>
                        <span className="info-label">Signed By</span>
                        <span className="info-value">{doc.signer_name}</span>
                      </div>
                    </div>
                  )}

                  {doc.certificate_id && (
                    <div className="info-row">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 8H17M7 12H17M7 16H13M5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V5C21 4.46957 20.7893 3.96086 20.4142 3.58579C20.0391 3.21071 19.5304 3 19 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21Z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div>
                        <span className="info-label">Certificate ID</span>
                        <span className="info-value cert-id">{doc.certificate_id}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="action-btn primary" 
                  title="Download Document"
                  onClick={() => handleDownloadDocument(doc.doc_id, doc.form_name)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15M12 15L17 10M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Download
                </button>
                {doc.has_certificate && doc.signature_id && (
                  <button 
                    className="action-btn secondary" 
                    onClick={() => downloadCertificate(doc.signature_id)}
                    title="Download Certificate"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 15L8 17L9 12.5L5.5 9.5L10 9L12 5L14 9L18.5 9.5L15 12.5L16 17L12 15Z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Certificate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SignedDocuments;
