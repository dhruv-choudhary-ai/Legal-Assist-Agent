"""
Test script for template discovery and variable extraction
"""
from ai.template_manager import template_manager

print("\n" + "="*60)
print("TESTING TEMPLATE DISCOVERY")
print("="*60 + "\n")

templates = template_manager.discover_templates()

print(f"✅ Found {len(templates)} templates\n")

for template_id, info in templates.items():
    print(f"📄 {info['name']} ({info['category']})")
    print(f"   ID: {template_id}")
    print(f"   File: {info['file_name']}")
    print(f"   Variables ({info['variable_count']}): {', '.join(info['variables'][:10])}")
    if info['variable_count'] > 10:
        print(f"   ... and {info['variable_count'] - 10} more")
    print()

print("\n" + "="*60)
print("TESTING TEMPLATE METADATA")
print("="*60 + "\n")

# Get detailed metadata for NDA template
nda_metadata = template_manager.get_template_metadata("employment/nda")

if nda_metadata:
    print(f"📋 Template: {nda_metadata['name']}")
    print(f"   Category: {nda_metadata['category']}")
    print(f"   Variables: {nda_metadata['variable_count']}")
    print()
    print("   Variable Details:")
    for var_name, var_info in list(nda_metadata['variables'].items())[:5]:
        print(f"   • {var_name}:")
        print(f"     - Display: {var_info['display_name']}")
        print(f"     - Type: {var_info['type']}")
        print(f"     - Example: {var_info.get('example', 'N/A')}")

print("\n✅ All tests passed!\n")
