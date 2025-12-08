import json
import os

# Load config
with open('data/templates/template_config.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

print("Checking template files...\n")

missing = []
found = []

for name, cfg in config.items():
    if isinstance(cfg, dict) and 'filename' in cfg:
        filepath = os.path.join('data/templates', cfg['filename'])
        if os.path.exists(filepath):
            found.append(f"✅ {name}: {cfg['filename']}")
        else:
            missing.append(f"❌ {name}: {cfg['filename']}")

print("Found templates:")
for f in found:
    print(f"  {f}")

if missing:
    print("\nMissing template files:")
    for m in missing:
        print(f"  {m}")
else:
    print("\n✅ All template files found!")
