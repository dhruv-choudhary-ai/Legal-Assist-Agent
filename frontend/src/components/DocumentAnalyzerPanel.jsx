import React, { useState, useRef } from 'react';
import './DocumentAnalyzerPanel.css';

const DocumentAnalyzerPanel = () => {
  const [docId, setDocId] = useState(null);
  const [filename, setFilename] = useState('');
  const [totalChunks, setTotalChunks] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/quick-actions/document-analyzer/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setDocId(data.doc_id);
        setFilename(data.filename);
        setTotalChunks(data.total_chunks);
        setQuestions([{
          type: 'system',
          text: `✅ ${data.message}`,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!currentQuestion.trim() || !docId || isQuerying) return;

    const userQuestion = {
      type: 'user',
      text: currentQuestion,
      timestamp: new Date()
    };

    setQuestions(prev => [...prev, userQuestion]);
    setCurrentQuestion('');
    setIsQuerying(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/quick-actions/document-analyzer/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doc_id: docId,
          question: userQuestion.text
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantAnswer = {
          type: 'assistant',
          text: data.answer,
          sources: data.sources,
          chunks_used: data.chunks_used,
          timestamp: new Date()
        };
        setQuestions(prev => [...prev, assistantAnswer]);
      } else {
        throw new Error(data.error || 'Query failed');
      }
    } catch (error) {
      console.error('Query error:', error);
      const errorMsg = {
        type: 'error',
        text: '❌ Failed to process your question. Please try again.',
        timestamp: new Date()
      };
      setQuestions(prev => [...prev, errorMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  const resetAnalyzer = () => {
    setDocId(null);
    setFilename('');
    setTotalChunks(0);
    setQuestions([]);
    setCurrentQuestion('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const suggestedQuestions = [
    "What is the main purpose of this document?",
    "What are the key obligations mentioned?",
    "Are there any payment terms specified?",
    "What are the termination conditions?",
    "Summarize the liability clauses"
  ];

  return (
    <div className="doc-analyzer-container">
      <div className="doc-analyzer-header">
        <div className="header-content">
          <div className="header-icon">🔍</div>
          <div>
            <h2>Document Analyzer</h2>
            <p>Upload and analyze legal documents with AI</p>
          </div>
        </div>
        {docId && (
          <button className="reset-btn" onClick={resetAnalyzer}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Document
          </button>
        )}
      </div>

      {!docId ? (
        <div className="upload-section">
          <div className="upload-card">
            <div className="upload-icon">📄</div>
            <h3>Upload Your Document</h3>
            <p>Upload a PDF or DOCX file to analyze</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
            <button
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <span className="spinner"></span>
                  Uploading & Processing...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10l5-5m0 0l5 5m-5-5v12M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Choose Document
                </>
              )}
            </button>
            <div className="supported-formats">
              Supported formats: PDF, DOCX
            </div>
          </div>
        </div>
      ) : (
        <div className="analysis-section">
          <div className="document-info">
            <div className="info-item">
              <span className="info-label">Document:</span>
              <span className="info-value">{filename}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Chunks:</span>
              <span className="info-value">{totalChunks}</span>
            </div>
            <div className="info-badge">✅ Ready for Analysis</div>
          </div>

          <div className="questions-section">
            {questions.map((q, index) => (
              <div key={index} className={`question-item ${q.type}`}>
                {q.type === 'user' && (
                  <div className="question-user">
                    <div className="question-avatar">👤</div>
                    <div className="question-content">
                      <div className="question-text">{q.text}</div>
                      <div className="question-time">{q.timestamp.toLocaleTimeString()}</div>
                    </div>
                  </div>
                )}
                {q.type === 'assistant' && (
                  <div className="question-assistant">
                    <div className="question-avatar">🤖</div>
                    <div className="question-content">
                      <div className="question-text">{q.text}</div>
                      {q.sources && q.sources.length > 0 && (
                        <div className="question-sources">
                          <div className="sources-label">📍 Sources from document:</div>
                          {q.sources.map((source, idx) => (
                            <div key={idx} className="source-chip">
                              Chunk {source.chunk_id} (Similarity: {(source.similarity * 100).toFixed(1)}%)
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="question-time">{q.timestamp.toLocaleTimeString()}</div>
                    </div>
                  </div>
                )}
                {q.type === 'system' && (
                  <div className="question-system">{q.text}</div>
                )}
                {q.type === 'error' && (
                  <div className="question-error">{q.text}</div>
                )}
              </div>
            ))}
            {isQuerying && (
              <div className="question-item assistant">
                <div className="question-assistant">
                  <div className="question-avatar">🤖</div>
                  <div className="question-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {questions.length === 1 && (
            <div className="suggested-questions">
              <p className="suggested-title">💡 Suggested questions:</p>
              <div className="suggested-grid">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="suggested-btn"
                    onClick={() => setCurrentQuestion(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="input-section">
            <div className="input-wrapper">
              <input
                type="text"
                className="question-input"
                placeholder="Ask a question about this document..."
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                disabled={isQuerying}
              />
              <button
                className="ask-btn"
                onClick={handleAskQuestion}
                disabled={!currentQuestion.trim() || isQuerying}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentAnalyzerPanel;
