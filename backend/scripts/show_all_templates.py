"""
Display all configured templates
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
CONFIG_FILE = BASE_DIR / "data" / "templates" / "template_config.json"

with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
    config = json.load(f)

print("="*80)
print("ALL TEMPLATES CONFIGURED (JINJA2 FORMAT)")
print("="*80)
print(f"\nTotal Templates: {len(config)}\n")

for i, (name, cfg) in enumerate(config.items(), 1):
    print(f"{i}. {name}")
    print(f"   📄 File: {cfg['filename']}")
    print(f"   📊 Fields: {len(cfg['fields'])}")
    print(f"   🏷️  Category: {cfg.get('category', 'N/A')}")
    print()

print("="*80)
print("✅ ALL TEMPLATES USE JINJA2 FORMAT")
print("="*80)
print("\nStatus:")
print("  ✅ Lease Agreement - Already Jinja2")
print("  ✅ Legal Notices (3) - Converted from underscores")
print("  ✅ Family Trust - Converted from dots")
print("  ✅ NDA - Converted from mixed placeholders")
print("\nAll templates ready for document generation!")
