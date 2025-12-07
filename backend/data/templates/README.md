# Templates Directory Structure

## Overview
This directory contains all Jinja2 document templates organized by category.

## Directory Structure

```
templates/
├── corporate/              # Corporate & business documents
│   └── Family-Trust-Deed-Jinja2.docx
├── employment/             # Employment-related documents
│   ├── NDA-Jinja2-Fixed.docx
│   ├── employment_agreement.docx
│   └── nda.docx (legacy)
├── legal_notices/          # Legal notice templates
│   ├── Legal-Notice-for-Recovery-of-Money-Jinja2.docx
│   ├── Legal-Notice-for-Non-Payment-of-Invoice-Jinja2.docx
│   └── Legal-Notice-for-Recovery-of-Friendly-Loan-Jinja2.docx
├── property/               # Property & lease documents
│   ├── Lease-Agreement-Jinja2.docx
│   └── lease_agreement.docx (legacy)
├── archive_old_templates/  # Old non-Jinja2 templates (archived)
├── template_config.json    # Template metadata and field definitions
├── template_analysis.json  # Template analysis data
└── placeholder_details.json # Placeholder mapping details
```

## Active Templates (Jinja2 Format)

### Property (1 template)
- **Lease Agreement** - `property/Lease-Agreement-Jinja2.docx`

### Legal Notices (3 templates)
- **Legal Notice for Recovery of Money** - `legal_notices/Legal-Notice-for-Recovery-of-Money-Jinja2.docx`
- **Legal Notice for Non-Payment of Invoice** - `legal_notices/Legal-Notice-for-Non-Payment-of-Invoice-Jinja2.docx`
- **Legal Notice for Recovery of Friendly Loan** - `legal_notices/Legal-Notice-for-Recovery-of-Friendly-Loan-Jinja2.docx`

### Corporate (1 template)
- **Family Trust Deed** - `corporate/Family-Trust-Deed-Jinja2.docx`

### Employment (1 template)
- **NDA** - `employment/NDA-Jinja2-Fixed.docx`

## Template Format

All active templates use **Jinja2** syntax for variable placeholders:
- Variables: `{{ variable_name }}`
- Conditionals: `{% if condition %} ... {% endif %}`
- Loops: `{% for item in items %} ... {% endfor %}`

## Configuration

Templates are configured in `template_config.json` with:
- Filename and category
- Description and keywords
- Field definitions (label, type, required, example)

## Legacy Templates

Old non-Jinja2 templates have been moved to `archive_old_templates/` for reference:
- Deed of Lease.docx
- Deed-of-Family-Trust.docx
- Lease-Deed-(for-a-term-of-years)-Rent-Agreement.docx
- Legal-Notice-for-Non-Payment-of-Invoice.docx
- Legal-Notice-for-Recovery-of-Friendly-Loan.docx
- Legal-Notice-for-Recovery-of-Money.docx
- Non Disclosure Agreement.docx

## Adding New Templates

1. Create Jinja2 template in appropriate category folder
2. Add configuration to `template_config.json`
3. Test template with sample data
4. Update this README with new template info
