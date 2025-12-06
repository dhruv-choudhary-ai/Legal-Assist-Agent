import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiUpload, FiEdit3, FiSave, FiRefreshCw, FiCheck } from 'react-icons/fi';

const TemplateUploader = ({ onTemplateSaved }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Edit Variables, 3: Save
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [variableMapping, setVariableMapping] = useState({});
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [loading, setLoading] = useState(false);

  // Step 1: Upload and Analyze
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Check for supported formats
    const supportedFormats = ['.docx', '.pdf', '.txt', '.rtf', '.odt'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!supportedFormats.includes(fileExt)) {
      toast.error(`Unsupported format. Please upload: ${supportedFormats.join(', ')}`);
      return;
    }

    setUploadedFile(file);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/template/upload-and-analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data);
        setVariableMapping(data.suggested_conversions || {});
        setTemplateName(file.name.replace(/\.(docx|pdf|txt|rtf|odt)$/i, ''));
        setStep(2);
        toast.success(`Found ${data.total_placeholders} placeholders in ${data.format.toUpperCase()}!`);
      } else {
        toast.error(data.error || 'Failed to analyze template');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload template');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Edit Variable Names
  const handleVariableChange = (placeholder, newName) => {
    setVariableMapping({
      ...variableMapping,
      [placeholder]: newName
    });
  };

  // Step 3: Convert and Save
  const handleConvertAndSave = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (Object.keys(variableMapping).length === 0) {
      toast.error('No variables mapped');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Convert template
      const convertResponse = await fetch('http://127.0.0.1:5000/api/template/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temp_path: analysis.temp_path,
          variable_mapping: variableMapping,
          template_name: templateName,
          category: category
        })
      });

      const convertData = await convertResponse.json();

      if (!convertData.success) {
        toast.error(convertData.error || 'Conversion failed');
        setLoading(false);
        return;
      }

      // Step 2: Save to library
      const saveResponse = await fetch('http://127.0.0.1:5000/api/template/save-to-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: convertData.metadata,
          output_path: convertData.output_path
        })
      });

      const saveData = await saveResponse.json();

      if (saveData.success) {
        toast.success(`Template "${templateName}" saved successfully! 🎉`);
        setStep(3);
        
        // Callback to parent
        if (onTemplateSaved) {
          onTemplateSaved(convertData.metadata);
        }
      } else {
        toast.error(saveData.error || 'Failed to save template');
      }

    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  // Reset to upload new template
  const handleReset = () => {
    setStep(1);
    setUploadedFile(null);
    setAnalysis(null);
    setVariableMapping({});
    setTemplateName('');
    setCategory('Custom');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[
            { num: 1, label: 'Upload', icon: FiUpload },
            { num: 2, label: 'Edit Variables', icon: FiEdit3 },
            { num: 3, label: 'Save', icon: FiSave }
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center space-x-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= s.num ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {step > s.num ? <FiCheck /> : <s.icon />}
                </div>
                <span className={`font-semibold ${step >= s.num ? 'text-green-600' : 'text-gray-500'}`}>
                  {s.label}
                </span>
              </div>
              {idx < 2 && (
                <div className={`w-16 h-1 ${step > s.num ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Upload Your Template</h2>
          <p className="text-gray-600 mb-6">
            Upload a template file with placeholders (like #1, ____, [NAME], etc.) <br />
            <strong>Supported formats:</strong> DOCX, PDF, TXT, RTF, ODT
          </p>

          <div className="border-4 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept=".docx,.pdf,.txt,.rtf,.odt"
              onChange={handleFileUpload}
              className="hidden"
              id="template-upload"
              disabled={loading}
            />
            <label
              htmlFor="template-upload"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <FiUpload className="text-6xl text-gray-400" />
              <span className="text-xl font-semibold text-gray-700">
                {loading ? 'Analyzing...' : 'Click to upload template file'}
              </span>
              {uploadedFile && (
                <span className="text-sm text-gray-500">{uploadedFile.name}</span>
              )}
            </label>
          </div>
        </div>
      )}

      {/* Step 2: Edit Variables */}
      {step === 2 && analysis && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Edit Variable Names</h2>
          <p className="text-gray-600 mb-6">
            Found {analysis.total_placeholders} placeholders. Review and customize variable names:
          </p>

          {/* Template Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="My Custom Template"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Custom">Custom</option>
                <option value="Employment">Employment</option>
                <option value="Property">Property</option>
                <option value="Corporate">Corporate</option>
                <option value="Legal Notice">Legal Notice</option>
              </select>
            </div>
          </div>

          {/* Variable Mapping Table */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Placeholder
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Context
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Variable Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(variableMapping).map(([placeholder, varName], idx) => (
                  <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm text-gray-800">
                      {placeholder}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {analysis.context[placeholder]?.substring(0, 50) || 'N/A'}...
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={varName}
                        onChange={(e) => handleVariableChange(placeholder, e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="variable_name"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex justify-between mt-6">
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleConvertAndSave}
              disabled={loading}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <FiRefreshCw className="animate-spin" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <FiSave />
                  <span>Convert & Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-green-500 text-6xl mb-4">
            <FiCheck className="mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Template Saved Successfully! 🎉</h2>
          <p className="text-gray-600 mb-6">
            Your template "{templateName}" is now available in the template library.
          </p>
          <div className="space-x-4">
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Upload Another Template
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateUploader;
