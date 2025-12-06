import React, { createContext, useState, useContext } from 'react';

const WorkspaceContext = createContext();

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider = ({ children }) => {
  // Document state
  const [document, setDocument] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentTitle, setDocumentTitle] = useState('Untitled Document');
  
  // Metadata
  const [extractedFields, setExtractedFields] = useState({});
  const [missingFields, setMissingFields] = useState([]);
  const [documentCategory, setDocumentCategory] = useState('');
  
  // Validation state
  const [validationStatus, setValidationStatus] = useState(null);
  const [complianceScore, setComplianceScore] = useState(null);
  const [validationIssues, setValidationIssues] = useState([]);
  
  // Workflow state
  const [workflowStage, setWorkflowStage] = useState('describe'); // describe, generate, edit, validate, export
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  // Conversation state
  const [conversationHistory, setConversationHistory] = useState([]);
  const [sessionId] = useState(`workspace_${Date.now()}`);
  
  // Helper functions
  const resetWorkspace = () => {
    setDocument('');
    setDocumentType('');
    setDocumentTitle('Untitled Document');
    setExtractedFields({});
    setMissingFields([]);
    setDocumentCategory('');
    setValidationStatus(null);
    setComplianceScore(null);
    setValidationIssues([]);
    setWorkflowStage('describe');
    setConversationHistory([]);
  };
  
  const updateDocument = (newContent) => {
    setDocument(newContent);
    // Mark as edited if in validate stage
    if (workflowStage === 'validate') {
      setWorkflowStage('edit');
      setValidationStatus(null);
    }
  };
  
  const addToConversation = (role, message, metadata = {}) => {
    setConversationHistory(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        role,
        message,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    ]);
  };
  
  const value = {
    // Document state
    document,
    setDocument: updateDocument,
    documentType,
    setDocumentType,
    documentTitle,
    setDocumentTitle,
    
    // Metadata
    extractedFields,
    setExtractedFields,
    missingFields,
    setMissingFields,
    documentCategory,
    setDocumentCategory,
    
    // Validation
    validationStatus,
    setValidationStatus,
    complianceScore,
    setComplianceScore,
    validationIssues,
    setValidationIssues,
    
    // Workflow
    workflowStage,
    setWorkflowStage,
    isGenerating,
    setIsGenerating,
    isValidating,
    setIsValidating,
    
    // Conversation
    conversationHistory,
    setConversationHistory,
    addToConversation,
    sessionId,
    
    // Helpers
    resetWorkspace
  };
  
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};
