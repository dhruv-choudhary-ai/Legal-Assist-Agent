import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PromptModal from './PromptModal';
import './Dashboard.css';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPromptModal, setShowPromptModal] = useState(false);

  const fetchUserDocuments = useCallback(async () => {
    try {
      if (!token) {
        console.log('No token available');
        setLoading(false);
        return;
      }

      console.log('Fetching documents with token:', token.substring(0, 20) + '...');
      
      const response = await fetch('http://127.0.0.1:5000/api/user/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        const error = await response.json();
        console.error('Failed to load documents:', error);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUserDocuments();
    }
  }, [token, fetchUserDocuments]);

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const quickActions = [
    {
      title: 'Analyze Document',
      description: 'Review contracts & agreements',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14Z" fill="currentColor" />
        </svg>
      ),
      color: 'green'
    },
    {
      title: 'Browse Services',
      description: 'View all legal services',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor" />
        </svg>
      ),
      link: '/',
      color: 'orange'
    }
  ];

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <section className="dashboard-header">
        <div className="welcome-card">
          <div className="welcome-content">
            <h1>Welcome back, <span className="user-name">{user.full_name || 'User'}</span>!</h1>
            <p>Your AI-powered legal assistant is ready to help you today.</p>
            <button 
              className="create-doc-cta"
              onClick={() => setShowPromptModal(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V20M20 12H4" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Create New Document
            </button>
          </div>
          <div className="welcome-illustration">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" fill="url(#gradient)" opacity="0.2"/>
              <path d="M100 40L80 70H120L100 40Z" fill="url(#gradient)"/>
              <path d="M100 70L80 100H120L100 70Z" fill="url(#gradient)" opacity="0.7"/>
              <path d="M100 100L80 130H120L100 100Z" fill="url(#gradient)" opacity="0.4"/>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#a855f7"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <Link 
              key={index} 
              to={action.link || '#'} 
              className={`action-card action-${action.color}`}
              onClick={(e) => {
                if (!action.link) {
                  e.preventDefault();
                  // Open chat or other functionality
                }
              }}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-content">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
              <div className="action-arrow">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Documents */}
      <section className="recent-documents">
        <div className="section-header">
          <h2 className="section-title">Recent Documents</h2>
          <Link to="/documents" className="view-all">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your documents...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="documents-grid">
            {documents.slice(0, 6).map((doc) => (
              <div key={doc.doc_id} className="document-card">
                <div className="doc-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor" />
                    <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="doc-info">
                  <h3>{doc.form_name}</h3>
                  <p className="doc-date">
                    Created: {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button className="doc-action">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="1" fill="currentColor"/>
                    <circle cx="12" cy="6" r="1" fill="currentColor"/>
                    <circle cx="12" cy="18" r="1" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <h3>No documents yet</h3>
            <p>Start creating legal documents with our AI assistant</p>
            <Link to="/workspace" className="btn-primary">
              Create Your First Document
            </Link>
          </div>
        )}
      </section>

      {/* Document History */}
      {documents.length > 0 && (
        <section className="document-history">
          <div className="section-header">
            <h2 className="section-title">Document History</h2>
            <div className="history-filters">
              <span className="filter-label">All Documents</span>
            </div>
          </div>

          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.doc_id}>
                    <td className="doc-name-cell">
                      <div className="doc-name-wrapper">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor" opacity="0.2"/>
                          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span className="doc-title">{doc.form_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="doc-type-badge">
                        {doc.form_name.includes('Lease') ? 'Property' : 
                         doc.form_name.includes('NDA') ? 'Business' :
                         doc.form_name.includes('Notice') ? 'Legal Notice' :
                         doc.form_name.includes('Trust') ? 'Trust' : 'Document'}
                      </span>
                    </td>
                    <td className="doc-date-cell">
                      {new Date(doc.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      <span className="doc-time">
                        {new Date(doc.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge status-completed">
                        <svg viewBox="0 0 8 8" fill="none">
                          <circle cx="4" cy="4" r="3" fill="currentColor"/>
                        </svg>
                        Completed
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button 
                          className="action-btn view-btn" 
                          title="View Document"
                          onClick={() => window.open(`http://127.0.0.1:5000/api/document/download/${doc.doc_id}`, '_blank')}
                        >
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2"/>
                            <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                        <button 
                          className="action-btn download-btn" 
                          title="Download Document"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `http://127.0.0.1:5000/api/document/download/${doc.doc_id}`;
                            link.download = `${doc.form_name}.docx`;
                            link.click();
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M7 10L12 15M12 15L17 10M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor" />
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{documents.length}</div>
              <div className="stat-label">Documents Created</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon purple">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor" />
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">24/7</div>
              <div className="stat-label">AI Assistant</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor" />
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">Secure</div>
              <div className="stat-label">Data Protected</div>
            </div>
          </div>
        </div>
      </section>

      {/* Prompt Modal */}
      {showPromptModal && (
        <PromptModal onClose={() => setShowPromptModal(false)} />
      )}
    </div>
  );
};

export default Dashboard;
