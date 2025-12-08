"""
Digital Signature Certificate Generator
Generates verifiable digital certificates with QR codes for signed documents
"""

import os
import qrcode
import json
import hashlib
from datetime import datetime
from io import BytesIO
from typing import Dict, Optional
import logging

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph

logger = logging.getLogger(__name__)


class CertificateGenerator:
    """Generate digital signature certificates with QR codes"""
    
    def __init__(self, output_dir: str = 'generated_documents/certificates'):
        """Initialize certificate generator"""
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def generate_certificate(
        self,
        signature_data: Dict,
        document_info: Dict,
        signer_info: Dict
    ) -> str:
        """
        Generate digital signature certificate PDF with QR code
        
        Args:
            signature_data: {
                'signature_id': int,
                'transaction_id': str,
                'document_hash': str,
                'signed_at': datetime,
                'esign_request_id': str
            }
            document_info: {
                'document_id': int,
                'document_name': str,
                'page_count': int
            }
            signer_info: {
                'name': str,
                'email': str,
                'phone': str (masked),
                'aadhaar_masked': str
            }
            
        Returns:
            Path to generated certificate PDF
        """
        try:
            # Generate certificate ID
            cert_id = self._generate_certificate_id(signature_data['signature_id'])
            cert_filename = f"certificate_{cert_id}.pdf"
            cert_path = os.path.join(self.output_dir, cert_filename)
            
            # Create QR code data
            qr_data = self._create_qr_data(signature_data, document_info, signer_info, cert_id)
            
            # Generate QR code image
            qr_image_path = self._generate_qr_code(qr_data, cert_id)
            
            # Create certificate PDF
            self._create_certificate_pdf(
                cert_path, qr_image_path, cert_id,
                signature_data, document_info, signer_info, qr_data
            )
            
            logger.info(f"✅ Generated certificate: {cert_filename}")
            return cert_path
            
        except Exception as e:
            logger.error(f"❌ Error generating certificate: {str(e)}")
            raise
    
    def _generate_certificate_id(self, signature_id: int) -> str:
        """Generate unique certificate ID"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        return f"CERT{timestamp}{signature_id:06d}"
    
    def _create_qr_data(
        self,
        signature_data: Dict,
        document_info: Dict,
        signer_info: Dict,
        cert_id: str
    ) -> Dict:
        """Create QR code data payload"""
        qr_data = {
            'certificate_id': cert_id,
            'signature_id': signature_data['signature_id'],
            'transaction_id': signature_data['transaction_id'],
            'document_id': document_info['document_id'],
            'document_name': document_info['document_name'],
            'document_hash': signature_data['document_hash'],
            'signer_name': signer_info['name'],
            'signed_at': signature_data['signed_at'].isoformat() if isinstance(signature_data['signed_at'], datetime) else signature_data['signed_at'],
            'verify_url': f"http://localhost:3000/verify-signature?cert={cert_id}",
            'esign_request_id': signature_data.get('esign_request_id', '')
        }
        return qr_data
    
    def _generate_qr_code(self, qr_data: Dict, cert_id: str) -> str:
        """Generate QR code image"""
        qr_filename = f"qr_{cert_id}.png"
        qr_path = os.path.join(self.output_dir, qr_filename)
        
        # Create QR code
        qr = qrcode.QRCode(
            version=5,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        
        # Add data as JSON
        qr.add_data(json.dumps(qr_data))
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(qr_path)
        
        logger.info(f"✅ Generated QR code: {qr_filename}")
        return qr_path
    
    def _create_certificate_pdf(
        self,
        cert_path: str,
        qr_image_path: str,
        cert_id: str,
        signature_data: Dict,
        document_info: Dict,
        signer_info: Dict,
        qr_data: Dict
    ):
        """Create certificate PDF with professional design"""
        c = canvas.Canvas(cert_path, pagesize=A4)
        width, height = A4
        
        # Header - Professional gradient effect (simulated with overlapping rectangles)
        c.setFillColorRGB(0.2, 0.3, 0.6)  # Dark blue
        c.rect(0, height - 120, width, 120, fill=True, stroke=False)
        
        c.setFillColorRGB(0.3, 0.4, 0.7)  # Lighter blue
        c.rect(0, height - 100, width, 20, fill=True, stroke=False)
        
        # Title
        c.setFillColorRGB(1, 1, 1)  # White text
        c.setFont("Helvetica-Bold", 28)
        c.drawCentredString(width / 2, height - 60, "DIGITAL SIGNATURE CERTIFICATE")
        
        c.setFont("Helvetica", 12)
        c.drawCentredString(width / 2, height - 85, "Issued by Legal Documentation Assistant")
        
        # Certificate ID
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(50, height - 140, f"Certificate ID: {cert_id}")
        
        # Main content area
        y_position = height - 180
        
        # Section: Document Information
        c.setFont("Helvetica-Bold", 14)
        c.setFillColorRGB(0.2, 0.3, 0.6)
        c.drawString(50, y_position, "Document Information")
        y_position -= 25
        
        c.setFont("Helvetica", 11)
        c.setFillColorRGB(0, 0, 0)
        
        doc_info_lines = [
            f"Document Name: {document_info['document_name']}",
            f"Document ID: {document_info['document_id']}",
            f"Document Hash: {signature_data['document_hash'][:40]}...",
            f"Total Pages: {document_info.get('page_count', 'N/A')}"
        ]
        
        for line in doc_info_lines:
            c.drawString(70, y_position, line)
            y_position -= 18
        
        y_position -= 15
        
        # Section: Signer Information
        c.setFont("Helvetica-Bold", 14)
        c.setFillColorRGB(0.2, 0.3, 0.6)
        c.drawString(50, y_position, "Signer Information")
        y_position -= 25
        
        c.setFont("Helvetica", 11)
        c.setFillColorRGB(0, 0, 0)
        
        signer_info_lines = [
            f"Name: {signer_info['name']}",
            f"Email: {signer_info['email']}",
            f"Phone: {signer_info.get('phone', 'N/A')}",
            f"Aadhaar: {signer_info.get('aadhaar_masked', 'XXXX-XXXX-XXXX')}"
        ]
        
        for line in signer_info_lines:
            c.drawString(70, y_position, line)
            y_position -= 18
        
        y_position -= 15
        
        # Section: Signature Details
        c.setFont("Helvetica-Bold", 14)
        c.setFillColorRGB(0.2, 0.3, 0.6)
        c.drawString(50, y_position, "Signature Details")
        y_position -= 25
        
        c.setFont("Helvetica", 11)
        c.setFillColorRGB(0, 0, 0)
        
        signed_at = signature_data['signed_at']
        if isinstance(signed_at, datetime):
            signed_at_str = signed_at.strftime('%B %d, %Y at %I:%M %p')
        else:
            signed_at_str = str(signed_at)
        
        signature_info_lines = [
            f"Transaction ID: {signature_data['transaction_id']}",
            f"Signature ID: {signature_data['signature_id']}",
            f"Signed At: {signed_at_str}",
            f"e-Sign Request ID: {signature_data.get('esign_request_id', 'N/A')}"
        ]
        
        for line in signature_info_lines:
            c.drawString(70, y_position, line)
            y_position -= 18
        
        # QR Code section
        qr_y_position = 250
        
        # QR Code box
        c.setStrokeColorRGB(0.2, 0.3, 0.6)
        c.setLineWidth(2)
        c.rect(width - 220, qr_y_position - 20, 170, 200, fill=False, stroke=True)
        
        # QR Code title
        c.setFont("Helvetica-Bold", 12)
        c.setFillColorRGB(0.2, 0.3, 0.6)
        c.drawCentredString(width - 135, qr_y_position + 165, "Verification QR Code")
        
        # Add QR Code image
        if os.path.exists(qr_image_path):
            c.drawImage(qr_image_path, width - 210, qr_y_position, width=150, height=150, preserveAspectRatio=True)
        
        c.setFont("Helvetica", 8)
        c.setFillColorRGB(0, 0, 0)
        c.drawCentredString(width - 135, qr_y_position - 10, "Scan to verify signature")
        
        # Footer
        footer_y = 80
        
        # Verification instructions
        c.setFont("Helvetica-Bold", 10)
        c.setFillColorRGB(0.2, 0.3, 0.6)
        c.drawString(50, footer_y, "Verification")
        
        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0, 0, 0)
        c.drawString(50, footer_y - 15, f"Verify at: {qr_data['verify_url']}")
        c.drawString(50, footer_y - 30, "Or scan the QR code with any QR scanner")
        
        # Legal notice
        c.setFont("Helvetica-Oblique", 8)
        c.setFillColorRGB(0.4, 0.4, 0.4)
        notice_text = "This is a digitally generated certificate. Verify authenticity at the URL above or by scanning the QR code."
        c.drawCentredString(width / 2, 40, notice_text)
        
        # Save PDF
        c.save()
        logger.info(f"✅ Certificate PDF created: {cert_path}")
    
    def verify_certificate(self, cert_data: Dict, uploaded_doc_hash: str) -> Dict:
        """
        Verify certificate authenticity
        
        Args:
            cert_data: Certificate data from QR code
            uploaded_doc_hash: Hash of uploaded document
            
        Returns:
            Verification result
        """
        try:
            result = {
                'valid': False,
                'message': '',
                'details': {}
            }
            
            # Check if document hash matches
            if cert_data.get('document_hash') == uploaded_doc_hash:
                result['valid'] = True
                result['message'] = 'Document signature verified successfully'
                result['details'] = {
                    'document_name': cert_data.get('document_name'),
                    'signer_name': cert_data.get('signer_name'),
                    'signed_at': cert_data.get('signed_at'),
                    'certificate_id': cert_data.get('certificate_id'),
                    'transaction_id': cert_data.get('transaction_id')
                }
            else:
                result['valid'] = False
                result['message'] = 'Document has been modified after signing'
                result['details'] = {
                    'expected_hash': cert_data.get('document_hash'),
                    'actual_hash': uploaded_doc_hash
                }
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error verifying certificate: {str(e)}")
            return {
                'valid': False,
                'message': f'Verification error: {str(e)}',
                'details': {}
            }


# Singleton instance
certificate_generator = CertificateGenerator()
