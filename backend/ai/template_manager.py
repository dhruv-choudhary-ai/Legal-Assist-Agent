"""
Template manager for loading and managing Jinja2 document templates
Supports both system templates and user-uploaded templates
"""
import json
import os
from pathlib import Path
from docxtpl import DocxTemplate

class TemplateManager:
    """Manages legal document templates with Jinja2 support"""
    
    def __init__(self, templates_dir='data/templates', user_templates_dir='data/user_templates'):
        self.templates_dir = templates_dir
        self.user_templates_dir = user_templates_dir
        self.config_file = os.path.join(templates_dir, 'template_config.json')
        self.user_config_file = os.path.join(user_templates_dir, 'user_template_config.json')
        
        # Create user templates directory if it doesn't exist
        Path(user_templates_dir).mkdir(parents=True, exist_ok=True)
        
        self.templates = self.load_config()
        self.user_templates = self.load_user_config()
    
    def load_config(self):
        """Load system template configuration from JSON file"""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def load_user_config(self):
        """Load user template configuration from JSON file"""
        if os.path.exists(self.user_config_file):
            with open(self.user_config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def get_template_schema(self, template_name):
        """Get field schema for a specific template (checks both system and user templates)"""
        # Check system templates first
        template = self.templates.get(template_name, {})
        
        # If not found, check user templates
        if not template:
            template = self.user_templates.get(template_name, {})
            if template:
                template['is_user_template'] = True
        
        if not template:
            return None
        
        fields = list(template.get('fields', {}).keys())
        required = [k for k, v in template.get('fields', {}).items() if v.get('required', False)]
        
        return {
            'fields': fields,
            'required': required,
            'config': template
        }
    
    def get_all_templates(self):
        """Get list of all available templates (system + user)"""
        all_templates = []
        
        # Add system templates
        for name, config in self.templates.items():
            all_templates.append({
                'name': name,
                'category': config.get('category'),
                'description': config.get('description'),
                'keywords': config.get('keywords', []),
                'is_user_template': False
            })
        
        # Add user templates
        for name, config in self.user_templates.items():
            all_templates.append({
                'name': name,
                'category': config.get('category'),
                'description': config.get('description'),
                'keywords': config.get('keywords', []),
                'is_user_template': True
            })
        
        return all_templates
    
    def fill_template(self, template_name, field_values):
        """Fill a Jinja2 template with provided field values"""
        # Check system templates first
        template_config = self.templates.get(template_name)
        is_user_template = False
        
        # If not found, check user templates
        if not template_config:
            template_config = self.user_templates.get(template_name)
            is_user_template = True
        
        if not template_config:
            raise ValueError(f"Template '{template_name}' not found")
        
        template_filename = template_config.get('filename')
        
        # Determine template path based on source
        if is_user_template:
            template_path = os.path.join(self.user_templates_dir, template_filename)
        else:
            template_path = os.path.join(self.templates_dir, template_filename)
        
        if not os.path.exists(template_path):
            raise FileNotFoundError(f"Template file not found: {template_path}")
        
        # Load template using docxtpl
        doc = DocxTemplate(template_path)
        
        # Fill template with context
        context = self._prepare_context(template_name, field_values, is_user_template)
        doc.render(context)
        
        return doc
    
    def _prepare_context(self, template_name, field_values, is_user_template=False):
        """Prepare context dictionary for template rendering with default values"""
        # Get template config from appropriate source
        if is_user_template:
            template_config = self.user_templates.get(template_name, {})
        else:
            template_config = self.templates.get(template_name, {})
        
        fields_config = template_config.get('fields', {})
        
        context = {}
        
        # Fill all fields with either provided value or placeholder (NO EXAMPLES!)
        for field_name, field_config in fields_config.items():
            if field_name in field_values and field_values[field_name]:
                context[field_name] = field_values[field_name]
            else:
                # Don't use examples - use placeholder with label instead
                # This prevents auto-filling with fake data
                context[field_name] = f'[{field_config.get("label", field_name)}]'
        
        return context
    
    def match_template_by_keywords(self, user_prompt):
        """Match template based on keywords in user prompt (checks both system and user templates)"""
        user_prompt_lower = user_prompt.lower()
        
        best_match = None
        best_score = 0
        
        # Check system templates
        for template_name, config in self.templates.items():
            keywords = config.get('keywords', [])
            score = sum(1 for keyword in keywords if keyword.lower() in user_prompt_lower)
            
            if score > best_score:
                best_score = score
                best_match = template_name
        
        # Check user templates
        for template_name, config in self.user_templates.items():
            keywords = config.get('keywords', [])
            score = sum(1 for keyword in keywords if keyword.lower() in user_prompt_lower)
            
            if score > best_score:
                best_score = score
                best_match = template_name
        
        return best_match if best_score > 0 else None

# Global template manager instance
template_manager = None

def get_template_manager():
    """Get or create template manager singleton"""
    global template_manager
    if template_manager is None:
        template_manager = TemplateManager()
    return template_manager
