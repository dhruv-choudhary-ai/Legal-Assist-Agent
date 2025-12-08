import React, { useRef, useState, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useWorkspace } from '../context/WorkspaceContext';
import { toast } from 'react-toastify';
import SignaturePanel from './SignaturePanel';
import SignatureWorkflow from './SignatureWorkflow';
import SignedDocumentViewer from './SignedDocumentViewer';
import './DocumentEditor.css';

const DocumentEditor = () => {
  const {
    document,
    setDocument,
    documentTitle,
    setDocumentTitle,
    documentType,
    workflowStage,
    setWorkflowStage,
    setIsValidating,
    setValidationStatus,
    setComplianceScore,
    setValidationIssues,
    isGenerating,
    setValidateDocument,
    setExportDocument
  } = useWorkspace();

  const quillRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Digital Signature states
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const [showWorkflowPanel, setShowWorkflowPanel] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedSignatureId, setSelectedSignatureId] = useState(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);

  // Simulate generation progress
  useEffect(() => {
    if (isGenerating) {
      setGenerationProgress(0);
      const interval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      return () => clearInterval(interval);
    } else {
      setGenerationProgress(100);
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  }, [isGenerating]);

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'align',
    'blockquote', 'code-block',
    'link'
  ];

  const handleDocumentChange = (content) => {
    setDocument(content);
  };

  const handleSaveDocument = async () => {
    if (!document || !document.trim()) {
      toast.error('No document to save');
      return null;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:5000/api/document/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: documentTitle || 'Untitled Document',
          content: document,
          doc_id: currentDocumentId // Will be null for new docs
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      const data = await response.json();
      
      if (data.success) {
        setCurrentDocumentId(data.doc_id);
        toast.success('Document saved successfully!');
        return data.doc_id;
      } else {
        throw new Error(data.error || 'Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(`Failed to save document: ${error.message}`);
      return null;
    }
  };

  const handleOpenSignaturePanel = async () => {
    // Save document first to get doc_id
    const docId = await handleSaveDocument();
    if (docId) {
      setShowSignaturePanel(true);
    }
  };

  const handleValidateDocument = useCallback(async () => {
    if (!document.trim()) {
      toast.error('No document to validate');
      return;
    }

    setIsValidating(true);
    setWorkflowStage('validate');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/document/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: document,
          document_type: documentType,
          jurisdiction: 'India',
          apply_corrections: false
        })
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const data = await response.json();

      console.log('🔍 Validation Response:', data);

      if (data.success) {
        // Extract issues from various possible locations
        const issues = data.validation?.issues || data.issues || [];
        
        console.log('📋 Extracted Issues:', issues);
        console.log('📊 Issues Count:', issues.length);
        
        setValidationStatus(data.overall_status || 'validated');
        setComplianceScore(data.compliance_score || 0);
        setValidationIssues(issues);

        const score = data.compliance_score || 0;
        if (score >= 90) {
          toast.success(`✅ Document Verified! Compliance Score: ${score}/100`);
        } else if (score >= 70) {
          toast.warning(`⚠️ Document needs minor improvements. Score: ${score}/100`);
        } else {
          toast.error(`❌ Document has significant issues. Score: ${score}/100`);
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate document');
    } finally {
      setIsValidating(false);
    }
  }, [document, documentType, setIsValidating, setWorkflowStage, setValidationStatus, setComplianceScore, setValidationIssues]);

  const handleExportDocument = useCallback(async (format) => {
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      if (format === 'docx') {
        // Use backend for DOCX export for better reliability
        const response = await fetch('http://127.0.0.1:5000/api/document/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: document,
            format: 'docx',
            title: documentTitle
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `${documentTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')}.docx`;
        window.document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(link);
        
        toast.success('Document exported as DOCX!');
      } else {
        // Use backend export endpoint for other formats
        const response = await fetch('http://127.0.0.1:5000/api/document/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: document,
            format: format,
            title: documentTitle
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `${documentTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')}.${format}`;
        window.document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(link);

        toast.success(`Document exported as ${format.toUpperCase()}!`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export document: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [document, documentTitle]);

  // Register handlers with context
  useEffect(() => {
    setValidateDocument(() => handleValidateDocument);
    setExportDocument(() => handleExportDocument);
  }, [handleValidateDocument, handleExportDocument, setValidateDocument, setExportDocument]);

  return (
    <div className="document-editor">
      {/* Document Editor */}
      <div className="editor-container">
        {isGenerating ? (
          <div className="document-generating-state">
            <div className="generating-animation">
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
            <h3>Generating Your Document...</h3>
            <p>Our AI is creating a professional legal document based on your information</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            <p className="progress-text">{generationProgress}%</p>
          </div>
        ) : document ? (
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={document}
            onChange={handleDocumentChange}
            modules={modules}
            formats={formats}
            placeholder="Your legal document will appear here..."
            className="document-quill-editor"
          />
        ) : (
          <div className="editor-empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>No Document Yet</h3>
            <p>Use the AI assistant on the right to create your legal document</p>
            <div className="empty-state-tip">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Tell the AI what document you need, and it will guide you through the process</span>
            </div>
          </div>
        )}
      </div>

      {/* Document Stats */}
      {document && (
        <div className="editor-footer">
          <div className="editor-stats">
            <span className="stat">{documentType}</span>
            <span className="stat">{getWordCount(document)} words</span>
            <span className="stat">Last edited: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* Digital Signature Panel Modal */}
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
              documentId={currentDocumentId}
              onSignatureComplete={(data) => {
                console.log('Document signed successfully:', data);
                setSelectedSignatureId(data.signature_id);
                setShowSignaturePanel(false);
                setShowDocumentViewer(true);
                toast.success('Document signed successfully!');
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
              documentId={currentDocumentId}
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
              documentId={currentDocumentId}
              onClose={() => setShowDocumentViewer(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to count words
const getWordCount = (html) => {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
};

export default DocumentEditor;
