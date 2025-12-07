import React, { useState, useEffect, useRef } from 'react';
import './AskLawyerChat.css';

const AskLawyerChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `lawyer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message
    setMessages([{
      role: 'assistant',
      content: '👋 Hello! I\'m your AI legal advisor. I can help answer your legal questions based on Indian law and legal principles. How can I assist you today?',
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
          sources: data.sources,
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
        content: '❌ Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
        content: '👋 Conversation cleared. How can I help you today?',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  };

  const exampleQuestions = [
    "What are the key elements of a valid contract in India?",
    "What is the difference between a lease and leave & license agreement?",
    "What are my rights as a tenant under Indian law?",
    "What are the legal requirements for an employment contract?",
    "What is consideration in contract law?"
  ];

  return (
    <div className="ask-lawyer-container">
      <div className="ask-lawyer-header">
        <div className="header-content">
          <div className="header-icon">⚖️</div>
          <div>
            <h2>Ask a Lawyer</h2>
            <p>Get expert legal guidance powered by AI</p>
          </div>
        </div>
        <button className="clear-btn" onClick={clearConversation}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Clear
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role} ${message.isError ? 'error' : ''}`}>
            <div className="message-avatar">
              {message.role === 'user' ? '👤' : '⚖️'}
            </div>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              {message.sources && message.sources.length > 0 && (
                <div className="message-sources">
                  <div className="sources-header">📚 Legal References:</div>
                  {message.sources.map((source, idx) => (
                    <div key={idx} className="source-item">
                      <span className="source-badge">Source {idx + 1}</span>
                      <span className="source-score">Relevance: {(source.score * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-avatar">⚖️</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="example-questions">
          <p className="example-title">💡 Try asking:</p>
          <div className="example-grid">
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                className="example-question"
                onClick={() => setInputMessage(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-input-container">
        <div className="disclaimer">
          ⚠️ This is AI-generated legal information. Always consult a licensed attorney for specific legal advice.
        </div>
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            placeholder="Ask your legal question here..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            rows={3}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AskLawyerChat;
