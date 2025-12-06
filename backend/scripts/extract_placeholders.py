"""
Extract detailed placeholders from .docx templates
"""
import os
from docx import Document
import re
import json

def extract_all_placeholders(filepath):
    """Extract all types of placeholders with their context"""
    try:
        doc = Document(filepath)
        
        # Get full text with paragraph markers
        full_text = ""
        paragraph_map = []
        
        for i, paragraph in enumerate(doc.paragraphs):
            text = paragraph.text
            if text.strip():
                full_text += text + "\n"
                paragraph_map.append({
                    'index': i,
                    'text': text
                })
        
        # Extract different placeholder types
        placeholders = {
            'hash_numbered': [],      # #1, #2, #3
            'dots': [],               # .... or .....
            'underscores': [],        # _____ or _____________
            'parentheses': [],        # (1), (2), (3)
            'context': []
        }
        
        # Find #-numbered placeholders
        hash_matches = re.finditer(r'#(\d+)', full_text)
        for match in hash_matches:
            placeholders['hash_numbered'].append({
                'number': match.group(1),
                'full_match': match.group(0),
                'context': full_text[max(0, match.start()-50):match.end()+50]
            })
        
        # Find dot placeholders (5+ dots)
        dot_matches = re.finditer(r'\.{5,}', full_text)
        for match in dot_matches:
            placeholders['dots'].append({
                'length': len(match.group(0)),
                'context': full_text[max(0, match.start()-50):match.end()+50]
            })
        
        # Find underscore placeholders (3+ underscores)
        underscore_matches = re.finditer(r'_{3,}', full_text)
        for match in underscore_matches:
            placeholders['underscores'].append({
                'length': len(match.group(0)),
                'context': full_text[max(0, match.start()-50):match.end()+50]
            })
        
        # Find parentheses numbered placeholders
        paren_matches = re.finditer(r'\((\d+)\)', full_text)
        for match in paren_matches:
            placeholders['parentheses'].append({
                'number': match.group(1),
                'full_match': match.group(0),
                'context': full_text[max(0, match.start()-50):match.end()+50]
            })
        
        return {
            'success': True,
            'placeholders': placeholders,
            'full_text': full_text,
            'paragraph_count': len(paragraph_map)
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}

def main():
    templates_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'templates')
    
    template_files = [
        'Deed of Lease .docx',
        'Deed-of-Family-Trust.docx',
        'Lease-Deed-(for-a-term-of-years)-Rent-Agreement.docx',
        'Legal-Notice-for-Non-Payment-of-Invoice.docx',
        'Legal-Notice-for-Recovery-of-Friendly-Loan.docx',
        'Legal-Notice-for-Recovery-of-Money.docx'
    ]
    
    print("=" * 100)
    print("DETAILED PLACEHOLDER EXTRACTION")
    print("=" * 100)
    
    all_results = {}
    
    for template_file in template_files:
        filepath = os.path.join(templates_dir, template_file)
        
        if not os.path.exists(filepath):
            print(f"\n❌ NOT FOUND: {template_file}")
            continue
        
        print(f"\n📄 {template_file}")
        print("-" * 100)
        
        result = extract_all_placeholders(filepath)
        all_results[template_file] = result
        
        if not result['success']:
            print(f"   ❌ Error: {result['error']}")
            continue
        
        placeholders = result['placeholders']
        
        # Hash numbered (#1, #2, etc.)
        if placeholders['hash_numbered']:
            print(f"\n   📌 Hash Numbered Placeholders: {len(placeholders['hash_numbered'])}")
            for i, ph in enumerate(placeholders['hash_numbered'][:5], 1):
                context = ph['context'].replace('\n', ' ')
                print(f"      {i}. #{ph['number']}: ...{context}...")
        
        # Dots (.....)
        if placeholders['dots']:
            print(f"\n   📌 Dot Placeholders: {len(placeholders['dots'])}")
            for i, ph in enumerate(placeholders['dots'][:5], 1):
                context = ph['context'].replace('\n', ' ')
                print(f"      {i}. {'.' * min(ph['length'], 10)}: ...{context}...")
        
        # Underscores (_____)
        if placeholders['underscores']:
            print(f"\n   📌 Underscore Placeholders: {len(placeholders['underscores'])}")
            for i, ph in enumerate(placeholders['underscores'][:5], 1):
                context = ph['context'].replace('\n', ' ')
                print(f"      {i}. {'_' * min(ph['length'], 10)}: ...{context}...")
        
        # Parentheses ((1), (2))
        if placeholders['parentheses']:
            print(f"\n   📌 Parentheses Numbered Placeholders: {len(placeholders['parentheses'])}")
            for i, ph in enumerate(placeholders['parentheses'][:5], 1):
                context = ph['context'].replace('\n', ' ')
                print(f"      {i}. ({ph['number']}): ...{context}...")
        
        print(f"\n   📊 Total Paragraphs: {result['paragraph_count']}")
    
    # Save detailed results
    output_file = os.path.join(templates_dir, 'placeholder_details.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 100)
    print(f"✅ Detailed analysis saved to: {output_file}")
    print("=" * 100)

if __name__ == '__main__':
    main()
