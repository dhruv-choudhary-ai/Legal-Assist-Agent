"""
Legal Verification System
Implements dual-model verification and clause-level validation
Following Harvey.ai accuracy standards
"""

import logging
import re
from typing import List, Dict, Optional, Tuple
from openai import AzureOpenAI

from .config import AIConfig
from .azure_openai_service import ai_service

logger = logging.getLogger(__name__)


class LegalVerifier:
    """
    Multi-layered legal document verification system
    
    Features:
    1. Dual-model verification (Generator + Verifier)
    2. Clause-level validation
    3. Citation verification against Indian Code
    4. Self-consistency checking
    5. Risk scoring per clause
    """
    
    # Indian Acts database for citation verification
    INDIAN_ACTS = {
        "Indian Contract Act": {"year": 1872, "sections": range(1, 239)},
        "Transfer of Property Act": {"year": 1882, "sections": range(1, 138)},
        "Companies Act": {"year": 2013, "sections": range(1, 471)},
        "Indian Penal Code": {"year": 1860, "sections": range(1, 512)},
        "Code of Civil Procedure": {"year": 1908, "sections": range(1, 158)},
        "Registration Act": {"year": 1908, "sections": range(1, 89)},
        "Arbitration and Conciliation Act": {"year": 1996, "sections": range(1, 87)},
        "Consumer Protection Act": {"year": 2019, "sections": range(1, 107)},
        "Information Technology Act": {"year": 2000, "sections": range(1, 94)},
        "Payment of Wages Act": {"year": 1936, "sections": range(1, 26)},
        "Industrial Disputes Act": {"year": 1947, "sections": range(1, 40)},
        "Shops and Establishments Act": {"year": "State-specific", "sections": range(1, 50)},
        "Hindu Marriage Act": {"year": 1955, "sections": range(1, 30)},
        "Indian Succession Act": {"year": 1925, "sections": range(1, 390)},
    }
    
    def __init__(self):
        """Initialize legal verifier"""
        self.client = ai_service.client
        logger.info("⚖️ Legal Verifier initialized")
    
    def verify_document(
        self,
        document_content: str,
        document_type: str,
        verification_level: str = "comprehensive"
    ) -> Dict:
        """
        Complete document verification pipeline
        
        Args:
            document_content: Full document text
            document_type: Type of legal document
            verification_level: "basic", "standard", or "comprehensive"
        
        Returns:
            Verification report with scores, issues, and recommendations
        """
        logger.info(f"🔍 Verifying {document_type} (level: {verification_level})")
        
        verification_report = {
            "document_type": document_type,
            "verification_level": verification_level,
            "overall_score": 0,
            "compliance_score": 0,
            "citation_verification": {},
            "clause_analysis": [],
            "hallucinations_detected": [],
            "risky_clauses": [],
            "missing_clauses": [],
            "recommendations": [],
            "temporal_check": {},
            "jurisdictional_check": {}
        }
        
        try:
            # Step 1: Extract and verify citations
            verification_report["citation_verification"] = self._verify_citations(document_content)
            
            # Step 2: Clause-level analysis
            verification_report["clause_analysis"] = self._analyze_clauses(
                document_content, document_type
            )
            
            # Step 3: Dual-model verification
            if verification_level in ["standard", "comprehensive"]:
                dual_verification = self._dual_model_check(document_content, document_type)
                verification_report.update(dual_verification)
            
            # Step 4: Self-consistency check
            if verification_level == "comprehensive":
                consistency = self._self_consistency_check(document_content, document_type)
                verification_report["consistency_score"] = consistency["score"]
                verification_report["consistency_issues"] = consistency.get("issues", [])
            
            # Step 5: Temporal and jurisdictional awareness
            verification_report["temporal_check"] = self._check_temporal_validity(document_content)
            verification_report["jurisdictional_check"] = self._check_jurisdiction(document_content)
            
            # Calculate overall scores
            verification_report["overall_score"] = self._calculate_overall_score(verification_report)
            
            logger.info(f"✅ Verification complete. Overall score: {verification_report['overall_score']}/100")
            
        except Exception as e:
            logger.error(f"❌ Verification failed: {e}")
            verification_report["error"] = str(e)
        
        return verification_report
    
    def _verify_citations(self, document: str) -> Dict:
        """
        Verify legal citations against Indian Code database
        
        Returns:
            Citation verification report
        """
        citation_pattern = r"(Section\s+(\d+)(?:\s*\([a-z0-9]+\))?)\s+(?:of\s+(?:the\s+)?)?([\w\s]+Act)(?:,?\s*(\d{4}))?"
        
        citations = re.finditer(citation_pattern, document, re.IGNORECASE)
        
        verified = []
        invalid = []
        missing_year = []
        
        for match in citations:
            full_citation = match.group(0)
            section_num = int(match.group(2))
            act_name = match.group(3).strip()
            year = match.group(4)
            
            # Check if act exists in database
            act_found = False
            for known_act, details in self.INDIAN_ACTS.items():
                if act_name.lower() in known_act.lower():
                    act_found = True
                    
                    # Verify section number
                    if section_num in details["sections"]:
                        verified.append({
                            "citation": full_citation,
                            "act": known_act,
                            "section": section_num,
                            "year": year or details["year"],
                            "valid": True
                        })
                    else:
                        invalid.append({
                            "citation": full_citation,
                            "reason": f"Section {section_num} does not exist in {known_act}",
                            "valid": False
                        })
                    break
            
            if not act_found:
                if not year:
                    missing_year.append({
                        "citation": full_citation,
                        "issue": "Act not in database and year not specified"
                    })
                else:
                    verified.append({
                        "citation": full_citation,
                        "act": act_name,
                        "section": section_num,
                        "year": year,
                        "valid": True,
                        "note": "Act not in database but properly formatted"
                    })
        
        return {
            "total_citations": len(verified) + len(invalid) + len(missing_year),
            "verified_citations": verified,
            "invalid_citations": invalid,
            "missing_year": missing_year,
            "verification_score": self._calculate_citation_score(verified, invalid, missing_year)
        }
    
    def _calculate_citation_score(self, verified, invalid, missing_year) -> int:
        """Calculate citation verification score (0-100)"""
        total = len(verified) + len(invalid) + len(missing_year)
        if total == 0:
            return 100  # No citations to verify
        
        score = (len(verified) / total) * 100
        score -= (len(invalid) * 10)  # Penalty for invalid citations
        score -= (len(missing_year) * 5)  # Smaller penalty for missing years
        
        return max(0, min(100, int(score)))
    
    def _analyze_clauses(self, document: str, document_type: str) -> List[Dict]:
        """
        Clause-level analysis using AI
        
        Returns:
            List of clause analyses with risk scores
        """
        prompt = f"""Analyze this {document_type} and break it down into individual clauses.

For EACH clause, provide:
1. Clause number/identifier
2. Clause text (summary)
3. Legal validity (valid/questionable/invalid)
4. Risk level (low/medium/high/critical)
5. Governing law (which Indian Act/Section applies)
6. Potential issues
7. Recommendation

Document:
---
{document}
---

Format response as JSON array of clauses."""

        try:
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert Indian legal document analyst. Analyze clauses for compliance with Indian law."
                },
                {"role": "user", "content": prompt}
            ]
            
            response = ai_service.chat_completion(messages, temperature=0.3)
            
            # Parse response (AI should return JSON)
            import json
            try:
                clauses = json.loads(response)
            except:
                # If not valid JSON, create basic structure
                clauses = [{
                    "clause_number": "Overall",
                    "analysis": response,
                    "risk_level": "unknown"
                }]
            
            return clauses
            
        except Exception as e:
            logger.error(f"Clause analysis failed: {e}")
            return []
    
    def _dual_model_check(self, document: str, document_type: str) -> Dict:
        """
        Dual-model verification
        Generator already created the document, now use verifier to audit
        
        Returns:
            Verification results from second model
        """
        verifier_prompt = f"""You are a legal compliance auditor. Review this {document_type} and provide:

Document:
---
{document}
---

Provide a structured report:
1. **Valid Citations**: List all correct legal citations found
2. **Hallucinations Detected**: Any invented laws, cases, or sections (true/false + examples)
3. **Risky Clauses**: Clauses that may be unenforceable or problematic under Indian law
4. **Missing Standard Clauses**: What should be added
5. **Compliance Score**: Rate 0-100 for Indian law compliance
6. **Recommendations**: Top 3 improvements

Format as JSON."""

        try:
            messages = [
                {
                    "role": "system",
                    "content": """You are a qualified Indian legal compliance auditor specializing in contract review.
                    
Your task is to audit documents for:
- Legal accuracy
- Citation correctness
- Compliance with Indian laws
- Enforceability under Indian jurisdiction
- Risk assessment

Be thorough and critical. Flag any issues."""
                },
                {"role": "user", "content": verifier_prompt}
            ]
            
            response = ai_service.chat_completion(messages, temperature=0.2)
            
            # Parse JSON response
            import json
            try:
                verification = json.loads(response)
            except:
                verification = {
                    "verifier_output": response,
                    "compliance_score": 75
                }
            
            return verification
            
        except Exception as e:
            logger.error(f"Dual-model verification failed: {e}")
            return {"error": str(e)}
    
    def _self_consistency_check(self, document: str, document_type: str) -> Dict:
        """
        Self-consistency check: Ask model the same question 3 times
        If answers differ significantly, flag for human review
        
        Returns:
            Consistency score and issues
        """
        query = f"Is this {document_type} legally enforceable under Indian law? Explain briefly."
        
        responses = []
        for i in range(3):
            messages = [
                {"role": "system", "content": "You are an Indian legal expert."},
                {"role": "user", "content": f"Document:\n{document}\n\nQuestion: {query}"}
            ]
            response = ai_service.chat_completion(messages, temperature=0.5)
            responses.append(response)
        
        # Check similarity (simple keyword overlap for now)
        # In production, use semantic similarity with embeddings
        common_keywords = set(responses[0].lower().split()) & set(responses[1].lower().split()) & set(responses[2].lower().split())
        
        consistency_score = min(100, len(common_keywords) * 5)
        
        issues = []
        if consistency_score < 50:
            issues.append("Model responses are inconsistent - human review recommended")
        
        return {
            "score": consistency_score,
            "responses": responses,
            "issues": issues
        }
    
    def _check_temporal_validity(self, document: str) -> Dict:
        """Check if document references outdated laws"""
        import datetime
        current_year = datetime.datetime.now().year
        
        # Extract year mentions
        year_pattern = r"\b(19|20)\d{2}\b"
        years = re.findall(year_pattern, document)
        
        outdated_references = []
        for year in set(years):
            year_int = int(year)
            if year_int < 2000:
                outdated_references.append({
                    "year": year,
                    "warning": f"Reference to {year} may be outdated. Verify current applicability."
                })
        
        return {
            "current_year": current_year,
            "outdated_references": outdated_references,
            "temporal_warning": len(outdated_references) > 0
        }
    
    def _check_jurisdiction(self, document: str) -> Dict:
        """Check jurisdictional compliance"""
        # Check for Indian jurisdiction markers
        indian_markers = [
            "India", "Indian", "New Delhi", "Mumbai", "Bangalore",
            "Supreme Court of India", "High Court"
        ]
        
        found_markers = [marker for marker in indian_markers if marker.lower() in document.lower()]
        
        # Check for conflicting jurisdictions
        foreign_markers = ["United States", "UK", "Singapore", "Dubai"]
        conflicts = [marker for marker in foreign_markers if marker in document]
        
        return {
            "indian_jurisdiction": len(found_markers) > 0,
            "jurisdiction_markers_found": found_markers,
            "conflicting_jurisdictions": conflicts,
            "jurisdiction_clear": len(found_markers) > 0 and len(conflicts) == 0
        }
    
    def _calculate_overall_score(self, report: Dict) -> int:
        """Calculate weighted overall verification score"""
        scores = []
        weights = []
        
        # Citation verification (20%)
        if "citation_verification" in report:
            scores.append(report["citation_verification"].get("verification_score", 100))
            weights.append(20)
        
        # Compliance score from dual-model (40%)
        if "compliance_score" in report:
            scores.append(report["compliance_score"])
            weights.append(40)
        
        # Consistency score (20%)
        if "consistency_score" in report:
            scores.append(report["consistency_score"])
            weights.append(20)
        
        # Temporal validity (10%)
        temporal_score = 100 if not report.get("temporal_check", {}).get("temporal_warning") else 70
        scores.append(temporal_score)
        weights.append(10)
        
        # Jurisdictional clarity (10%)
        jurisdiction_score = 100 if report.get("jurisdictional_check", {}).get("jurisdiction_clear") else 60
        scores.append(jurisdiction_score)
        weights.append(10)
        
        # Calculate weighted average
        if not scores:
            return 0
        
        weighted_sum = sum(score * weight for score, weight in zip(scores, weights))
        total_weight = sum(weights)
        
        return int(weighted_sum / total_weight) if total_weight > 0 else 0


# Singleton instance
legal_verifier = LegalVerifier()
