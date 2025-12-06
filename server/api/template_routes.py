"""
Template Assembly API Routes
Adds endpoints for template-based document assembly
NOTE: These routes use the legacy template_manager for backward compatibility
"""

from flask import Blueprint, jsonify, request, send_file
from ai.template_manager_legacy import template_manager
from ai.variable_extractor import variable_extractor
from ai.document_assembler import document_assembler
from pathlib import Path
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

# Create Blueprint
template_api = Blueprint('template_api', __name__)

# Output directory for generated documents
OUTPUT_DIR = Path("./generated_documents")
OUTPUT_DIR.mkdir(exist_ok=True)


@template_api.route('/api/templates/list', methods=['GET'])
def list_templates():
    """
    List all available templates
    
    Query params:
        category (optional): Filter by category
    
    Returns:
        {
            "success": true,
            "templates": [
                {
                    "id": "employment/nda",
                    "name": "NDA",
                    "category": "employment",
                    "variable_count": 6,
                    "variables": ["PARTY_NAME_1", ...]
                }
            ],
            "categories": ["employment", "property", "corporate"]
        }
    """
    try:
        # Discover templates
        templates = template_manager.discover_templates()
        
        # Filter by category if requested
        category_filter = request.args.get('category')
        if category_filter:
            templates = {
                tid: info for tid, info in templates.items()
                if info['category'] == category_filter
            }
        
        # Get unique categories
        categories = sorted(list(set(t['category'] for t in templates.values())))
        
        return jsonify({
            'success': True,
            'templates': list(templates.values()),
            'categories': categories,
            'count': len(templates)
        })
    
    except Exception as e:
        logger.error(f"Failed to list templates: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@template_api.route('/api/templates/<path:template_id>/metadata', methods=['GET'])
def get_template_metadata(template_id):
    """
    Get detailed metadata for a specific template
    
    Args:
        template_id: Template identifier (e.g., "employment/nda")
    
    Returns:
        {
            "success": true,
            "template": {
                "id": "employment/nda",
                "name": "NDA",
                "category": "employment",
                "variable_count": 6,
                "variables": {
                    "PARTY_NAME_1": {
                        "name": "PARTY_NAME_1",
                        "display_name": "Party Name 1",
                        "type": "text",
                        "required": true,
                        "example": "John Doe"
                    },
                    ...
                }
            }
        }
    """
    try:
        metadata = template_manager.get_template_metadata(template_id)
        
        if not metadata:
            return jsonify({
                'success': False,
                'error': f'Template not found: {template_id}'
            }), 404
        
        return jsonify({
            'success': True,
            'template': metadata
        })
    
    except Exception as e:
        logger.error(f"Failed to get template metadata: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@template_api.route('/api/variables/extract', methods=['POST'])
def extract_variables():
    """
    Extract variables from user's natural language description
    
    Request body:
        {
            "description": "Create an NDA between...",
            "template_id": "employment/nda"
        }
    
    Returns:
        {
            "success": true,
            "extracted_variables": {
                "PARTY_NAME_1": {
                    "value": "TechCorp",
                    "confidence": "high",
                    "source": "extracted"
                }
            },
            "missing_variables": ["TERM_DURATION"],
            "prompt": "I need more information. What is the term duration?"
        }
    """
    try:
        data = request.json
        
        if not data or 'description' not in data or 'template_id' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: description, template_id'
            }), 400
        
        description = data['description']
        template_id = data['template_id']
        
        # Extract variables
        result = variable_extractor.extract_from_description(
            user_description=description,
            template_id=template_id
        )
        
        # Generate prompt for missing variables if any
        prompt = None
        if result['missing_variables']:
            first_missing = result['missing_variables'][0]
            prompt = variable_extractor.generate_missing_variable_prompt(
                variable_name=first_missing,
                template_id=template_id
            )
        
        return jsonify({
            'success': True,
            'extracted_variables': result['extracted_variables'],
            'missing_variables': result['missing_variables'],
            'prompt': prompt
        })
    
    except Exception as e:
        logger.error(f"Failed to extract variables: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@template_api.route('/api/variables/validate', methods=['POST'])
def validate_variable():
    """
    Validate a single variable value
    
    Request body:
        {
            "variable_name": "EMAIL_ADDRESS",
            "value": "test@example.com",
            "variable_type": "email"
        }
    
    Returns:
        {
            "success": true,
            "valid": true,
            "message": "Valid email address"
        }
    """
    try:
        data = request.json
        
        if not data or 'variable_name' not in data or 'value' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: variable_name, value'
            }), 400
        
        variable_name = data['variable_name']
        value = data['value']
        variable_type = data.get('variable_type', 'text')
        
        # Validate
        is_valid, message = variable_extractor.validate_variable(
            variable_name=variable_name,
            value=value,
            var_type=variable_type
        )
        
        return jsonify({
            'success': True,
            'valid': is_valid,
            'message': message
        })
    
    except Exception as e:
        logger.error(f"Failed to validate variable: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@template_api.route('/api/document/assemble', methods=['POST'])
def assemble_document():
    """
    Assemble document from template and variables
    
    Request body:
        {
            "template_id": "employment/nda",
            "variables": {
                "PARTY_NAME_1": "TechCorp",
                "PARTY_NAME_2": "John Doe",
                ...
            },
            "filename": "nda_techcorp_john.docx" (optional)
        }
    
    Returns:
        {
            "success": true,
            "document_id": "abc123...",
            "filename": "nda_techcorp_john.docx",
            "validation": {
                "is_complete": true,
                "missing_variables": [],
                "warnings": []
            },
            "download_url": "/api/document/download/abc123"
        }
    """
    try:
        data = request.json
        
        if not data or 'template_id' not in data or 'variables' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: template_id, variables'
            }), 400
        
        template_id = data['template_id']
        variables = data['variables']
        filename = data.get('filename')
        
        # Generate filename if not provided
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            template_name = template_id.replace('/', '_')
            filename = f"{template_name}_{timestamp}.docx"
        
        # Load template
        doc = template_manager.load_template(template_id)
        if not doc:
            return jsonify({
                'success': False,
                'error': f'Template not found: {template_id}'
            }), 404
        
        # Assemble document
        assembled_doc = document_assembler.assemble_document(doc, variables)
        
        # Validate
        validation = document_assembler.validate_assembly(assembled_doc)
        
        # Generate document ID
        document_id = str(uuid.uuid4())
        
        # Save document
        output_path = OUTPUT_DIR / f"{document_id}_{filename}"
        success = document_assembler.export_document(assembled_doc, str(output_path))
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to export document'
            }), 500
        
        return jsonify({
            'success': True,
            'document_id': document_id,
            'filename': filename,
            'validation': validation,
            'download_url': f'/api/document/download/{document_id}',
            'file_size': output_path.stat().st_size
        })
    
    except Exception as e:
        logger.error(f"Failed to assemble document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@template_api.route('/api/document/download/<document_id>', methods=['GET'])
def download_document(document_id):
    """
    Download assembled document
    
    Args:
        document_id: Document identifier
    
    Query params:
        filename (optional): Override download filename
    
    Returns:
        DOCX file
    """
    try:
        # Find document file
        matching_files = list(OUTPUT_DIR.glob(f"{document_id}_*"))
        
        if not matching_files:
            return jsonify({
                'success': False,
                'error': 'Document not found'
            }), 404
        
        document_path = matching_files[0]
        
        # Get filename
        download_filename = request.args.get('filename')
        if not download_filename:
            download_filename = document_path.name.split('_', 1)[1]  # Remove UUID prefix
        
        return send_file(
            document_path,
            as_attachment=True,
            download_name=download_filename,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    
    except Exception as e:
        logger.error(f"Failed to download document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@template_api.route('/api/document/preview/<document_id>', methods=['GET'])
def preview_document(document_id):
    """
    Get document preview/metadata
    
    Args:
        document_id: Document identifier
    
    Returns:
        {
            "success": true,
            "document_id": "abc123",
            "filename": "nda_techcorp_john.docx",
            "file_size": 38000,
            "created_at": "2025-10-30T12:00:00",
            "preview": "First 500 characters of text..."
        }
    """
    try:
        # Find document file
        matching_files = list(OUTPUT_DIR.glob(f"{document_id}_*"))
        
        if not matching_files:
            return jsonify({
                'success': False,
                'error': 'Document not found'
            }), 404
        
        document_path = matching_files[0]
        
        # Get file info
        stats = document_path.stat()
        filename = document_path.name.split('_', 1)[1]
        
        # Extract preview text
        try:
            from docx import Document
            doc = Document(document_path)
            preview_text = ' '.join([p.text for p in doc.paragraphs[:10]])[:500]
        except:
            preview_text = "Preview not available"
        
        return jsonify({
            'success': True,
            'document_id': document_id,
            'filename': filename,
            'file_size': stats.st_size,
            'created_at': datetime.fromtimestamp(stats.st_ctime).isoformat(),
            'preview': preview_text
        })
    
    except Exception as e:
        logger.error(f"Failed to preview document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
