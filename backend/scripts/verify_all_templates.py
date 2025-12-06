"""
Final verification of all Jinja2 templates
"""

import json
from pathlib import Path
from docx import Document
import re

BASE_DIR = Path(__file__).parent.parent
TEMPLATES_DIR = BASE_DIR / "data" / "templates"
CONFIG_FILE = TEMPLATES_DIR / "template_config.json"

with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
    config = json.load(f)

print("="*80)
print("JINJA2 TEMPLATE VERIFICATION")
print("="*80)
print()

all_good = True

for template_name, template_config in config.items():
    filename = template_config['filename']
    filepath = TEMPLATES_DIR / filename
    
    print(f"📄 {template_name}")
    print(f"   File: {filename}")
    
    # Check if file exists
    if not filepath.exists():
        print(f"   ❌ FILE NOT FOUND: {filepath}")
        all_good = False
        print()
        continue
    
    # Read document
    try:
        doc = Document(filepath)
        text = '\n'.join([p.text for p in doc.paragraphs])
        
        # Find Jinja2 variables in document
        doc_vars = set(re.findall(r'\{\{\s*(\w+)\s*\}\}', text))
        
        # Get expected variables from config
        config_vars = set(template_config['fields'].keys())
        
        # Compare
        missing_in_doc = config_vars - doc_vars
        extra_in_doc = doc_vars - config_vars
        
        if missing_in_doc or extra_in_doc:
            print(f"   ⚠️  Variable mismatch!")
            if missing_in_doc:
                print(f"      Missing in document: {missing_in_doc}")
            if extra_in_doc:
                print(f"      Extra in document: {extra_in_doc}")
            all_good = False
        else:
            print(f"   ✅ All {len(config_vars)} variables match")
        
    except Exception as e:
        print(f"   ❌ Error reading document: {e}")
        all_good = False
    
    print()

print("="*80)
if all_good:
    print("✅ ALL TEMPLATES VERIFIED AND READY!")
else:
    print("⚠️  SOME ISSUES FOUND - PLEASE REVIEW ABOVE")
print("="*80)
