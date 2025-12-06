"""
Azure OpenAI Service
Modern AI service wrapper for legal assistant
"""

import os
import json
import logging
import tiktoken
from typing import List, Dict, Optional, Generator, Union
from openai import AzureOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from .config import AIConfig
from .prompt_templates import PromptTemplates

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AzureOpenAIService:
    """
    Azure OpenAI Service for legal documentation assistant
    
    Features:
    - GPT-4o-mini for chat and analysis
    - legal-bge-m3 for embeddings
    - Streaming support
    - Token counting and cost tracking
    - Error handling and retry logic
    - Conversation context management
    """
    
    def __init__(self):
        """Initialize Azure OpenAI client"""
        # Validate configuration
        if not AIConfig.validate():
            logger.warning("Azure OpenAI configuration incomplete. Service may not work properly.")
        
        # Initialize client
        try:
            self.client = AzureOpenAI(
                api_key=AIConfig.AZURE_OPENAI_API_KEY,
                api_version=AIConfig.AZURE_OPENAI_API_VERSION,
                azure_endpoint=AIConfig.AZURE_OPENAI_ENDPOINT
            )
            logger.info("✅ Azure OpenAI client initialized successfully")
            logger.info(f"📊 Configuration: {AIConfig.get_summary()}")
        except Exception as e:
            logger.warning(f"⚠️ Azure OpenAI client not initialized: {str(e)}")
            logger.info("💡 Application will run without Azure OpenAI features")
            self.client = None
        
        # Initialize tokenizer for cost tracking
        try:
            self.tokenizer = tiktoken.encoding_for_model("gpt-4o-mini")
        except Exception:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")
        
        # Cost tracking
        self.total_tokens_used = 0
        self.total_cost = 0.0
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        try:
            return len(self.tokenizer.encode(text))
        except Exception as e:
            logger.warning(f"Token counting failed: {e}")
            # Rough estimate: 1 token ≈ 4 characters
            return len(text) // 4
    
    def estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """
        Estimate cost for API call
        GPT-4o-mini pricing: $0.15/1M input, $0.60/1M output
        """
        input_cost = (input_tokens / 1_000_000) * 0.15
        output_cost = (output_tokens / 1_000_000) * 0.60
        return input_cost + output_cost
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> Union[str, Generator]:
        """
        Get chat completion from Azure OpenAI
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response
        
        Returns:
            String response or Generator for streaming
        """
        if not self.client:
            return "Azure OpenAI service not properly configured. Please check your .env file."
        
        # Use config defaults if not specified
        temperature = temperature if temperature is not None else AIConfig.TEMPERATURE
        max_tokens = max_tokens if max_tokens is not None else AIConfig.MAX_TOKENS
        
        # Determine which deployment to use
        deployment = AIConfig.AZURE_OPENAI_FINETUNED_DEPLOYMENT if \
                    AIConfig.ENABLE_FINETUNED_MODEL and AIConfig.AZURE_OPENAI_FINETUNED_DEPLOYMENT \
                    else AIConfig.AZURE_OPENAI_CHAT_DEPLOYMENT
        
        try:
            # Count input tokens
            input_text = " ".join([m['content'] for m in messages])
            input_tokens = self.count_tokens(input_text)
            
            logger.info(f"💬 Chat request | Deployment: {deployment} | Input tokens: {input_tokens}")
            
            response = self.client.chat.completions.create(
                model=deployment,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=AIConfig.TOP_P,
                frequency_penalty=AIConfig.FREQUENCY_PENALTY,
                presence_penalty=AIConfig.PRESENCE_PENALTY,
                stream=stream
            )
            
            if stream:
                return self._handle_stream(response, input_tokens)
            else:
                return self._handle_response(response, input_tokens)
        
        except Exception as e:
            logger.error(f"❌ Chat completion error: {str(e)}")
            return f"I apologize, but I encountered an error: {str(e)}. Please try again."
    
    def _handle_response(self, response, input_tokens: int) -> str:
        """Handle non-streaming response"""
        try:
            content = response.choices[0].message.content
            
            # Track usage
            output_tokens = self.count_tokens(content)
            total_tokens = input_tokens + output_tokens
            cost = self.estimate_cost(input_tokens, output_tokens)
            
            self.total_tokens_used += total_tokens
            self.total_cost += cost
            
            logger.info(f"✅ Response | Output tokens: {output_tokens} | Cost: ${cost:.6f} | Total cost: ${self.total_cost:.6f}")
            
            return content
        except Exception as e:
            logger.error(f"Error handling response: {e}")
            return "I apologize, but I couldn't process the response properly."
    
    def _handle_stream(self, response, input_tokens: int) -> Generator:
        """Handle streaming response"""
        def generate():
            try:
                full_response = ""
                for chunk in response:
                    if chunk.choices and len(chunk.choices) > 0:
                        delta = chunk.choices[0].delta
                        if hasattr(delta, 'content') and delta.content:
                            content = delta.content
                            full_response += content
                            yield content
                
                # Track usage after stream completes
                output_tokens = self.count_tokens(full_response)
                cost = self.estimate_cost(input_tokens, output_tokens)
                self.total_tokens_used += input_tokens + output_tokens
                self.total_cost += cost
                
                logger.info(f"✅ Stream complete | Output tokens: {output_tokens} | Cost: ${cost:.6f}")
            
            except Exception as e:
                logger.error(f"Error in stream: {e}")
                yield f"\n\n[Error: {str(e)}]"
        
        return generate()
    
    def legal_chat(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        domain: Optional[str] = None,
        stream: bool = False
    ) -> Union[str, Generator]:
        """
        Legal assistant chat with context
        
        Args:
            user_message: User's question or request
            conversation_history: Previous conversation messages
            domain: Legal domain specialization (property, corporate, employment, ip, family)
            stream: Whether to stream the response
        
        Returns:
            AI response as string or generator
        """
        # Get appropriate system prompt
        if domain:
            system_prompt = PromptTemplates.get_specialized_system_prompt(domain)
        else:
            system_prompt = PromptTemplates.LEGAL_ASSISTANT_SYSTEM
        
        # Build messages
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history
        if conversation_history:
            messages.extend(conversation_history[-AIConfig.MAX_CONVERSATION_HISTORY:])
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        return self.chat_completion(messages, stream=stream)
    
    def analyze_document(
        self,
        document_type: str,
        document_content: str,
        stream: bool = False
    ) -> Union[str, Generator]:
        """
        Analyze a legal document
        
        Args:
            document_type: Type of document (contract, agreement, deed, etc.)
            document_content: The document text
            stream: Whether to stream the response
        
        Returns:
            Analysis as string or generator
        """
        system_prompt = PromptTemplates.DOCUMENT_ANALYSIS_SYSTEM
        user_prompt = PromptTemplates.create_document_analysis_prompt(document_type, document_content)
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return self.chat_completion(messages, stream=stream, max_tokens=3000)
    
    def compare_contracts(
        self,
        contract1: str,
        contract2: str,
        stream: bool = False
    ) -> Union[str, Generator]:
        """
        Compare two contracts
        
        Args:
            contract1: First contract text
            contract2: Second contract text
            stream: Whether to stream the response
        
        Returns:
            Comparison analysis
        """
        system_prompt = PromptTemplates.CONTRACT_REVIEW_SYSTEM
        user_prompt = PromptTemplates.create_contract_comparison_prompt(contract1, contract2)
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return self.chat_completion(messages, stream=stream, max_tokens=3000)
    
    def assist_form_filling(
        self,
        form_name: str,
        field_name: str,
        field_description: str
    ) -> str:
        """
        Assist user with filling a form field
        
        Args:
            form_name: Name of the form
            field_name: Name of the field
            field_description: Description of the field
        
        Returns:
            Assistance text
        """
        system_prompt = PromptTemplates.FORM_ASSISTANT_SYSTEM
        user_prompt = PromptTemplates.create_form_assistance_prompt(form_name, field_name, field_description)
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return self.chat_completion(messages, max_tokens=1000)
    
    def answer_legal_question(
        self,
        question: str,
        document_context: Optional[str] = None,
        stream: bool = False
    ) -> Union[str, Generator]:
        """
        Answer a legal question
        
        Args:
            question: User's legal question
            document_context: Optional context from a document
            stream: Whether to stream the response
        
        Returns:
            Answer as string or generator
        """
        system_prompt = PromptTemplates.LEGAL_ASSISTANT_SYSTEM
        user_prompt = PromptTemplates.create_legal_question_prompt(question, document_context)
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return self.chat_completion(messages, stream=stream)
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def get_embeddings(self, texts: Union[str, List[str]]) -> Union[List[float], List[List[float]]]:
        """
        Get embeddings for text(s) using legal-bge-m3
        
        Args:
            texts: Single text string or list of texts
        
        Returns:
            Embedding vector(s)
        """
        if not self.client:
            logger.error("Azure OpenAI client not initialized")
            return []
        
        # Convert single text to list
        is_single = isinstance(texts, str)
        if is_single:
            texts = [texts]
        
        try:
            response = self.client.embeddings.create(
                model=AIConfig.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
                input=texts
            )
            
            embeddings = [item.embedding for item in response.data]
            
            # Log usage
            total_tokens = sum(self.count_tokens(text) for text in texts)
            logger.info(f"🔢 Generated {len(embeddings)} embeddings | Tokens: {total_tokens}")
            
            return embeddings[0] if is_single else embeddings
        
        except Exception as e:
            logger.error(f"❌ Embedding error: {str(e)}")
            return [] if is_single else [[]]
    
    def get_usage_stats(self) -> Dict:
        """Get usage statistics"""
        return {
            'total_tokens': self.total_tokens_used,
            'total_cost_usd': round(self.total_cost, 4),
            'average_cost_per_request': round(self.total_cost / max(1, self.total_tokens_used / 1000), 6)
        }
    
    def reset_stats(self):
        """Reset usage statistics"""
        self.total_tokens_used = 0
        self.total_cost = 0.0
        logger.info("📊 Usage stats reset")
    
    def extract_document_intent(self, user_description: str) -> Dict:
        """
        Extract structured intent from natural language description
        
        Args:
            user_description: User's description of what they need
            
        Returns:
            Dict with document_type, context, parties, and extracted fields
        """
        system_prompt = """You are an expert legal AI assistant specializing in small business documentation.
Your task is to analyze user requests and extract structured information for legal document generation.

DOCUMENT TYPES YOU SUPPORT:
Business Formation: Partnership Deed, LLP Agreement, MOA, AOA, Shareholder Agreement, etc.
Employment: Employment Agreement, NDA, Non-Compete, Consulting Agreement, etc.
Sales & Contracts: MSA, SOW, Sales Contract, Purchase Order, T&C, etc.
Property: Commercial Lease, Office Rent, Leave & License, etc.
Intellectual Property: Copyright License, IP Assignment, Software License, etc.
Financial: Loan Agreement, Promissory Note, Guarantee, Invoice, etc.
Compliance: Privacy Policy, Terms of Service, Data Processing Agreement, etc.

EXTRACTION RULES:
1. Identify the document type precisely
2. Extract all mentioned details (names, amounts, dates, locations, etc.)
3. Identify missing critical information
4. Determine jurisdiction (default: India unless specified)
5. Categorize by business size (startup, SME, enterprise)

RESPONSE FORMAT (JSON):
{
    "document_type": "exact document name",
    "category": "business_formation|employment|sales|property|ip|financial|compliance",
    "jurisdiction": "India",
    "business_size": "small|medium|large",
    "extracted_fields": {
        "party_1": "name if mentioned",
        "party_2": "name if mentioned",
        "amount": "if mentioned",
        "location": "if mentioned",
        "date": "if mentioned",
        ...
    },
    "missing_fields": ["list of critical fields not provided"],
    "confidence": 0.95
}"""

        user_prompt = f"""Analyze this document request and extract structured information:

USER REQUEST: "{user_description}"

Provide a JSON response with the document type, extracted fields, and missing information."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            response = self.chat_completion(messages, temperature=0.3, max_tokens=1000)
            
            # Parse JSON response
            import json
            import re
            
            # Extract JSON from response (handle markdown code blocks)
            json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Try to find JSON object
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                json_str = json_match.group(0) if json_match else response
            
            intent = json.loads(json_str)
            logger.info(f"📋 Extracted intent: {intent['document_type']} (confidence: {intent.get('confidence', 'N/A')})")
            return intent
        
        except Exception as e:
            logger.error(f"❌ Intent extraction failed: {e}")
            return {
                'document_type': 'Unknown',
                'category': 'general',
                'jurisdiction': 'India',
                'extracted_fields': {},
                'missing_fields': [],
                'confidence': 0.0,
                'error': str(e)
            }
    
    def generate_document_from_description(
        self,
        user_description: str,
        extracted_intent: Optional[Dict] = None,
        stream: bool = False
    ) -> Union[str, Generator]:
        """
        Generate complete legal document from natural language description
        
        Args:
            user_description: User's description of document needed
            extracted_intent: Pre-extracted intent (optional)
            stream: Whether to stream the response
            
        Returns:
            Generated document content
        """
        # Extract intent if not provided
        if not extracted_intent:
            extracted_intent = self.extract_document_intent(user_description)
        
        document_type = extracted_intent.get('document_type', 'Legal Document')
        extracted_fields = extracted_intent.get('extracted_fields', {})
        jurisdiction = extracted_intent.get('jurisdiction', 'India')
        
        system_prompt = f"""You are an expert legal document drafter specializing in Indian law and small business documentation.

EXPERTISE:
- Indian Contract Act, 1872
- Companies Act, 2013
- Partnership Act, 1932
- Information Technology Act, 2000
- All relevant Indian commercial laws

DOCUMENT DRAFTING STANDARDS:
1. Use formal legal language appropriate for {jurisdiction}
2. Include all standard clauses for {document_type}
3. Follow Indian legal formatting conventions
4. Include jurisdiction-specific legal requirements
5. Add definitions section where appropriate
6. Include dispute resolution clause (arbitration preferred)
7. Specify governing law as Indian law
8. Use INR (₹) for monetary values
9. Include stamp duty guidance where applicable
10. Make document legally enforceable in Indian courts

STRUCTURE REQUIREMENTS:
- Title and Date
- Parties section with complete details
- Recitals/Background
- Operative clauses (numbered)
- Representations and warranties
- Term and termination
- Confidentiality (if applicable)
- Intellectual property rights (if applicable)
- Indemnity and limitation of liability
- Dispute resolution and arbitration
- Miscellaneous provisions
- Signature blocks

SMALL BUSINESS FOCUS:
- Keep language clear but legally sound
- Include practical protective clauses
- Balance between comprehensiveness and simplicity
- Cost-effective drafting (avoid unnecessary complexity)"""

        user_prompt = f"""Generate a complete {document_type} based on this information:

ORIGINAL REQUEST: {user_description}

EXTRACTED INFORMATION:
{json.dumps(extracted_fields, indent=2)}

JURISDICTION: {jurisdiction}

INSTRUCTIONS:
1. Generate a complete, legally sound document
2. Use the extracted information to populate relevant sections
3. For missing information, use placeholders like [PARTY NAME], [AMOUNT], etc.
4. Include all standard clauses required for this document type
5. Ensure compliance with Indian law
6. Format professionally with proper sections and numbering
7. Add helpful comments where user needs to fill in specific details

Generate the document now:"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        logger.info(f"📄 Generating {document_type} from natural language")
        return self.chat_completion(messages, temperature=0.7, max_tokens=4000, stream=stream)
    
    def validate_legal_document(
        self,
        document_content: str,
        document_type: str,
        jurisdiction: str = "India"
    ) -> Dict:
        """
        Validate and verify legal document for compliance and correctness
        
        Args:
            document_content: The document text to validate
            document_type: Type of document
            jurisdiction: Legal jurisdiction
            
        Returns:
            Dict with validation results, issues found, and corrections
        """
        system_prompt = f"""You are an expert legal reviewer and compliance officer specializing in {jurisdiction} law.

YOUR ROLE:
Thoroughly review legal documents for:
1. Legal compliance and validity
2. Missing critical clauses
3. Ambiguous or contradictory terms
4. Potential legal risks
5. Enforceability issues
6. Best practice recommendations

VALIDATION CHECKLIST FOR {document_type}:
✓ All parties properly identified
✓ Consideration/payment terms clear
✓ Rights and obligations well-defined
✓ Term and termination provisions
✓ Dispute resolution mechanism
✓ Governing law specified
✓ Signatures and execution requirements
✓ Stamp duty compliance (if applicable)
✓ Registration requirements (if applicable)
✓ Regulatory compliance

ANALYSIS DEPTH:
- Clause-by-clause review
- Legal risk assessment (High/Medium/Low)
- Practical business impact analysis
- Comparison with standard industry practices

OUTPUT FORMAT (JSON):
{{
    "overall_status": "valid|needs_correction|invalid",
    "compliance_score": 0-100,
    "issues": [
        {{
            "severity": "critical|high|medium|low",
            "issue": "description of issue",
            "clause_reference": "section/clause number",
            "recommendation": "how to fix",
            "legal_risk": "potential legal consequences"
        }}
    ],
    "missing_clauses": ["list of standard clauses that should be added"],
    "suggested_corrections": [
        {{
            "original": "problematic text",
            "corrected": "improved text",
            "reason": "explanation"
        }}
    ],
    "strengths": ["positive aspects of the document"],
    "overall_assessment": "summary paragraph",
    "enforceability_rating": "high|medium|low",
    "ready_for_execution": true/false
}}"""

        user_prompt = f"""Review this {document_type} for legal compliance and correctness:

DOCUMENT:
{document_content}

JURISDICTION: {jurisdiction}

Provide a comprehensive validation report with:
1. Overall assessment
2. All issues found (categorized by severity)
3. Missing clauses
4. Suggested corrections
5. Legal risks
6. Recommendations

Be thorough but practical. Focus on issues that matter for small businesses."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            logger.info(f"🔍 Validating {document_type}")
            response = self.chat_completion(messages, temperature=0.3, max_tokens=3000)
            
            # Parse JSON response
            import json
            import re
            
            json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                json_str = json_match.group(0) if json_match else response
            
            validation = json.loads(json_str)
            
            logger.info(f"✅ Validation complete | Status: {validation.get('overall_status')} | Score: {validation.get('compliance_score')}/100")
            return validation
        
        except Exception as e:
            logger.error(f"❌ Validation failed: {e}")
            return {
                'overall_status': 'error',
                'compliance_score': 0,
                'issues': [],
                'error': str(e)
            }
    
    def ask_for_missing_information(
        self,
        document_type: str,
        current_document: str,
        extracted_fields: Dict,
        missing_fields: List[str]
    ) -> str:
        """
        Generate conversational question to ask user for missing information
        
        Args:
            document_type: Type of document being created
            current_document: Current state of document
            extracted_fields: Fields already extracted
            missing_fields: Fields that are missing
            
        Returns:
            Conversational question to ask user
        """
        system_prompt = """You are a friendly but professional legal assistant helping users create documents.

YOUR STYLE:
- Conversational and helpful
- Ask one question at a time
- Explain WHY the information is needed
- Provide examples if helpful
- Use simple language

RULES:
- Never ask for information already provided
- Prioritize critical information first
- Be encouraging and supportive
- Keep questions short and clear"""

        user_prompt = f"""You're helping create a {document_type}.

ALREADY HAVE:
{json.dumps(extracted_fields, indent=2)}

STILL NEED:
{', '.join(missing_fields)}

Ask the user for the MOST IMPORTANT missing piece of information. 
Make it conversational and explain why it's needed. Keep it to 1-2 sentences."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return self.chat_completion(messages, temperature=0.8, max_tokens=200)
    
    def validate_document_with_verifier(
        self,
        document_content: str,
        document_type: str,
        verification_level: str = "comprehensive"
    ) -> Dict:
        """
        Enhanced validation using dual-model verification system
        Implements Harvey.ai-style multi-layered verification
        
        Args:
            document_content: Full document text
            document_type: Type of document
            verification_level: "basic", "standard", or "comprehensive"
            
        Returns:
            Comprehensive verification report
        """
        try:
            # Import verifier
            from .legal_verifier import legal_verifier
            
            logger.info(f"🔬 Enhanced verification: {document_type} ({verification_level})")
            
            # Run comprehensive verification
            verification_report = legal_verifier.verify_document(
                document_content,
                document_type,
                verification_level
            )
            
            # Also run standard validation for comparison
            standard_validation = self.validate_legal_document(document_content, document_type)
            
            # Merge results
            final_report = {
                "verification_level": verification_level,
                "overall_score": verification_report.get("overall_score", 0),
                "compliance_score": standard_validation.get("compliance_score", 0),
                "citation_verification": verification_report.get("citation_verification", {}),
                "clause_analysis": verification_report.get("clause_analysis", []),
                "issues": standard_validation.get("issues", []),
                "hallucinations_detected": verification_report.get("hallucinations_detected", []),
                "risky_clauses": verification_report.get("risky_clauses", []),
                "missing_clauses": standard_validation.get("missing_clauses", []),
                "suggested_corrections": standard_validation.get("suggested_corrections", []),
                "temporal_check": verification_report.get("temporal_check", {}),
                "jurisdictional_check": verification_report.get("jurisdictional_check", {}),
                "consistency_score": verification_report.get("consistency_score", None),
                "ready_for_execution": verification_report.get("overall_score", 0) >= 80,
                "recommendations": standard_validation.get("strengths", []),
                "enforceability_rating": standard_validation.get("enforceability_rating", "medium")
            }
            
            logger.info(f"✅ Enhanced verification complete | Score: {final_report['overall_score']}/100")
            return final_report
            
        except Exception as e:
            logger.error(f"❌ Enhanced verification failed: {e}")
            # Fallback to standard validation
            return self.validate_legal_document(document_content, document_type)


# Create singleton instance
ai_service = AzureOpenAIService()
