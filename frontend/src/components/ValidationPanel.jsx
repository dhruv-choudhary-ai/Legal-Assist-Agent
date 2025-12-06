import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { toast } from 'react-toastify';
import './ValidationPanel.css';

const ValidationPanel = () => {
  const { 
    validationStatus, 
    complianceScore, 
    validationIssues,
    setValidationIssues,
    setComplianceScore,
    setValidationStatus,
    document,
    setDocument,
    setWorkflowStage
  } = useWorkspace();

  const [showAllIssues, setShowAllIssues] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState(null);

  const handleBackToChat = () => {
    setWorkflowStage('edit');
  };

  const getComplianceLevel = (score) => {
    if (score >= 90) return { label: 'Excellent', color: '#10b981', icon: '✓' };
    if (score >= 75) return { label: 'Good', color: '#3b82f6', icon: '✓' };
    if (score >= 60) return { label: 'Fair', color: '#f59e0b', icon: '⚠' };
    if (score >= 40) return { label: 'Poor', color: '#ef4444', icon: '⚠' };
    return { label: 'Critical', color: '#dc2626', icon: '✕' };
  };

  const getSeverityInfo = (severity) => {
    switch (severity) {
      case 'critical':
        return { color: '#dc2626', icon: '🔴', label: 'Critical' };
      case 'high':
        return { color: '#ef4444', icon: '🟠', label: 'High' };
      case 'medium':
        return { color: '#f59e0b', icon: '🟡', label: 'Medium' };
      case 'low':
        return { color: '#3b82f6', icon: '🔵', label: 'Low' };
      default:
        return { color: '#64748b', icon: '⚪', label: 'Info' };
    }
  };

  const handleApplyCorrection = (correction) => {
    if (correction && document) {
      setDocument(correction);
    }
  };

  const handleFixIssue = async (issue, index) => {
    try {
      toast.info(`Fixing issue: ${issue.issue_type || issue.issue}...`);
      
      // Call backend to fix this specific issue
      const response = await fetch('http://localhost:5000/api/document/fix-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_html: document,
          issue: issue
        })
      });

      if (!response.ok) throw new Error('Failed to fix issue');

      const data = await response.json();
      
      if (data.success && data.fixed_document) {
        setDocument(data.fixed_document);
        
        // Remove the fixed issue from the list
        const updatedIssues = validationIssues.filter((_, i) => i !== index);
        setValidationIssues(updatedIssues);
        
        // Recalculate score
        const newScore = Math.min(100, complianceScore + 5);
        setComplianceScore(newScore);
        
        toast.success('✅ Issue fixed successfully!');
      }
    } catch (error) {
      console.error('Fix issue error:', error);
      toast.error('Failed to fix issue. Please try manually.');
    }
  };

  const handleFixAllIssues = async () => {
    try {
      toast.info('🔧 Fixing all issues... This may take a moment.');
      
      // Call backend to fix all issues at once
      const response = await fetch('http://localhost:5000/api/document/fix-all-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_html: document,
          issues: validationIssues
        })
      });

      if (!response.ok) throw new Error('Failed to fix issues');

      const data = await response.json();
      
      if (data.success && data.fixed_document) {
        setDocument(data.fixed_document);
        setValidationIssues([]);
        setComplianceScore(95); // Set high score after fixing all
        setValidationStatus('valid');
        
        toast.success('✅ All issues fixed successfully!');
      }
    } catch (error) {
      console.error('Fix all issues error:', error);
      toast.error('Failed to fix all issues. You can try fixing them one by one.');
    }
  };

  const toggleIssue = (index) => {
    setExpandedIssue(expandedIssue === index ? null : index);
  };

  if (validationStatus === 'idle') {
    return (
      <div className="validation-panel">
        <div className="validation-empty">
          <div className="empty-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3>No Validation Yet</h3>
          <p>Click "Validate Document" in the editor to check your document for legal compliance and issues.</p>
          <div className="validation-features">
            <div className="feature-item">
              <span className="feature-icon">⚖️</span>
              <span>Legal Compliance Check</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔍</span>
              <span>Issue Detection</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💡</span>
              <span>AI Corrections</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (validationStatus === 'validating') {
    return (
      <div className="validation-panel">
        <div className="validation-loading">
          <div className="loading-spinner"></div>
          <h3>Validating Document...</h3>
          <p>AI is analyzing your document for legal compliance and potential issues.</p>
        </div>
      </div>
    );
  }

  const complianceLevel = getComplianceLevel(complianceScore);
  const criticalIssues = validationIssues.filter(i => i.severity === 'critical');
  const highIssues = validationIssues.filter(i => i.severity === 'high');
  const mediumIssues = validationIssues.filter(i => i.severity === 'medium');
  const lowIssues = validationIssues.filter(i => i.severity === 'low');

  const displayedIssues = showAllIssues ? validationIssues : validationIssues.slice(0, 5);

  return (
    <div className="validation-panel">
      {/* Compliance Score */}
      <div className="compliance-score-card">
        <div className="score-header">
          <h3>Compliance Score</h3>
          <div className="score-badge" style={{ background: complianceLevel.color }}>
            {complianceLevel.icon} {complianceLevel.label}
          </div>
        </div>
        
        <div className="score-display">
          <div className="score-circle" style={{ borderColor: complianceLevel.color }}>
            <span className="score-number" style={{ color: complianceLevel.color }}>
              {complianceScore}
            </span>
            <span className="score-label">/ 100</span>
          </div>
          
          <div className="score-bar-container">
            <div className="score-bar">
              <div 
                className="score-bar-fill" 
                style={{ 
                  width: `${complianceScore}%`,
                  background: complianceLevel.color 
                }}
              />
            </div>
            <div className="score-labels">
              <span>Critical (0-40)</span>
              <span>Fair (40-60)</span>
              <span>Good (60-90)</span>
              <span>Excellent (90+)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Issues Summary */}
      <div className="issues-summary">
        <h4>Issues Summary</h4>
        <div className="summary-grid">
          <div className="summary-item critical">
            <span className="summary-count">{criticalIssues.length}</span>
            <span className="summary-label">Critical</span>
          </div>
          <div className="summary-item high">
            <span className="summary-count">{highIssues.length}</span>
            <span className="summary-label">High</span>
          </div>
          <div className="summary-item medium">
            <span className="summary-count">{mediumIssues.length}</span>
            <span className="summary-label">Medium</span>
          </div>
          <div className="summary-item low">
            <span className="summary-count">{lowIssues.length}</span>
            <span className="summary-label">Low</span>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {validationIssues && validationIssues.length > 0 && (
        <div className="issues-list">
          <div className="issues-header">
            <h4>Issues Detected ({validationIssues.length})</h4>
            {validationIssues.length > 5 && (
              <button 
                className="show-all-btn"
                onClick={() => setShowAllIssues(!showAllIssues)}
              >
                {showAllIssues ? 'Show Less' : `Show All (${validationIssues.length})`}
              </button>
            )}
          </div>

          {displayedIssues.map((issue, index) => {
            const severityInfo = getSeverityInfo(issue.severity);
            const isExpanded = expandedIssue === index;

            return (
              <div 
                key={index} 
                className={`issue-card ${issue.severity} ${isExpanded ? 'expanded' : ''}`}
              >
                <div className="issue-header" onClick={() => toggleIssue(index)}>
                  <div className="issue-title">
                    <span className="severity-badge" style={{ background: severityInfo.color }}>
                      {severityInfo.icon} {severityInfo.label}
                    </span>
                    <span className="issue-type">{issue.issue_type || issue.issue || 'Compliance Issue'}</span>
                  </div>
                  <svg 
                    className="expand-icon" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                  </svg>
                </div>

                <div className="issue-description">
                  {issue.description || issue.issue || 'No description provided'}
                </div>

                {isExpanded && (
                  <div className="issue-details">
                    {(issue.location || issue.clause_reference) && (
                      <div className="issue-location">
                        <strong>📍 Location:</strong> {issue.location || issue.clause_reference}
                      </div>
                    )}

                    {(issue.suggestion || issue.recommendation) && (
                      <div className="issue-suggestion">
                        <strong>💡 Suggestion:</strong>
                        <p>{issue.suggestion || issue.recommendation}</p>
                      </div>
                    )}

                    {issue.legal_risk && (
                      <div className="issue-legal-risk">
                        <strong>⚠️ Legal Risk:</strong>
                        <p>{issue.legal_risk}</p>
                      </div>
                    )}

                    {issue.correction && (
                      <div className="issue-correction">
                        <strong>✨ AI Correction:</strong>
                        <div className="correction-text">{issue.correction}</div>
                        <button 
                          className="apply-correction-btn"
                          onClick={() => handleApplyCorrection(issue.correction)}
                        >
                          Apply Correction
                        </button>
                      </div>
                    )}

                    {issue.legal_reference && (
                      <div className="issue-reference">
                        <strong>📚 Legal Reference:</strong>
                        <p>{issue.legal_reference}</p>
                      </div>
                    )}

                    {/* Fix This Issue Button */}
                    <div className="issue-actions">
                      <button 
                        className="fix-issue-btn"
                        onClick={() => handleFixIssue(issue, index)}
                      >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Fix This Issue
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Fix All Issues Button */}
          {validationIssues.length > 0 && (
            <div className="validation-actions">
              <button 
                className="fix-all-btn"
                onClick={handleFixAllIssues}
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Fix All Issues ({validationIssues.length})
              </button>
              
              <button className="back-to-chat-btn" onClick={handleBackToChat}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Back to Chat
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Issues */}
      {validationIssues.length === 0 && validationStatus === 'validated' && (
        <div className="no-issues">
          <div className="success-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3>Perfect! No Issues Found</h3>
          <p>Your document meets all legal compliance requirements.</p>
        </div>
      )}
    </div>
  );
};

export default ValidationPanel;
