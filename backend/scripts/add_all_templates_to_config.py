"""
Script to automatically add all templates to template_config.json
Analyzes placeholder_details.json and creates configurations for all templates
"""
import json
import os

# Load placeholder details
with open('data/templates/placeholder_details.json', 'r', encoding='utf-8') as f:
    placeholder_data = json.load(f)

# Load existing config
config_path = 'data/templates/template_config.json'
with open(config_path, 'r', encoding='utf-8') as f:
    template_config = json.load(f)

# Template configurations
templates_to_add = {
    "Legal Notice for Recovery of Money": {
        "filename": "Legal-Notice-for-Recovery-of-Money.docx",
        "category": "Legal Notice",
        "description": "Legal notice for recovery of outstanding money/payment",
        "keywords": ["legal notice", "recovery", "money", "payment", "debt", "outstanding"],
        "fields": {
            "notice_date_day": {"label": "Day of notice", "type": "number", "required": True, "example": "15"},
            "notice_date_month": {"label": "Month of notice", "type": "text", "required": True, "example": "January"},
            "notice_date_year": {"label": "Year of notice", "type": "number", "required": True, "example": "2025"},
            "recipient_name": {"label": "Recipient's name", "type": "text", "required": True, "example": "Mr. Amit Sharma"},
            "recipient_address": {"label": "Recipient's address", "type": "text", "required": True, "example": "123 MG Road, Mumbai 400001"},
            "client_name": {"label": "Client's name (your company/individual)", "type": "text", "required": True, "example": "ABC Enterprises Pvt. Ltd."},
            "client_designation": {"label": "Client designation/capacity", "type": "text", "required": False, "example": "Managing Director"},
            "client_type": {"label": "Client type (firm/individual/company)", "type": "text", "required": True, "example": "Private Limited Company"},
            "client_full_name": {"label": "Client's full legal name", "type": "text", "required": True, "example": "M/s ABC Enterprises Pvt. Ltd."},
            "business_nature": {"label": "Nature of business", "type": "text", "required": True, "example": "manufacturing and supply of electronics"},
            "business_product": {"label": "Product/Service", "type": "text", "required": True, "example": "electronic components"},
            "principal_amount": {"label": "Principal outstanding amount (₹)", "type": "number", "required": True, "example": "250000"},
            "total_amount_with_interest": {"label": "Total amount including interest (₹)", "type": "number", "required": True, "example": "275000"},
            "interest_amount": {"label": "Interest amount (₹)", "type": "number", "required": True, "example": "25000"},
            "interest_rate": {"label": "Interest rate (% per annum)", "type": "number", "required": True, "example": "12"},
            "total_payable": {"label": "Total amount payable (₹)", "type": "number", "required": True, "example": "275000"},
            "notice_fee": {"label": "Legal notice fee (₹)", "type": "number", "required": False, "example": "5000"},
            "advocate_name": {"label": "Advocate's name", "type": "text", "required": True, "example": "Adv. Rajesh Kumar"}
        }
    },
    
    "Legal Notice for Non-Payment of Invoice": {
        "filename": "Legal-Notice-for-Non-Payment-of-Invoice.docx",
        "category": "Legal Notice",
        "description": "Legal notice for non-payment of invoices",
        "keywords": ["legal notice", "invoice", "non-payment", "bill", "payment due"],
        "fields": {
            "notice_date_day": {"label": "Day of notice", "type": "number", "required": True, "example": "15"},
            "notice_date_month": {"label": "Month of notice", "type": "text", "required": True, "example": "January"},
            "notice_date_year": {"label": "Year of notice", "type": "number", "required": True, "example": "2025"},
            "recipient_name": {"label": "Recipient's name", "type": "text", "required": True, "example": "Mr. Amit Sharma"},
            "recipient_address": {"label": "Recipient's address", "type": "text", "required": True, "example": "123 MG Road, Mumbai 400001"},
            "client_name": {"label": "Client's name", "type": "text", "required": True, "example": "ABC Enterprises Pvt. Ltd."},
            "client_designation": {"label": "Client designation", "type": "text", "required": False, "example": "Managing Director"},
            "client_type": {"label": "Client type", "type": "text", "required": True, "example": "company"},
            "client_full_name": {"label": "Client's full legal name", "type": "text", "required": True, "example": "M/s ABC Enterprises Pvt. Ltd."},
            "business_nature": {"label": "Nature of business", "type": "text", "required": True, "example": "supply of goods"},
            "business_product": {"label": "Product/Service", "type": "text", "required": True, "example": "office supplies"},
            "principal_amount": {"label": "Invoice amount (₹)", "type": "number", "required": True, "example": "150000"},
            "total_amount_with_interest": {"label": "Total with interest (₹)", "type": "number", "required": True, "example": "165000"},
            "interest_amount": {"label": "Interest amount (₹)", "type": "number", "required": True, "example": "15000"},
            "interest_rate": {"label": "Interest rate (%)", "type": "number", "required": True, "example": "12"},
            "total_payable": {"label": "Total payable (₹)", "type": "number", "required": True, "example": "165000"},
            "notice_fee": {"label": "Notice fee (₹)", "type": "number", "required": False, "example": "3000"},
            "advocate_name": {"label": "Advocate's name", "type": "text", "required": True, "example": "Adv. Priya Patel"}
        }
    },
    
    "Legal Notice for Recovery of Friendly Loan": {
        "filename": "Legal-Notice-for-Recovery-of-Friendly-Loan.docx",
        "category": "Legal Notice",
        "description": "Legal notice for recovery of friendly/personal loan",
        "keywords": ["legal notice", "loan", "friendly loan", "personal loan", "recovery"],
        "fields": {
            "notice_date_day": {"label": "Day of notice", "type": "number", "required": True, "example": "15"},
            "notice_date_month": {"label": "Month of notice", "type": "text", "required": True, "example": "January"},
            "notice_date_year": {"label": "Year of notice", "type": "number", "required": True, "example": "2025"},
            "recipient_name": {"label": "Borrower's name", "type": "text", "required": True, "example": "Mr. Rahul Verma"},
            "recipient_address": {"label": "Borrower's address", "type": "text", "required": True, "example": "456 Park Street, Delhi 110001"},
            "client_name": {"label": "Lender's name (your name)", "type": "text", "required": True, "example": "Mr. Suresh Kumar"},
            "client_designation": {"label": "Lender's designation", "type": "text", "required": False, "example": "Businessman"},
            "client_type": {"label": "Lender type", "type": "text", "required": True, "example": "individual"},
            "client_full_name": {"label": "Lender's full name", "type": "text", "required": True, "example": "Mr. Suresh Kumar"},
            "business_nature": {"label": "Nature of transaction", "type": "text", "required": True, "example": "personal friendly loan"},
            "business_product": {"label": "Loan purpose", "type": "text", "required": True, "example": "business expansion"},
            "principal_amount": {"label": "Loan amount (₹)", "type": "number", "required": True, "example": "500000"},
            "total_amount_with_interest": {"label": "Total with interest (₹)", "type": "number", "required": True, "example": "550000"},
            "interest_amount": {"label": "Interest (₹)", "type": "number", "required": True, "example": "50000"},
            "interest_rate": {"label": "Interest rate (%)", "type": "number", "required": True, "example": "10"},
            "total_payable": {"label": "Total payable (₹)", "type": "number", "required": True, "example": "550000"},
            "notice_fee": {"label": "Notice fee (₹)", "type": "number", "required": False, "example": "5000"},
            "advocate_name": {"label": "Advocate's name", "type": "text", "required": True, "example": "Adv. Meera Singh"}
        }
    },
    
    "Family Trust Deed": {
        "filename": "Deed-of-Family-Trust.docx",
        "category": "Trust",
        "description": "Deed for creating a family trust",
        "keywords": ["trust", "family trust", "settlor", "trustee", "family property"],
        "fields": {
            "trust_location": {"label": "Place of trust deed", "type": "text", "required": True, "example": "Mumbai"},
            "trust_date_day": {"label": "Day of deed", "type": "number", "required": True, "example": "15"},
            "trust_date_month": {"label": "Month of deed", "type": "text", "required": True, "example": "January"},
            "trust_date_year": {"label": "Year of deed", "type": "number", "required": True, "example": "2025"},
            "settlor1_name": {"label": "First Settlor name", "type": "text", "required": True, "example": "Mr. Ramesh Kumar"},
            "settlor2_name": {"label": "Second Settlor name", "type": "text", "required": True, "example": "Mr. Suresh Kumar"},
            "settlor3_name": {"label": "Third Settlor name", "type": "text", "required": False, "example": "Mr. Dinesh Kumar"},
            "settlor_address": {"label": "Settlors' address", "type": "text", "required": True, "example": "123 Green Park, Mumbai 400001"},
            "trustee1_name": {"label": "First Trustee name", "type": "text", "required": True, "example": "Mr. Ajay Patel"},
            "trustee2_name": {"label": "Second Trustee name", "type": "text", "required": True, "example": "Mr. Vijay Sharma"},
            "trustee3_name": {"label": "Third Trustee name", "type": "text", "required": False, "example": "Mr. Sanjay Gupta"},
            "family_name": {"label": "Family name/surname", "type": "text", "required": True, "example": "Kumar"},
            "property_location": {"label": "Property location", "type": "text", "required": True, "example": "Mumbai, Maharashtra"},
            "property_village": {"label": "Village/Town", "type": "text", "required": True, "example": "Bandra"},
            "property_district": {"label": "District", "type": "text", "required": True, "example": "Mumbai"},
            "property_state": {"label": "State", "type": "text", "required": True, "example": "Maharashtra"},
            "deity_name": {"label": "Family deity name", "type": "text", "required": True, "example": "Goddess Lakshmi"},
            "trust_fund_amount": {"label": "Initial trust fund (₹)", "type": "number", "required": True, "example": "1000000"},
            "trust_name": {"label": "Trust name", "type": "text", "required": True, "example": "Kumar Family Trust"},
            "max_expenditure": {"label": "Max expenditure without approval (₹)", "type": "number", "required": False, "example": "50000"},
            "witness_name": {"label": "Witness name", "type": "text", "required": False, "example": "Mr. Prakash Reddy"}
        }
    }
}

# Add new templates to config
for template_name, template_data in templates_to_add.items():
    if template_name not in template_config:
        template_config[template_name] = template_data
        print(f"✅ Added: {template_name}")
    else:
        print(f"⚠️  Skipped (already exists): {template_name}")

# Save updated config
with open(config_path, 'w', encoding='utf-8') as f:
    json.dump(template_config, f, indent=2, ensure_ascii=False)

print(f"\n✅ Template config updated successfully!")
print(f"Total templates: {len(template_config)}")
