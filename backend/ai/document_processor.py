"""
Document Processor
Handles document parsing, chunking, and preprocessing for RAG
"""

import os
import re
import logging
from typing import List, Dict, Optional, Tuple
from pathlib import Path

# Document parsing imports
try:
    from docx import Document
    import PyPDF2
    import pdfplumber
    from bs4 import BeautifulSoup
    PARSING_AVAILABLE = True
except ImportError as e:
    PARSING_AVAILABLE = False
    logging.warning(f"Document parsing libraries not fully available: {e}")

from .config import AIConfig

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """
    Process and chunk documents for vector database
    
    Supports:
    - PDF files
    - DOCX files
    - TXT files
    - HTML content
    - String content
    """
    
    def __init__(self):
        """Initialize document processor"""
        self.chunk_size = AIConfig.CHUNK_SIZE
        self.chunk_overlap = AIConfig.CHUNK_OVERLAP
        logger.info(f"📄 DocumentProcessor initialized (chunk_size={self.chunk_size}, overlap={self.chunk_overlap})")
    
    def read_file(self, file_path: str) -> Tuple[str, Dict]:
        """
        Read content from file
        
        Args:
            file_path: Path to the file
        
        Returns:
            Tuple of (content, metadata)
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        extension = file_path.suffix.lower()
        
        try:
            if extension == '.pdf':
                content = self._read_pdf(file_path)
            elif extension == '.docx':
                content = self._read_docx(file_path)
            elif extension in ['.txt', '.md']:
                content = self._read_txt(file_path)
            elif extension in ['.html', '.htm']:
                content = self._read_html(file_path)
            else:
                raise ValueError(f"Unsupported file type: {extension}")
            
            metadata = {
                'source': file_path.name,
                'file_type': extension[1:],
                'file_path': str(file_path),
                'size_bytes': file_path.stat().st_size
            }
            
            logger.info(f"✅ Read {file_path.name} ({len(content)} chars)")
            return content, metadata
        
        except Exception as e:
            logger.error(f"❌ Failed to read {file_path}: {e}")
            raise
    
    def _read_pdf(self, file_path: Path) -> str:
        """Read PDF file"""
        if not PARSING_AVAILABLE:
            raise ImportError("PDF parsing not available. Install pypdf2 or pdfplumber")
        
        try:
            # Try pdfplumber first (better text extraction)
            with pdfplumber.open(file_path) as pdf:
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() or ""
                return text.strip()
        except:
            # Fallback to pypdf2
            try:
                import PyPDF2
                with open(file_path, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    text = ""
                    for page in reader.pages:
                        text += page.extract_text() or ""
                    return text.strip()
            except Exception as e:
                raise Exception(f"Failed to read PDF: {e}")
    
    def _read_docx(self, file_path: Path) -> str:
        """Read DOCX file"""
        if not PARSING_AVAILABLE:
            raise ImportError("DOCX parsing not available. Install python-docx")
        
        doc = Document(file_path)
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        return "\n\n".join(paragraphs)
    
    def _read_txt(self, file_path: Path) -> str:
        """Read text file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    def _read_html(self, file_path: Path) -> str:
        """Read HTML file"""
        if not PARSING_AVAILABLE:
            raise ImportError("HTML parsing not available. Install beautifulsoup4")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            return soup.get_text(separator='\n').strip()
    
    def chunk_text(
        self,
        text: str,
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None,
        preserve_paragraphs: bool = True
    ) -> List[str]:
        """
        Split text into chunks
        
        Args:
            text: Text to chunk
            chunk_size: Size of each chunk
            chunk_overlap: Overlap between chunks
            preserve_paragraphs: Try to keep paragraphs intact
        
        Returns:
            List of text chunks
        """
        chunk_size = chunk_size or self.chunk_size
        chunk_overlap = chunk_overlap or self.chunk_overlap
        
        if not text or len(text) < chunk_size:
            return [text] if text else []
        
        if preserve_paragraphs:
            return self._chunk_by_paragraphs(text, chunk_size, chunk_overlap)
        else:
            return self._chunk_by_size(text, chunk_size, chunk_overlap)
    
    def _chunk_by_paragraphs(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """Chunk text while preserving paragraph boundaries"""
        # Split into paragraphs
        paragraphs = re.split(r'\n\s*\n', text)
        
        chunks = []
        current_chunk = ""
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            # If adding this paragraph exceeds chunk size
            if len(current_chunk) + len(para) > chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                
                # Start new chunk with overlap
                overlap_text = current_chunk[-overlap:] if overlap > 0 else ""
                current_chunk = overlap_text + "\n\n" + para
            else:
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para
        
        # Add last chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _chunk_by_size(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """Chunk text by fixed size with overlap"""
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                
                if break_point > chunk_size * 0.5:  # Only if we're past halfway
                    chunk = chunk[:break_point + 1]
                    end = start + break_point + 1
            
            chunks.append(chunk.strip())
            start = end - overlap
        
        return [c for c in chunks if c]  # Remove empty chunks
    
    def extract_legal_clauses(self, text: str) -> List[Dict[str, str]]:
        """
        Extract legal clauses from document
        
        Args:
            text: Document text
        
        Returns:
            List of clauses with metadata
        """
        clauses = []
        
        # Common legal clause patterns
        patterns = [
            (r'(?:WHEREAS|Whereas)\s+(.+?)(?=WHEREAS|Whereas|NOW THEREFORE|$)', 'Recital'),
            (r'(?:Article|ARTICLE|Section|SECTION)\s+(\d+\.?\d*)\s*[:\-]\s*(.+?)(?=Article|ARTICLE|Section|SECTION|$)', 'Section'),
            (r'(?:Clause|CLAUSE)\s+(\d+\.?\d*)\s*[:\-]\s*(.+?)(?=Clause|CLAUSE|$)', 'Clause'),
            (r'(?:Definition|DEFINITION)\s*[:\-]\s*(.+?)(?=Definition|DEFINITION|$)', 'Definition'),
        ]
        
        for pattern, clause_type in patterns:
            matches = re.finditer(pattern, text, re.DOTALL | re.IGNORECASE)
            for match in matches:
                clause_text = match.group(0).strip()
                if len(clause_text) > 50:  # Ignore very short matches
                    clauses.append({
                        'type': clause_type,
                        'text': clause_text[:500],  # Limit length
                        'position': match.start()
                    })
        
        # Sort by position
        clauses.sort(key=lambda x: x['position'])
        
        return clauses
    
    def preprocess_legal_document(self, text: str) -> str:
        """
        Preprocess legal document text
        
        Args:
            text: Raw document text
        
        Returns:
            Preprocessed text
        """
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove page numbers (common patterns)
        text = re.sub(r'Page\s+\d+\s+of\s+\d+', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\n\s*\d+\s*\n', '\n', text)
        
        # Normalize paragraph breaks
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Clean up common artifacts
        text = text.replace('\x0c', '')  # Form feed
        text = text.replace('\r', '\n')  # Carriage return
        
        return text.strip()
    
    def process_document_for_rag(
        self,
        file_path: str,
        document_type: Optional[str] = None,
        extract_clauses: bool = False
    ) -> List[Dict]:
        """
        Process document for RAG (complete pipeline)
        
        Args:
            file_path: Path to document
            document_type: Type of document (contract, agreement, etc.)
            extract_clauses: Whether to extract individual clauses
        
        Returns:
            List of chunks with metadata ready for vector DB
        """
        # Read file
        content, metadata = self.read_file(file_path)
        
        # Preprocess
        content = self.preprocess_legal_document(content)
        
        # Add document type to metadata
        if document_type:
            metadata['type'] = document_type
        
        # Extract clauses if requested
        if extract_clauses:
            clauses = self.extract_legal_clauses(content)
            metadata['num_clauses'] = len(clauses)
        
        # Chunk the document
        chunks = self.chunk_text(content)
        
        # Create chunk objects with metadata
        processed_chunks = []
        for i, chunk in enumerate(chunks):
            chunk_metadata = metadata.copy()
            chunk_metadata['chunk_index'] = i
            chunk_metadata['total_chunks'] = len(chunks)
            
            processed_chunks.append({
                'text': chunk,
                'metadata': chunk_metadata
            })
        
        logger.info(f"📄 Processed {file_path}: {len(chunks)} chunks")
        return processed_chunks
    
    def process_directory(
        self,
        directory: str,
        file_extensions: Optional[List[str]] = None,
        recursive: bool = True
    ) -> List[Dict]:
        """
        Process all documents in a directory
        
        Args:
            directory: Path to directory
            file_extensions: List of extensions to process (default: all supported)
            recursive: Whether to search subdirectories
        
        Returns:
            List of processed chunks from all documents
        """
        if not file_extensions:
            file_extensions = ['.pdf', '.docx', '.txt', '.md', '.html']
        
        directory = Path(directory)
        all_chunks = []
        
        # Get all matching files
        pattern = '**/*' if recursive else '*'
        for ext in file_extensions:
            files = directory.glob(f"{pattern}{ext}")
            
            for file_path in files:
                try:
                    chunks = self.process_document_for_rag(str(file_path))
                    all_chunks.extend(chunks)
                except Exception as e:
                    logger.error(f"Failed to process {file_path}: {e}")
        
        logger.info(f"📁 Processed directory {directory}: {len(all_chunks)} total chunks")
        return all_chunks


# Singleton instance
doc_processor = DocumentProcessor()
