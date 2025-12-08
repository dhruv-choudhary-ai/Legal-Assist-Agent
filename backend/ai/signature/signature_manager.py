"""
Signature Manager
Manages the complete digital signature workflow
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
import json

from .esign_service import esign_service
from .aadhaar_validator import AadhaarValidator
from .pdf_processor import PDFProcessor
from .certificate_generator import certificate_generator

logger = logging.getLogger(__name__)


class SignatureManager:
    """Manages digital signature workflows"""
    
    def __init__(self, db_connection):
        """
        Initialize signature manager
        
        Args:
            db_connection: PostgreSQL database connection
        """
        self.conn = db_connection
        self.validator = AadhaarValidator()
        self.pdf_processor = PDFProcessor()
    
    def initiate_signature(
        self,
        document_id: int,
        user_id: int,
        aadhaar_number: str,
        signer_info: Dict,
        ip_address: str = None,
        device_info: Dict = None
    ) -> Tuple[bool, Dict]:
        """
        Initiate digital signature process
        
        Args:
            document_id: ID of document to be signed
            user_id: ID of user initiating signature
            aadhaar_number: Aadhaar number of signer
            signer_info: Dict with name, email, phone
            ip_address: Client IP address
            device_info: Client device information
            
        Returns:
            Tuple of (success: bool, response: Dict)
        """
        try:
            # Validate Aadhaar number
            is_valid, message = self.validator.validate(aadhaar_number)
            if not is_valid:
                return False, {'error': message}
            
            # Get document path from database
            cur = self.conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                "SELECT doc_id, form_name, content FROM user_documents WHERE doc_id = %s",
                (document_id,)
            )
            document = cur.fetchone()
            
            if not document:
                return False, {'error': 'Document not found'}
            
            # Generate unique transaction ID
            transaction_id = self._generate_transaction_id()
            
            # Prepare document for signing (ensure it's PDF)
            # For now, assume document is stored as HTML content
            # In production, convert to PDF first
            document_path = self._get_or_create_pdf(document_id, document['content'])
            
            # Calculate document hash
            doc_hash = self.pdf_processor.calculate_hash(document_path)
            
            # Hash Aadhaar number (never store plain text)
            aadhaar_hash = hashlib.sha256(aadhaar_number.encode()).hexdigest()
            
            # Request OTP from NSDL e-Sign service
            success, otp_response = esign_service.request_otp(
                aadhaar_number=aadhaar_number,
                transaction_id=transaction_id,
                document_hash=doc_hash,
                signer_info=signer_info
            )
            
            if not success:
                return False, otp_response
            
            # Store signature request in database
            esign_request_id = otp_response.get('esign_request_id')
            expires_at = datetime.fromisoformat(otp_response.get('expires_at'))
            
            # Prepare metadata with signer info
            metadata = {
                'signer_name': signer_info.get('name'),
                'signer_email': signer_info.get('email'),
                'signer_phone': signer_info.get('phone')
            }
            
            cur.execute("""
                INSERT INTO digital_signatures (
                    document_id, user_id, aadhaar_number_hash,
                    signature_status, transaction_id, esign_request_id,
                    document_hash, ip_address, device_info,
                    otp_request_time, expires_at, is_demo_mode,
                    signature_metadata
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING signature_id
            """, (
                document_id, user_id, aadhaar_hash,
                'otp_sent', transaction_id, esign_request_id,
                doc_hash, ip_address, json.dumps(device_info) if device_info else None,
                datetime.now(), expires_at, esign_service.is_demo_mode,
                json.dumps(metadata)
            ))
            
            signature_id = cur.fetchone()['signature_id']
            self.conn.commit()
            
            # Log audit trail
            self._log_audit(
                signature_id=signature_id,
                event_type='otp_requested',
                event_data={'transaction_id': transaction_id},
                ip_address=ip_address,
                user_id=user_id
            )
            
            logger.info(f"✅ Signature initiated: ID {signature_id}, Transaction {transaction_id}")
            
            response = {
                'signature_id': signature_id,
                'transaction_id': transaction_id,
                'status': 'otp_sent',
                'expires_at': otp_response.get('expires_at'),
                'message': otp_response.get('message'),
                'masked_aadhaar': self.validator.mask_aadhaar(aadhaar_number)
            }
            
            # Include demo OTP if in demo mode
            if esign_service.is_demo_mode and 'demo_otp' in otp_response:
                response['demo_otp'] = otp_response['demo_otp']
                response['demo_mode'] = True
            
            return True, response
            
        except Exception as e:
            logger.error(f"❌ Error initiating signature: {str(e)}")
            if self.conn:
                self.conn.rollback()
            return False, {'error': f'Failed to initiate signature: {str(e)}'}
    
    def verify_otp(
        self,
        signature_id: int,
        otp: str,
        user_id: int,
        ip_address: str = None
    ) -> Tuple[bool, Dict]:
        """
        Verify OTP for signature
        
        Args:
            signature_id: Signature ID
            otp: 6-digit OTP
            user_id: User ID
            ip_address: Client IP
            
        Returns:
            Tuple of (success: bool, response: Dict)
        """
        try:
            cur = self.conn.cursor(cursor_factory=RealDictCursor)
            
            # Get signature details
            cur.execute("""
                SELECT signature_id, transaction_id, esign_request_id, 
                       signature_status, expires_at, retry_count
                FROM digital_signatures
                WHERE signature_id = %s AND user_id = %s
            """, (signature_id, user_id))
            
            signature = cur.fetchone()
            
            if not signature:
                return False, {'error': 'Signature request not found'}
            
            # Check if already verified
            if signature['signature_status'] == 'verified':
                return False, {'error': 'OTP already verified'}
            
            # Check if expired
            if datetime.now() > signature['expires_at']:
                cur.execute(
                    "UPDATE digital_signatures SET signature_status = 'expired' WHERE signature_id = %s",
                    (signature_id,)
                )
                self.conn.commit()
                return False, {'error': 'OTP expired'}
            
            # Check retry limit
            if signature['retry_count'] >= 3:
                return False, {'error': 'Maximum OTP retry attempts exceeded'}
            
            # Verify OTP with NSDL
            success, verify_response = esign_service.verify_otp(
                transaction_id=signature['transaction_id'],
                otp=otp,
                esign_request_id=signature['esign_request_id']
            )
            
            if success:
                # Update signature status
                cur.execute("""
                    UPDATE digital_signatures
                    SET signature_status = 'verified',
                        aadhaar_verified = TRUE,
                        otp_verified_time = %s,
                        signature_metadata = %s
                    WHERE signature_id = %s
                """, (
                    datetime.now(),
                    json.dumps(verify_response),
                    signature_id
                ))
                self.conn.commit()
                
                # Log audit
                self._log_audit(
                    signature_id=signature_id,
                    event_type='otp_verified',
                    event_data=verify_response,
                    ip_address=ip_address,
                    user_id=user_id
                )
                
                logger.info(f"✅ OTP verified for signature {signature_id}")
                
                return True, {
                    'verified': True,
                    'signature_id': signature_id,
                    'signer_name': verify_response.get('signer_name'),
                    'message': 'OTP verified successfully. Ready to sign.'
                }
            else:
                # Increment retry count
                cur.execute("""
                    UPDATE digital_signatures
                    SET retry_count = retry_count + 1,
                        error_message = %s
                    WHERE signature_id = %s
                """, (verify_response.get('error'), signature_id))
                self.conn.commit()
                
                # Log failed attempt
                self._log_audit(
                    signature_id=signature_id,
                    event_type='otp_verification_failed',
                    event_data=verify_response,
                    ip_address=ip_address,
                    user_id=user_id
                )
                
                return False, verify_response
            
        except Exception as e:
            logger.error(f"❌ Error verifying OTP: {str(e)}")
            if self.conn:
                self.conn.rollback()
            return False, {'error': f'OTP verification failed: {str(e)}'}
    
    def apply_signature(
        self,
        signature_id: int,
        user_id: int,
        ip_address: str = None
    ) -> Tuple[bool, Dict]:
        """
        Apply digital signature to document
        
        Args:
            signature_id: Signature ID
            user_id: User ID
            ip_address: Client IP
            
        Returns:
            Tuple of (success: bool, response: Dict)
        """
        try:
            cur = self.conn.cursor(cursor_factory=RealDictCursor)
            
            # Get signature details
            cur.execute("""
                SELECT s.signature_id, s.transaction_id, s.document_id,
                       s.signature_status, s.signature_metadata,
                       d.content, d.form_name
                FROM digital_signatures s
                JOIN user_documents d ON s.document_id = d.doc_id
                WHERE s.signature_id = %s AND s.user_id = %s
            """, (signature_id, user_id))
            
            signature = cur.fetchone()
            
            if not signature:
                return False, {'error': 'Signature request not found'}
            
            # Check if OTP is verified
            if signature['signature_status'] != 'verified':
                return False, {'error': 'OTP not verified. Please verify OTP first.'}
            
            # Get document path
            document_path = self._get_or_create_pdf(
                signature['document_id'],
                signature['content']
            )
            
            # Get verification token from metadata
            metadata = signature['signature_metadata']
            verification_token = metadata.get('verification_token')
            
            # Apply signature using NSDL
            success, sign_response = esign_service.apply_signature(
                transaction_id=signature['transaction_id'],
                verification_token=verification_token,
                document_path=document_path
            )
            
            if success:
                signed_doc_path = sign_response.get('signed_document_path')
                
                # Calculate hash of signed document
                signed_doc_hash = self.pdf_processor.calculate_hash(signed_doc_path)
                
                # Update signature record
                cur.execute("""
                    UPDATE digital_signatures
                    SET signature_status = 'signed',
                        signed_document_url = %s,
                        signed_document_hash = %s,
                        signature_certificate_url = %s,
                        signed_at = %s,
                        esign_response_data = %s
                    WHERE signature_id = %s
                """, (
                    signed_doc_path,
                    signed_doc_hash,
                    sign_response.get('certificate_url'),
                    datetime.now(),
                    json.dumps(sign_response),
                    signature_id
                ))
                self.conn.commit()
                
                # Log audit
                self._log_audit(
                    signature_id=signature_id,
                    event_type='document_signed',
                    event_data=sign_response,
                    ip_address=ip_address,
                    user_id=user_id
                )
                
                # Generate digital certificate with QR code
                try:
                    cert_success, cert_path = self.generate_certificate(signature_id)
                    if cert_success:
                        logger.info(f"✅ Certificate generated: {cert_path}")
                except Exception as cert_error:
                    logger.error(f"⚠️  Certificate generation failed: {str(cert_error)}")
                    # Don't fail the whole signature process if certificate fails
                
                logger.info(f"✅ Document signed successfully: Signature {signature_id}")
                
                return True, {
                    'signed': True,
                    'signature_id': signature_id,
                    'signed_document_url': f'/api/signature/download/{signature_id}',
                    'certificate_id': sign_response.get('certificate_id'),
                    'signed_at': sign_response.get('signature_timestamp'),
                    'signer_name': sign_response.get('signer_name')
                }
            else:
                # Update with error
                cur.execute("""
                    UPDATE digital_signatures
                    SET signature_status = 'failed',
                        error_message = %s
                    WHERE signature_id = %s
                """, (sign_response.get('error'), signature_id))
                self.conn.commit()
                
                # Log failure
                self._log_audit(
                    signature_id=signature_id,
                    event_type='signature_failed',
                    event_data=sign_response,
                    ip_address=ip_address,
                    user_id=user_id
                )
                
                return False, sign_response
            
        except Exception as e:
            logger.error(f"❌ Error applying signature: {str(e)}")
            if self.conn:
                self.conn.rollback()
            return False, {'error': f'Failed to apply signature: {str(e)}'}
    
    def get_signature_status(self, signature_id: int, user_id: int) -> Dict:
        """Get current status of signature request"""
        try:
            cur = self.conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT signature_id, document_id, signature_status,
                       transaction_id, signed_document_url,
                       created_at, signed_at, expires_at,
                       retry_count, error_message, is_demo_mode
                FROM digital_signatures
                WHERE signature_id = %s AND user_id = %s
            """, (signature_id, user_id))
            
            signature = cur.fetchone()
            if signature:
                return dict(signature)
            return None
            
        except Exception as e:
            logger.error(f"❌ Error getting signature status: {str(e)}")
            return None
    
    def _generate_transaction_id(self) -> str:
        """Generate unique transaction ID"""
        import uuid
        return f"TXN_{datetime.now().strftime('%Y%m%d')}_{uuid.uuid4().hex[:12].upper()}"
    
    def _get_or_create_pdf(self, document_id: int, content: str) -> str:
        """Get or create PDF version of document"""
        # For now, create a simple PDF from HTML content
        # In production, this should handle actual document conversion
        pdf_dir = os.path.join('generated_documents', 'pdfs')
        os.makedirs(pdf_dir, exist_ok=True)
        
        pdf_path = os.path.join(pdf_dir, f'document_{document_id}.pdf')
        
        # If PDF already exists, return it
        if os.path.exists(pdf_path):
            return pdf_path
        
        # Create PDF from content
        # This is a placeholder - implement actual conversion
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        
        c = canvas.Canvas(pdf_path, pagesize=letter)
        c.drawString(100, 750, f"Document ID: {document_id}")
        c.drawString(100, 730, "Legal Document")
        c.drawString(100, 700, content[:500] if content else "No content")
        c.save()
        
        return pdf_path
    
    def _log_audit(
        self,
        signature_id: int,
        event_type: str,
        event_data: Dict = None,
        ip_address: str = None,
        user_id: int = None
    ):
        """Log signature audit trail"""
        try:
            cur = self.conn.cursor()
            cur.execute("""
                INSERT INTO signature_audit_log (
                    signature_id, event_type, event_data,
                    ip_address, user_id
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                signature_id, event_type,
                json.dumps(event_data) if event_data else None,
                ip_address, user_id
            ))
            self.conn.commit()
        except Exception as e:
            logger.error(f"❌ Error logging audit: {str(e)}")
    
    # ========== WORKFLOW MANAGEMENT METHODS ==========
    
    def create_workflow(
        self,
        document_id: int,
        user_id: int,
        signatories: List[Dict],
        signing_order: str = 'parallel',
        reminder_enabled: bool = True
    ) -> Tuple[bool, Dict]:
        """
        Create multi-party signature workflow
        
        Args:
            document_id: ID of document to be signed
            user_id: ID of user creating workflow
            signatories: List of signatory details [{'email', 'name', 'phone', 'role'}]
            signing_order: 'parallel' or 'sequential'
            reminder_enabled: Enable automatic reminders
            
        Returns:
            (success, {'workflow_id': int, ...})
        """
        try:
            cur = self.conn.cursor(cursor_factory=RealDictCursor)
            
            # Create workflow
            cur.execute("""
                INSERT INTO signature_workflows (
                    document_id, created_by, workflow_status,
                    total_signatories, signing_order, reminder_enabled
                ) VALUES (%s, %s, 'active', %s, %s, %s)
                RETURNING workflow_id
            """, (document_id, user_id, len(signatories), signing_order, reminder_enabled))
            
            workflow_id = cur.fetchone()['workflow_id']
            
            # Add signatories
            for idx, signatory in enumerate(signatories):
                cur.execute("""
                    INSERT INTO signatories (
                        workflow_id, email, name, phone, role,
                        signing_order, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                """, (
                    workflow_id,
                    signatory['email'],
                    signatory['name'],
                    signatory.get('phone'),
                    signatory.get('role', 'signer'),
                    idx + 1
                ))
            
            self.conn.commit()
            
            logger.info(f"✅ Created workflow {workflow_id} with {len(signatories)} signatories")
            
            return True, {
                'workflow_id': workflow_id,
                'total_signatories': len(signatories),
                'signing_order': signing_order
            }
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"❌ Error creating workflow: {str(e)}")
            return False, {'error': str(e)}
    
    def add_signatory(
        self,
        workflow_id: int,
        signatory_info: Dict
    ) -> Tuple[bool, Dict]:
        """
        Add signatory to existing workflow
        
        Args:
            workflow_id: Workflow ID
            signatory_info: {'email', 'name', 'phone', 'role'}
            
        Returns:
            (success, {'signatory_id': int})
        """
        try:
            cur = self.conn.cursor(cursor_factory=RealDictCursor)
            
            # Get current max signing order
            cur.execute("""
                SELECT COALESCE(MAX(signing_order), 0) as max_order
                FROM signatories
                WHERE workflow_id = %s
            """, (workflow_id,))
            
            max_order = cur.fetchone()['max_order']
            
            # Add signatory
            cur.execute("""
                INSERT INTO signatories (
                    workflow_id, email, name, phone, role,
                    signing_order, status
                ) VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                RETURNING signatory_id
            """, (
                workflow_id,
                signatory_info['email'],
                signatory_info['name'],
                signatory_info.get('phone'),
                signatory_info.get('role', 'signer'),
                max_order + 1
            ))
            
            signatory_id = cur.fetchone()['signatory_id']
            
            # Update workflow total
            cur.execute("""
                UPDATE signature_workflows
                SET total_signatories = total_signatories + 1
                WHERE workflow_id = %s
            """, (workflow_id,))
            
            self.conn.commit()
            
            logger.info(f"✅ Added signatory {signatory_id} to workflow {workflow_id}")
            
            return True, {'signatory_id': signatory_id}
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"❌ Error adding signatory: {str(e)}")
            return False, {'error': str(e)}
    
    def remove_signatory(
        self,
        workflow_id: int,
        signatory_id: int
    ) -> Tuple[bool, Dict]:
        """
        Remove signatory from workflow
        
        Args:
            workflow_id: Workflow ID
            signatory_id: Signatory ID to remove
            
        Returns:
            (success, {})
        """
        try:
            cur = self.conn.cursor()
            
            # Check if already signed
            cur.execute("""
                SELECT status FROM signatories
                WHERE signatory_id = %s AND workflow_id = %s
            """, (signatory_id, workflow_id))
            
            result = cur.fetchone()
            if not result:
                return False, {'error': 'Signatory not found'}
            
            if result[0] == 'signed':
                return False, {'error': 'Cannot remove signatory who has already signed'}
            
            # Remove signatory
            cur.execute("""
                DELETE FROM signatories
                WHERE signatory_id = %s AND workflow_id = %s
            """, (signatory_id, workflow_id))
            
            # Update workflow total
            cur.execute("""
                UPDATE signature_workflows
                SET total_signatories = total_signatories - 1
                WHERE workflow_id = %s
            """, (workflow_id,))
            
            self.conn.commit()
            
            logger.info(f"✅ Removed signatory {signatory_id} from workflow {workflow_id}")
            
            return True, {'message': 'Signatory removed successfully'}
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"❌ Error removing signatory: {str(e)}")
            return False, {'error': str(e)}
    
    def get_workflow_status(
        self,
        workflow_id: int
    ) -> Tuple[bool, Dict]:
        """
        Get workflow progress and status
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            (success, workflow_data)
        """
        try:
            cur = self.conn.cursor(cursor_factory=RealDictCursor)
            
            # Get workflow details
            cur.execute("""
                SELECT 
                    w.*,
                    d.doc_name,
                    u.username as created_by_name
                FROM signature_workflows w
                LEFT JOIN user_documents d ON w.document_id = d.doc_id
                LEFT JOIN users u ON w.created_by = u.user_id
                WHERE w.workflow_id = %s
            """, (workflow_id,))
            
            workflow = cur.fetchone()
            if not workflow:
                return False, {'error': 'Workflow not found'}
            
            # Get signatories
            cur.execute("""
                SELECT 
                    signatory_id, email, name, phone, role,
                    signing_order, status, signed_at,
                    invitation_sent_at, last_reminder_at
                FROM signatories
                WHERE workflow_id = %s
                ORDER BY signing_order
            """, (workflow_id,))
            
            signatories = cur.fetchall()
            
            return True, {
                'workflow': dict(workflow),
                'signatories': [dict(s) for s in signatories],
                'progress': {
                    'total': workflow['total_signatories'],
                    'signed': workflow['signed_count'],
                    'pending': workflow['total_signatories'] - workflow['signed_count']
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting workflow status: {str(e)}")
            return False, {'error': str(e)}
    
    def send_signature_request(
        self,
        workflow_id: int,
        signatory_id: int,
        notification_service
    ) -> Tuple[bool, Dict]:
        """
        Send signature request to signatory
        
        Args:
            workflow_id: Workflow ID
            signatory_id: Signatory ID
            notification_service: Notification service instance
            
        Returns:
            (success, {})
        """
        try:
            cur = self.conn.cursor(cursor_factory=RealDictCursor)
            
            # Get signatory and workflow details
            cur.execute("""
                SELECT s.*, w.document_id, d.doc_name
                FROM signatories s
                JOIN signature_workflows w ON s.workflow_id = w.workflow_id
                LEFT JOIN user_documents d ON w.document_id = d.doc_id
                WHERE s.signatory_id = %s AND s.workflow_id = %s
            """, (signatory_id, workflow_id))
            
            signatory = cur.fetchone()
            if not signatory:
                return False, {'error': 'Signatory not found'}
            
            # Send notification
            notification_service.send_signature_request(
                email=signatory['email'],
                name=signatory['name'],
                document_name=signatory['doc_name'],
                workflow_id=workflow_id,
                signatory_id=signatory_id
            )
            
            # Update invitation sent time
            cur.execute("""
                UPDATE signatories
                SET invitation_sent_at = CURRENT_TIMESTAMP,
                    status = 'notified'
                WHERE signatory_id = %s
            """, (signatory_id,))
            
            self.conn.commit()
            
            logger.info(f"✅ Sent signature request to {signatory['email']}")
            
            return True, {'message': 'Signature request sent'}
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"❌ Error sending signature request: {str(e)}")
            return False, {'error': str(e)}
    
    def send_reminders(
        self,
        workflow_id: int,
        notification_service
    ) -> Tuple[bool, Dict]:
        """
        Send reminders to pending signatories
        
        Args:
            workflow_id: Workflow ID
            notification_service: Notification service instance
            
        Returns:
            (success, {'reminded_count': int})
        """
        try:
            cur = self.conn.cursor(cursor_factory=RealDictCursor)
            
            # Get pending signatories who need reminders
            cur.execute("""
                SELECT s.*, w.document_id, d.doc_name
                FROM signatories s
                JOIN signature_workflows w ON s.workflow_id = w.workflow_id
                LEFT JOIN user_documents d ON w.document_id = d.doc_id
                WHERE s.workflow_id = %s
                AND s.status IN ('notified', 'viewed')
                AND (
                    s.last_reminder_at IS NULL
                    OR s.last_reminder_at < CURRENT_TIMESTAMP - INTERVAL '24 hours'
                )
            """, (workflow_id,))
            
            signatories = cur.fetchall()
            reminded_count = 0
            
            for signatory in signatories:
                try:
                    notification_service.send_reminder(
                        email=signatory['email'],
                        name=signatory['name'],
                        document_name=signatory['doc_name'],
                        workflow_id=workflow_id
                    )
                    
                    cur.execute("""
                        UPDATE signatories
                        SET last_reminder_at = CURRENT_TIMESTAMP
                        WHERE signatory_id = %s
                    """, (signatory['signatory_id'],))
                    
                    reminded_count += 1
                except Exception as e:
                    logger.error(f"Failed to send reminder to {signatory['email']}: {str(e)}")
            
            self.conn.commit()
            
            logger.info(f"✅ Sent {reminded_count} reminders for workflow {workflow_id}")
            
            return True, {'reminded_count': reminded_count}
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"❌ Error sending reminders: {str(e)}")
            return False, {'error': str(e)}
    
    def bulk_initiate_signatures(
        self,
        document_ids: List[int],
        user_id: int,
        common_config: Dict
    ) -> Tuple[bool, Dict]:
        """
        Initiate signatures for multiple documents
        
        Args:
            document_ids: List of document IDs
            user_id: User ID initiating signatures
            common_config: Common configuration for all signatures
            
        Returns:
            (success, {'initiated': int, 'failed': int, 'results': []})
        """
        results = []
        initiated = 0
        failed = 0
        
        for doc_id in document_ids:
            try:
                success, result = self.initiate_signature(
                    document_id=doc_id,
                    user_id=user_id,
                    aadhaar_number=common_config.get('aadhaar_number'),
                    signer_info=common_config.get('signer_info', {}),
                    ip_address=common_config.get('ip_address')
                )
                
                if success:
                    initiated += 1
                else:
                    failed += 1
                
                results.append({
                    'document_id': doc_id,
                    'success': success,
                    'result': result
                })
                
            except Exception as e:
                failed += 1
                results.append({
                    'document_id': doc_id,
                    'success': False,
                    'error': str(e)
                })
        
        logger.info(f"✅ Bulk initiation: {initiated} succeeded, {failed} failed")
        
        return True, {
            'initiated': initiated,
            'failed': failed,
            'results': results
        }
    
    # ========== SIGNATURE VERIFICATION METHODS ==========
    
    def verify_signed_document(
        self,
        document_file_path: str,
        certificate_data: Optional[Dict] = None
    ) -> Tuple[bool, Dict]:
        """
        Verify a signed document's authenticity
        
        Args:
            document_file_path: Path to uploaded signed document
            certificate_data: Optional QR code data from certificate
            
        Returns:
            Tuple of (success: bool, verification_result: Dict)
        """
        try:
            # Calculate hash of uploaded document
            doc_hash = self.pdf_processor.calculate_hash(document_file_path)
            
            # If certificate data provided, verify against it
            if certificate_data:
                verification = certificate_generator.verify_certificate(
                    cert_data=certificate_data,
                    uploaded_doc_hash=doc_hash
                )
                return True, verification
            
            # Otherwise, look up signature in database by document hash
            cur = self.conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT 
                    ds.signature_id, ds.transaction_id, ds.document_hash,
                    ds.signed_at, ds.signature_certificate_url,
                    ds.esign_request_id, ds.signer_name,
                    d.form_name as document_name
                FROM digital_signatures ds
                JOIN user_documents d ON ds.document_id = d.doc_id
                WHERE ds.document_hash = %s
                AND ds.signature_status = 'signed'
                ORDER BY ds.signed_at DESC
                LIMIT 1
            """, (doc_hash,))
            
            signature_record = cur.fetchone()
            
            if signature_record:
                return True, {
                    'valid': True,
                    'message': 'Document signature verified from database',
                    'details': dict(signature_record),
                    'verification_method': 'database_lookup'
                }
            else:
                return True, {
                    'valid': False,
                    'message': 'No signature found for this document',
                    'details': {'document_hash': doc_hash},
                    'verification_method': 'database_lookup'
                }
                
        except Exception as e:
            logger.error(f"❌ Error verifying document: {str(e)}")
            return False, {'error': str(e)}
    
    def get_certificate_by_id(self, certificate_id: str) -> Optional[Dict]:
        """
        Get certificate details by certificate ID
        
        Args:
            certificate_id: Certificate ID from QR code
            
        Returns:
            Certificate details or None
        """
        try:
            # Extract signature_id from certificate_id (format: CERT<timestamp><signature_id>)
            # Example: CERT202501081234560000042 -> signature_id = 42
            if certificate_id.startswith('CERT') and len(certificate_id) >= 20:
                signature_id_str = certificate_id[20:]  # Remove CERT + 14-digit timestamp
                signature_id = int(signature_id_str)
                
                cur = self.conn.cursor(cursor_factory=RealDictCursor)
                cur.execute("""
                    SELECT 
                        ds.signature_id, ds.transaction_id, ds.document_hash,
                        ds.signed_at, ds.signature_certificate_url,
                        ds.signature_metadata,
                        d.form_name as document_name, d.doc_id as document_id
                    FROM digital_signatures ds
                    JOIN user_documents d ON ds.document_id = d.doc_id
                    WHERE ds.signature_id = %s
                    AND ds.signature_status = 'signed'
                """, (signature_id,))
                
                result = cur.fetchone()
                return dict(result) if result else None
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Error getting certificate: {str(e)}")
            return None
    
    def generate_certificate(self, signature_id: int) -> Tuple[bool, str]:
        """
        Generate digital certificate for a signed document
        
        Args:
            signature_id: Signature ID
            
        Returns:
            Tuple of (success: bool, certificate_path: str)
        """
        try:
            cur = self.conn.cursor(cursor_factory=RealDictCursor)
            
            # Get signature details
            cur.execute("""
                SELECT 
                    ds.signature_id, ds.transaction_id, ds.document_hash,
                    ds.signed_at, ds.esign_request_id,
                    ds.signature_metadata,
                    ds.aadhaar_number_hash,
                    d.doc_id, d.form_name
                FROM digital_signatures ds
                JOIN user_documents d ON ds.document_id = d.doc_id
                WHERE ds.signature_id = %s
                AND ds.signature_status = 'signed'
            """, (signature_id,))
            
            sig_record = cur.fetchone()
            
            if not sig_record:
                return False, "Signature not found or not completed"
            
            # Extract signer info from metadata
            metadata = sig_record['signature_metadata'] or {}
            
            # Prepare data for certificate
            signature_data = {
                'signature_id': sig_record['signature_id'],
                'transaction_id': sig_record['transaction_id'],
                'document_hash': sig_record['document_hash'],
                'signed_at': sig_record['signed_at'],
                'esign_request_id': sig_record['esign_request_id']
            }
            
            document_info = {
                'document_id': sig_record['doc_id'],
                'document_name': sig_record['form_name'],
                'page_count': 1  # TODO: Get actual page count
            }
            
            # Mask Aadhaar for display
            aadhaar_masked = "XXXX-XXXX-" + sig_record['aadhaar_number_hash'][:4].upper()
            
            signer_info = {
                'name': metadata.get('signer_name', 'N/A'),
                'email': metadata.get('signer_email', 'N/A'),
                'phone': metadata.get('signer_phone', 'N/A'),
                'aadhaar_masked': aadhaar_masked
            }
            
            # Generate certificate
            cert_path = certificate_generator.generate_certificate(
                signature_data=signature_data,
                document_info=document_info,
                signer_info=signer_info
            )
            
            # Update database with certificate URL
            cert_url = f"/certificates/{os.path.basename(cert_path)}"
            cur.execute("""
                UPDATE digital_signatures
                SET signature_certificate_url = %s
                WHERE signature_id = %s
            """, (cert_url, signature_id))
            
            self.conn.commit()
            
            logger.info(f"✅ Generated certificate for signature {signature_id}")
            return True, cert_path
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"❌ Error generating certificate: {str(e)}")
            return False, str(e)


def get_signature_manager(db_connection):
    """Factory function to get signature manager instance"""
    return SignatureManager(db_connection)

