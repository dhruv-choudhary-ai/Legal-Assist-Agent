import React, { useState, useEffect } from 'react';
import './DocumentSelector.css';

const DocumentSelector = ({ onDocumentSelect, onCancel }) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'existing'
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (activeTab === 'existing') {
      fetchUserDocuments();
    }
  }, [activeTab]);

  const fetchUserDocuments = async () => {
    setLoading(true);
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
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
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

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const uploadDocument = async () => {
    if (!uploadedFile) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          onDocumentSelect({
            id: data.document_id,
            name: uploadedFile.name,
            type: 'uploaded'
          });
        } else {
          alert('Failed to upload document');
        }
        setLoading(false);
      });

      xhr.addEventListener('error', () => {
        alert('Upload failed. Please try again.');
        setLoading(false);
      });

      xhr.open('POST', 'http://localhost:5000/api/document/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload document');
      setLoading(false);
    }
  };

  const selectExistingDocument = (doc) => {
    onDocumentSelect({
      id: doc.doc_id,
      name: doc.form_name,
      type: 'existing'
    });
  };

  const filteredDocuments = documents.filter(doc =>
    doc.form_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="document-selector-overlay" onClick={onCancel}>
      <div className="document-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="selector-header">
          <h2>Select Document to Sign</h2>
          <button className="close-btn" onClick={onCancel}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="selector-tabs">
          <button
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Upload Document
          </button>
          <button
            className={`tab ${activeTab === 'existing' ? 'active' : ''}`}
            onClick={() => setActiveTab('existing')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            My Documents
          </button>
        </div>

        <div className="selector-content">
          {activeTab === 'upload' ? (
            <div className="upload-section">
              {!uploadedFile ? (
                <div
                  className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 18C4.79086 18 3 16.2091 3 14C3 12.0929 4.33457 10.4976 6.12071 10.0991C6.04169 9.74649 6 9.37768 6 9C6 6.23858 8.23858 4 11 4C13.4193 4 15.4373 5.71825 15.9002 8.00189C15.9334 8.00063 15.9666 8 16 8C18.2091 8 20 9.79086 20 12C20 14.2091 18.2091 16 16 16H15" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 12V21M12 12L9 15M12 12L15 15" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3>Drop your document here</h3>
                  <p>or click to browse</p>
                  <span className="file-types">Supports PDF, DOC, DOCX (Max 10MB)</span>
                  <input
                    id="fileInput"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                  />
                </div>
              ) : (
                <div className="uploaded-file-preview">
                  <div className="file-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 21H17C18.1046 21 19 20.1046 19 19V9.41421C19 9.149 18.8946 8.89464 18.7071 8.70711L13.2929 3.29289C13.1054 3.10536 12.851 3 12.5858 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21Z" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13 3V9H19" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="file-info">
                    <h4>{uploadedFile.name}</h4>
                    <p>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    className="remove-file-btn"
                    onClick={() => setUploadedFile(null)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 18L18 6M6 6L18 18" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}

              {uploadedFile && !loading && (
                <button className="upload-btn" onClick={uploadDocument}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13L9 17L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Continue with this document
                </button>
              )}

              {loading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
              )}
            </div>
          ) : (
            <div className="existing-documents-section">
              <div className="search-bar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21L16.65 16.65" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading your documents...</p>
                </div>
              ) : filteredDocuments.length > 0 ? (
                <div className="documents-list">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.doc_id}
                      className="document-item"
                      onClick={() => selectExistingDocument(doc)}
                    >
                      <div className="doc-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="doc-details">
                        <div className="doc-title-row">
                          <h4>{doc.form_name}</h4>
                          {doc.is_signed && (
                            <span className="signed-badge">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Signed
                            </span>
                          )}
                        </div>
                        <p className="doc-date">Created: {formatDate(doc.created_at)}</p>
                        {doc.is_signed && doc.signed_at && (
                          <p className="doc-signed-date">Signed: {formatDate(doc.signed_at)}</p>
                        )}
                      </div>
                      <div className="select-arrow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18L15 12L9 6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3>No documents found</h3>
                  <p>
                    {searchQuery
                      ? 'Try a different search term'
                      : 'Generate your first document to get started'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentSelector;
