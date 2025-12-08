import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import DocumentEditor from './DocumentEditor';
import WorkspaceAssistant from './WorkspaceAssistant';
import ValidationPanel from './ValidationPanel';
import SignaturePanel from './SignaturePanel';
import SignatureWorkflow from './SignatureWorkflow';
import SignedDocumentViewer from './SignedDocumentViewer';
import './UnifiedWorkspace.css';

const UnifiedWorkspace = () => {
  const location = useLocation();
  const { 
    workflowStage, 
    documentTitle,
    setDocumentTitle, 
    documentId,
    validationStatus, 
    isGenerating,
    isValidating,
    validateDocument,
    exportDocument
  } = useWorkspace();
  const [isAssistantCollapsed, setIsAssistantCollapsed] = useState(false);
  const [editorWidth, setEditorWidth] = useState(60); // Default 60%
  const [isResizing, setIsResizing] = useState(false);
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const [showWorkflowPanel, setShowWorkflowPanel] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedSignatureId, setSelectedSignatureId] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Handle initial prompt from PromptModal
  useEffect(() => {
    const initialPrompt = location.state?.initialPrompt;
    if (initialPrompt) {
      // Initial prompt already added in PromptModal, just ensure we're ready
      console.log('Workspace opened with prompt:', initialPrompt);
    }
  }, [location.state]);

  // Handle resize
  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const container = document.querySelector('.workspace-content');
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Limit between 30% and 80%
      if (newWidth >= 30 && newWidth <= 80) {
        setEditorWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showExportMenu && !e.target.closest('.export-dropdown-container')) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showExportMenu]);

  return (
    <div className="unified-workspace">
      {/* Header */}
      <div className="workspace-header">
        <div className="workspace-header-left">
          <div className="workspace-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" />
              <path d="M3 17L12 22L21 17V11L12 16L3 11V17Z" fill="currentColor" />
            </svg>
          </div>
          <div className="workspace-title">
            <input
              type="text"
              className="workspace-title-input"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Document Title"
            />
            <span className="workspace-stage">{getStageLabel(workflowStage, isGenerating)}</span>
          </div>
        </div>
        
        <div className="workspace-header-right">
          {/* Editor Toolbar - Moved from DocumentEditor */}
          <div className="editor-toolbar-in-header">
            <button
              className="toolbar-btn-header validate-btn"
              onClick={() => validateDocument && validateDocument()}
              title="Validate Document"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Validate
            </button>

            <button
              className="toolbar-btn-header signature-btn"
              onClick={() => setShowSignaturePanel(true)}
              title="Sign Document Digitally"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 14.66V20C20 21.1 19.1 22 18 22H4C2.9 22 2 21.1 2 20V6C2 4.9 2.9 4 4 4H9.34C9.84 2.84 10.79 2 12 2C13.21 2 14.16 2.84 14.66 4H20C21.1 4 22 4.9 22 6V12.34L20 14.34V6H18V9H6V6H4V20H18V16.66L20 14.66ZM12 5C11.45 5 11 4.55 11 4C11 3.45 11.45 3 12 3C12.55 3 13 3.45 13 4C13 4.55 12.55 5 12 5Z" fill="currentColor"/>
                <path d="M13.46 11.88L14.88 13.3L20 8.18L21.42 9.6L14.88 16.14L11.46 12.72L13.46 11.88Z" fill="currentColor"/>
              </svg>
              eSign
            </button>

            <div className="export-dropdown-container" style={{ position: 'relative' }}>
              <button
                className="toolbar-btn-header export-btn"
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="Export Document"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15M12 15L17 10M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Export
              </button>
              {showExportMenu && (
                <div className="export-menu" style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                  zIndex: 9999,
                  minWidth: '180px'
                }}>
                  <button
                    className="export-option"
                    onClick={() => {
                      exportDocument && exportDocument('pdf');
                      setShowExportMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '10px 16px',
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      fontWeight: '500',
                      borderRadius: '8px 8px 0 0'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Export as PDF
                  </button>
                  <button
                    className="export-option"
                    onClick={() => {
                      exportDocument && exportDocument('docx');
                      setShowExportMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '10px 16px',
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <path d="M12 18v-6" />
                      <path d="M9 15l3 3 3-3" />
                    </svg>
                    Export as DOCX
                  </button>
                  <button
                    className="export-option"
                    onClick={() => {
                      exportDocument && exportDocument('txt');
                      setShowExportMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '10px 16px',
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      fontWeight: '500',
                      borderRadius: '0 0 8px 8px'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <line x1="12" y1="9" x2="8" y2="9" />
                    </svg>
                    Export as TXT
                  </button>
                </div>
              )}
            </div>
          </div>

          {validationStatus && (
            <div className={`validation-badge ${validationStatus}`}>
              {validationStatus === 'valid' && '✓ Verified'}
              {validationStatus === 'needs_correction' && '⚠ Needs Review'}
              {validationStatus === 'invalid' && '✗ Invalid'}
            </div>
          )}
          
          {/* Workflow Buttons */}
          {workflowStage === 'export' && selectedSignatureId && (
            <>
              <button 
                className="signature-btn-header workflow-btn"
                onClick={() => setShowWorkflowPanel(true)}
                title="Multi-Party Signature Workflow"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Workflow
              </button>
              <button 
                className="signature-btn-header viewer-btn"
                onClick={() => setShowDocumentViewer(true)}
                title="View Signed Document"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                View Certificate
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content - Always show split view */}
      <div className="workspace-content">
        <div 
          className={`workspace-split ${isAssistantCollapsed ? 'assistant-collapsed' : ''} ${isValidating ? 'validating' : ''} ${isResizing ? 'resizing' : ''}`}
          style={!isAssistantCollapsed ? { gridTemplateColumns: `${editorWidth}% ${100 - editorWidth}%` } : {}}
        >
          {/* Left Panel - Document Viewer/Editor */}
          <div className="workspace-panel workspace-editor-panel">
            <DocumentEditor />
          </div>

          {/* Resizable Divider */}
          {!isAssistantCollapsed && (
            <div 
              className="workspace-divider"
              onMouseDown={handleMouseDown}
              style={{ left: `${editorWidth}%` }}
            >
              <div className="divider-handle"></div>
            </div>
          )}

          {/* Right Panel - AI Assistant */}
          <div className="workspace-panel workspace-assistant-panel">
            <button 
              className="collapse-assistant-btn"
              onClick={() => setIsAssistantCollapsed(!isAssistantCollapsed)}
              title={isAssistantCollapsed ? 'Show Assistant' : 'Hide Assistant'}
            >
              {isAssistantCollapsed ? '«' : '»'}
            </button>
            
            {!isAssistantCollapsed && (
              workflowStage === 'validate' ? (
                <ValidationPanel />
              ) : (
                <WorkspaceAssistant />
              )
            )}
          </div>
        </div>

        {/* Validation Loading Overlay */}
        {isValidating && (
          <div className="validation-overlay">
            <div className="validation-loader">
              <div className="loader-spinner">
                <svg viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" strokeWidth="3" stroke="#6366f1" strokeLinecap="round">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 25 25"
                      to="360 25 25"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              </div>
              <h3>Validating Your Document</h3>
              <p>Our AI is checking for legal compliance, accuracy, and completeness...</p>
              <div className="validation-steps">
                <div className="validation-step active">
                  <span className="step-icon">✓</span>
                  <span>Analyzing structure</span>
                </div>
                <div className="validation-step active">
                  <span className="step-icon">⟳</span>
                  <span>Checking compliance</span>
                </div>
                <div className="validation-step">
                  <span className="step-icon">○</span>
                  <span>Generating report</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Digital Signature Modal */}
        {showSignaturePanel && (
          <div className="signature-modal-overlay" onClick={() => setShowSignaturePanel(false)}>
            <div className="signature-modal-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="signature-modal-close"
                onClick={() => setShowSignaturePanel(false)}
              >
                ✕
              </button>
              <SignaturePanel 
                documentId={documentId}
                onSignatureComplete={(data) => {
                  console.log('Document signed successfully:', data);
                  setSelectedSignatureId(data.signature_id);
                  setShowSignaturePanel(false);
                  // Optionally refresh document or show success message
                }}
              />
            </div>
          </div>
        )}

        {/* Multi-Party Workflow Modal */}
        {showWorkflowPanel && (
          <div className="signature-modal-overlay" onClick={() => setShowWorkflowPanel(false)}>
            <div className="signature-modal-content" onClick={(e) => e.stopPropagation()}>
              <SignatureWorkflow 
                documentId={documentId}
                onClose={() => setShowWorkflowPanel(false)}
              />
            </div>
          </div>
        )}

        {/* Signed Document Viewer Modal */}
        {showDocumentViewer && selectedSignatureId && (
          <div className="signature-modal-overlay" onClick={() => setShowDocumentViewer(false)}>
            <div className="signature-modal-content viewer-modal" onClick={(e) => e.stopPropagation()}>
              <SignedDocumentViewer 
                signatureId={selectedSignatureId}
                documentId={documentId}
                onClose={() => setShowDocumentViewer(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components

const WorkflowIndicator = () => {
  const { workflowStage } = useWorkspace();
  
  const stages = [
    { id: 'describe', label: 'Describe' },
    { id: 'generate', label: 'Generate' },
    { id: 'edit', label: 'Edit' },
    { id: 'validate', label: 'Validate' },
    { id: 'export', label: 'Export' }
  ];
  
  const currentIndex = stages.findIndex(s => s.id === workflowStage);
  
  return (
    <div className="workflow-indicator">
      {stages.map((stage, index) => (
        <div 
          key={stage.id}
          className={`workflow-stage ${index <= currentIndex ? 'active' : ''} ${index === currentIndex ? 'current' : ''}`}
        >
          <span className="stage-number">{index + 1}</span>
          <span className="stage-label">{stage.label}</span>
        </div>
      ))}
    </div>
  );
};

const getStageLabel = (stage, isGenerating) => {
  if (isGenerating) return '⚡ Generating Document...';
  
  const labels = {
    describe: 'Describe Your Document',
    generate: 'Generating Document...',
    edit: 'Editing Document',
    validate: 'Validating Document',
    export: 'Ready to Export'
  };
  return labels[stage] || 'Legal AI Workspace';
};

export default UnifiedWorkspace;
