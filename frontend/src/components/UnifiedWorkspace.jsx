import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import DocumentEditor from './DocumentEditor';
import WorkspaceAssistant from './WorkspaceAssistant';
import ValidationPanel from './ValidationPanel';
import './UnifiedWorkspace.css';

const UnifiedWorkspace = () => {
  const location = useLocation();
  const { 
    workflowStage, 
    documentTitle, 
    validationStatus, 
    isGenerating,
    isValidating
  } = useWorkspace();
  const [isAssistantCollapsed, setIsAssistantCollapsed] = useState(false);
  const [editorWidth, setEditorWidth] = useState(60); // Default 60%
  const [isResizing, setIsResizing] = useState(false);

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
            <h1>{documentTitle}</h1>
            <span className="workspace-stage">{getStageLabel(workflowStage, isGenerating)}</span>
          </div>
        </div>
        
        <div className="workspace-header-right">
          {validationStatus && (
            <div className={`validation-badge ${validationStatus}`}>
              {validationStatus === 'valid' && '✓ Verified'}
              {validationStatus === 'needs_correction' && '⚠ Needs Review'}
              {validationStatus === 'invalid' && '✗ Invalid'}
            </div>
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
