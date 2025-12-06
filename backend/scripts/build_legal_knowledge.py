"""
Indian Legal Knowledge Base Scraper
Scrapes verified Indian legal content for RAG knowledge base

Sources:
1. India Code (indiacode.nic.in) - Official Indian Acts
2. Sample legal templates (for demonstration)
3. Legal definitions and glossaries

Note: This is a framework. Actual web scraping requires compliance with
website terms of service and robots.txt
"""

import os
import json
import logging
from typing import List, Dict, Optional
from pathlib import Path
import requests
from bs4 import BeautifulSoup
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IndianLegalKnowledgeBuilder:
    """Build verified Indian legal knowledge base"""
    
    # Indian Acts database with metadata
    INDIAN_ACTS = {
        "Indian Contract Act, 1872": {
            "url": "https://legislative.gov.in/sites/default/files/A1872-09.pdf",
            "sections": 238,
            "category": "Contract Law",
            "keywords": ["contract", "agreement", "consideration", "void", "voidable"]
        },
        "Transfer of Property Act, 1882": {
            "url": "https://legislative.gov.in/sites/default/files/A1882-04.pdf",
            "sections": 137,
            "category": "Property Law",
            "keywords": ["property", "transfer", "sale", "mortgage", "lease"]
        },
        "Companies Act, 2013": {
            "url": "https://www.mca.gov.in/Ministry/pdf/CompaniesAct2013.pdf",
            "sections": 470,
            "category": "Corporate Law",
            "keywords": ["company", "director", "shares", "board", "incorporation"]
        },
        "Indian Penal Code, 1860": {
            "url": "https://legislative.gov.in/sites/default/files/A1860-45.pdf",
            "sections": 511,
            "category": "Criminal Law",
            "keywords": ["offence", "punishment", "crime", "penalty"]
        },
        "Information Technology Act, 2000": {
            "url": "https://www.meity.gov.in/writereaddata/files/itbill2000.pdf",
            "sections": 94,
            "category": "Cyber Law",
            "keywords": ["electronic", "digital", "cyber", "data protection"]
        },
        "Consumer Protection Act, 2019": {
            "url": "https://consumeraffairs.nic.in/sites/default/files/CP%20Act%202019.pdf",
            "sections": 107,
            "category": "Consumer Law",
            "keywords": ["consumer", "complaint", "defect", "service", "goods"]
        }
    }
    
    def __init__(self, output_dir: str = "backend/data/legal_knowledge"):
        """Initialize knowledge builder"""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        (self.output_dir / "acts").mkdir(exist_ok=True)
        (self.output_dir / "cases").mkdir(exist_ok=True)
        (self.output_dir / "templates").mkdir(exist_ok=True)
        (self.output_dir / "regulations").mkdir(exist_ok=True)
        
        logger.info(f"📁 Output directory: {self.output_dir}")
    
    def create_sample_legal_knowledge(self):
        """
        Create sample legal knowledge base with verified Indian legal content
        This serves as a foundation until web scraping is implemented
        """
        logger.info("📚 Creating sample Indian legal knowledge base...")
        
        # 1. Indian Contract Act excerpts
        contract_act = self._create_contract_act_knowledge()
        self._save_knowledge("acts/indian_contract_act_1872.json", contract_act)
        
        # 2. Property law excerpts
        property_act = self._create_property_act_knowledge()
        self._save_knowledge("acts/transfer_of_property_act_1882.json", property_act)
        
        # 3. Companies Act excerpts
        companies_act = self._create_companies_act_knowledge()
        self._save_knowledge("acts/companies_act_2013.json", companies_act)
        
        # 4. Legal templates
        templates = self._create_legal_templates()
        self._save_knowledge("templates/standard_templates.json", templates)
        
        # 5. Legal definitions glossary
        glossary = self._create_legal_glossary()
        self._save_knowledge("glossary.json", glossary)
        
        # 6. Case law summaries (landmark cases)
        cases = self._create_landmark_cases()
        self._save_knowledge("cases/landmark_cases.json", cases)
        
        logger.info("✅ Sample legal knowledge base created successfully!")
        
        return {
            "total_acts": 3,
            "total_templates": len(templates),
            "total_glossary_terms": len(glossary),
            "total_cases": len(cases)
        }
    
    def _create_contract_act_knowledge(self) -> List[Dict]:
        """Indian Contract Act, 1872 - Key sections"""
        return [
            {
                "act": "Indian Contract Act, 1872",
                "section": "Section 10",
                "title": "What agreements are contracts",
                "content": "All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void.",
                "keywords": ["contract", "agreement", "free consent", "lawful consideration"],
                "category": "Contract Law",
                "importance": "critical"
            },
            {
                "act": "Indian Contract Act, 1872",
                "section": "Section 2(h)",
                "title": "Definition of Contract",
                "content": "An agreement enforceable by law is a contract.",
                "keywords": ["contract", "agreement", "enforceable"],
                "category": "Contract Law",
                "importance": "critical"
            },
            {
                "act": "Indian Contract Act, 1872",
                "section": "Section 73",
                "title": "Compensation for loss or damage caused by breach of contract",
                "content": "When a contract has been broken, the party who suffers by such breach is entitled to receive, from the party who has broken the contract, compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things from such breach, or which the parties knew, when they made the contract, to be likely to result from the breach of it.",
                "keywords": ["breach", "compensation", "damage", "loss"],
                "category": "Contract Law",
                "importance": "high"
            },
            {
                "act": "Indian Contract Act, 1872",
                "section": "Section 27",
                "title": "Agreement in restraint of trade void",
                "content": "Every agreement by which anyone is restrained from exercising a lawful profession, trade or business of any kind, is to that extent void. Exception 1: One who sells the goodwill of a business may agree with the buyer to refrain from carrying on a similar business, within specified local limits, so long as the buyer carries on a like business therein.",
                "keywords": ["restraint of trade", "non-compete", "void", "business"],
                "category": "Contract Law",
                "importance": "high"
            },
            {
                "act": "Indian Contract Act, 1872",
                "section": "Section 124",
                "title": "Contract of Indemnity",
                "content": "A contract by which one party promises to save the other from loss caused to him by the conduct of the promisor himself, or by the conduct of any other person, is called a 'contract of indemnity'.",
                "keywords": ["indemnity", "loss", "save from loss"],
                "category": "Contract Law",
                "importance": "medium"
            }
        ]
    
    def _create_property_act_knowledge(self) -> List[Dict]:
        """Transfer of Property Act, 1882 - Key sections"""
        return [
            {
                "act": "Transfer of Property Act, 1882",
                "section": "Section 5",
                "title": "Transfer of property defined",
                "content": "Transfer of property means an act by which a living person conveys property, in present or in future, to one or more other living persons, or to himself and one or more other living persons; and 'to transfer property' is to perform such act.",
                "keywords": ["transfer", "property", "convey"],
                "category": "Property Law",
                "importance": "critical"
            },
            {
                "act": "Transfer of Property Act, 1882",
                "section": "Section 54",
                "title": "Sale defined",
                "content": "Sale is a transfer of ownership in exchange for a price paid or promised or part-paid and part-promised. Sale how made: Such transfer, in the case of tangible immovable property of the value of one hundred rupees and upwards, or in the case of a reversion or other intangible thing, can be made only by a registered instrument.",
                "keywords": ["sale", "ownership", "price", "registered"],
                "category": "Property Law",
                "importance": "critical"
            },
            {
                "act": "Transfer of Property Act, 1882",
                "section": "Section 105",
                "title": "Lease defined",
                "content": "A lease of immovable property is a transfer of a right to enjoy such property, made for a certain time, express or implied, or in perpetuity, in consideration of a price paid or promised, or of money, a share of crops, service or any other thing of value, to be rendered periodically or on specified occasions to the transferor by the transferee, who accepts the transfer on such terms.",
                "keywords": ["lease", "immovable property", "rent", "transferor", "transferee"],
                "category": "Property Law",
                "importance": "critical"
            },
            {
                "act": "Transfer of Property Act, 1882",
                "section": "Section 106",
                "title": "Duration of certain leases in absence of written contract or local usage",
                "content": "In the absence of a contract or local law or usage to the contrary, a lease of immovable property for agricultural or manufacturing purposes shall be deemed to be a lease from year to year, terminable on the part of either lessor or lessee, by six months' notice expiring with the end of a year of the tenancy.",
                "keywords": ["lease duration", "agricultural", "manufacturing", "notice"],
                "category": "Property Law",
                "importance": "high"
            }
        ]
    
    def _create_companies_act_knowledge(self) -> List[Dict]:
        """Companies Act, 2013 - Key sections"""
        return [
            {
                "act": "Companies Act, 2013",
                "section": "Section 2(20)",
                "title": "Definition of Company",
                "content": "Company means a company incorporated under this Act or under any previous company law.",
                "keywords": ["company", "incorporated"],
                "category": "Corporate Law",
                "importance": "critical"
            },
            {
                "act": "Companies Act, 2013",
                "section": "Section 7",
                "title": "Incorporation of company",
                "content": "A company may be formed for any lawful purpose by seven or more persons (or two or more persons in case of a private company), by subscribing their names to a memorandum and complying with the requirements of this Act in respect of registration.",
                "keywords": ["incorporation", "memorandum", "registration", "private company"],
                "category": "Corporate Law",
                "importance": "critical"
            },
            {
                "act": "Companies Act, 2013",
                "section": "Section 149",
                "title": "Company to have Board of Directors",
                "content": "Every company shall have a Board of Directors consisting of individuals as directors and shall have a minimum number of three directors in the case of a public company, two directors in the case of a private company, and one director in the case of a One Person Company.",
                "keywords": ["board of directors", "directors", "public company", "private company"],
                "category": "Corporate Law",
                "importance": "high"
            }
        ]
    
    def _create_legal_templates(self) -> List[Dict]:
        """Standard legal document templates"""
        return [
            {
                "template_name": "Non-Disclosure Agreement (NDA)",
                "category": "Employment/Business",
                "jurisdiction": "India",
                "description": "Standard confidentiality agreement between two parties",
                "key_clauses": [
                    "Definition of Confidential Information",
                    "Obligations of Receiving Party",
                    "Time Period (typically 2-5 years)",
                    "Exceptions to Confidentiality",
                    "Return of Materials",
                    "Remedies for Breach",
                    "Governing Law and Jurisdiction (Indian jurisdiction)"
                ],
                "applicable_laws": ["Indian Contract Act, 1872"],
                "risk_level": "Low",
                "enforceability": "High"
            },
            {
                "template_name": "Employment Agreement",
                "category": "Employment",
                "jurisdiction": "India",
                "description": "Contract between employer and employee",
                "key_clauses": [
                    "Job Title and Responsibilities",
                    "Compensation and Benefits",
                    "Working Hours",
                    "Leave Policy",
                    "Termination Clause (Notice Period)",
                    "Non-Compete Clause (Must comply with Section 27 of Contract Act - limited enforceability)",
                    "Confidentiality Obligations",
                    "Governing Law"
                ],
                "applicable_laws": [
                    "Indian Contract Act, 1872",
                    "Industrial Disputes Act, 1947",
                    "Payment of Wages Act, 1936",
                    "Shops and Establishments Act (State-specific)"
                ],
                "risk_level": "Medium",
                "enforceability": "High"
            },
            {
                "template_name": "Lease Agreement (11 Months)",
                "category": "Property",
                "jurisdiction": "India",
                "description": "Short-term lease for residential/commercial property (11 months to avoid registration)",
                "key_clauses": [
                    "Property Description",
                    "Lease Period (11 months)",
                    "Rent Amount",
                    "Security Deposit (typically 2-3 months rent)",
                    "Maintenance Responsibilities",
                    "Termination Clause",
                    "Lock-in Period",
                    "Notice Period",
                    "Stamp Duty Payment"
                ],
                "applicable_laws": [
                    "Transfer of Property Act, 1882",
                    "Registration Act, 1908",
                    "Indian Stamp Act, 1899"
                ],
                "risk_level": "Low",
                "enforceability": "High",
                "note": "11-month leases avoid mandatory registration under Section 107 of Transfer of Property Act"
            }
        ]
    
    def _create_legal_glossary(self) -> List[Dict]:
        """Legal terms glossary"""
        return [
            {
                "term": "Force Majeure",
                "definition": "Unforeseeable circumstances that prevent someone from fulfilling a contract",
                "example": "Natural disasters, war, pandemic (COVID-19)",
                "usage": "Force majeure clauses excuse parties from liability in extraordinary events"
            },
            {
                "term": "Consideration",
                "definition": "Something of value given by both parties to a contract that induces them to enter into the agreement",
                "legal_reference": "Section 2(d) of Indian Contract Act, 1872",
                "example": "Payment in exchange for services"
            },
            {
                "term": "Void Agreement",
                "definition": "An agreement not enforceable by law",
                "legal_reference": "Section 2(g) of Indian Contract Act, 1872",
                "example": "Agreement in restraint of marriage, agreement to commit a crime"
            },
            {
                "term": "Voidable Contract",
                "definition": "A contract that can be affirmed or rejected by one of the parties",
                "legal_reference": "Section 2(i) of Indian Contract Act, 1872",
                "example": "Contract made under coercion or undue influence"
            },
            {
                "term": "Indemnity",
                "definition": "A promise to compensate another for loss or damage",
                "legal_reference": "Section 124 of Indian Contract Act, 1872",
                "example": "Indemnity clauses in service agreements"
            }
        ]
    
    def _create_landmark_cases(self) -> List[Dict]:
        """Landmark Indian legal cases"""
        return [
            {
                "case_name": "Mohori Bibee v. Dharmodas Ghose (1903)",
                "court": "Privy Council",
                "area": "Contract Law - Minors",
                "principle": "Agreement with a minor is void ab initio (from the beginning)",
                "relevance": "Establishes that minors cannot enter into valid contracts in India",
                "section_applied": "Section 11, Indian Contract Act, 1872"
            },
            {
                "case_name": "Balfour v. Balfour (1919)",
                "court": "Court of Appeal (UK - applicable in India)",
                "area": "Contract Law - Intention to Create Legal Relations",
                "principle": "Domestic agreements between husband and wife are not contracts due to lack of intention to create legal relations",
                "relevance": "Distinguishes between social/domestic agreements and legal contracts"
            },
            {
                "case_name": "Hadley v. Baxendale (1854)",
                "court": "Court of Exchequer (UK - applied in India)",
                "area": "Contract Law - Damages for Breach",
                "principle": "Damages for breach of contract are limited to what arises naturally or what was in contemplation of both parties",
                "relevance": "Foundation for Section 73 of Indian Contract Act regarding compensation",
                "section_applied": "Section 73, Indian Contract Act, 1872"
            }
        ]
    
    def _save_knowledge(self, filename: str, data: List[Dict]):
        """Save knowledge to JSON file"""
        filepath = self.output_dir / filename
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Saved: {filepath} ({len(data)} items)")
    
    def load_into_vector_db(self):
        """
        Load all legal knowledge into vector database
        Uses existing RAG pipeline
        """
        try:
            from ai.rag_pipeline import rag_pipeline
            from ai.document_processor import doc_processor
            
            logger.info("📊 Loading legal knowledge into vector database...")
            
            # Process all JSON files in legal_knowledge directory
            stats = rag_pipeline.populate_knowledge_base(
                directory=str(self.output_dir),
                file_extensions=['.json', '.txt', '.md'],
                recursive=True
            )
            
            logger.info(f"✅ Loaded into vector DB: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"❌ Failed to load into vector DB: {e}")
            return {"error": str(e)}
    
    def generate_metadata_index(self) -> Dict:
        """Generate metadata index for all legal content"""
        index = {
            "total_acts": len(self.INDIAN_ACTS),
            "acts_covered": list(self.INDIAN_ACTS.keys()),
            "categories": set(),
            "last_updated": "2025-10-29",
            "version": "1.0"
        }
        
        for act, metadata in self.INDIAN_ACTS.items():
            index["categories"].add(metadata["category"])
        
        index["categories"] = list(index["categories"])
        
        # Save index
        with open(self.output_dir / "metadata_index.json", 'w') as f:
            json.dump(index, f, indent=2)
        
        logger.info(f"📑 Metadata index generated: {index}")
        return index


def main():
    """Main execution"""
    builder = IndianLegalKnowledgeBuilder()
    
    # Create sample knowledge base
    stats = builder.create_sample_legal_knowledge()
    
    # Generate metadata
    metadata = builder.generate_metadata_index()
    
    print("\n" + "="*60)
    print("✅ INDIAN LEGAL KNOWLEDGE BASE CREATED")
    print("="*60)
    print(f"Acts: {stats['total_acts']}")
    print(f"Templates: {stats['total_templates']}")
    print(f"Glossary Terms: {stats['total_glossary_terms']}")
    print(f"Landmark Cases: {stats['total_cases']}")
    print(f"\nLocation: {builder.output_dir}")
    print("\nNext Steps:")
    print("1. Run populate_vectordb.py to load into ChromaDB")
    print("2. Test RAG queries with enhanced knowledge base")
    print("3. Add more acts and legal content as needed")
    print("="*60)


if __name__ == "__main__":
    main()
