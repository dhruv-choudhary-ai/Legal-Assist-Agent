import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { toast } from 'react-toastify';
import './WorkspaceHome.css';

const WorkspaceHome = () => {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { 
    setDocument, 
    setDocumentType, 
    setDocumentTitle,
    setExtractedFields,
    setMissingFields,
    setDocumentCategory,
    setWorkflowStage,
    addToConversation
  } = useWorkspace();

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please describe what document you need');
      return;
    }

    setIsLoading(true);
    addToConversation('user', description);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/document/generate-from-nl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: description.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const data = await response.json();

      if (data.success) {
        // Update workspace state
        setDocument(data.document);
        setDocumentType(data.document_type);
        setDocumentTitle(data.document_type);
        setExtractedFields(data.extracted_fields);
        setMissingFields(data.missing_fields);
        setDocumentCategory(data.category);
        
        // Add AI response to conversation
        addToConversation('assistant', data.document, {
          documentType: data.document_type,
          nextQuestion: data.next_question
        });
        
        // Move to edit stage
        setWorkflowStage('edit');
        
        toast.success(`${data.document_type} generated successfully!`);
      } else {
        toast.error(data.message || 'Failed to understand request');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (type, example) => {
    setDescription(example);
  };

  const quickActions = [
    {
      category: 'Employment',
      icon: '👥',
      examples: [
        { type: 'Employment Agreement', text: 'I need an employment agreement for a software developer with ₹8L annual salary' },
        { type: 'NDA', text: 'Create an NDA for protecting our business secrets' },
        { type: 'Consulting Agreement', text: 'I need a consulting agreement for a marketing consultant' }
      ]
    },
    {
      category: 'Business',
      icon: '🏢',
      examples: [
        { type: 'Partnership Deed', text: 'Create a partnership deed for two partners sharing profits equally' },
        { type: 'Service Agreement', text: 'I need a service agreement for software development services' },
        { type: 'MSA', text: 'Create a master service agreement for ongoing client projects' }
      ]
    },
    {
      category: 'Property',
      icon: '🏠',
      examples: [
        { type: 'Commercial Lease', text: 'I need a commercial lease for office space in Mumbai at ₹50,000/month for 11 months' },
        { type: 'Rent Agreement', text: 'Create a residential rent agreement for ₹25,000 per month' },
        { type: 'Leave & License', text: 'I need a leave and license agreement for my property in Pune' }
      ]
    },
    {
      category: 'Compliance',
      icon: '🔒',
      examples: [
        { type: 'Privacy Policy', text: 'Create a privacy policy for my e-commerce website' },
        { type: 'Terms of Service', text: 'I need terms of service for my SaaS platform' },
        { type: 'Refund Policy', text: 'Create a refund policy for my online store' }
      ]
    }
  ];

  return (
    <div className="workspace-home">
      <div className="workspace-home-container">
        {/* Hero Section */}
        <div className="workspace-hero">
          <div className="hero-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="url(#gradient)" />
              <path d="M3 17L12 22L21 17V11L12 16L3 11V17Z" fill="url(#gradient)" opacity="0.7"/>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#a855f7"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>What legal document do you need?</h1>
          <p className="hero-subtitle">
            Describe your needs in plain English. Our AI will create a complete, legally-sound document in seconds.
          </p>
        </div>

        {/* Input Section */}
        <div className="workspace-input-section">
          <div className="input-wrapper">
            <textarea
              className="workspace-input"
              placeholder='Example: "I need a lease agreement for my office in Mumbai for 11 months at ₹50,000/month with a security deposit of ₹1,50,000"'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleGenerate();
                }
              }}
              disabled={isLoading}
              rows={4}
            />
            <div className="input-footer">
              <span className="input-hint">
                💡 Tip: Be specific about parties, amounts, locations, and terms
              </span>
              <button 
                className="generate-btn"
                onClick={handleGenerate}
                disabled={!description.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" />
                      <path d="M3 17L12 22L21 17V11L12 16L3 11V17Z" fill="currentColor" />
                    </svg>
                    Generate Document with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Or choose from popular documents:</h2>
          <div className="quick-actions-grid">
            {quickActions.map((category, idx) => (
              <div key={idx} className="quick-action-category">
                <div className="category-header">
                  <span className="category-icon">{category.icon}</span>
                  <h3>{category.category}</h3>
                </div>
                <div className="category-examples">
                  {category.examples.map((example, exIdx) => (
                    <button
                      key={exIdx}
                      className="example-btn"
                      onClick={() => handleQuickAction(example.type, example.text)}
                      disabled={isLoading}
                    >
                      <span className="example-type">{example.type}</span>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="workspace-features">
          <div className="feature">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <h4>AI-Validated</h4>
              <p>Every document checked for legal compliance</p>
            </div>
          </div>
          <div className="feature">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="currentColor" opacity="0.2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <h4>Instant Creation</h4>
              <p>Get your document in under 30 seconds</p>
            </div>
          </div>
          <div className="feature">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6Z" fill="currentColor"/>
              <path d="M20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor" opacity="0.7"/>
            </svg>
            <div>
              <h4>70+ Templates</h4>
              <p>Covers all small business legal needs</p>
            </div>
          </div>
          <div className="feature">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15Z" fill="currentColor"/>
              <path d="M19.4 15C19.2 15.6 18.8 16.1 18.3 16.4L19.8 18.3L18.3 19.8L16.4 18.3C16.1 18.8 15.6 19.2 15 19.4V22H13V19.4C12.4 19.2 11.9 18.8 11.6 18.3L9.7 19.8L8.2 18.3L9.7 16.4C9.2 16.1 8.8 15.6 8.6 15H6V13H8.6C8.8 12.4 9.2 11.9 9.7 11.6L8.2 9.7L9.7 8.2L11.6 9.7C11.9 9.2 12.4 8.8 13 8.6V6H15V8.6C15.6 8.8 16.1 9.2 16.4 9.7L18.3 8.2L19.8 9.7L18.3 11.6C18.8 11.9 19.2 12.4 19.4 13H22V15H19.4Z" fill="currentColor" opacity="0.3"/>
            </svg>
            <div>
              <h4>Indian Law Expert</h4>
              <p>Specialized in Indian legal requirements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceHome;
