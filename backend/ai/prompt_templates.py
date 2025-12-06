"""
Legal-Specific Prompt Templates
Optimized for Indian legal system and documentation
"""

from typing import Dict, List


class PromptTemplates:
    """Collection of prompt templates for legal AI assistant"""
    
    # ===================================
    # SYSTEM PROMPTS
    # ===================================
    
    LEGAL_ASSISTANT_SYSTEM = """You are a qualified Indian legal assistant with expertise in Indian law.

CRITICAL INSTRUCTIONS - Follow this reasoning framework for EVERY response:

1. **Identify Relevant Law**: State the applicable Indian Act(s), Section(s), Rule(s), or Case Law FIRST
   - Example: "This falls under Section 10 of the Indian Contract Act, 1872"
   - If multiple laws apply, list all relevant ones

2. **Summarize the Rule**: Explain the legal principle in plain English
   - What does the law say?
   - What are the key requirements?

3. **Apply to Facts**: Connect the law to the user's specific situation
   - How does this law apply here?
   - What does it mean in this context?

4. **Cite Sources**: End with "Sources:" followed by complete citations
   - Format: Act Name, Year, Section Number
   - Include case names if citing precedents
   - Example: "Sources: Indian Contract Act, 1872, Section 10; Indian Evidence Act, 1872, Section 65B"

5. **Uncertainty Protocol**: If you cannot find a definitive Indian law:
   - Say: "I cannot find a definitive Indian law on this specific matter"
   - Explain what general principles may apply
   - Recommend consulting a qualified lawyer

NEVER:
- Invent citations or statutes
- Reference laws without verification
- Claim certainty when uncertain
- Skip the citation step

ALWAYS:
- Ground answers in actual Indian law
- Use the IRAC framework (Issue-Rule-Application-Conclusion)
- Provide complete, verifiable citations
- Recommend lawyer consultation for complex matters
- Clarify you are an AI assistant, not a licensed lawyer

Your expertise covers:
- Indian Contract Act, 1872
- Companies Act, 2013
- Transfer of Property Act, 1882
- Indian Penal Code, 1860
- Information Technology Act, 2000
- Consumer Protection Act, 2019
- GST, Labour Laws, Property Law
- Supreme Court and High Court precedents"""

    DOCUMENT_ANALYSIS_SYSTEM = """You are a legal document analysis expert specializing in Indian legal documents.

Your task is to:
1. Analyze the document structure and content
2. Identify key clauses and terms
3. Highlight potential issues or missing elements
4. Suggest improvements
5. Check compliance with Indian laws

Analyze documents like:
- Contracts and agreements
- Property documents
- Employment agreements
- Partnership deeds
- Service agreements
- Lease agreements

Provide:
- Summary of document
- Key terms and conditions
- Risk assessment
- Compliance check
- Recommendations"""

    FORM_ASSISTANT_SYSTEM = """You are a legal form-filling assistant for Indian legal documents.

Your role:
1. Guide users through form completion
2. Explain each field clearly
3. Provide examples and suggestions
4. Validate inputs for legal accuracy
5. Alert about mandatory fields
6. Ensure compliance with Indian legal requirements

Be helpful, patient, and thorough in your explanations."""

    CONTRACT_REVIEW_SYSTEM = """You are a contract review specialist for Indian business contracts.

Your expertise:
1. Review contract terms and conditions
2. Identify unfavorable clauses
3. Check for legal compliance
4. Suggest modifications
5. Highlight risks and liabilities
6. Ensure alignment with Indian Contract Act 1872

Focus areas:
- Payment terms
- Termination clauses
- Liability and indemnity
- Intellectual property rights
- Dispute resolution
- Jurisdiction"""

    # ===================================
    # USER PROMPT TEMPLATES
    # ===================================
    
    @staticmethod
    def create_chat_prompt(user_message: str, context: str = "") -> str:
        """Create a chat prompt with optional context"""
        if context:
            return f"""Context from previous conversation:
{context}

User question: {user_message}

Please provide a helpful, accurate response based on Indian legal framework."""
        return user_message

    @staticmethod
    def create_document_analysis_prompt(document_type: str, document_content: str) -> str:
        """Create prompt for document analysis"""
        return f"""Analyze this {document_type}:

---BEGIN DOCUMENT---
{document_content}
---END DOCUMENT---

Please provide:
1. **Summary**: Brief overview of the document
2. **Key Terms**: Important clauses and conditions
3. **Parties Involved**: Who are the parties and their obligations
4. **Compliance Check**: Does it comply with relevant Indian laws?
5. **Risk Assessment**: Potential legal risks or issues
6. **Recommendations**: Suggested improvements or additions
7. **Missing Elements**: Any standard clauses that should be included

Focus on Indian legal requirements and standards."""

    @staticmethod
    def create_contract_comparison_prompt(contract1: str, contract2: str) -> str:
        """Create prompt for comparing two contracts"""
        return f"""Compare these two contracts and identify:

**Contract A:**
{contract1}

**Contract B:**
{contract2}

Please analyze:
1. **Key Differences**: Major variations in terms and conditions
2. **Advantages/Disadvantages**: Which contract is more favorable?
3. **Missing Clauses**: What's present in one but not the other?
4. **Compliance**: Which better aligns with Indian legal standards?
5. **Recommendation**: Which contract should be preferred and why?
6. **Suggested Modifications**: How to improve the weaker contract?"""

    @staticmethod
    def create_form_assistance_prompt(form_name: str, field_name: str, field_description: str) -> str:
        """Create prompt for form field assistance"""
        return f"""Help the user fill this field in a {form_name}:

**Field Name**: {field_name}
**Description**: {field_description}

Provide:
1. **Explanation**: What this field means in simple terms
2. **Example**: A practical example of what to enter
3. **Legal Importance**: Why this field matters legally
4. **Common Mistakes**: What to avoid
5. **Format**: How to format the input (if applicable)"""

    @staticmethod
    def create_legal_question_prompt(question: str, document_context: str = "") -> str:
        """Create prompt for answering legal questions"""
        prompt = f"**Legal Question**: {question}\n\n"
        
        if document_context:
            prompt += f"**Related Document Context**:\n{document_context}\n\n"
        
        prompt += """Please provide:
1. **Answer**: Clear, accurate response based on Indian law
2. **Relevant Laws**: Cite applicable Acts, Sections, or Regulations
3. **Practical Implications**: What this means in practice
4. **Action Steps**: What the person should do
5. **When to Consult a Lawyer**: Is professional legal help needed?

Remember to use simple language and be specific to Indian legal framework."""
        
        return prompt

    @staticmethod
    def create_clause_extraction_prompt(document: str, clause_types: List[str]) -> str:
        """Create prompt for extracting specific clauses"""
        clause_list = ", ".join(clause_types)
        return f"""Extract the following clauses from this legal document:

**Clauses to extract**: {clause_list}

**Document**:
{document}

For each clause, provide:
1. **Clause Text**: Exact text from the document
2. **Location**: Where in the document it appears
3. **Analysis**: What it means and its implications
4. **Compliance**: Does it meet Indian legal standards?
5. **Recommendations**: Any suggested modifications

If a clause is missing, indicate that and explain its importance."""

    @staticmethod
    def create_compliance_check_prompt(document_type: str, content: str, applicable_laws: List[str]) -> str:
        """Create prompt for compliance checking"""
        laws = ", ".join(applicable_laws)
        return f"""Check compliance of this {document_type} against Indian laws:

**Applicable Laws**: {laws}

**Document Content**:
{content}

Please verify:
1. **Mandatory Requirements**: Are all legally required elements present?
2. **Prohibited Clauses**: Any clauses that violate Indian laws?
3. **Recommended Additions**: Standard clauses that should be included?
4. **Formatting**: Does it meet legal documentation standards?
5. **Compliance Score**: Rate compliance on a scale of 1-10
6. **Action Items**: Specific changes needed for full compliance"""

    # ===================================
    # CONVERSATION CONTEXT TEMPLATES
    # ===================================
    
    @staticmethod
    def format_conversation_history(messages: List[Dict[str, str]], max_messages: int = 10) -> str:
        """Format conversation history for context"""
        if not messages:
            return ""
        
        # Take last N messages
        recent_messages = messages[-max_messages:] if len(messages) > max_messages else messages
        
        formatted = "Previous conversation:\n\n"
        for msg in recent_messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            if role == 'user':
                formatted += f"User: {content}\n"
            elif role == 'assistant':
                formatted += f"Assistant: {content}\n"
            formatted += "\n"
        
        return formatted

    # ===================================
    # SPECIALTY TEMPLATES
    # ===================================
    
    INDIAN_LAW_SPECIALIZATIONS = {
        'property': """Focus on:
- Transfer of Property Act 1882
- Registration Act 1908
- Indian Stamp Act 1899
- State-specific property laws
- Sale deeds, lease agreements, gift deeds""",
        
        'corporate': """Focus on:
- Companies Act 2013
- Limited Liability Partnership Act 2008
- Indian Contract Act 1872
- SEBI regulations
- MOA, AOA, shareholder agreements""",
        
        'employment': """Focus on:
- Industrial Disputes Act 1947
- Payment of Wages Act 1936
- Employees' Provident Funds Act 1952
- Shops and Establishments Act (state-specific)
- Employment contracts, NDAs, non-compete clauses""",
        
        'ip': """Focus on:
- Copyright Act 1957
- Trade Marks Act 1999
- Patents Act 1970
- Information Technology Act 2000
- Licensing agreements, assignment deeds""",
        
        'family': """Focus on:
- Hindu Marriage Act 1955
- Indian Divorce Act 1869
- Hindu Succession Act 1956
- Guardians and Wards Act 1890
- Divorce petitions, custody agreements, wills"""
    }

    @staticmethod
    def get_specialized_system_prompt(domain: str) -> str:
        """Get system prompt for specific legal domain"""
        base = PromptTemplates.LEGAL_ASSISTANT_SYSTEM
        
        if domain.lower() in PromptTemplates.INDIAN_LAW_SPECIALIZATIONS:
            specialization = PromptTemplates.INDIAN_LAW_SPECIALIZATIONS[domain.lower()]
            return f"{base}\n\n**Your Specialization:**\n{specialization}"
        
        return base
