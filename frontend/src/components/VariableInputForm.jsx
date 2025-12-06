import React, { useState, useEffect } from 'react';
import './VariableInputForm.css';

const VariableInputForm = ({ template, onComplete, onBack }) => {
  const [variables, setVariables] = useState({});
  const [extracted, setExtracted] = useState({});
  const [loading, setLoading] = useState(false);
  const [nlInput, setNlInput] = useState('');
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState('describe'); // describe or fill

  // Extract variables from natural language
  const handleExtractVariables = async () => {
    if (!nlInput.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/variables/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          description: nlInput
        })
      });

      const data = await response.json();
      if (data.success) {
        const extractedVars = {};
        Object.entries(data.extracted_variables).forEach(([key, info]) => {
          extractedVars[key] = info.value;
        });
        setExtracted(extractedVars);
        setVariables(extractedVars);
        setCurrentStep('fill');
      }
    } catch (error) {
      console.error('Extraction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVariableChange = (varName, value) => {
    setVariables(prev => ({ ...prev, [varName]: value }));
    // Clear error when user starts typing
    if (errors[varName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[varName];
        return newErrors;
      });
    }
  };

  const validateVariables = () => {
    const newErrors = {};
    
    if (!template.variables) return true;

    Object.entries(template.variables).forEach(([varName, varInfo]) => {
      if (varInfo.required && !variables[varName]?.trim()) {
        newErrors[varName] = 'This field is required';
      } else if (variables[varName]) {
        // Type-specific validation
        if (varInfo.type === 'email' && !isValidEmail(variables[varName])) {
          newErrors[varName] = 'Invalid email format';
        } else if (varInfo.type === 'phone' && !isValidPhone(variables[varName])) {
          newErrors[varName] = 'Invalid phone number';
        } else if (varInfo.type === 'date' && !isValidDate(variables[varName])) {
          newErrors[varName] = 'Invalid date format (use YYYY-MM-DD)';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateVariables()) {
      onComplete(variables);
    }
  };

  // Validation helpers
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => /^[\d\s\-\+\(\)]+$/.test(phone);
  const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);

  return (
    <div className="variable-input-form">
      {currentStep === 'describe' ? (
        <div className="describe-stage">
          <div className="stage-header">
            <h2>📝 Describe Your Document</h2>
            <p>Tell us about your document in plain English, and we'll extract the details automatically</p>
          </div>

          <div className="template-info">
            <div className="info-icon">📄</div>
            <div>
              <h3>{template.name}</h3>
              <p>{template.variable_count} fields required</p>
            </div>
          </div>

          <div className="nl-input-container">
            <label>Describe your document:</label>
            <textarea
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              placeholder={`Example: "Create ${template.name.toLowerCase()} between TechCorp India and John Doe, signed on January 15, 2025 in Mumbai..."`}
              rows={6}
              disabled={loading}
            />
            <div className="input-help">
              💡 Include: parties involved, dates, locations, amounts, and any specific terms
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-secondary" onClick={onBack}>
              ← Back to Templates
            </button>
            <button 
              className="btn-primary" 
              onClick={handleExtractVariables}
              disabled={!nlInput.trim() || loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Extracting...
                </>
              ) : (
                <>
                  Extract Variables ✨
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="fill-stage">
          <div className="stage-header">
            <h2>✏️ Review & Complete</h2>
            <p>We've extracted the following information. Please review and fill any missing fields.</p>
          </div>

          <div className="extraction-summary">
            <div className="summary-icon">✅</div>
            <div>
              <strong>Extracted {Object.keys(extracted).length} of {template.variable_count} fields</strong>
              <p>Please review and complete the remaining information below</p>
            </div>
          </div>

          <div className="variables-grid">
            {template.variables && Object.entries(template.variables).map(([varName, varInfo]) => (
              <VariableInput
                key={varName}
                varName={varName}
                varInfo={varInfo}
                value={variables[varName] || ''}
                onChange={(value) => handleVariableChange(varName, value)}
                error={errors[varName]}
                wasExtracted={!!extracted[varName]}
              />
            ))}
          </div>

          <div className="action-buttons">
            <button className="btn-secondary" onClick={() => setCurrentStep('describe')}>
              ← Back to Description
            </button>
            <button className="btn-primary" onClick={handleSubmit}>
              Generate Document 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const VariableInput = ({ varName, varInfo, value, onChange, error, wasExtracted }) => {
  const getInputType = () => {
    switch (varInfo.type) {
      case 'date': return 'date';
      case 'email': return 'email';
      case 'phone': return 'tel';
      case 'currency': return 'text';
      default: return 'text';
    }
  };

  const formatLabel = (name) => {
    return name.replace(/_/g, ' ')
               .toLowerCase()
               .split(' ')
               .map(word => word.charAt(0).toUpperCase() + word.slice(1))
               .join(' ');
  };

  return (
    <div className={`variable-input ${error ? 'has-error' : ''} ${wasExtracted ? 'extracted' : ''}`}>
      <label>
        {formatLabel(varName)}
        {varInfo.required && <span className="required">*</span>}
        {wasExtracted && <span className="extracted-badge">✨ Auto-filled</span>}
      </label>
      
      {varInfo.type === 'text' && varName.includes('DESCRIPTION') || varName.includes('PURPOSE') ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={varInfo.example || `Enter ${formatLabel(varName).toLowerCase()}...`}
          rows={3}
        />
      ) : (
        <input
          type={getInputType()}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={varInfo.example || `Enter ${formatLabel(varName).toLowerCase()}...`}
        />
      )}

      {error && <span className="error-message">{error}</span>}
      {varInfo.description && !error && (
        <span className="help-text">{varInfo.description}</span>
      )}
    </div>
  );
};

export default VariableInputForm;
