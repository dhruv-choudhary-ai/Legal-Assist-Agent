"""
NSDL e-Sign Service Integration
Handles communication with NSDL e-Sign API for Aadhaar-based digital signatures

This service supports:
1. NSDL Production Mode - When credentials are configured
2. Demo Mode - For testing without NSDL account

Demo mode simulates the full workflow for development/testing
"""

import os
import requests
import json
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class NSDLESignService:
    """
    NSDL e-Sign Service Integration
    
    Provides Aadhaar-based digital signature functionality using NSDL infrastructure.
    Automatically switches between production and demo mode based on configuration.
    """
    
    def __init__(self):
        """Initialize NSDL e-Sign service with configuration"""
        self.client_id = os.getenv('NSDL_CLIENT_ID', '')
        self.client_secret = os.getenv('NSDL_CLIENT_SECRET', '')
        self.api_url = os.getenv('NSDL_API_URL', 'https://esign.nsdl.com/api/v2')
        self.callback_url = os.getenv('NSDL_CALLBACK_URL', 'http://localhost:5000/api/signature/callback')
        
        # Determine if we're in demo mode
        self.is_demo_mode = not (self.client_id and self.client_secret)
        
        if self.is_demo_mode:
            logger.warning("⚠️  NSDL e-Sign running in DEMO MODE (no credentials configured)")
            logger.info("Configure NSDL_CLIENT_ID and NSDL_CLIENT_SECRET in .env for production")
        else:
            logger.info("✅ NSDL e-Sign service initialized in PRODUCTION MODE")
        
        # Demo mode storage (in-memory for testing)
        self._demo_otps = {}  # transaction_id -> otp
        self._demo_transactions = {}  # transaction_id -> transaction_data
    
    def is_configured(self) -> bool:
        """Check if NSDL credentials are configured"""
        return not self.is_demo_mode
    
    def request_otp(
        self, 
        aadhaar_number: str, 
        transaction_id: str,
        document_hash: str,
        signer_info: Dict
    ) -> Tuple[bool, Dict]:
        """
        Request OTP from NSDL for Aadhaar verification
        
        Args:
            aadhaar_number: 12-digit Aadhaar number (will be validated)
            transaction_id: Unique transaction identifier
            document_hash: SHA-256 hash of document to be signed
            signer_info: Dict with keys: name, email, phone
            
        Returns:
            Tuple of (success: bool, response: Dict)
        """
        if self.is_demo_mode:
            return self._demo_request_otp(aadhaar_number, transaction_id, document_hash, signer_info)
        
        try:
            # NSDL API endpoint for OTP request
            endpoint = f"{self.api_url}/esign/otp/request"
            
            # Prepare request payload
            payload = {
                "clientId": self.client_id,
                "transactionId": transaction_id,
                "aadhaarNumber": aadhaar_number,
                "documentHash": document_hash,
                "signerDetails": {
                    "name": signer_info.get('name'),
                    "email": signer_info.get('email'),
                    "mobile": signer_info.get('phone')
                },
                "callbackUrl": self.callback_url
            }
            
            # Add authentication header
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self._get_access_token()}"
            }
            
            # Make API request
            response = requests.post(endpoint, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('status') == 'success':
                logger.info(f"✅ OTP requested successfully for transaction {transaction_id}")
                return True, {
                    'transaction_id': transaction_id,
                    'esign_request_id': result.get('requestId'),
                    'otp_sent': True,
                    'expires_at': (datetime.now() + timedelta(minutes=10)).isoformat(),
                    'message': 'OTP sent to Aadhaar-linked mobile number'
                }
            else:
                logger.error(f"❌ OTP request failed: {result.get('message')}")
                return False, {
                    'error': result.get('message', 'OTP request failed'),
                    'error_code': result.get('errorCode')
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ NSDL API request failed: {str(e)}")
            return False, {
                'error': 'Unable to connect to NSDL e-Sign service',
                'details': str(e)
            }
        except Exception as e:
            logger.error(f"❌ Unexpected error in OTP request: {str(e)}")
            return False, {
                'error': 'Internal error processing OTP request',
                'details': str(e)
            }
    
    def verify_otp(
        self, 
        transaction_id: str, 
        otp: str,
        esign_request_id: Optional[str] = None
    ) -> Tuple[bool, Dict]:
        """
        Verify OTP with NSDL
        
        Args:
            transaction_id: Unique transaction identifier
            otp: 6-digit OTP entered by user
            esign_request_id: NSDL request ID from OTP request
            
        Returns:
            Tuple of (success: bool, response: Dict)
        """
        if self.is_demo_mode:
            return self._demo_verify_otp(transaction_id, otp)
        
        try:
            endpoint = f"{self.api_url}/esign/otp/verify"
            
            payload = {
                "clientId": self.client_id,
                "transactionId": transaction_id,
                "requestId": esign_request_id,
                "otp": otp
            }
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self._get_access_token()}"
            }
            
            response = requests.post(endpoint, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('status') == 'success':
                logger.info(f"✅ OTP verified successfully for transaction {transaction_id}")
                return True, {
                    'verified': True,
                    'signer_name': result.get('signerName'),
                    'aadhaar_last4': result.get('aadhaarLast4'),
                    'verification_token': result.get('verificationToken')
                }
            else:
                logger.warning(f"⚠️  OTP verification failed: {result.get('message')}")
                return False, {
                    'verified': False,
                    'error': result.get('message', 'Invalid OTP'),
                    'retry_allowed': result.get('retryAllowed', True)
                }
                
        except Exception as e:
            logger.error(f"❌ Error verifying OTP: {str(e)}")
            return False, {
                'verified': False,
                'error': 'Unable to verify OTP',
                'details': str(e)
            }
    
    def apply_signature(
        self,
        transaction_id: str,
        verification_token: str,
        document_path: str,
        signature_position: Optional[Dict] = None
    ) -> Tuple[bool, Dict]:
        """
        Apply digital signature to document using NSDL
        
        Args:
            transaction_id: Unique transaction identifier
            verification_token: Token from OTP verification
            document_path: Path to PDF document
            signature_position: Dict with keys: page, x, y, width, height
            
        Returns:
            Tuple of (success: bool, response: Dict with signed_document_path)
        """
        if self.is_demo_mode:
            return self._demo_apply_signature(transaction_id, document_path, signature_position)
        
        try:
            endpoint = f"{self.api_url}/esign/sign"
            
            # Default signature position (bottom right of last page)
            sig_pos = signature_position or {
                "page": -1,  # Last page
                "llx": 350,  # Lower left X
                "lly": 50,   # Lower left Y
                "urx": 550,  # Upper right X
                "ury": 100   # Upper right Y
            }
            
            # Read document content
            with open(document_path, 'rb') as f:
                document_content = f.read()
            
            # Prepare multipart form data
            files = {
                'document': ('document.pdf', document_content, 'application/pdf')
            }
            
            data = {
                "clientId": self.client_id,
                "transactionId": transaction_id,
                "verificationToken": verification_token,
                "signaturePosition": json.dumps(sig_pos),
                "signatureReason": "Legal Document Signature",
                "signatureLocation": "India"
            }
            
            headers = {
                "Authorization": f"Bearer {self._get_access_token()}"
            }
            
            response = requests.post(
                endpoint, 
                data=data, 
                files=files, 
                headers=headers, 
                timeout=60
            )
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('status') == 'success':
                logger.info(f"✅ Document signed successfully for transaction {transaction_id}")
                
                # Save signed document
                signed_doc_path = document_path.replace('.pdf', '_signed.pdf')
                signed_content = result.get('signedDocument')  # Base64 encoded
                
                import base64
                with open(signed_doc_path, 'wb') as f:
                    f.write(base64.b64decode(signed_content))
                
                return True, {
                    'signed': True,
                    'signed_document_path': signed_doc_path,
                    'certificate_id': result.get('certificateId'),
                    'signature_timestamp': result.get('timestamp'),
                    'signer_name': result.get('signerName')
                }
            else:
                logger.error(f"❌ Signature failed: {result.get('message')}")
                return False, {
                    'signed': False,
                    'error': result.get('message', 'Signature application failed')
                }
                
        except Exception as e:
            logger.error(f"❌ Error applying signature: {str(e)}")
            return False, {
                'signed': False,
                'error': 'Unable to apply signature',
                'details': str(e)
            }
    
    def _get_access_token(self) -> str:
        """
        Get OAuth access token from NSDL
        (Cached for performance - implement caching in production)
        """
        try:
            endpoint = f"{self.api_url}/oauth/token"
            
            payload = {
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret
            }
            
            response = requests.post(endpoint, data=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            return result.get('access_token')
            
        except Exception as e:
            logger.error(f"❌ Failed to get access token: {str(e)}")
            raise
    
    # ===== DEMO MODE METHODS =====
    
    def _demo_request_otp(
        self, 
        aadhaar_number: str, 
        transaction_id: str,
        document_hash: str,
        signer_info: Dict
    ) -> Tuple[bool, Dict]:
        """Demo mode OTP request - generates fake OTP"""
        logger.info(f"🎭 DEMO MODE: Requesting OTP for transaction {transaction_id}")
        
        # Generate demo OTP (always 123456 for easy testing)
        demo_otp = "123456"
        
        # Store transaction data
        self._demo_transactions[transaction_id] = {
            'aadhaar_number': aadhaar_number,
            'document_hash': document_hash,
            'signer_info': signer_info,
            'created_at': datetime.now()
        }
        
        # Store OTP
        self._demo_otps[transaction_id] = {
            'otp': demo_otp,
            'expires_at': datetime.now() + timedelta(minutes=10)
        }
        
        logger.info(f"🎭 DEMO MODE: OTP generated: {demo_otp}")
        
        return True, {
            'transaction_id': transaction_id,
            'esign_request_id': f"DEMO_{transaction_id}",
            'otp_sent': True,
            'expires_at': (datetime.now() + timedelta(minutes=10)).isoformat(),
            'message': 'DEMO MODE: OTP sent (use 123456)',
            'demo_otp': demo_otp  # Only in demo mode!
        }
    
    def _demo_verify_otp(self, transaction_id: str, otp: str) -> Tuple[bool, Dict]:
        """Demo mode OTP verification"""
        logger.info(f"🎭 DEMO MODE: Verifying OTP for transaction {transaction_id}")
        
        if transaction_id not in self._demo_otps:
            return False, {
                'verified': False,
                'error': 'Invalid transaction ID'
            }
        
        stored_otp_data = self._demo_otps[transaction_id]
        
        # Check expiry
        if datetime.now() > stored_otp_data['expires_at']:
            return False, {
                'verified': False,
                'error': 'OTP expired'
            }
        
        # Verify OTP
        if otp == stored_otp_data['otp']:
            transaction_data = self._demo_transactions[transaction_id]
            signer_info = transaction_data['signer_info']
            
            logger.info(f"✅ DEMO MODE: OTP verified successfully")
            
            return True, {
                'verified': True,
                'signer_name': signer_info.get('name', 'Demo Signer'),
                'aadhaar_last4': transaction_data['aadhaar_number'][-4:],
                'verification_token': f"DEMO_TOKEN_{transaction_id}"
            }
        else:
            return False, {
                'verified': False,
                'error': 'Invalid OTP (hint: use 123456 in demo mode)',
                'retry_allowed': True
            }
    
    def _demo_apply_signature(
        self,
        transaction_id: str,
        document_path: str,
        signature_position: Optional[Dict]
    ) -> Tuple[bool, Dict]:
        """Demo mode signature application - adds demo signature to PDF"""
        logger.info(f"🎭 DEMO MODE: Applying signature for transaction {transaction_id}")
        
        try:
            from PyPDF2 import PdfReader, PdfWriter
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            import io
            
            # Read original PDF
            reader = PdfReader(document_path)
            writer = PdfWriter()
            
            # Copy all pages
            for page in reader.pages:
                writer.add_page(page)
            
            # Create signature annotation on last page
            packet = io.BytesIO()
            can = canvas.Canvas(packet, pagesize=letter)
            
            # Draw demo signature box
            x, y = 350, 50
            can.setStrokeColorRGB(0, 0, 1)
            can.setFillColorRGB(0.9, 0.9, 1)
            can.rect(x, y, 200, 50, fill=1)
            
            can.setFillColorRGB(0, 0, 0)
            can.setFont("Helvetica-Bold", 10)
            can.drawString(x + 5, y + 35, "✓ DIGITALLY SIGNED (DEMO)")
            can.setFont("Helvetica", 8)
            
            transaction_data = self._demo_transactions.get(transaction_id, {})
            signer_info = transaction_data.get('signer_info', {})
            signer_name = signer_info.get('name', 'Demo Signer')
            
            can.drawString(x + 5, y + 22, f"Signer: {signer_name}")
            can.drawString(x + 5, y + 12, f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
            can.drawString(x + 5, y + 2, "Certificate: DEMO-CERT-2025")
            
            can.save()
            
            # Overlay signature on last page
            packet.seek(0)
            signature_pdf = PdfReader(packet)
            last_page = writer.pages[-1]
            last_page.merge_page(signature_pdf.pages[0])
            
            # Save signed document
            signed_doc_path = document_path.replace('.pdf', '_signed.pdf')
            with open(signed_doc_path, 'wb') as output_file:
                writer.write(output_file)
            
            logger.info(f"✅ DEMO MODE: Signature applied successfully")
            
            return True, {
                'signed': True,
                'signed_document_path': signed_doc_path,
                'certificate_id': 'DEMO-CERT-2025',
                'signature_timestamp': datetime.now().isoformat(),
                'signer_name': signer_name,
                'demo_mode': True
            }
            
        except Exception as e:
            logger.error(f"❌ DEMO MODE: Error applying signature: {str(e)}")
            return False, {
                'signed': False,
                'error': f'Demo signature failed: {str(e)}'
            }


# Global instance
esign_service = NSDLESignService()
