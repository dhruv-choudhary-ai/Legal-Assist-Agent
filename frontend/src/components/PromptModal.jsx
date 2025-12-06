import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import './PromptModal.css';

const PromptModal = ({ onClose }) => {
  const navigate = useNavigate();
  const { addToConversation, setDocumentTitle } = useWorkspace();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;

    setIsLoading(true);

    // Add user's initial prompt to conversation
    addToConversation('user', prompt);

    // Set initial document title from prompt (first few words)
    const titleWords = prompt.split(' ').slice(0, 5).join(' ');
    setDocumentTitle(titleWords + '...');

    // Navigate to workspace
    navigate('/workspace', { state: { initialPrompt: prompt } });
    
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
            <div className="prompt-input-wrapper">
              <textarea
                className="prompt-input"
                placeholder="Describe the document you need... e.g., 'I need a rental agreement for a 2BHK apartment in Delhi' or 'Create an employment contract for a marketing manager'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div className="quick-prompts">
              <p className="quick-prompts-label">Quick Start:</p>
              <div className="quick-prompts-grid">
                {quickPrompts.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    className="quick-prompt-btn"
                    onClick={() => handleQuickPrompt(item.prompt)}
                    disabled={isLoading}
                  >
                    <span className="quick-prompt-icon">{item.icon}</span>
                    <span className="quick-prompt-text">{item.text}</span>
                  </button>
                ))}
              </div>
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
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 7L18 12M18 12L13 17M18 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Start Creating
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
            The AI will analyze your request, select the best template, and guide you through filling in the details.
          </span>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
