import React, { useState, useEffect } from 'react';
import './TemplateBrowser.css';

const TemplateBrowser = ({ onTemplateSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/templates/list');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
        setCategories(['all', ...data.categories]);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  if (loading) {
    return (
      <div className="template-browser-loading">
        <div className="loading-spinner"></div>
        <p>Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="template-browser">
      <div className="template-browser-header">
        <div className="header-left">
          <h2>📄 Document Templates</h2>
          <p className="subtitle">Choose a template to get started</p>
        </div>
        
        <div className="header-right">
          <div className="view-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="4" width="18" height="3" rx="1"/>
                <rect x="3" y="10" width="18" height="3" rx="1"/>
                <rect x="3" y="16" width="18" height="3" rx="1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="template-filters">
        {categories.map(category => (
          <button
            key={category}
            className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category === 'all' ? '🗂️ All' : `📁 ${category.charAt(0).toUpperCase() + category.slice(1)}`}
            <span className="count">
              {category === 'all' ? templates.length : templates.filter(t => t.category === category).length}
            </span>
          </button>
        ))}
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="no-templates">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
          <h3>No templates found</h3>
          <p>Try selecting a different category</p>
        </div>
      ) : (
        <div className={`template-grid ${viewMode}`}>
          {filteredTemplates.map(template => (
            <TemplateCard 
              key={template.id}
              template={template}
              viewMode={viewMode}
              onSelect={() => onTemplateSelect(template)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TemplateCard = ({ template, viewMode, onSelect }) => {
  const getCategoryIcon = (category) => {
    const icons = {
      employment: '💼',
      property: '🏠',
      corporate: '🏢',
      contracts: '📝',
      agreements: '🤝'
    };
    return icons[category] || '📄';
  };

  const getCategoryColor = (category) => {
    const colors = {
      employment: '#3b82f6',
      property: '#10b981',
      corporate: '#8b5cf6',
      contracts: '#f59e0b',
      agreements: '#ec4899'
    };
    return colors[category] || '#6b7280';
  };

  return (
    <div className={`template-card ${viewMode}`} onClick={onSelect}>
      <div className="card-icon" style={{ backgroundColor: getCategoryColor(template.category) + '15' }}>
        <span style={{ color: getCategoryColor(template.category) }}>
          {getCategoryIcon(template.category)}
        </span>
      </div>
      
      <div className="card-content">
        <h3 className="card-title">{template.name}</h3>
        
        <div className="card-meta">
          <span className="category-badge" style={{ 
            backgroundColor: getCategoryColor(template.category) + '15',
            color: getCategoryColor(template.category)
          }}>
            {template.category}
          </span>
          <span className="variable-count">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h10"/>
            </svg>
            {template.variable_count} fields
          </span>
        </div>

        {viewMode === 'list' && template.variables && (
          <div className="card-variables">
            <span className="variables-label">Fields:</span>
            {template.variables.slice(0, 3).map((variable, index) => (
              <span key={index} className="variable-tag">
                {variable.replace(/_/g, ' ').toLowerCase()}
              </span>
            ))}
            {template.variable_count > 3 && (
              <span className="variable-tag more">+{template.variable_count - 3} more</span>
            )}
          </div>
        )}
      </div>

      <div className="card-action">
        <button className="select-btn">
          Select →
        </button>
      </div>
    </div>
  );
};

export default TemplateBrowser;
