import React, { useState, useEffect } from 'react';
import './SignatureWorkflow.css';

const SignatureWorkflow = ({ documentId, onClose }) => {
  const [workflowId, setWorkflowId] = useState(null);
  const [signatories, setSignatories] = useState([]);
  const [signingOrder, setSigningOrder] = useState('parallel');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('setup'); // setup, active, completed

  // Form state for adding signatory
  const [newSignatory, setNewSignatory] = useState({
    email: '',
    name: '',
    phone: '',
    role: 'signer'
  });

  const roles = [
    { value: 'party_1', label: 'Party 1' },
    { value: 'party_2', label: 'Party 2' },
    { value: 'witness', label: 'Witness' },
    { value: 'signer', label: 'Signer' },
    { value: 'notary', label: 'Notary' }
  ];

  // Add signatory to list
  const handleAddSignatory = () => {
    if (!newSignatory.email || !newSignatory.name) {
      setError('Email and name are required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSignatory.email)) {
      setError('Invalid email format');
      return;
    }

    // Check for duplicate email
    if (signatories.some(s => s.email === newSignatory.email)) {
      setError('Signatory with this email already exists');
      return;
    }

    setSignatories([...signatories, { ...newSignatory }]);
    setNewSignatory({ email: '', name: '', phone: '', role: 'signer' });
    setError(null);
  };

  // Remove signatory from list (before workflow creation)
  const handleRemoveSignatory = (email) => {
    setSignatories(signatories.filter(s => s.email !== email));
  };

  // Create workflow
  const handleCreateWorkflow = async () => {
    if (signatories.length === 0) {
      setError('Add at least one signatory');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/signature/workflow/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_id: documentId,
          signatories: signatories,
          signing_order: signingOrder,
          reminder_enabled: reminderEnabled
        })
      });

      const data = await response.json();

      if (response.ok) {
        setWorkflowId(data.workflow_id);
        setStep('active');
        loadWorkflowStatus(data.workflow_id);
      } else {
        setError(data.error || 'Failed to create workflow');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load workflow status
  const loadWorkflowStatus = async (wfId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/signature/workflow/${wfId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setWorkflowStatus(data);
        
        // Update signatories with latest status
        if (data.signatories) {
          setSignatories(data.signatories);
        }

        // Check if workflow is completed
        if (data.workflow.workflow_status === 'completed') {
          setStep('completed');
        }
      } else {
        setError(data.error || 'Failed to load workflow status');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  // Send signature request to specific signatory
  const handleSendRequest = async (signatoryId) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/signature/workflow/${workflowId}/request/${signatoryId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('Signature request sent successfully');
        loadWorkflowStatus(workflowId);
      } else {
        setError(data.error || 'Failed to send request');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Send reminders to all pending signatories
  const handleSendReminders = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/signature/workflow/${workflowId}/reminders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(`Reminders sent to ${data.reminded_count} signatories`);
        loadWorkflowStatus(workflowId);
      } else {
        setError(data.error || 'Failed to send reminders');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add signatory to existing workflow
  const handleAddToWorkflow = async () => {
    if (!newSignatory.email || !newSignatory.name) {
      setError('Email and name are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/signature/workflow/${workflowId}/signatory`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newSignatory)
        }
      );

      const data = await response.json();

      if (response.ok) {
        setNewSignatory({ email: '', name: '', phone: '', role: 'signer' });
        loadWorkflowStatus(workflowId);
      } else {
        setError(data.error || 'Failed to add signatory');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Remove signatory from active workflow
  const handleRemoveFromWorkflow = async (signatoryId) => {
    if (!window.confirm('Are you sure you want to remove this signatory?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/signature/workflow/${workflowId}/signatory/${signatoryId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        loadWorkflowStatus(workflowId);
      } else {
        setError(data.error || 'Failed to remove signatory');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh workflow status
  useEffect(() => {
    if (workflowId && step === 'active') {
      const interval = setInterval(() => {
        loadWorkflowStatus(workflowId);
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
  }, [workflowId, step]);

  // Get status badge class
  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'status-pending',
      'notified': 'status-notified',
      'viewed': 'status-viewed',
      'signed': 'status-signed',
      'declined': 'status-declined',
      'expired': 'status-expired'
    };
    return badges[status] || 'status-default';
  };

  return (
    <div className="signature-workflow-container">
      <div className="workflow-header">
        <h2>
          {step === 'setup' && 'Multi-Party Signature Setup'}
          {step === 'active' && 'Active Workflow'}
          {step === 'completed' && 'Workflow Completed'}
        </h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* SETUP STEP */}
      {step === 'setup' && (
        <div className="workflow-setup">
          {/* Workflow Configuration */}
          <div className="config-section">
            <h3>Workflow Configuration</h3>
            
            <div className="form-group">
              <label>Signing Order</label>
              <select 
                value={signingOrder} 
                onChange={(e) => setSigningOrder(e.target.value)}
              >
                <option value="parallel">Parallel (any order)</option>
                <option value="sequential">Sequential (specific order)</option>
              </select>
              <small>
                {signingOrder === 'parallel' 
                  ? 'All signatories can sign at the same time'
                  : 'Signatories must sign in the order listed below'}
              </small>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                />
                Enable automatic reminders (every 24 hours)
              </label>
            </div>
          </div>

          {/* Add Signatories */}
          <div className="add-signatory-section">
            <h3>Add Signatories</h3>
            
            <div className="signatory-form">
              <input
                type="email"
                placeholder="Email *"
                value={newSignatory.email}
                onChange={(e) => setNewSignatory({...newSignatory, email: e.target.value})}
              />
              <input
                type="text"
                placeholder="Full Name *"
                value={newSignatory.name}
                onChange={(e) => setNewSignatory({...newSignatory, name: e.target.value})}
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={newSignatory.phone}
                onChange={(e) => setNewSignatory({...newSignatory, phone: e.target.value})}
              />
              <select
                value={newSignatory.role}
                onChange={(e) => setNewSignatory({...newSignatory, role: e.target.value})}
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              <button 
                className="add-btn" 
                onClick={handleAddSignatory}
                disabled={loading}
              >
                + Add
              </button>
            </div>

            {/* Signatories List */}
            {signatories.length > 0 && (
              <div className="signatories-list">
                <h4>Signatories ({signatories.length})</h4>
                {signatories.map((sig, index) => (
                  <div key={index} className="signatory-item">
                    <div className="signatory-info">
                      <span className="signatory-order">#{index + 1}</span>
                      <div className="signatory-details">
                        <strong>{sig.name}</strong>
                        <small>{sig.email}</small>
                        <span className="role-badge">{sig.role}</span>
                      </div>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveSignatory(sig.email)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Workflow Button */}
          <div className="workflow-actions">
            <button
              className="create-workflow-btn"
              onClick={handleCreateWorkflow}
              disabled={loading || signatories.length === 0}
            >
              {loading ? 'Creating Workflow...' : 'Create Workflow'}
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE STEP */}
      {step === 'active' && workflowStatus && (
        <div className="workflow-active">
          {/* Progress Summary */}
          <div className="progress-summary">
            <h3>Progress</h3>
            <div className="progress-stats">
              <div className="stat">
                <span className="stat-value">{workflowStatus.progress.total}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat signed">
                <span className="stat-value">{workflowStatus.progress.signed}</span>
                <span className="stat-label">Signed</span>
              </div>
              <div className="stat pending">
                <span className="stat-value">{workflowStatus.progress.pending}</span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{
                  width: `${(workflowStatus.progress.signed / workflowStatus.progress.total) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Workflow Info */}
          <div className="workflow-info">
            <div className="info-item">
              <strong>Workflow ID:</strong> {workflowId}
            </div>
            <div className="info-item">
              <strong>Signing Order:</strong> {workflowStatus.workflow.signing_order}
            </div>
            <div className="info-item">
              <strong>Status:</strong> 
              <span className={`status-badge ${workflowStatus.workflow.workflow_status}`}>
                {workflowStatus.workflow.workflow_status}
              </span>
            </div>
          </div>

          {/* Signatories Table */}
          <div className="signatories-table">
            <div className="table-header">
              <h3>Signatories</h3>
              <button 
                className="reminder-btn"
                onClick={handleSendReminders}
                disabled={loading}
              >
                📧 Send Reminders
              </button>
            </div>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Signed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {signatories.map((sig, index) => (
                  <tr key={sig.signatory_id || index}>
                    <td>{sig.signing_order || index + 1}</td>
                    <td>{sig.name}</td>
                    <td>{sig.email}</td>
                    <td><span className="role-badge">{sig.role}</span></td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(sig.status)}`}>
                        {sig.status}
                      </span>
                    </td>
                    <td>
                      {sig.signed_at 
                        ? new Date(sig.signed_at).toLocaleString()
                        : '-'}
                    </td>
                    <td>
                      {sig.status === 'pending' && (
                        <button
                          className="send-request-btn"
                          onClick={() => handleSendRequest(sig.signatory_id)}
                          disabled={loading}
                        >
                          📤 Send Request
                        </button>
                      )}
                      {sig.status !== 'signed' && (
                        <button
                          className="remove-btn-sm"
                          onClick={() => handleRemoveFromWorkflow(sig.signatory_id)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add More Signatories */}
          <div className="add-more-section">
            <h4>Add More Signatories</h4>
            <div className="signatory-form">
              <input
                type="email"
                placeholder="Email *"
                value={newSignatory.email}
                onChange={(e) => setNewSignatory({...newSignatory, email: e.target.value})}
              />
              <input
                type="text"
                placeholder="Full Name *"
                value={newSignatory.name}
                onChange={(e) => setNewSignatory({...newSignatory, name: e.target.value})}
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={newSignatory.phone}
                onChange={(e) => setNewSignatory({...newSignatory, phone: e.target.value})}
              />
              <select
                value={newSignatory.role}
                onChange={(e) => setNewSignatory({...newSignatory, role: e.target.value})}
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              <button 
                className="add-btn" 
                onClick={handleAddToWorkflow}
                disabled={loading}
              >
                + Add to Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED STEP */}
      {step === 'completed' && (
        <div className="workflow-completed">
          <div className="success-icon">✅</div>
          <h3>Workflow Completed!</h3>
          <p>All signatories have signed the document.</p>
          {workflowStatus && (
            <div className="completion-summary">
              <p>
                <strong>Total Signatories:</strong> {workflowStatus.progress.total}
              </p>
              <p>
                <strong>Completed At:</strong>{' '}
                {new Date(workflowStatus.workflow.completed_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SignatureWorkflow;
