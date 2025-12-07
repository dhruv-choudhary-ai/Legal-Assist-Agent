import React, { useState } from 'react';
import './ClauseSearchPanel.css';

const ClauseSearchPanel = () => {
  const [query, setQuery] = useState('');
  const [clauseType, setClauseType] = useState('all');
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const clauseTypes = [
    { value: 'all', label: 'All Types', icon: '📚' },
    { value: 'indemnity', label: 'Indemnity', icon: '🛡️' },
    { value: 'termination', label: 'Termination', icon: '🚪' },
    { value: 'payment', label: 'Payment', icon: '💰' },
    { value: 'confidentiality', label: 'Confidentiality', icon: '🔒' },
    { value: 'liability', label: 'Liability', icon: '⚠️' },
    { value: 'warranty', label: 'Warranty', icon: '✅' },
    { value: 'dispute', label: 'Dispute Resolution', icon: '⚖️' },
    { value: 'intellectual_property', label: 'IP Rights', icon: '💡' }
  ];

  const exampleQueries = [
    "Limitation of liability clause for software services",
    "Non-compete clause for employees",
    "Confidentiality obligations for consultants",
    "Payment terms for monthly retainer",
    "Termination clause with 30 days notice"
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/quick-actions/clause-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          clause_type: clauseType,
          top_k: 5
        })
      });

      const data = await response.json();

      if (data.success) {
        setResults(data);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search clauses. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Clause copied to clipboard!');
  };

  return (
    <div className="clause-search-container">
      <div className="clause-search-header">
        <div className="header-content">
          <div className="header-icon">📚</div>
          <div>
            <h2>Clause Library Search</h2>
            <p>Find pre-vetted legal clauses for your documents</p>
          </div>
        </div>
      </div>

      <div className="search-section">
        <div className="clause-type-selector">
          <label>Filter by Clause Type:</label>
          <div className="type-pills">
            {clauseTypes.map((type) => (
              <button
                key={type.value}
                className={`type-pill ${clauseType === type.value ? 'active' : ''}`}
                onClick={() => setClauseType(type.value)}
              >
                <span className="pill-icon">{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="search-input-section">
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Describe the clause you need... (e.g., 'limitation of liability for software')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSearching}
            />
            <button
              className="search-btn"
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
            >
              {isSearching ? (
                <span className="spinner"></span>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              Search
            </button>
          </div>
        </div>

        {!results && (
          <div className="example-queries">
            <p className="example-title">💡 Try searching for:</p>
            <div className="example-list">
              {exampleQueries.map((example, idx) => (
                <button
                  key={idx}
                  className="example-btn"
                  onClick={() => setQuery(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {results && (
          <div className="results-section">
            <div className="results-header">
              <h3>Found {results.total_found} Clause{results.total_found !== 1 ? 's' : ''}</h3>
              <div className="results-meta">
                Query: "{results.query}" • Type: {clauseTypes.find(t => t.value === results.clause_type)?.label}
              </div>
            </div>

            <div className="clauses-list">
              {results.clauses.map((clause, index) => (
                <div key={index} className="clause-card">
                  <div className="clause-header">
                    <div className="clause-rank">#{clause.rank}</div>
                    <div className="clause-meta">
                      <div className="clause-type-badge">{clause.clause_type}</div>
                      <div className="relevance-score">
                        Relevance: {(clause.relevance_score * 100).toFixed(1)}%
                      </div>
                    </div>
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(clause.clause_text)}
                      title="Copy to clipboard"
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="clause-content">
                    <p>{clause.clause_text}</p>
                  </div>
                  <div className="clause-footer">
                    <span className="clause-source">📖 Source: {clause.source}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="new-search-btn" onClick={() => setResults(null)}>
              New Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClauseSearchPanel;
