import React, { useState, useRef, useEffect } from 'react';
import './ModernChat.css';

// Simple markdown-like formatter
const formatMessage = (text) => {
  if (!text) return '';
  
  // Convert markdown to HTML
  let formatted = text
    // Bold **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Headers ### text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Horizontal rules ---
    .replace(/^---$/gim, '<hr/>')
    // Lists - item
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  
  // Wrap lists in ul tags
  formatted = formatted.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  
  // Wrap in paragraph if not already wrapped
  if (!formatted.startsWith('<h') && !formatted.startsWith('<ul')) {
    formatted = '<p>' + formatted + '</p>';
  }
  
  return formatted;
};

const ModernChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [uploadedDocument, setUploadedDocument] = useState(null); // New state for uploaded doc
  const [isUploading, setIsUploading] = useState(false);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const addMessage = (role, content, sources = null) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        role,
        content,
        sources,
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
      // If document is uploaded, use document analysis endpoint
      if (uploadedDocument) {
        await handleDocumentQuery(userMessage);
      } else {
        // Regular RAG endpoint
        const response = await fetch('http://127.0.0.1:5000/api/chat/rag', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_chat: userMessage,
            session_id: sessionId,
            n_results: 5,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const data = await response.json();
        
        if (data.result) {
          addMessage('assistant', data.result.response, data.result.sources);
        } else {
          throw new Error('Invalid response format');
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleDocumentQuery = async (question) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/document/analyze/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: uploadedDocument.document_id,
          question: question,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze document');
      }

      const data = await response.json();
      
      if (data.success) {
        addMessage('assistant', data.answer, data.sources);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('Document query error:', error);
      addMessage('assistant', 'Sorry, I couldn\'t analyze the document. Please try again.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['.pdf', '.docx', '.doc'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
      addMessage('assistant', `Sorry, only PDF and DOCX files are supported. You uploaded: ${fileExt}`);
      return;
    }

    setIsUploading(true);
    addMessage('user', `📎 Uploading: ${file.name}`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:5000/api/document/analyze/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      if (data.success) {
        setUploadedDocument(data);
        addMessage('assistant', 
          `✅ **Document uploaded successfully!**\n\n` +
          `📄 **${data.filename}**\n` +
          `📊 ${data.word_count} words • ${data.total_chunks} chunks\n\n` +
          `You can now:\n` +
          `• Ask questions about the document\n` +
          `• Type "summarize" for a summary\n` +
          `• Type "clauses" to extract key clauses\n` +
          `• Type "risks" for risk analysis`
        );
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      addMessage('assistant', 'Sorry, document upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDocumentAction = async (action) => {
    if (!uploadedDocument) {
      addMessage('assistant', 'Please upload a document first.');
      return;
    }

    setIsTyping(true);
    addMessage('user', `📋 Requesting: ${action}`);

    try {
      let endpoint = '';
      switch (action.toLowerCase()) {
        case 'summarize':
          endpoint = 'summarize';
          break;
        case 'clauses':
          endpoint = 'clauses';
          break;
        case 'risks':
          endpoint = 'risks';
          break;
        default:
          throw new Error('Unknown action');
      }

      const response = await fetch(`http://127.0.0.1:5000/api/document/analyze/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: uploadedDocument.document_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();

      if (data.success) {
        if (data.summary) {
          addMessage('assistant', `📝 **Document Summary:**\n\n${data.summary}`);
        } else if (data.clauses) {
          addMessage('assistant', `📋 **Key Legal Clauses:**\n\n${data.clauses}`);
        } else if (data.risks) {
          addMessage('assistant', `⚠️ **Risk Analysis:**\n\n${data.risks}`);
        }
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      addMessage('assistant', 'Sorry, analysis failed. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const clearDocument = async () => {
    if (!uploadedDocument) return;

    try {
      await fetch('http://127.0.0.1:5000/api/document/analyze/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: uploadedDocument.document_id,
        }),
      });

      setUploadedDocument(null);
      addMessage('assistant', '🗑️ Document cleared from session.');
    } catch (error) {
      console.error('Clear document error:', error);
    }
  };

  const clearConversation = async () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      try {
        await fetch('http://127.0.0.1:5000/api/conversation/clear', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session_id: sessionId }),
        });
        setMessages([]);
      } catch (error) {
        console.error('Clear error:', error);
      }
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          className="chat-toggle-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
              fill="currentColor"
            />
          </svg>
          {messages.length > 0 && <span className="chat-badge">{messages.length}</span>}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="modern-chat-container">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" />
                  <path d="M3 17L12 22L21 17V11L12 16L3 11V17Z" fill="currentColor" />
                </svg>
              </div>
              <div className="chat-header-text">
                <h3>Legal AI Assistant</h3>
                <p className="chat-status rag-active">
                  AI + Knowledge Base
                </p>
              </div>
            </div>
            <div className="chat-header-actions">
              <button className="header-btn" onClick={clearConversation} title="Clear conversation">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor" />
                </svg>
              </button>
              <button className="header-btn close-btn" onClick={() => setIsOpen(false)} title="Close">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>

          {/* Document Upload Status */}
          {uploadedDocument && (
            <div className="document-status">
              <div className="document-status-info">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor"/>
                  <path d="M14 2V8H20" stroke="#fff" strokeWidth="2"/>
                </svg>
                <div className="document-status-text">
                  <strong>{uploadedDocument.filename}</strong>
                  <span>{uploadedDocument.word_count} words • {uploadedDocument.total_chunks} chunks</span>
                </div>
              </div>
              <div className="document-status-actions">
                <button onClick={() => handleDocumentAction('summarize')} title="Summarize">📝</button>
                <button onClick={() => handleDocumentAction('clauses')} title="Extract Clauses">📋</button>
                <button onClick={() => handleDocumentAction('risks')} title="Analyze Risks">⚠️</button>
                <button onClick={clearDocument} title="Clear Document">🗑️</button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages" ref={chatContainerRef}>
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="welcome-message">
                <div className="welcome-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" />
                    <path d="M3 17L12 22L21 17V11L12 16L3 11V17Z" fill="currentColor" />
                  </svg>
                </div>
                <h3>Welcome to Legal AI Assistant</h3>
                <p className="welcome-subtitle">How can I assist you today?</p>
                <ul className="welcome-features">
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor" />
                    </svg>
                    <span>Legal document generation</span>
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="currentColor" />
                    </svg>
                    <span>Contract analysis & review</span>
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor" />
                    </svg>
                    <span>Legal advice & guidance</span>
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6ZM20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor" />
                    </svg>
                    <span>Indian law reference</span>
                  </li>
                </ul>
                <div className="welcome-tip">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor" />
                  </svg>
                  <span>
                    Powered by GPT-4o-mini with Indian Legal Knowledge Base for accurate, cited responses.
                  </span>
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" />
                      <path d="M3 17L12 22L21 17V11L12 16L3 11V17Z" fill="currentColor" />
                    </svg>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-bubble">
                    <div 
                      className="message-text"
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} 
                    />
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="message-sources">
                        <div className="sources-header">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6ZM20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor" />
                          </svg>
                          <span className="sources-label">Sources</span>
                        </div>
                        {msg.sources.map((source, idx) => (
                          <div key={idx} className="source-item">
                            <span className="source-name">{source.source || 'Legal Document'}</span>
                            <span className="source-score">
                              {Math.round((source.score || 0) * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="message-time">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="message assistant">
                <div className="message-avatar">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" />
                    <path d="M3 17L12 22L21 17V11L12 16L3 11V17Z" fill="currentColor" />
                  </svg>
                </div>
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
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.docx,.doc"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Upload Document (PDF/DOCX)"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M12 18V12M12 12L9 15M12 12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <input
                ref={inputRef}
                type="text"
                className="chat-input"
                placeholder={uploadedDocument ? "Ask about the document..." : "Ask me anything about Indian law..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping || isUploading}
              />
              <button
                type="submit"
                className="send-btn"
                disabled={!input.trim() || isTyping || isUploading}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
            <p className="input-hint">
              {uploadedDocument ? (
                <>📄 Document Mode: Ask questions, type "summarize", "clauses", or "risks"</>
              ) : (
                <>GPT-4o-mini + Legal Knowledge Base • Powered by Azure OpenAI</>
              )}
            </p>
          </form>
        </div>
      )}
    </>
  );
};

export default ModernChat;
