import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import './PromptModal.css';

const PromptModal = ({ onClose }) => {
  const navigate = useNavigate();
  const { addToConversation, setDocumentTitle } = useWorkspace();
  const [prompt, setPrompt] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [documentFormats, setDocumentFormats] = useState([
    { id: 'auto', name: 'Auto-Detect', description: 'Let AI choose the best format', icon: '✨' }
  ]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Fetch templates from API on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/templates/list');
        const data = await response.json();
        
        if (data.success && data.templates) {
          // Separate system and user templates
          const systemTemplates = data.templates
            .filter(t => !t.is_user_template)
            .map(template => ({
              id: template.id,
              name: template.name,
              description: template.category,
              icon: getCategoryIcon(template.category),
              isUserTemplate: false
            }));

          const userTemplates = data.templates
            .filter(t => t.is_user_template)
            .map(template => ({
              id: template.id,
              name: template.name,
              description: template.category,
              icon: getCategoryIcon(template.category),
              isUserTemplate: true
            }));

          // Combine: auto-detect, system templates, then user templates
          setDocumentFormats([
            { id: 'auto', name: 'Auto-Detect', description: 'Let AI choose the best format', icon: '✨' },
            ...systemTemplates,
            ...userTemplates
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        // Keep default auto-detect option on error
      } finally {
        setTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Get icon based on category
  const getCategoryIcon = (category) => {
    const icons = {
      property: '🏠',
      employment: '💼',
      corporate: '🤝',
      custom: '⭐',
      contracts: '📝',
      agreements: '🤝'
    };
    return icons[category?.toLowerCase()] || '📄';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;

    setIsLoading(true);

    // Add format hint to prompt if not auto
    let finalPrompt = prompt;
    let templateInfo = null;
    
    if (selectedFormat !== 'auto') {
      const selectedTemplate = documentFormats.find(f => f.id === selectedFormat);
      if (selectedTemplate) {
        finalPrompt = `Create a ${selectedTemplate.name}: ${prompt}`;
        // Pass template information for the backend
        templateInfo = {
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          isUserTemplate: selectedTemplate.isUserTemplate
        };
      }
    }

    // Add user's initial prompt to conversation
    addToConversation('user', finalPrompt);

    // Set initial document title from prompt (first few words)
    const titleWords = prompt.split(' ').slice(0, 5).join(' ');
    setDocumentTitle(titleWords + '...');

    // Navigate to workspace with template info if available
    navigate('/workspace', { 
      state: { 
        initialPrompt: finalPrompt,
        selectedTemplate: templateInfo
      } 
    });
    
    onClose();
  };

  const quickPrompts = [
    {
      icon: '📝',
      text: 'Create a rental agreement',
      prompt: 'I need to create a rental agreement for a residential property in Mumbai'
    },
    {
      icon: '💼',
      text: 'Draft an employment contract',
      prompt: 'I want to draft an employment contract for a software developer'
    },
    {
      icon: '🤝',
      text: 'Partnership deed',
      prompt: 'I need a partnership deed for a business with two partners'
    },
    {
      icon: '📄',
      text: 'Non-disclosure agreement',
      prompt: 'Create an NDA for protecting confidential business information'
    }
  ];

  const handleQuickPrompt = (promptText) => {
    setPrompt(promptText);
  };

  return (
    <div className="prompt-modal-overlay" onClick={onClose}>
      <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="prompt-modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" />
                <path d="M3 17L12 22L21 17V11L12 16L3 11V17Z" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h2>Create New Document</h2>
              <p>Tell me what document you need, and I'll help you create it</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="prompt-modal-body">
          <form onSubmit={handleSubmit}>
            {/* Prompt Input */}
            <div className="prompt-input-section">
              <label className="section-label">What document do you need?</label>
              <textarea
                className="prompt-input"
                placeholder="Describe your requirements in detail... e.g., 'Rental agreement for a 2BHK apartment in Delhi with monthly rent of ₹25,000 and 11-month lease period'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Document Format Selector */}
            <div className="format-selector-section">
              <label className="section-label">
                Document Type
                {templatesLoading && <span className="loading-text"> (Loading templates...)</span>}
              </label>
              <select
                className="format-select"
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                disabled={isLoading || templatesLoading}
              >
                {/* Auto-detect option */}
                <option value="auto">Auto-Detect (Recommended)</option>
                
                {/* System Templates */}
                {documentFormats.some(f => !f.isUserTemplate && f.id !== 'auto') && (
                  <optgroup label="System Templates">
                    {documentFormats
                      .filter(f => !f.isUserTemplate && f.id !== 'auto')
                      .map((format) => (
                        <option key={format.id} value={format.id}>
                          {format.name} - {format.description}
                        </option>
                      ))}
                  </optgroup>
                )}
                
                {/* User Templates */}
                {documentFormats.some(f => f.isUserTemplate) && (
                  <optgroup label="My Custom Templates">
                    {documentFormats
                      .filter(f => f.isUserTemplate)
                      .map((format) => (
                        <option key={format.id} value={format.id}>
                          {format.name} - {format.description}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!prompt.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner-small"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Create Document
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 7L18 12M18 12L13 17M18 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Tip */}
        <div className="prompt-modal-footer">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>
            {selectedFormat === 'auto' ? 'AI will automatically detect the best template for your needs' : 'AI will generate your document using the selected template'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
