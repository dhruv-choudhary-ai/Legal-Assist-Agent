"""
PDF Processor for Digital Signatures
Handles PDF document processing, hashing, and signature preparation
"""

import hashlib
import os
from pathlib import Path
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Optional dependency for DOCX to PDF conversion
try:
    from docx2pdf import convert as docx2pdf_convert
    DOCX2PDF_AVAILABLE = True
except ImportError:
    DOCX2PDF_AVAILABLE = False
    logger.info("docx2pdf not installed - DOCX conversion will be limited")


class PDFProcessor:
    """PDF document processor for digital signatures"""
    
    @staticmethod
    def calculate_hash(file_path: str) -> str:
        """
        Calculate SHA-256 hash of PDF document
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            SHA-256 hash as hex string
        """
        try:
            sha256_hash = hashlib.sha256()
            with open(file_path, "rb") as f:
                # Read file in chunks for memory efficiency
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            
            hash_value = sha256_hash.hexdigest()
            logger.info(f"📊 Calculated document hash: {hash_value[:16]}...")
            return hash_value
            
        except Exception as e:
            logger.error(f"❌ Error calculating hash: {str(e)}")
            raise
    
    @staticmethod
    def convert_to_pdf(input_path: str, output_path: Optional[str] = None) -> str:
        """
        Convert DOCX to PDF (if needed)
        
        Args:
            input_path: Path to input document
            output_path: Optional output path for PDF
            
        Returns:
            Path to PDF file
        """
        input_file = Path(input_path)
        
        # If already PDF, return as is
        if input_file.suffix.lower() == '.pdf':
            logger.info("📄 Document is already in PDF format")
            return input_path
        
        # For DOCX files, convert to PDF
        if input_file.suffix.lower() in ['.docx', '.doc']:
            if not DOCX2PDF_AVAILABLE:
                logger.error("❌ DOCX to PDF conversion requires docx2pdf package")
                raise NotImplementedError(
                    "DOCX to PDF conversion requires docx2pdf package. "
                    "Install with: pip install docx2pdf"
                )
            
            try:
                if output_path is None:
                    output_path = str(input_file.with_suffix('.pdf'))
                
                logger.info(f"🔄 Converting {input_file.suffix} to PDF...")
                docx2pdf_convert(input_path, output_path)
                logger.info(f"✅ Converted to PDF: {output_path}")
                
                return output_path
                
            except Exception as e:
                logger.error(f"❌ Error converting to PDF: {str(e)}")
                raise
        
        raise ValueError(f"Unsupported file format: {input_file.suffix}")
    
    @staticmethod
    def validate_pdf(file_path: str) -> Tuple[bool, str]:
        """
        Validate if file is a valid PDF
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            Tuple of (is_valid: bool, message: str)
        """
        try:
            from PyPDF2 import PdfReader
            
            if not os.path.exists(file_path):
                return False, "File does not exist"
            
            # Check file extension
            if not file_path.lower().endswith('.pdf'):
                return False, "File must be a PDF"
            
            # Try to read PDF
            reader = PdfReader(file_path)
            num_pages = len(reader.pages)
            
            if num_pages == 0:
                return False, "PDF has no pages"
            
            logger.info(f"✅ Valid PDF with {num_pages} pages")
            return True, f"Valid PDF with {num_pages} pages"
            
        except Exception as e:
            logger.error(f"❌ PDF validation failed: {str(e)}")
            return False, f"Invalid PDF: {str(e)}"
    
    @staticmethod
    def get_pdf_info(file_path: str) -> Dict:
        """
        Get PDF document information
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            Dict with PDF metadata
        """
        try:
            from PyPDF2 import PdfReader
            
            reader = PdfReader(file_path)
            
            info = {
                'num_pages': len(reader.pages),
                'file_size': os.path.getsize(file_path),
                'file_name': os.path.basename(file_path),
                'metadata': {}
            }
            
            # Extract metadata if available
            if reader.metadata:
                info['metadata'] = {
                    'title': reader.metadata.get('/Title', ''),
                    'author': reader.metadata.get('/Author', ''),
                    'subject': reader.metadata.get('/Subject', ''),
                    'creator': reader.metadata.get('/Creator', ''),
                    'producer': reader.metadata.get('/Producer', ''),
                    'creation_date': reader.metadata.get('/CreationDate', '')
                }
            
            logger.info(f"📊 PDF Info: {info['num_pages']} pages, {info['file_size']} bytes")
            return info
            
        except Exception as e:
            logger.error(f"❌ Error getting PDF info: {str(e)}")
            return {'error': str(e)}
    
    @staticmethod
    def add_watermark(
        input_path: str,
        output_path: str,
        watermark_text: str = "DRAFT - NOT SIGNED"
    ) -> bool:
        """
        Add watermark to PDF (for unsigned documents)
        
        Args:
            input_path: Path to input PDF
            output_path: Path to output PDF
            watermark_text: Watermark text
            
        Returns:
            Success status
        """
        try:
            from PyPDF2 import PdfReader, PdfWriter
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            import io
            
            # Create watermark
            packet = io.BytesIO()
            can = canvas.Canvas(packet, pagesize=letter)
            can.setFont("Helvetica-Bold", 40)
            can.setFillColorRGB(0.9, 0.9, 0.9, alpha=0.3)
            can.saveState()
            can.translate(300, 400)
            can.rotate(45)
            can.drawString(0, 0, watermark_text)
            can.restoreState()
            can.save()
            
            # Read original PDF
            packet.seek(0)
            watermark_pdf = PdfReader(packet)
            reader = PdfReader(input_path)
            writer = PdfWriter()
            
            # Apply watermark to each page
            for page in reader.pages:
                page.merge_page(watermark_pdf.pages[0])
                writer.add_page(page)
            
            # Write output
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
            
            logger.info(f"✅ Added watermark to PDF: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error adding watermark: {str(e)}")
            return False
    
    @staticmethod
    def prepare_for_signing(document_path: str, output_dir: str) -> Tuple[str, str]:
        """
        Prepare document for signing (convert to PDF and calculate hash)
        
        Args:
            document_path: Path to source document
            output_dir: Directory for prepared PDF
            
        Returns:
            Tuple of (pdf_path: str, document_hash: str)
        """
        try:
            # Ensure output directory exists
            os.makedirs(output_dir, exist_ok=True)
            
            # Convert to PDF if needed
            pdf_path = PDFProcessor.convert_to_pdf(document_path)
            
            # If conversion created a new file, move it to output_dir
            if pdf_path != document_path:
                import shutil
                new_path = os.path.join(output_dir, os.path.basename(pdf_path))
                shutil.copy2(pdf_path, new_path)
                pdf_path = new_path
            
            # Validate PDF
            is_valid, message = PDFProcessor.validate_pdf(pdf_path)
            if not is_valid:
                raise ValueError(f"PDF validation failed: {message}")
            
            # Calculate hash
            doc_hash = PDFProcessor.calculate_hash(pdf_path)
            
            logger.info(f"✅ Document prepared for signing: {pdf_path}")
            return pdf_path, doc_hash
            
        except Exception as e:
            logger.error(f"❌ Error preparing document: {str(e)}")
            raise


# Example usage
if __name__ == "__main__":
    processor = PDFProcessor()
    
    # Test with a sample PDF
    test_file = "test_document.pdf"
    if os.path.exists(test_file):
        doc_hash = processor.calculate_hash(test_file)
        print(f"Document hash: {doc_hash}")
        
        is_valid, message = processor.validate_pdf(test_file)
        print(f"Validation: {message}")
        
        info = processor.get_pdf_info(test_file)
        print(f"PDF Info: {info}")
