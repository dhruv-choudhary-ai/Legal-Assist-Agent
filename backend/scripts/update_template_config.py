"""
Create NDA Jinja2 template and update template_config.json
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
TEMPLATES_DIR = BASE_DIR / "data" / "templates"
CONFIG_FILE = TEMPLATES_DIR / "template_config.json"

# Load existing config
with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
    config = json.load(f)

print("="*80)
print("UPDATING TEMPLATE CONFIGURATION")
print("="*80)

# Update existing templates to point to new Jinja2 versions
print("\n📝 Updating template configurations...\n")

# Add NDA configuration
config["NDA"] = {
    "filename": "employment/nda.docx",
    "category": "Employment",
    "description": "Non-Disclosure Agreement for protecting confidential information",
    "keywords": ["nda", "non-disclosure", "confidentiality", "agreement", "secrecy"],
    "fields": {
        "disclosing_party": {
            "label": "Disclosing Party Name",
            "type": "text",
            "required": True,
            "example": "ABC Corporation Ltd."
        },
        "disclosing_party_address": {
            "label": "Disclosing Party Address",
            "type": "text",
            "required": True,
            "example": "123 Business Park, Mumbai 400001"
        },
        "receiving_party": {
            "label": "Receiving Party Name",
            "type": "text",
            "required": True,
            "example": "XYZ Enterprises Pvt. Ltd."
        },
        "receiving_party_address": {
            "label": "Receiving Party Address",
            "type": "text",
            "required": True,
            "example": "456 Tech Hub, Bangalore 560001"
        },
        "effective_date": {
            "label": "Effective Date",
            "type": "date",
            "required": True,
            "example": "2025-01-15"
        },
        "purpose": {
            "label": "Purpose of Disclosure",
            "type": "text",
            "required": True,
            "example": "Exploring potential business collaboration in software development"
        },
        "jurisdiction": {
            "label": "Governing Jurisdiction",
            "type": "text",
            "required": False,
            "example": "Mumbai, Maharashtra, India"
        },
        "term_years": {
            "label": "Confidentiality Term (years)",
            "type": "number",
            "required": False,
            "example": "2"
        },
        "disclosing_party_signatory": {
            "label": "Disclosing Party Authorized Signatory",
            "type": "text",
            "required": False,
            "example": "Mr. Rajesh Kumar, CEO"
        },
        "receiving_party_signatory": {
            "label": "Receiving Party Authorized Signatory",
            "type": "text",
            "required": False,
            "example": "Ms. Priya Sharma, Director"
        }
    }
}
print("✅ Added: NDA")

# Update Legal Notices to use new Jinja2 versions
for notice_name in ["Legal Notice for Recovery of Money",
                     "Legal Notice for Non-Payment of Invoice", 
                     "Legal Notice for Recovery of Friendly Loan"]:
    if notice_name in config:
        old_filename = config[notice_name]["filename"]
        new_filename = old_filename.replace(".docx", "-Jinja2.docx")
        config[notice_name]["filename"] = new_filename
        print(f"✅ Updated: {notice_name} → {new_filename}")

# Update Family Trust to use new Jinja2 version
if "Family Trust Deed" in config:
    config["Family Trust Deed"]["filename"] = "Family-Trust-Deed-Jinja2.docx"
    print(f"✅ Updated: Family Trust Deed → Family-Trust-Deed-Jinja2.docx")

# Save updated config
with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print(f"\n✅ Configuration saved to: {CONFIG_FILE}")
print(f"\nTotal templates configured: {len(config)}")
print("\nAll configured templates:")
for i, name in enumerate(config.keys(), 1):
    print(f"  {i}. {name}")

print("\n" + "="*80)
print("✅ CONFIGURATION UPDATE COMPLETE!")
print("="*80)
print("\nAll templates now use Jinja2 format!")
print("You can now create documents using any of these templates.")
