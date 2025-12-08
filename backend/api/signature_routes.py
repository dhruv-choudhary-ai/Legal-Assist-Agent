"""
Digital Signature API Routes
Endpoints for Aadhaar-based e-Sign functionality
"""

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
import os
from pathlib import Path

from ai.signature.signature_manager import get_signature_manager
from ai.signature.esign_service import esign_service

logger = logging.getLogger(__name__)

# Create Blueprint
signature_api = Blueprint('signature_api', __name__, url_prefix='/api/signature')


def get_db_connection():
    """Get database connection (import from app.py)"""
    import psycopg2
    from dotenv import load_dotenv
    load_dotenv()
    
    return psycopg2.connect(
        database=os.getenv('DATABASE_NAME'),
        user=os.getenv('DATABASE_USER'),
        password=os.getenv('PASSWORD'),
        host=os.getenv('DATABASE_HOST'),
        port=os.getenv('DATABASE_PORT'),
        sslmode='require'
    )


@signature_api.route('/status', methods=['GET'])
@jwt_required()
def get_service_status():
    """
    Get e-Sign service status
    
    Returns service configuration and availability
    """
    try:
        return jsonify({
            'service': 'NSDL e-Sign',
            'status': 'active',
            'mode': 'demo' if esign_service.is_demo_mode else 'production',
            'configured': esign_service.is_configured(),
            'message': 'Demo mode active - use OTP 123456' if esign_service.is_demo_mode 
                      else 'Production mode - connected to NSDL'
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting service status: {str(e)}")
        return jsonify({'error': str(e)}), 500


@signature_api.route('/initiate', methods=['POST'])
@jwt_required()
def initiate_signature():
    """
    Initiate digital signature process
    
    Request Body:
    {
        "document_id": 123,
        "aadhaar_number": "234567890123",
        "signer_details": {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "+919876543210"
        }
    }
    
    Response:
    {
        "signature_id": 456,
        "transaction_id": "TXN_20251207_ABC123",
        "status": "otp_sent",
        "expires_at": "2025-12-07T14:30:00Z",
        "message": "OTP sent to Aadhaar-linked mobile",
        "masked_aadhaar": "XXXX-XXXX-0123",
        "demo_otp": "123456"  // Only in demo mode
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # Validate request
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        document_id = data.get('document_id')
        aadhaar_number = data.get('aadhaar_number')
        signer_details = data.get('signer_details', {})
        
        if not document_id:
            return jsonify({'error': 'document_id is required'}), 400
        if not aadhaar_number:
            return jsonify({'error': 'aadhaar_number is required'}), 400
        if not signer_details.get('name'):
            return jsonify({'error': 'signer_details.name is required'}), 400
        
        # Get client info
        ip_address = request.remote_addr
        device_info = {
            'user_agent': request.headers.get('User-Agent'),
            'platform': request.headers.get('Sec-Ch-Ua-Platform', 'unknown')
        }
        
        # Initialize signature
        conn = get_db_connection()
        sig_manager = get_signature_manager(conn)
        
        success, response = sig_manager.initiate_signature(
            document_id=document_id,
            user_id=user_id,
            aadhaar_number=aadhaar_number,
            signer_info=signer_details,
            ip_address=ip_address,
            device_info=device_info
        )
        
        conn.close()
        
        if success:
            logger.info(f"✅ Signature initiated for user {user_id}, doc {document_id}")
            return jsonify(response), 200
        else:
            logger.warning(f"⚠️  Signature initiation failed: {response.get('error')}")
            return jsonify(response), 400
            
    except Exception as e:
        logger.error(f"❌ Error in initiate_signature: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@signature_api.route('/verify-otp', methods=['POST'])
@jwt_required()
def verify_otp():
    """
    Verify OTP for signature
    
    Request Body:
    {
        "signature_id": 456,
        "otp": "123456"
    }
    
    Response:
    {
        "verified": true,
        "signature_id": 456,
        "signer_name": "John Doe",
        "message": "OTP verified successfully. Ready to sign."
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        signature_id = data.get('signature_id')
        otp = data.get('otp')
        
        if not signature_id:
            return jsonify({'error': 'signature_id is required'}), 400
        if not otp:
            return jsonify({'error': 'otp is required'}), 400
        
        # Verify OTP
        conn = get_db_connection()
        sig_manager = get_signature_manager(conn)
        
        success, response = sig_manager.verify_otp(
            signature_id=signature_id,
            otp=otp,
            user_id=user_id,
            ip_address=request.remote_addr
        )
        
        conn.close()
        
        if success:
            logger.info(f"✅ OTP verified for signature {signature_id}")
            return jsonify(response), 200
        else:
            logger.warning(f"⚠️  OTP verification failed: {response.get('error')}")
            return jsonify(response), 400
            
    except Exception as e:
        logger.error(f"❌ Error in verify_otp: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@signature_api.route('/apply', methods=['POST'])
@jwt_required()
def apply_signature():
    """
    Apply digital signature to document
    
    Request Body:
    {
        "signature_id": 456
    }
    
    Response:
    {
        "signed": true,
        "signature_id": 456,
        "signed_document_url": "/api/signature/download/456",
        "certificate_id": "CERT123",
        "signed_at": "2025-12-07T14:15:00Z",
        "signer_name": "John Doe"
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        signature_id = data.get('signature_id')
        
        if not signature_id:
            return jsonify({'error': 'signature_id is required'}), 400
        
        # Apply signature
        conn = get_db_connection()
        sig_manager = get_signature_manager(conn)
        
        success, response = sig_manager.apply_signature(
            signature_id=signature_id,
            user_id=user_id,
            ip_address=request.remote_addr
        )
        
        conn.close()
        
        if success:
            logger.info(f"✅ Signature applied for signature {signature_id}")
            return jsonify(response), 200
        else:
            logger.warning(f"⚠️  Signature application failed: {response.get('error')}")
            return jsonify(response), 400
            
    except Exception as e:
        logger.error(f"❌ Error in apply_signature: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@signature_api.route('/status/<int:signature_id>', methods=['GET'])
@jwt_required()
def get_signature_status(signature_id):
    """
    Get status of signature request
    
    Response:
    {
        "signature_id": 456,
        "document_id": 123,
        "signature_status": "signed",
        "created_at": "2025-12-07T14:00:00Z",
        "signed_at": "2025-12-07T14:15:00Z",
        "expires_at": "2025-12-07T14:30:00Z",
        "is_demo_mode": false
    }
    """
    try:
        user_id = int(get_jwt_identity())
        
        conn = get_db_connection()
        sig_manager = get_signature_manager(conn)
        
        status = sig_manager.get_signature_status(signature_id, user_id)
        conn.close()
        
        if status:
            # Convert datetime objects to ISO format
            for key in ['created_at', 'signed_at', 'expires_at']:
                if status.get(key):
                    status[key] = status[key].isoformat()
            
            return jsonify(status), 200
        else:
            return jsonify({'error': 'Signature not found'}), 404
            
    except Exception as e:
        logger.error(f"❌ Error getting signature status: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@signature_api.route('/download/<int:signature_id>', methods=['GET'])
@jwt_required()
def download_signed_document(signature_id):
    """
    Download signed document
    
    Returns PDF file
    """
    try:
        user_id = int(get_jwt_identity())
        
        conn = get_db_connection()
        sig_manager = get_signature_manager(conn)
        
        status = sig_manager.get_signature_status(signature_id, user_id)
        conn.close()
        
        if not status:
            return jsonify({'error': 'Signature not found'}), 404
        
        if status['signature_status'] != 'signed':
            return jsonify({'error': 'Document not signed yet'}), 400
        
        signed_doc_url = status.get('signed_document_url')
        if not signed_doc_url or not os.path.exists(signed_doc_url):
            return jsonify({'error': 'Signed document not found'}), 404
        
        filename = f"signed_document_{signature_id}.pdf"
        
        return send_file(
            signed_doc_url,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        logger.error(f"❌ Error downloading signed document: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@signature_api.route('/history/<int:document_id>', methods=['GET'])
@jwt_required()
def get_signature_history(document_id):
    """
    Get signature history for a document
    
    Response:
    {
        "signatures": [
            {
                "signature_id": 456,
                "signer_name": "John Doe",
                "signed_at": "2025-12-07T14:15:00Z",
                "status": "signed",
                "certificate_id": "CERT123"
            }
        ]
    }
    """
    try:
        user_id = int(get_jwt_identity())
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT ds.signature_id, ds.signature_status,
                   ds.created_at, ds.signed_at,
                   ds.signature_metadata
            FROM digital_signatures ds
            JOIN user_documents ud ON ds.document_id = ud.doc_id
            WHERE ds.document_id = %s AND ud.user_id = %s
            ORDER BY ds.created_at DESC
        """, (document_id, user_id))
        
        signatures = []
        for row in cur.fetchall():
            sig_id, status, created_at, signed_at, metadata = row
            
            import json
            metadata_dict = json.loads(metadata) if metadata else {}
            
            signatures.append({
                'signature_id': sig_id,
                'status': status,
                'signer_name': metadata_dict.get('signer_name', 'Unknown'),
                'created_at': created_at.isoformat() if created_at else None,
                'signed_at': signed_at.isoformat() if signed_at else None,
                'certificate_id': metadata_dict.get('certificate_id')
            })
        
        conn.close()
        
        return jsonify({'signatures': signatures}), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting signature history: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


# ========== WORKFLOW MANAGEMENT ENDPOINTS ==========

@signature_api.route('/workflow/create', methods=['POST'])
@jwt_required()
def create_workflow():
    """
    Create multi-party signature workflow
    
    Request:
    {
        "document_id": 123,
        "signatories": [
            {
                "email": "signer1@example.com",
                "name": "John Doe",
                "phone": "+91XXXXXXXXXX",
                "role": "party_1"
            }
        ],
        "signing_order": "parallel",  // or "sequential"
        "reminder_enabled": true
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # Validate required fields
        if not data.get('document_id'):
            return jsonify({'error': 'document_id is required'}), 400
        if not data.get('signatories') or len(data.get('signatories', [])) == 0:
            return jsonify({'error': 'At least one signatory is required'}), 400
        
        conn = get_db_connection()
        manager = get_signature_manager(conn)
        
        success, result = manager.create_workflow(
            document_id=data['document_id'],
            user_id=user_id,
            signatories=data['signatories'],
            signing_order=data.get('signing_order', 'parallel'),
            reminder_enabled=data.get('reminder_enabled', True)
        )
        
        conn.close()
        
        if success:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"❌ Error creating workflow: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@signature_api.route('/workflow/<int:workflow_id>/status', methods=['GET'])
@jwt_required()
def get_workflow_status(workflow_id):
    """
    Get workflow status and progress
    
    Returns:
    {
        "workflow": {...},
        "signatories": [...],
        "progress": {
            "total": 5,
            "signed": 2,
            "pending": 3
        }
    }
    """
    try:
        conn = get_db_connection()
        manager = get_signature_manager(conn)
        
        success, result = manager.get_workflow_status(workflow_id)
        
        conn.close()
        
        if success:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"❌ Error getting workflow status: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@signature_api.route('/workflow/<int:workflow_id>/signatory', methods=['POST'])
@jwt_required()
def add_signatory(workflow_id):
    """
    Add signatory to workflow
    
    Request:
    {
        "email": "newsigner@example.com",
        "name": "Jane Smith",
        "phone": "+91XXXXXXXXXX",
        "role": "witness"
    }
    """
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('name'):
            return jsonify({'error': 'email and name are required'}), 400
        
        conn = get_db_connection()
        manager = get_signature_manager(conn)
        
        success, result = manager.add_signatory(workflow_id, data)
        
        conn.close()
        
        if success:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"❌ Error adding signatory: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@signature_api.route('/workflow/<int:workflow_id>/signatory/<int:signatory_id>', methods=['DELETE'])
@jwt_required()
def remove_signatory(workflow_id, signatory_id):
    """
    Remove signatory from workflow
    """
    try:
        conn = get_db_connection()
        manager = get_signature_manager(conn)
        
        success, result = manager.remove_signatory(workflow_id, signatory_id)
        
        conn.close()
        
        if success:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"❌ Error removing signatory: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@signature_api.route('/workflow/<int:workflow_id>/request/<int:signatory_id>', methods=['POST'])
@jwt_required()
def send_signature_request(workflow_id, signatory_id):
    """
    Send signature request to specific signatory
    """
    try:
        from ai.signature.notification_service import NotificationService
        
        conn = get_db_connection()
        manager = get_signature_manager(conn)
        notification_service = NotificationService()
        
        success, result = manager.send_signature_request(
            workflow_id, 
            signatory_id,
            notification_service
        )
        
        conn.close()
        
        if success:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"❌ Error sending signature request: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@signature_api.route('/workflow/<int:workflow_id>/reminders', methods=['POST'])
@jwt_required()
def send_reminders(workflow_id):
    """
    Send reminders to all pending signatories
    
    Returns:
    {
        "reminded_count": 3
    }
    """
    try:
        from ai.signature.notification_service import NotificationService
        
        conn = get_db_connection()
        manager = get_signature_manager(conn)
        notification_service = NotificationService()
        
        success, result = manager.send_reminders(workflow_id, notification_service)
        
        conn.close()
        
        if success:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"❌ Error sending reminders: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@signature_api.route('/bulk/initiate', methods=['POST'])
@jwt_required()
def bulk_initiate():
    """
    Initiate signatures for multiple documents
    
    Request:
    {
        "document_ids": [123, 124, 125],
        "aadhaar_number": "XXXXXXXXXXXX",
        "signer_info": {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "+91XXXXXXXXXX"
        }
    }
    
    Returns:
    {
        "initiated": 3,
        "failed": 0,
        "results": [...]
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data.get('document_ids') or len(data.get('document_ids', [])) == 0:
            return jsonify({'error': 'document_ids array is required'}), 400
        
        conn = get_db_connection()
        manager = get_signature_manager(conn)
        
        common_config = {
            'aadhaar_number': data.get('aadhaar_number'),
            'signer_info': data.get('signer_info', {}),
            'ip_address': request.remote_addr
        }
        
        success, result = manager.bulk_initiate_signatures(
            document_ids=data['document_ids'],
            user_id=user_id,
            common_config=common_config
        )
        
        conn.close()
        
        return jsonify(result), 200
            
    except Exception as e:
        logger.error(f"❌ Error bulk initiating signatures: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@signature_api.route('/audit/<int:signature_id>', methods=['GET'])
@jwt_required()
def get_audit_trail(signature_id):
    """
    Get complete audit trail for a signature
    
    Returns:
    {
        "signature_id": 123,
        "audit_log": [
            {
                "event_type": "otp_requested",
                "timestamp": "2025-12-07T10:00:00Z",
                "ip_address": "192.168.1.1",
                "event_data": {...}
            }
        ]
    }
    """
    try:
        user_id = int(get_jwt_identity())
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Verify user owns this signature
        cur.execute("""
            SELECT ds.signature_id
            FROM digital_signatures ds
            JOIN user_documents ud ON ds.document_id = ud.doc_id
            WHERE ds.signature_id = %s AND ud.user_id = %s
        """, (signature_id, user_id))
        
        if not cur.fetchone():
            conn.close()
            return jsonify({'error': 'Signature not found'}), 404
        
        # Get audit trail
        cur.execute("""
            SELECT event_type, event_data, ip_address, 
                   user_agent, created_at
            FROM signature_audit_log
            WHERE signature_id = %s
            ORDER BY created_at ASC
        """, (signature_id,))
        
        audit_log = []
        for row in cur.fetchall():
            event_type, event_data, ip_address, user_agent, created_at = row
            
            import json
            audit_log.append({
                'event_type': event_type,
                'event_data': json.loads(event_data) if event_data else {},
                'ip_address': ip_address,
                'user_agent': user_agent,
                'timestamp': created_at.isoformat() if created_at else None
            })
        
        conn.close()
        
        return jsonify({
            'signature_id': signature_id,
            'audit_log': audit_log
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting audit trail: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@signature_api.route('/verify', methods=['POST'])
def verify_signature():
    """
    Verify a signed document's authenticity
    
    Accepts uploaded document and optional QR code data
    Returns verification result
    
    Form Data:
        - file: Signed PDF document
        - qr_data: Optional JSON string from QR code scan
    
    Response:
    {
        "valid": true,
        "message": "Document signature verified successfully",
        "details": {
            "signer_name": "John Doe",
            "signed_at": "2025-12-07T14:30:00Z",
            "certificate_id": "CERT2025120714300000042",
            "transaction_id": "TXN_20251207_ABC123",
            "document_name": "Contract Agreement"
        }
    }
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No document file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
        
        # Save uploaded file temporarily
        upload_dir = 'temp_uploads'
        os.makedirs(upload_dir, exist_ok=True)
        
        import uuid
        temp_filename = f"verify_{uuid.uuid4().hex}.pdf"
        temp_path = os.path.join(upload_dir, temp_filename)
        file.save(temp_path)
        
        try:
            # Get optional QR data
            qr_data_str = request.form.get('qr_data')
            certificate_data = None
            
            if qr_data_str:
                import json
                certificate_data = json.loads(qr_data_str)
            
            # Verify document
            conn = get_db_connection()
            sig_manager = get_signature_manager(conn)
            
            success, verification_result = sig_manager.verify_signed_document(
                document_file_path=temp_path,
                certificate_data=certificate_data
            )
            
            conn.close()
            
            if success:
                return jsonify(verification_result), 200
            else:
                return jsonify({'error': verification_result.get('error', 'Verification failed')}), 400
                
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
    except Exception as e:
        logger.error(f"❌ Error verifying signature: {str(e)}")
        return jsonify({'error': f'Verification failed: {str(e)}'}), 500


@signature_api.route('/certificate/<certificate_id>', methods=['GET'])
def get_certificate_info(certificate_id):
    """
    Get certificate information by ID (from QR code)
    
    Response:
    {
        "certificate_id": "CERT2025120714300000042",
        "signature_id": 42,
        "transaction_id": "TXN_20251207_ABC123",
        "document_name": "Contract Agreement",
        "signer_name": "John Doe",
        "signed_at": "2025-12-07T14:30:00Z",
        "document_hash": "abc123..."
    }
    """
    try:
        conn = get_db_connection()
        sig_manager = get_signature_manager(conn)
        
        cert_data = sig_manager.get_certificate_by_id(certificate_id)
        conn.close()
        
        if cert_data:
            return jsonify({
                'certificate_id': certificate_id,
                **cert_data
            }), 200
        else:
            return jsonify({'error': 'Certificate not found'}), 404
        
    except Exception as e:
        logger.error(f"❌ Error getting certificate: {str(e)}")
        return jsonify({'error': str(e)}), 500


@signature_api.route('/certificate/download/<int:signature_id>', methods=['GET'])
@jwt_required()
def download_certificate(signature_id):
    """
    Download digital certificate PDF
    
    Response:
        PDF file download
    """
    try:
        user_id = int(get_jwt_identity())
        
        conn = get_db_connection()
        sig_manager = get_signature_manager(conn)
        
        # Check ownership
        import psycopg2.extras
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT signature_certificate_url
            FROM digital_signatures
            WHERE signature_id = %s AND user_id = %s
        """, (signature_id, user_id))
        
        result = cur.fetchone()
        
        if not result:
            conn.close()
            return jsonify({'error': 'Certificate not found'}), 404
        
        cert_url = result['signature_certificate_url']
        
        # If no certificate yet, generate it
        if not cert_url:
            success, cert_path = sig_manager.generate_certificate(signature_id)
            if not success:
                conn.close()
                return jsonify({'error': cert_path}), 500
        else:
            # Extract path from URL
            cert_path = os.path.join('generated_documents', cert_url.lstrip('/'))
        
        conn.close()
        
        if os.path.exists(cert_path):
            return send_file(
                cert_path,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f'certificate_{signature_id}.pdf'
            )
        else:
            return jsonify({'error': 'Certificate file not found'}), 404
        
    except Exception as e:
        logger.error(f"❌ Error downloading certificate: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Error handlers
@signature_api.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@signature_api.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
