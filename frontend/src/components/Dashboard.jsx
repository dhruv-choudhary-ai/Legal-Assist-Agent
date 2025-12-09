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
      title: 'Ask Lawyer AI',
      description: 'Legal Q&A with AI advisor',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3C10.9 3 10 3.9 10 5C10 5.5 10.2 6 10.5 6.4L9 9H15L13.5 6.4C13.8 6 14 5.5 14 5C14 3.9 13.1 3 12 3ZM7 10L5 14V22H19V14L17 10H7ZM9 18H7V16H9V18ZM13 18H11V12H13V18ZM17 18H15V14H17V18Z" fill="currentColor"/>
        </svg>
      ),
      link: '/quick-actions/ask-lawyer',
      color: 'purple'
    },
    {
      title: 'Document Analyzer',
      description: 'Upload & analyze documents',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 15.5L9.5 17L12.5 14L16 17.5L17.5 16L12.5 11L8 15.5Z" fill="currentColor"/>
        </svg>
      ),
      link: '/quick-actions/document-analyzer',
      color: 'green'
    },
    {
      title: 'Contract Review',
      description: 'AI-powered contract analysis',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM10 19L15 14L13.59 12.59L10 16.17L8.41 14.59L7 16L10 19Z" fill="currentColor"/>
        </svg>
      ),
      link: '/quick-actions/contract-review',
      color: 'orange'
    },
    {
      title: 'Clause Search',
      description: 'Find legal clauses instantly',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 6H19V15H21V6ZM17 6H15V15H17V6ZM22 4V17C22 18.1 21.1 19 20 19H4C2.9 19 2 18.1 2 17V4C2 2.9 2.9 2 4 2H20C21.1 2 22 2.9 22 4ZM20 4H4V17H20V4ZM11.25 8.5L8.5 12.5L6.25 9.75L3 14H14L11.25 8.5ZM16 21H8V22H16V21Z" fill="currentColor"/>
        </svg>
      ),
      link: '/quick-actions/clause-search',
      color: 'violet'
    },
    {
      title: 'Legal Research',
      description: 'Research legal topics',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 5C19.89 4.65 18.67 4.5 17.5 4.5C15.55 4.5 13.45 4.9 12 6C10.55 4.9 8.45 4.5 6.5 4.5C4.55 4.5 2.45 4.9 1 6V20.65C1 20.9 1.25 21.15 1.5 21.15C1.6 21.15 1.65 21.1 1.75 21.1C3.1 20.45 5.05 20 6.5 20C8.45 20 10.55 20.4 12 21.5C13.35 20.65 15.8 20 17.5 20C19.15 20 20.85 20.3 22.25 21.05C22.35 21.1 22.4 21.1 22.5 21.1C22.75 21.1 23 20.85 23 20.6V6C22.4 5.55 21.75 5.25 21 5ZM21 18.5C19.9 18.15 18.7 18 17.5 18C15.8 18 13.35 18.65 12 19.5V8C13.35 7.15 15.8 6.5 17.5 6.5C18.7 6.5 19.9 6.65 21 7V18.5Z" fill="currentColor"/>
        </svg>
      ),
      link: '/quick-actions/legal-research',
      color: 'blue'
    },
    {
      title: 'Create Document',
      description: 'Generate legal documents',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM11 13H13V18H15L12 21L9 18H11V13Z" fill="currentColor"/>
        </svg>
      ),
      link: '/workspace',
      color: 'indigo'
    },
    {
      title: 'Browse Templates',
      description: 'View all templates',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z" fill="currentColor"/>
        </svg>
      ),
      link: '/templates',
      color: 'teal'
    },
    {
      title: 'Compare Documents',
      description: 'Side-by-side comparison',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H14.82C14.4 1.84 13.3 1 12 1C10.7 1 9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H9.11C9.56 22.19 10.69 23 12 23C13.31 23 14.44 22.19 14.89 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM12 3C12.55 3 13 3.45 13 4C13 4.55 12.55 5 12 5C11.45 5 11 4.55 11 4C11 3.45 11.45 3 12 3ZM7 7H17V9H7V7ZM10 12H7V10H10V12ZM14 15H7V13H14V15ZM17 17H7V15H17V17Z" fill="currentColor"/>
        </svg>
      ),
      link: '/',
      color: 'cyan',
      onClick: () => alert('Document comparison coming soon!')
    },
    {
      title: 'Digital Signature',
      description: 'eSign documents securely',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 14.66V20C20 21.1 19.1 22 18 22H4C2.9 22 2 21.1 2 20V6C2 4.9 2.9 4 4 4H9.34C9.84 2.84 10.79 2 12 2C13.21 2 14.16 2.84 14.66 4H20C21.1 4 22 4.9 22 6V12.34L20 14.34V6H18V9H6V6H4V20H18V16.66L20 14.66ZM12 5C11.45 5 11 4.55 11 4C11 3.45 11.45 3 12 3C12.55 3 13 3.45 13 4C13 4.55 12.55 5 12 5Z" fill="currentColor"/>
          <path d="M13.46 11.88L14.88 13.3L20 8.18L21.42 9.6L14.88 16.14L11.46 12.72L13.46 11.88Z" fill="currentColor"/>
        </svg>
      ),
      link: '/quick-actions/digital-signature',
      color: 'emerald'
    },
    {
      title: 'Verify Signature',
      description: 'Verify signed documents',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      link: '/quick-actions/verify-signature',
      color: 'violet'
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
                if (action.onClick) {
                  e.preventDefault();
                  action.onClick();
                } else if (!action.link) {
                  e.preventDefault();
                }
              }}
            >
              <div className="action-icon">
                {action.icon}
              </div>
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

      {/* Document History removed - now accessible via navbar */}

      {/* Prompt Modal */}
      {showPromptModal && (
        <PromptModal onClose={() => setShowPromptModal(false)} />
      )}
    </div>
  );
};

export default Dashboard;
