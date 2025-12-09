import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './AskLawyerChat.css';

const AskLawyerChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `lawyer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [showSources, setShowSources] = useState({});
  const [showExamples, setShowExamples] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message - professional lawyer introduction
    setMessages([{
      role: 'assistant',
      content: 'Good day. Please, have a seat.\n\nI\'m here to assist you with any legal matters you\'re facing. With my background in Indian law and years of practice, I can help you understand your rights, obligations, and the best course of action for your situation.\n\nWhat brings you in today? Feel free to explain your concern in as much detail as you\'re comfortable sharing.',
      timestamp: new Date()
    }]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/quick-actions/ask-lawyer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputMessage,
          session_id: sessionId
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered a technical difficulty processing your question. Please try again, or rephrase your query. If the issue persists, you may want to consult with our technical support.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSources = (index) => {
    setShowSources(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = async () => {
    try {
      await fetch('http://127.0.0.1:5000/api/quick-actions/session/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      setMessages([{
        role: 'assistant',
        content: 'Good day. Please, have a seat.\n\nI\'m here to assist you with any legal matters you\'re facing. With my background in Indian law and years of practice, I can help you understand your rights, obligations, and the best course of action for your situation.\n\nWhat brings you in today? Feel free to explain your concern in as much detail as you\'re comfortable sharing.',
        timestamp: new Date()
      }]);
      setShowSources({});
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  };

  const exampleQuestions = [
    "What are the essential elements that make a contract legally valid in India?",
    "Could you explain the distinction between a lease agreement and a leave & license agreement?",
    "What legal protections do I have as a tenant under Indian tenancy laws?",
    "What are the mandatory requirements for a valid employment contract?",
    "What constitutes 'consideration' in Indian contract law?"
  ];

  return (
    <div className="ask-lawyer-container">
      <div className="ask-lawyer-header">
        <div className="header-content">
          <div className="header-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2>Legal Consultation</h2>
            <p>Professional Legal Advisory Services</p>
          </div>
        </div>
        <button className="clear-btn" onClick={clearConversation} title="Start New Consultation">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New Session
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role} ${message.isError ? 'error' : ''}`}>
            <div className="message-avatar">
              {message.role === 'user' ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11L11 13L15 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-role">
                  {message.role === 'user' ? 'You' : 'Legal Counsel'}
                </span>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="message-text">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              {message.sources && message.sources.length > 0 && (
                <div className="message-sources">
                  <button 
                    className="sources-toggle"
                    onClick={() => toggleSources(index)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Legal References ({message.sources.length})</span>
                    <svg 
                      className={`chevron ${showSources[index] ? 'open' : ''}`}
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {showSources[index] && (
                    <div className="sources-list">
                      {message.sources.map((source, idx) => (
                        <div key={idx} className="source-item">
                          <div className="source-header">
                            <span className="source-badge">Reference {idx + 1}</span>
                            {source.similarity && (
                              <span className="source-score">
                                {(source.similarity * 100).toFixed(0)}% Relevant
                              </span>
                            )}
                          </div>
                          {source.source && (
                            <div className="source-name">{source.source}</div>
                          )}
                          {source.content && (
                            <div className="source-excerpt">
                              {source.content.substring(0, 200)}
                              {source.content.length > 200 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-avatar">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11L11 13L15 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-role">Legal Counsel</span>
              </div>
              <div className="typing-indicator">
                <span>Analyzing your question</span>
                <div className="dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && showExamples && (
        <div className="example-questions">
          <div className="example-header">
            <p className="example-title">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Common Legal Inquiries
            </p>
            <button className="hide-examples-btn" onClick={() => setShowExamples(false)} title="Hide examples">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="example-grid">
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                className="example-question"
                onClick={() => {
                  setInputMessage(question);
                  setShowExamples(false);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.length === 1 && !showExamples && (
        <div className="show-examples-section">
          <button className="show-examples-btn" onClick={() => setShowExamples(true)}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Show Example Questions
          </button>
        </div>
      )}

      <div className="chat-input-container">
        {/* <div className="disclaimer">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>
            <strong>Professional Disclaimer:</strong> This consultation provides general legal information. 
            For case-specific advice and legal representation, please consult a licensed attorney.
          </span>
        </div> */}
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            placeholder="Describe your legal question or concern in detail..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            rows={1}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            title="Submit Question"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Submit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AskLawyerChat;
