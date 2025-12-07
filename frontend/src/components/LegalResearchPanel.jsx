import React, { useState } from 'react';
import './LegalResearchPanel.css';

const LegalResearchPanel = () => {
  const [topic, setTopic] = useState('');
  const [jurisdiction, setJurisdiction] = useState('India');
  const [depth, setDepth] = useState('moderate');
  const [result, setResult] = useState(null);
  const [isResearching, setIsResearching] = useState(false);

  const jurisdictions = [
    'India',
    'Delhi',
    'Mumbai',
    'Karnataka',
    'Maharashtra',
    'Tamil Nadu',
    'Gujarat',
    'West Bengal'
  ];

  const depthLevels = [
    { value: 'brief', label: 'Brief Overview', icon: '📄', desc: 'Quick summary' },
    { value: 'moderate', label: 'Detailed Analysis', icon: '📚', desc: 'Comprehensive research' },
    { value: 'comprehensive', label: 'In-Depth Study', icon: '🔬', desc: 'Extensive analysis' }
  ];

  const popularTopics = [
    "Right to Privacy under Indian Constitution",
    "Consumer Protection Act 2019",
    "Digital Signature validity in India",
    "Force Majeure clauses in Indian contracts",
    "Employment termination laws in India",
    "Intellectual Property Rights enforcement",
    "Data Protection under IT Act 2000",
    "Contract Act 1872 - Essential elements"
  ];

  const handleResearch = async () => {
    if (!topic.trim()) return;

    setIsResearching(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/quick-actions/legal-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          jurisdiction: jurisdiction,
          depth: depth
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        throw new Error(data.error || 'Research failed');
      }
    } catch (error) {
      console.error('Research error:', error);
      alert('Failed to complete research. Please try again.');
    } finally {
      setIsResearching(false);
    }
  };

  const resetResearch = () => {
    setResult(null);
    setTopic('');
  };

  return (
    <div className="legal-research-container">
      <div className="legal-research-header">
        <div className="header-content">
          <div className="header-icon">🔬</div>
          <div>
            <h2>Legal Research Assistant</h2>
            <p>AI-powered research on legal topics and case law</p>
          </div>
        </div>
        {result && (
          <button className="reset-btn" onClick={resetResearch}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Research
          </button>
        )}
      </div>

      {!result ? (
        <div className="research-section">
          <div className="research-form">
            <div className="form-group">
              <label>Research Topic</label>
              <textarea
                className="topic-input"
                placeholder="Enter the legal topic you want to research... (e.g., 'Consumer rights under Consumer Protection Act 2019')"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Jurisdiction</label>
                <select
                  className="jurisdiction-select"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                >
                  {jurisdictions.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Research Depth</label>
                <div className="depth-options">
                  {depthLevels.map((level) => (
                    <button
                      key={level.value}
                      className={`depth-btn ${depth === level.value ? 'active' : ''}`}
                      onClick={() => setDepth(level.value)}
                    >
                      <span className="depth-icon">{level.icon}</span>
                      <div className="depth-info">
                        <div className="depth-label">{level.label}</div>
                        <div className="depth-desc">{level.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              className="research-btn"
              onClick={handleResearch}
              disabled={!topic.trim() || isResearching}
            >
              {isResearching ? (
                <>
                  <span className="spinner"></span>
                  Researching...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Start Research
                </>
              )}
            </button>
          </div>

          <div className="popular-topics">
            <h3>🔥 Popular Research Topics</h3>
            <div className="topics-grid">
              {popularTopics.map((t, idx) => (
                <button
                  key={idx}
                  className="topic-btn"
                  onClick={() => setTopic(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="results-section">
          <div className="result-header">
            <div className="result-topic">
              <div className="topic-icon">🔬</div>
              <div>
                <h3>{result.topic}</h3>
                <div className="result-meta">
                  <span className="meta-item">📍 {result.jurisdiction}</span>
                  <span className="meta-item">📊 {depthLevels.find(d => d.value === result.depth)?.label}</span>
                  <span className="meta-item">📚 {result.sources_count} sources referenced</span>
                </div>
              </div>
            </div>
          </div>

          <div className="research-summary">
            <div className="summary-header">
              <h4>📋 Research Summary</h4>
            </div>
            <div className="summary-content">
              <pre>{result.research_summary}</pre>
            </div>
          </div>

          {result.sources && result.sources.length > 0 && (
            <div className="sources-section">
              <h4>📚 Legal References & Sources</h4>
              <div className="sources-list">
                {result.sources.map((source, idx) => (
                  <div key={idx} className="source-card">
                    <div className="source-header">
                      <div className="source-number">Source {idx + 1}</div>
                      <div className="source-score">
                        Relevance: {(source.score * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="source-content">
                      {source.content}
                    </div>
                    {source.metadata && source.metadata.source && (
                      <div className="source-footer">
                        📖 {source.metadata.source}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="disclaimer-box">
            <strong>⚠️ Research Disclaimer:</strong> This research is AI-generated based on available legal knowledge and should be used for informational purposes only. Always verify information with current laws and consult legal professionals for specific advice.
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalResearchPanel;
