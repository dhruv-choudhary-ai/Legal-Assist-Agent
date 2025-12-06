"""
Legal Ontology and Clause Tagging System
Structured knowledge representation for legal clauses and concepts

Features:
- Hierarchical legal taxonomy
- Clause categorization and tagging
- Risk assessment
- Semantic search optimization
"""

import json
import logging
from typing import List, Dict, Optional, Set
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)


class LegalArea(Enum):
    """Primary areas of Indian law"""
    CONTRACT_LAW = "Contract Law"
    PROPERTY_LAW = "Property Law"
    CORPORATE_LAW = "Corporate Law"
    EMPLOYMENT_LAW = "Employment Law"
    INTELLECTUAL_PROPERTY = "Intellectual Property"
    FAMILY_LAW = "Family Law"
    CRIMINAL_LAW = "Criminal Law"
    TAX_LAW = "Tax Law"
    CONSUMER_LAW = "Consumer Law"
    CYBER_LAW = "Cyber Law"


class RiskLevel(Enum):
    """Risk levels for clauses"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    MINIMAL = "minimal"


class Enforceability(Enum):
    """Enforceability ratings"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNENFORCEABLE = "unenforceable"
    CONTEXTUAL = "contextual"


@dataclass
class LegalClause:
    """Structured representation of a legal clause"""
    clause_id: str
    clause_text: str
    clause_type: str
    sub_type: Optional[str] = None
    legal_area: str = LegalArea.CONTRACT_LAW.value
    jurisdiction: str = "India"
    risk_level: str = RiskLevel.MEDIUM.value
    enforceability: str = Enforceability.HIGH.value
    applicable_acts: List[str] = None
    keywords: List[str] = None
    must_include: bool = False
    common_errors: List[str] = None
    best_practices: List[str] = None
    related_clauses: List[str] = None
    
    def __post_init__(self):
        if self.applicable_acts is None:
            self.applicable_acts = []
        if self.keywords is None:
            self.keywords = []
        if self.common_errors is None:
            self.common_errors = []
        if self.best_practices is None:
            self.best_practices = []
        if self.related_clauses is None:
            self.related_clauses = []
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'LegalClause':
        """Create from dictionary"""
        return cls(**data)


class LegalOntology:
    """
    Legal knowledge ontology for clause organization and retrieval
    
    Organizes legal concepts hierarchically:
    Area → Sub-Area → Document Type → Clause Type → Specific Clause
    """
    
    def __init__(self, ontology_file: Optional[str] = None):
        """Initialize legal ontology"""
        self.ontology_file = ontology_file or "backend/data/legal_ontology.json"
        self.clauses: Dict[str, LegalClause] = {}
        self.taxonomy: Dict = self._build_taxonomy()
        self.load_ontology()
    
    def _build_taxonomy(self) -> Dict:
        """Build hierarchical legal taxonomy"""
        return {
            "Contract Law": {
                "Employment Contracts": [
                    "Job Description", "Compensation", "Benefits", "Working Hours",
                    "Leave Policy", "Termination", "Non-Compete", "Confidentiality",
                    "Probation Period", "Notice Period", "Severance"
                ],
                "Service Agreements": [
                    "Scope of Services", "Payment Terms", "Deliverables", "Timeline",
                    "Warranties", "Indemnification", "Limitation of Liability",
                    "Termination", "Dispute Resolution"
                ],
                "Non-Disclosure Agreements": [
                    "Definition of Confidential Information", "Obligations",
                    "Exceptions", "Duration", "Return of Materials", "Remedies"
                ],
                "Partnership Agreements": [
                    "Capital Contribution", "Profit Sharing", "Management",
                    "Decision Making", "Dissolution", "Non-Compete"
                ]
            },
            "Property Law": {
                "Lease Agreements": [
                    "Property Description", "Lease Period", "Rent", "Security Deposit",
                    "Maintenance", "Subletting", "Termination", "Lock-in Period",
                    "Stamp Duty", "Notice Period"
                ],
                "Sale Deeds": [
                    "Property Description", "Sale Consideration", "Payment Schedule",
                    "Possession Date", "Title Warranty", "Encumbrances",
                    "Registration", "Stamp Duty"
                ],
                "Gift Deeds": [
                    "Donor Details", "Donee Details", "Property Description",
                    "Gift Declaration", "Acceptance", "Consideration", "Registration"
                ]
            },
            "Corporate Law": {
                "Shareholder Agreements": [
                    "Share Capital", "Voting Rights", "Board Composition",
                    "Transfer Restrictions", "Tag-Along Rights", "Drag-Along Rights",
                    "Exit Mechanisms", "Dispute Resolution"
                ],
                "Board Resolutions": [
                    "Meeting Notice", "Quorum", "Agenda Items", "Voting",
                    "Approval of Actions", "Execution"
                ]
            },
            "Intellectual Property": {
                "IP Assignment": [
                    "IP Description", "Assignor/Assignee", "Consideration",
                    "Warranties", "Indemnification", "Registration"
                ],
                "License Agreements": [
                    "Licensed IP", "License Grant", "Territory", "Duration",
                    "Royalties", "Termination", "Sublicensing"
                ]
            }
        }
    
    def create_standard_clauses(self) -> List[LegalClause]:
        """Create standard clause library"""
        standard_clauses = [
            # Employment Contract Clauses
            LegalClause(
                clause_id="emp_job_desc_01",
                clause_text="The Employee shall perform the duties of [Job Title] as assigned by the Employer from time to time.",
                clause_type="Job Description",
                legal_area=LegalArea.EMPLOYMENT_LAW.value,
                applicable_acts=["Industrial Disputes Act, 1947", "Shops and Establishments Act"],
                keywords=["job title", "duties", "responsibilities"],
                risk_level=RiskLevel.LOW.value,
                enforceability=Enforceability.HIGH.value,
                must_include=True,
                best_practices=["Be specific about role", "Allow flexibility for reasonable changes"]
            ),
            
            LegalClause(
                clause_id="emp_noncompete_01",
                clause_text="The Employee agrees not to engage in any business competitive with the Employer for a period of [X years] within [Territory] after termination of employment.",
                clause_type="Non-Compete",
                legal_area=LegalArea.EMPLOYMENT_LAW.value,
                applicable_acts=["Indian Contract Act, 1872, Section 27"],
                keywords=["non-compete", "restraint of trade", "competitive business"],
                risk_level=RiskLevel.HIGH.value,
                enforceability=Enforceability.LOW.value,
                must_include=False,
                common_errors=[
                    "Making it too broad (likely unenforceable)",
                    "Not specifying reasonable duration (max 2 years)",
                    "Not specifying reasonable territory"
                ],
                best_practices=[
                    "Keep duration reasonable (typically 6-12 months)",
                    "Limit to specific geography",
                    "Consider non-solicitation instead",
                    "Note: Section 27 of Indian Contract Act makes most non-competes void"
                ]
            ),
            
            LegalClause(
                clause_id="emp_confidentiality_01",
                clause_text="The Employee shall not disclose any Confidential Information of the Employer to third parties during or after employment.",
                clause_type="Confidentiality",
                legal_area=LegalArea.EMPLOYMENT_LAW.value,
                applicable_acts=["Indian Contract Act, 1872", "Information Technology Act, 2000"],
                keywords=["confidentiality", "trade secrets", "proprietary information"],
                risk_level=RiskLevel.MEDIUM.value,
                enforceability=Enforceability.HIGH.value,
                must_include=True,
                best_practices=[
                    "Define 'Confidential Information' clearly",
                    "Specify exceptions (publicly available info)",
                    "Include post-employment obligations"
                ]
            ),
            
            # Lease Agreement Clauses
            LegalClause(
                clause_id="lease_rent_01",
                clause_text="The Tenant shall pay monthly rent of INR [Amount] on or before the [X] day of each month.",
                clause_type="Rent Payment",
                legal_area=LegalArea.PROPERTY_LAW.value,
                applicable_acts=["Transfer of Property Act, 1882"],
                keywords=["rent", "payment", "monthly", "due date"],
                risk_level=RiskLevel.LOW.value,
                enforceability=Enforceability.HIGH.value,
                must_include=True,
                best_practices=[
                    "Specify exact amount",
                    "Mention due date",
                    "Include late payment penalties",
                    "Specify payment method"
                ]
            ),
            
            LegalClause(
                clause_id="lease_deposit_01",
                clause_text="The Tenant shall pay a refundable security deposit of INR [Amount] (equivalent to [X] months' rent) at the time of signing this Agreement.",
                clause_type="Security Deposit",
                legal_area=LegalArea.PROPERTY_LAW.value,
                applicable_acts=["Transfer of Property Act, 1882"],
                keywords=["security deposit", "refundable", "deposit amount"],
                risk_level=RiskLevel.MEDIUM.value,
                enforceability=Enforceability.HIGH.value,
                must_include=True,
                best_practices=[
                    "Typically 2-3 months rent",
                    "Specify refund conditions",
                    "Mention deduction scenarios",
                    "Include timeline for refund after vacating"
                ]
            ),
            
            LegalClause(
                clause_id="lease_lockin_01",
                clause_text="This lease is subject to a lock-in period of [X] months, during which neither party may terminate the Agreement except for material breach.",
                clause_type="Lock-in Period",
                legal_area=LegalArea.PROPERTY_LAW.value,
                applicable_acts=["Transfer of Property Act, 1882", "Indian Contract Act, 1872"],
                keywords=["lock-in", "minimum tenure", "termination restriction"],
                risk_level=RiskLevel.MEDIUM.value,
                enforceability=Enforceability.HIGH.value,
                must_include=False,
                best_practices=[
                    "Typically 6-11 months",
                    "Clearly define exceptions (material breach)",
                    "Specify penalties for early termination"
                ]
            ),
            
            # NDA Clauses
            LegalClause(
                clause_id="nda_definition_01",
                clause_text="'Confidential Information' means all information disclosed by one party to the other, whether in writing, orally, or by any other means, including but not limited to technical data, business plans, customer lists, and financial information.",
                clause_type="Definition of Confidential Information",
                legal_area=LegalArea.CONTRACT_LAW.value,
                applicable_acts=["Indian Contract Act, 1872"],
                keywords=["confidential information", "definition", "scope"],
                risk_level=RiskLevel.LOW.value,
                enforceability=Enforceability.HIGH.value,
                must_include=True,
                best_practices=[
                    "Be comprehensive but not overly broad",
                    "Include both written and oral information",
                    "Specify information marked as confidential"
                ]
            ),
            
            LegalClause(
                clause_id="nda_exceptions_01",
                clause_text="Confidential Information does not include information that: (a) is publicly available; (b) was rightfully known prior to disclosure; (c) is independently developed; or (d) is required to be disclosed by law.",
                clause_type="Exceptions to Confidentiality",
                legal_area=LegalArea.CONTRACT_LAW.value,
                applicable_acts=["Indian Contract Act, 1872"],
                keywords=["exceptions", "public information", "legal disclosure"],
                risk_level=RiskLevel.LOW.value,
                enforceability=Enforceability.HIGH.value,
                must_include=True,
                best_practices=[
                    "Include standard carve-outs",
                    "Address legal disclosure requirements",
                    "Consider public domain exception"
                ]
            ),
            
            # General Contract Clauses
            LegalClause(
                clause_id="gen_governing_law_01",
                clause_text="This Agreement shall be governed by and construed in accordance with the laws of India, and the parties submit to the exclusive jurisdiction of courts in [City], India.",
                clause_type="Governing Law",
                legal_area=LegalArea.CONTRACT_LAW.value,
                applicable_acts=["Indian Contract Act, 1872", "Code of Civil Procedure, 1908"],
                keywords=["governing law", "jurisdiction", "dispute resolution"],
                risk_level=RiskLevel.MEDIUM.value,
                enforceability=Enforceability.HIGH.value,
                must_include=True,
                best_practices=[
                    "Specify Indian law",
                    "Name specific city for jurisdiction",
                    "Consider arbitration clause as alternative"
                ]
            ),
            
            LegalClause(
                clause_id="gen_arbitration_01",
                clause_text="Any dispute arising out of or in connection with this Agreement shall be resolved through arbitration in accordance with the Arbitration and Conciliation Act, 1996, with seat of arbitration in [City], India.",
                clause_type="Arbitration",
                legal_area=LegalArea.CONTRACT_LAW.value,
                applicable_acts=["Arbitration and Conciliation Act, 1996"],
                keywords=["arbitration", "dispute resolution", "adr"],
                risk_level=RiskLevel.LOW.value,
                enforceability=Enforceability.HIGH.value,
                must_include=False,
                best_practices=[
                    "Specify seat of arbitration",
                    "Mention number of arbitrators",
                    "Consider costs allocation",
                    "Alternative to court litigation"
                ]
            ),
            
            LegalClause(
                clause_id="gen_force_majeure_01",
                clause_text="Neither party shall be liable for failure to perform its obligations due to Force Majeure events including but not limited to acts of God, war, pandemic, natural disasters, or government actions, provided notice is given within [X] days.",
                clause_type="Force Majeure",
                legal_area=LegalArea.CONTRACT_LAW.value,
                applicable_acts=["Indian Contract Act, 1872, Section 56"],
                keywords=["force majeure", "impossibility", "frustration"],
                risk_level=RiskLevel.MEDIUM.value,
                enforceability=Enforceability.HIGH.value,
                must_include=False,
                best_practices=[
                    "List specific events (pandemic, natural disasters, etc.)",
                    "Include notice requirements",
                    "Specify consequences (suspension vs termination)",
                    "Set time limits"
                ]
            )
        ]
        
        return standard_clauses
    
    def add_clause(self, clause: LegalClause):
        """Add clause to ontology"""
        self.clauses[clause.clause_id] = clause
        logger.info(f"✅ Added clause: {clause.clause_id}")
    
    def get_clause(self, clause_id: str) -> Optional[LegalClause]:
        """Get clause by ID"""
        return self.clauses.get(clause_id)
    
    def search_clauses(
        self,
        clause_type: Optional[str] = None,
        legal_area: Optional[str] = None,
        risk_level: Optional[str] = None,
        must_include: Optional[bool] = None,
        keywords: Optional[List[str]] = None
    ) -> List[LegalClause]:
        """Search clauses by criteria"""
        results = list(self.clauses.values())
        
        if clause_type:
            results = [c for c in results if c.clause_type == clause_type]
        
        if legal_area:
            results = [c for c in results if c.legal_area == legal_area]
        
        if risk_level:
            results = [c for c in results if c.risk_level == risk_level]
        
        if must_include is not None:
            results = [c for c in results if c.must_include == must_include]
        
        if keywords:
            results = [c for c in results if any(kw.lower() in ' '.join(c.keywords).lower() for kw in keywords)]
        
        return results
    
    def get_required_clauses(self, document_type: str) -> List[LegalClause]:
        """Get all required clauses for a document type"""
        # Map document types to legal areas
        type_mapping = {
            "Employment Agreement": LegalArea.EMPLOYMENT_LAW.value,
            "Lease Agreement": LegalArea.PROPERTY_LAW.value,
            "NDA": LegalArea.CONTRACT_LAW.value,
            "Service Agreement": LegalArea.CONTRACT_LAW.value
        }
        
        legal_area = type_mapping.get(document_type, LegalArea.CONTRACT_LAW.value)
        return self.search_clauses(legal_area=legal_area, must_include=True)
    
    def save_ontology(self):
        """Save ontology to file"""
        data = {
            "clauses": {cid: clause.to_dict() for cid, clause in self.clauses.items()},
            "taxonomy": self.taxonomy
        }
        
        Path(self.ontology_file).parent.mkdir(parents=True, exist_ok=True)
        with open(self.ontology_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"💾 Ontology saved: {self.ontology_file} ({len(self.clauses)} clauses)")
    
    def load_ontology(self):
        """Load ontology from file"""
        if not Path(self.ontology_file).exists():
            logger.info("📝 Creating new ontology with standard clauses")
            standard_clauses = self.create_standard_clauses()
            for clause in standard_clauses:
                self.add_clause(clause)
            self.save_ontology()
            return
        
        with open(self.ontology_file, 'r') as f:
            data = json.load(f)
        
        for clause_id, clause_data in data.get('clauses', {}).items():
            self.clauses[clause_id] = LegalClause.from_dict(clause_data)
        
        logger.info(f"✅ Loaded ontology: {len(self.clauses)} clauses")


# Global ontology instance
legal_ontology = LegalOntology()


if __name__ == "__main__":
    # Test ontology
    ontology = LegalOntology()
    
    print("\n" + "="*60)
    print("LEGAL ONTOLOGY SYSTEM")
    print("="*60)
    
    # Search for employment clauses
    emp_clauses = ontology.search_clauses(legal_area=LegalArea.EMPLOYMENT_LAW.value)
    print(f"\nEmployment Law Clauses: {len(emp_clauses)}")
    for clause in emp_clauses:
        print(f"  - {clause.clause_id}: {clause.clause_type} (Risk: {clause.risk_level})")
    
    # Get required clauses for lease
    required = ontology.get_required_clauses("Lease Agreement")
    print(f"\nRequired Clauses for Lease Agreement: {len(required)}")
    for clause in required:
        print(f"  - {clause.clause_type}")
    
    # Search by keywords
    confidentiality = ontology.search_clauses(keywords=["confidentiality"])
    print(f"\nConfidentiality-related Clauses: {len(confidentiality)}")
    
    print("\n" + "="*60)
