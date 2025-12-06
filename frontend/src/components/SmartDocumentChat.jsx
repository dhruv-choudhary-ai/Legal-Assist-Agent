import React, { useState, useRef, useEffect } from 'react';
import './ConversationalAssembly.css';

const SmartDocumentChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [documentState, setDocumentState] = useState({
    status: 'initial', // initial, collecting, ready, generated
    templateId: null,
    extractedVars: {},
    missingVars: [],
    progress: { current: 0, total: 0, percentage: 0 }
  });
  const [generatedDocument, setGeneratedDocument] = useState(null);
  
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const addMessage = (role, content) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        role,
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setIsTyping(true);

    try {
      // Use SIMPLE endpoint
      const response = await fetch('http://127.0.0.1:5000/api/document/simple-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          template: documentState.templateId,
          conversation: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      const data = await response.json();
      
      // Update document state
      setDocumentState({
        status: data.status,
        templateId: data.template || documentState.templateId,
        extractedVars: data.extracted || {},
        missingVars: data.missing || [],
        progress: data.progress || { done: 0, total: 0, percent: 0 }
      });

      // Add assistant response
      addMessage('assistant', data.message);

      // If document is ready, show it
      if (data.status === 'ready' && data.document) {
        setGeneratedDocument({
          content: data.document,
          downloadUrl: data.download_url,
          suggestions: data.rag_suggestions
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="smart-doc-chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" />
            </svg>
          </div>
          <div className="chat-header-text">
            <h3>Smart Document Assistant</h3>
            <p className="chat-status">
              {documentState.status === 'initial' && 'Ready to help'}
              {documentState.status === 'collecting' && `Collecting info... ${documentState.progress.percentage}%`}
              {documentState.status === 'ready' && 'Ready to generate'}
              {documentState.status === 'generated' && '✓ Document ready'}
            </p>
          </div>
        </div>
        {documentState.progress.total > 0 && (
          <div className="progress-indicator">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${documentState.progress.percent}%` }}
              />
            </div>
            <span className="progress-text">
              {documentState.progress.done}/{documentState.progress.total} fields
            </span>
          </div>
        )}
      </div>

      {/* Split View: Chat + Document Preview */}
      <div className="split-view">
        {/* Chat Side */}
        <div className="chat-side">
          <div className="chat-messages" ref={chatContainerRef}>
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="welcome-message">
                <div className="welcome-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" />
                  </svg>
                </div>
                <h3>Create Legal Documents</h3>
                <p className="welcome-subtitle">Just tell me what you need in plain English</p>
                <div className="welcome-examples">
                  <button onClick={() => setInput("I need a rent agreement for my property in Mumbai")}>
                    🏠 Rent Agreement
                  </button>
                  <button onClick={() => setInput("Create an NDA for my company")}>
                    📝 NDA
                  </button>
                  <button onClick={() => setInput("I need a legal notice for recovery")}>
                    ⚖️ Legal Notice
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <div className="message-bubble">
                    <div className="message-text">{msg.content}</div>
                  </div>
                  <span className="message-time">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="message-bubble typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form className="chat-input-container" onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <input
                ref={inputRef}
                type="text"
                className="chat-input"
                placeholder={
                  documentState.status === 'initial' 
                    ? "Describe the document you need..." 
                    : "Enter the information..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
              />
              <button
                type="submit"
                className="send-btn"
                disabled={!input.trim() || isTyping}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Document Preview Side */}
        {generatedDocument && (
          <div className="document-side">
            <div className="document-header">
              <h3>📄 Document Preview</h3>
              <button className="download-btn">
                Download DOCX
              </button>
            </div>
            <div className="document-preview">
              <pre className="document-content">{generatedDocument.content}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartDocumentChat;
