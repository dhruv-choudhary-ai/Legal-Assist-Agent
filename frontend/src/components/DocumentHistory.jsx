import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DocumentHistory.css';

const DocumentHistory = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, signed, unsigned

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/documents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
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
      day: 'numeric' 
    });
  };

  const handleViewDocument = async (docId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/document/${docId}/data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.document) {
          // Navigate to workspace with document data
          navigate('/workspace', {
            state: {
              loadDocument: true,
              documentData: data.document
            }
          });
        } else {
          alert('Failed to load document data');
        }
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
        let filename = `${docName}.pdf`; // Default to PDF
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

  const handleDownloadCertificate = async (signatureId) => {
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

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'signed') return doc.is_signed;
    if (filter === 'unsigned') return !doc.is_signed;
    return true;
  });

  return (
    <div className="document-history-page">
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
              <h1>Document History</h1>
              <p className="subtitle">View and manage all your generated documents</p>
            </div>
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-value">{documents.length}</span>
                <span className="stat-label">Total Documents</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{documents.filter(d => d.is_signed).length}</span>
                <span className="stat-label">Signed</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{documents.filter(d => !d.is_signed).length}</span>
                <span className="stat-label">Unsigned</span>
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
            All Documents ({documents.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'signed' ? 'active' : ''}`}
            onClick={() => setFilter('signed')}
          >
            Signed ({documents.filter(d => d.is_signed).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'unsigned' ? 'active' : ''}`}
            onClick={() => setFilter('unsigned')}
          >
            Unsigned ({documents.filter(d => !d.is_signed).length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>No documents found</h3>
          <p>Start creating documents from the dashboard</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="documents-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Created Date</th>
                <th>Last Updated</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.doc_id}>
                  <td>
                    <div className="doc-name-cell">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{doc.form_name}</span>
                    </div>
                  </td>
                  <td>{formatDate(doc.created_at)}</td>
                  <td>{formatDate(doc.updated_at)}</td>
                  <td>
                    {doc.is_signed ? (
                      <span className="status-badge signed">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Signed
                      </span>
                    ) : (
                      <span className="status-badge unsigned">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Unsigned
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view" 
                        title="View Document"
                        onClick={() => handleViewDocument(doc.doc_id)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        className="action-btn download" 
                        title="Download Document"
                        onClick={() => handleDownloadDocument(doc.doc_id, doc.form_name)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15M12 15L17 10M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {doc.is_signed && doc.has_certificate && doc.signature_id && (
                        <button 
                          className="action-btn certificate" 
                          title="Download Certificate"
                          onClick={() => handleDownloadCertificate(doc.signature_id)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocumentHistory;
