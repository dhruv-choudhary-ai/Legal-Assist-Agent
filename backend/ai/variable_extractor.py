"""
Variable Extractor - Enhanced with Smart Entity Recognition
Extracts variables from user descriptions using GPT-4 and BGE-M3 embeddings
NOTE: Uses legacy template_manager for metadata access
"""

import logging
import json
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from .azure_openai_service import ai_service
from .template_manager_legacy import template_manager
from .embedding_service import embedding_service

logger = logging.getLogger(__name__)


class VariableExtractor:
    """
    Smart Variable Extractor with Semantic Understanding
    
    Features:
    - GPT-4 powered entity extraction with high accuracy
    - BGE-M3 embeddings for semantic variable matching
    - Context-aware extraction from conversation history
    - Intelligent response parsing (extracts "Rahul Kumar" from "I told you Rahul Kumar")
    - Type validation and auto-formatting
    - Prevents redundant questions by tracking extracted data
    """
    
    def __init__(self):
        self.extracted_cache = {}  # Cache extracted variables per session
        logger.info("🔧 Smart Variable Extractor initialized with GPT-4 + BGE-M3")
    
    def extract_from_description(
        self, 
        user_description: str, 
        template_id: Optional[str] = None,
        conversation_history: Optional[List[Dict]] = None,
        session_id: Optional[str] = None
    ) -> Dict:
        """
        Smart extraction from user description with conversation context
        
        Args:
            user_description: Natural language description or single response
            template_id: Optional template to match against
            conversation_history: Previous conversation for context
            session_id: Session identifier for caching
        
        Returns:
            Dict with extracted variables, missing fields, and smart prompts
        """
        # Get cached variables for this session
        cache_key = session_id or "default"
        cached_vars = self.extracted_cache.get(cache_key, {})
        
        # Get template variables if specified
        template_vars = {}
        if template_id:
            metadata = template_manager.get_template_metadata(template_id)
            template_vars = metadata.get('variables', {})
        
        # Build context from conversation history
        context = self._build_extraction_context(conversation_history) if conversation_history else ""
        
        # Enhanced extraction prompt with examples
        system_prompt = f"""You are an expert at extracting structured information from conversations about legal documents.

CRITICAL RULES FOR EXTRACTION:
1. **Extract the ACTUAL VALUE, not the user's phrasing**
   - If user says "I told you Rahul Kumar" → Extract "Rahul Kumar" (NOT "I told you Rahul Kumar")
   - If user says "My name is Dhruv" → Extract "Dhruv" (NOT "My name is Dhruv")
   - If user says "It's in Bhopal" → Extract "Bhopal" (NOT "It's in Bhopal")

2. **Understand context and references:**
   - "owner" / "landlord" / "lessor" → LESSOR_NAME or PARTY_NAME_1
   - "tenant" / "renter" / "lessee" → LESSEE_NAME or PARTY_NAME_2  
   - "my name" / "I am" → Usually the tenant/second party
   - "property in X" → PROPERTY_ADDRESS includes X

3. **Parse different answer formats:**
   - Direct: "Rahul Kumar" → LESSOR_NAME = "Rahul Kumar"
   - Sentence: "The owner is Rahul Kumar" → LESSOR_NAME = "Rahul Kumar"
   - Reference: "I told you it's Rahul Kumar" → LESSOR_NAME = "Rahul Kumar"
   - Implied: "5000" when asked about rent → MONTHLY_RENT = "5000"

4. **Smart type conversion:**
   - Dates: "2024-01-05" or "Jan 5, 2024" or "5th January 2024" → "2024-01-05"
   - Money: "5000" or "Rs. 5000" or "₹5000" → "5000"
   - Duration: "1" or "1 year" or "11 months" → Extract number and unit

5. **Use conversation context:**
   - If previous messages mentioned information, include it
   - If user references "that" or "the same", look back in conversation

{'EXPECTED TEMPLATE VARIABLES:' if template_vars else 'COMMON LEGAL DOCUMENT VARIABLES:'}
{json.dumps({k: v.get('description', k) for k, v in template_vars.items()}, indent=2) if template_vars else '''
Common variables include:
- LESSOR_NAME / LANDLORD_NAME / PARTY_NAME_1 (owner/first party)
- LESSEE_NAME / TENANT_NAME / PARTY_NAME_2 (tenant/second party)  
- PROPERTY_ADDRESS / LOCATION
- MONTHLY_RENT / RENT_AMOUNT
- SECURITY_DEPOSIT
- LEASE_DURATION / TERM
- START_DATE / COMMENCEMENT_DATE
- PROPERTY_TYPE (residential/commercial)
'''}

OUTPUT FORMAT (JSON only):
{{
    "extracted_variables": {{
        "VARIABLE_NAME": {{
            "value": "clean extracted value",
            "confidence": "high|medium|low",
            "source": "what user said to extract this",
            "matched_from": "which template variable this matches"
        }}
    }},
    "context_understanding": "brief note on what you understood",
    "ambiguities": ["any unclear points"]
}}

EXAMPLES:

User: "I want a rent agreement, my name is Dhruv and owner is Rahul Kumar"
→ {{
    "extracted_variables": {{
        "LESSEE_NAME": {{"value": "Dhruv", "confidence": "high", "source": "my name is Dhruv"}},
        "LESSOR_NAME": {{"value": "Rahul Kumar", "confidence": "high", "source": "owner is Rahul Kumar"}}
    }}
}}

User: "I told you Rahul Kumar" (when asked about landlord)
→ {{
    "extracted_variables": {{
        "LESSOR_NAME": {{"value": "Rahul Kumar", "confidence": "high", "source": "I told you Rahul Kumar"}}
    }}
}}

User: "5000" (when asked about monthly rent)
→ {{
    "extracted_variables": {{
        "MONTHLY_RENT": {{"value": "5000", "confidence": "high", "source": "direct amount stated"}}
    }}
}}"""

        user_prompt = f"""{context}

CURRENT USER MESSAGE:
"{user_description}"

Extract all variables you can identify. Return ONLY clean values, never include phrases like "I told you" or "my name is"."""

        try:
            response = ai_service.chat_completion([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ], temperature=0.1, max_tokens=2000)
            
            # Parse JSON from response
            result = self._parse_extraction_json(response)
            
            # Merge with cached variables
            if cached_vars:
                for var_name, var_data in cached_vars.items():
                    if var_name not in result.get('extracted_variables', {}):
                        result.setdefault('extracted_variables', {})[var_name] = var_data
            
            # Update cache
            if session_id and result.get('extracted_variables'):
                self.extracted_cache[cache_key] = result['extracted_variables']
            
            # Match template variables to identify missing ones
            if template_vars:
                result['template_variables'] = template_vars
                extracted_keys = set(result.get('extracted_variables', {}).keys())
                required_keys = set(template_vars.keys())
                result['missing_variables'] = list(required_keys - extracted_keys)
            else:
                result['missing_variables'] = []
            
            logger.info(f"✅ Smart extraction: {len(result.get('extracted_variables', {}))} variables, {len(result.get('missing_variables', []))} missing")
            return result
        
        except Exception as e:
            logger.error(f"❌ Smart extraction failed: {e}")
            return {
                'extracted_variables': cached_vars,
                'missing_variables': list(template_vars.keys()) if template_vars else [],
                'error': str(e)
            }
    
    def _build_extraction_context(self, conversation_history: List[Dict]) -> str:
        """Build context string from conversation history"""
        if not conversation_history:
            return ""
        
        context_parts = ["CONVERSATION HISTORY (for context):"]
        for msg in conversation_history[-5:]:  # Last 5 messages
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')
            if role == 'user':
                context_parts.append(f"User said: {content}")
            elif role == 'assistant':
                # Only include questions asked by assistant
                if '?' in content:
                    context_parts.append(f"Assistant asked: {content}")
        
        return "\n".join(context_parts) + "\n"
    
    def _parse_extraction_json(self, response: str) -> Dict:
        """Parse JSON from GPT response (handles markdown blocks)"""
        # Try to find JSON in markdown code block
        json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', response, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find raw JSON
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            json_str = json_match.group(0) if json_match else response
        
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}\nResponse: {response[:500]}")
            return {
                'extracted_variables': {},
                'error': 'Failed to parse extraction result'
            }
    
    def generate_missing_variable_prompt(
        self,
        missing_variables: List[str],
        template_id: str,
        already_provided: Dict,
        conversation_history: Optional[List[Dict]] = None
    ) -> str:
        """
        Generate smart conversational prompt for missing variable
        PREVENTS asking for already provided information
        
        Args:
            missing_variables: List of missing variable names
            template_id: Template being used
            already_provided: Variables already collected  
            conversation_history: Recent conversation for context
        
        Returns:
            Conversational question for user (or completion message if none missing)
        """
        if not missing_variables:
            return "✅ Perfect! I have all the information I need."
        
        # Filter out variables that might be in conversation history
        if conversation_history:
            # Check if any "missing" variables were actually mentioned
            recent_context = " ".join([
                msg.get('content', '') for msg in conversation_history[-3:]
                if msg.get('role') == 'user'
            ])
            
            # Re-analyze to catch missed extractions
            recheck = self.extract_from_description(
                recent_context,
                template_id,
                conversation_history
            )
            
            # If we found more variables, update already_provided
            newly_found = recheck.get('extracted_variables', {})
            for var_name, var_data in newly_found.items():
                if var_name in missing_variables and var_name not in already_provided:
                    already_provided[var_name] = var_data
                    missing_variables.remove(var_name)
            
            if not missing_variables:
                return "✅ Got everything! Let me prepare your document..."
        
        # Get template metadata
        metadata = template_manager.get_template_metadata(template_id)
        template_vars = metadata.get('variables', {})
        
        # Pick most important missing variable
        next_var = missing_variables[0]
        var_info = template_vars.get(next_var, {})
        
        # Generate friendly, context-aware question
        prompt = f"""You are a friendly, professional legal assistant having a natural conversation.

TASK: Ask for ONE piece of missing information naturally.

STYLE:
- Conversational and warm (like Harvey.ai)
- Ask directly without over-explaining
- Provide a helpful example in parentheses
- Keep it to ONE short sentence
- Sound professional but approachable

AVOID:
- Legal jargon
- Multiple questions
- Long explanations
- Being robotic or formal
- Saying "I need" or "Please provide" (too formal)

USER CONTEXT:
We're creating: {metadata.get('name', template_id.replace('_', ' '))}
Already have: {', '.join([k.replace('_', ' ').title() for k in already_provided.keys()]) if already_provided else 'Nothing yet'}

NOW NEED:
Variable: {next_var}
Type: {var_info.get('type', 'text')}
Description: {var_info.get('description', var_info.get('display_name', next_var.replace('_', ' ')))}
Example: {var_info.get('example', 'N/A')}

Generate ONE short, friendly question asking for this. Include example in parentheses."""

        try:
            question = ai_service.chat_completion([
                {"role": "system", "content": "You are a friendly legal assistant. Generate a natural, conversational question."},
                {"role": "user", "content": prompt}
            ], temperature=0.7, max_tokens=100)
            
            return question.strip()
        
        except Exception as e:
            logger.error(f"❌ Failed to generate prompt: {e}")
            # Fallback to simple question
            display_name = var_info.get('display_name', next_var.replace('_', ' ').title())
            example = var_info.get('example', '')
            return f"What's the {display_name.lower()}? (e.g., {example})" if example else f"What's the {display_name.lower()}?"
    
    def validate_variable(self, var_name: str, value: str, var_type: str) -> Tuple[bool, str]:
        """
        Validate and auto-format variable value
        
        Args:
            var_name: Variable name
            value: Provided value
            var_type: Expected type
        
        Returns:
            (is_valid: bool, formatted_value_or_error: str)
        """
        from datetime import datetime
        
        value = value.strip()
        
        # Type-specific validation
        if var_type == 'email':
            pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(pattern, value):
                return False, "Invalid email format (e.g., user@example.com)"
            return True, value.lower()
        
        elif var_type == 'phone':
            # Clean and validate Indian phone numbers
            cleaned = re.sub(r'[^\d+]', '', value)
            if len(cleaned) < 10:
                return False, "Phone number too short (need 10 digits)"
            # Format: +91-XXXXX-XXXXX or keep as is
            return True, cleaned
        
        elif var_type == 'date':
            # Smart date parsing
            try:
                # Try various formats
                for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d']:
                    try:
                        parsed = datetime.strptime(value, fmt)
                        return True, parsed.strftime('%Y-%m-%d')
                    except:
                        continue
                # Try parsing with words
                from dateutil import parser
                parsed = parser.parse(value)
                return True, parsed.strftime('%Y-%m-%d')
            except:
                return False, "Invalid date (use YYYY-MM-DD or DD/MM/YYYY)"
        
        elif var_type in ['currency', 'number', 'amount']:
            # Extract numeric value
            cleaned = re.sub(r'[^\d.]', '', value)
            try:
                amount = float(cleaned)
                if var_type == 'currency':
                    return True, f"₹{amount:,.0f}"
                return True, str(int(amount) if amount.is_integer() else amount)
            except:
                return False, "Invalid amount (numbers only)"
        
        elif var_type == 'address':
            # Basic address validation
            if len(value) < 5:
                return False, "Address too short (provide full address)"
            return True, value.title()
        
        else:
            # Generic text - just clean it
            if not value:
                return False, "Value cannot be empty"
            return True, value.strip()
    
    def clear_session_cache(self, session_id: str):
        """Clear extracted variables cache for a session"""
        if session_id in self.extracted_cache:
            del self.extracted_cache[session_id]
            logger.info(f"🗑️ Cleared variable cache for session: {session_id}")
    
    def get_session_variables(self, session_id: str) -> Dict:
        """Get all extracted variables for a session"""
        return self.extracted_cache.get(session_id, {})


# Global instance
variable_extractor = VariableExtractor()
