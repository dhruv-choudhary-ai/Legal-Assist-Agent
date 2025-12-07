import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiTrash2, FiEye, FiPlus, FiFileText } from 'react-icons/fi';
import TemplateUploader from './TemplateUploader';

const TemplateManager = () => {
  const [userTemplates, setUserTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Fetch user templates
  const fetchUserTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/template/user-templates');
      const data = await response.json();

      if (data.success) {
        setUserTemplates(data.templates);
      } else {
        toast.error('Failed to load templates');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTemplates();
  }, []);

  // Delete template
  const handleDelete = async (templateName) => {
    if (!window.confirm(`Are you sure you want to delete "${templateName}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/template/delete/${encodeURIComponent(templateName)}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`Template "${templateName}" deleted`);
        fetchUserTemplates(); // Refresh list
      } else {
        toast.error(data.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete template');
    }
  };

  // Callback when new template is uploaded
  const handleTemplateSaved = () => {
    setShowUploader(false);
    fetchUserTemplates(); // Refresh list
  };

  if (showUploader) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setShowUploader(false)}
            className="mb-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            ← Back to Templates
          </button>
          <TemplateUploader onTemplateSaved={handleTemplateSaved} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 pt-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              My Templates
            </h1>
            <p className="text-gray-600">
              Manage your custom document templates
            </p>
          </div>
          <button
            onClick={() => setShowUploader(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 shadow-lg"
          >
            <FiPlus />
            <span>Upload New Template</span>
          </button>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl text-blue-500 mb-4">⏳</div>
            <p className="text-gray-600">Loading templates...</p>
          </div>
        ) : userTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <FiFileText className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              No Templates Yet
            </h2>
            <p className="text-gray-500 mb-6">
              Upload your first template to get started
            </p>
            <button
              onClick={() => setShowUploader(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Upload Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userTemplates.map((template, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                {/* Template Icon */}
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <FiFileText className="text-3xl text-blue-500" />
                </div>

                {/* Template Info */}
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {template.description || 'No description'}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                    {template.category}
                  </span>
                  <span className="text-gray-600">
                    {template.field_count} fields
                  </span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1"
                    title="View Details"
                  >
                    <FiEye />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDelete(template.name)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                    title="Delete Template"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Template Detail Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedTemplate.name}
                  </h2>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Category</label>
                    <p className="text-gray-600">{selectedTemplate.category}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Description</label>
                    <p className="text-gray-600">{selectedTemplate.description}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Number of Fields</label>
                    <p className="text-gray-600">{selectedTemplate.field_count}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManager;
