"""
Populate Knowledge Base Script
Adds Indian legal documents to the vector database
"""

import os
import sys
import logging

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from ai.rag_pipeline import rag_pipeline
from ai.vectordb_manager import vector_db

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_sample_legal_documents():
    """Create sample Indian legal documents for testing"""
    
    sample_docs = [
        {
            'text': """
Transfer of Property Act 1882 - Section 54
Sale how made:
Sale of immovable property of the value of one hundred rupees and upwards, or of any interest in such property, can be made only by a registered instrument.

Sale of immovable property of a value less than one hundred rupees may be made either by a registered instrument or by delivery of the property.

Sale of tangible immoveable property of a value of one hundred rupees and upwards can be made only by a registered instrument, while sale of such property of a value less than one hundred rupees may be made either by such instrument or by delivery of the property.

Delivery of tangible immoveable property takes place when the buyer is put into possession of the property.
            """,
            'metadata': {
                'source': 'Transfer of Property Act 1882',
                'type': 'Bare Act',
                'section': '54',
                'domain': 'property'
            }
        },
        {
            'text': """
Indian Contract Act 1872 - Section 10
What agreements are contracts:
All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void.

Essential elements of a valid contract:
1. Offer and Acceptance
2. Free Consent
3. Competent Parties
4. Lawful Consideration
5. Lawful Object
6. Not expressly declared void
7. Certainty and Possibility of Performance
8. Legal Formalities (where required)
            """,
            'metadata': {
                'source': 'Indian Contract Act 1872',
                'type': 'Bare Act',
                'section': '10',
                'domain': 'corporate'
            }
        },
        {
            'text': """
Lease Agreement Requirements in India:
A lease agreement for property in India must include:

1. Parties Details: Full names, addresses of lessor (owner) and lessee (tenant)
2. Property Description: Complete address, area, boundaries
3. Lease Duration: Start date, end date, renewal terms
4. Rent Amount: Monthly/annual rent, payment due date
5. Security Deposit: Amount, refund conditions
6. Maintenance: Responsibilities of lessor and lessee
7. Utilities: Who pays for electricity, water, etc.
8. Termination Clauses: Notice period, conditions
9. Registration: Required if lease > 11 months
10. Signatures: Both parties with witnesses

Important: Leases exceeding 11 months must be registered under Registration Act 1908.
            """,
            'metadata': {
                'source': 'Legal Documentation Guide',
                'type': 'Guide',
                'category': 'Lease Agreement',
                'domain': 'property'
            }
        },
        {
            'text': """
Companies Act 2013 - Key Provisions for Private Companies:

Minimum Requirements:
- Minimum 2 directors (at least one resident in India)
- Minimum 2 shareholders
- Minimum paid-up capital: ₹1 lakh

Documents Required:
1. Memorandum of Association (MOA)
2. Articles of Association (AOA)
3. Director Identification Number (DIN)
4. Digital Signature Certificate (DSC)

Compliance Requirements:
- Annual General Meeting (AGM)
- Annual financial statements
- Income tax returns
- ROC filings (Form AOC-4, Form MGT-7)
- Board meetings (minimum 4 per year)

Penalties for non-compliance range from ₹10,000 to ₹5 lakhs.
            """,
            'metadata': {
                'source': 'Companies Act 2013',
                'type': 'Act Summary',
                'category': 'Corporate Compliance',
                'domain': 'corporate'
            }
        },
        {
            'text': """
Employment Contract Essentials in India:

Mandatory Clauses:
1. Job Title and Description
2. Date of Joining
3. Probation Period (typically 3-6 months)
4. Salary and Benefits (CTC breakdown)
5. Working Hours and Leave Policy
6. Notice Period (typically 30-90 days)
7. Termination Conditions
8. Confidentiality and Non-Disclosure
9. Intellectual Property Rights
10. Dispute Resolution and Jurisdiction

Important Laws:
- Industrial Disputes Act 1947
- Payment of Wages Act 1936
- Employees' Provident Funds Act 1952
- Shops and Establishments Act (State-specific)

Gratuity is payable after 5 years of continuous service.
            """,
            'metadata': {
                'source': 'Employment Law Guide',
                'type': 'Guide',
                'category': 'Employment Contract',
                'domain': 'employment'
            }
        },
        {
            'text': """
Copyright Act 1957 - Key Points:

Copyright Protection:
- Original literary, dramatic, musical, and artistic works
- Cinematograph films and sound recordings
- Protection lasts for author's lifetime + 60 years

Copyright gives exclusive rights to:
1. Reproduce the work
2. Issue copies to public
3. Perform the work in public
4. Communicate the work to public
5. Make adaptations

Registration:
- Not mandatory but provides legal benefits
- Apply at Copyright Office
- Processing time: 6-18 months

Fair Use: Permitted for research, criticism, review, reporting, education.

Penalties: Imprisonment up to 3 years and/or fine up to ₹2 lakhs.
            """,
            'metadata': {
                'source': 'Copyright Act 1957',
                'type': 'Bare Act',
                'category': 'Intellectual Property',
                'domain': 'ip'
            }
        },
        {
            'text': """
Will and Testament Requirements in India:

Types of Wills:
1. Privileged Will: By soldiers, airmen, mariners
2. Unprivileged Will: By general public
3. Conditional Will: Takes effect on specific condition
4. Joint Will: Made by two or more persons

Essential Requirements:
- Testator must be of sound mind
- Minimum age: 18 years
- Must be in writing (except privileged wills)
- Signed by testator
- Witnessed by at least 2 witnesses

Content Should Include:
1. Declaration (revoking previous wills)
2. Appointment of Executor
3. Details of Assets
4. Beneficiaries and their shares
5. Specific bequests
6. Residuary clause
7. Date and place of execution

Registration: Optional but recommended for authenticity.

Applicable Laws: Indian Succession Act 1925, Hindu Succession Act 1956
            """,
            'metadata': {
                'source': 'Succession Law Guide',
                'type': 'Guide',
                'category': 'Will and Testament',
                'domain': 'family'
            }
        },
        {
            'text': """
Non-Disclosure Agreement (NDA) in India:

Purpose: Protect confidential business information from unauthorized disclosure.

Key Clauses:
1. Definition of Confidential Information
2. Obligations of Receiving Party
3. Exclusions from Confidentiality
4. Term and Termination
5. Return or Destruction of Information
6. Remedies for Breach
7. Governing Law and Jurisdiction

Types:
- Unilateral NDA: One party discloses
- Bilateral NDA: Both parties disclose (Mutual NDA)

Important Points:
- Must clearly define what is confidential
- Reasonable time period (typically 2-5 years)
- Specify consequences of breach
- Include injunctive relief clause
- Choose appropriate jurisdiction

Enforceability: NDAs are enforceable under Indian Contract Act 1872, provided they meet all requirements of a valid contract.
            """,
            'metadata': {
                'source': 'Contract Law Guide',
                'type': 'Guide',
                'category': 'Non-Disclosure Agreement',
                'domain': 'corporate'
            }
        },
        {
            'text': """
GST (Goods and Services Tax) Registration in India:

Mandatory for:
- Businesses with turnover > ₹40 lakhs (₹20 lakhs for special category states)
- Inter-state suppliers
- E-commerce sellers
- Casual taxable persons
- Input Service Distributors

Documents Required:
1. PAN Card
2. Aadhaar Card
3. Business Registration Certificate
4. Bank Account Details
5. Business Address Proof
6. Authorized Signatory Details

Process:
1. Apply on GST portal (gst.gov.in)
2. Submit Form GST REG-01
3. Upload documents
4. Verification by GST officer
5. GSTIN issued within 3-7 working days

Returns Filing:
- GSTR-1: Outward supplies (monthly)
- GSTR-3B: Summary return (monthly)
- GSTR-9: Annual return

Penalties for non-compliance: Up to ₹10,000 or tax amount, whichever is higher.
            """,
            'metadata': {
                'source': 'GST Law Guide',
                'type': 'Guide',
                'category': 'GST Registration',
                'domain': 'finance'
            }
        },
        {
            'text': """
Partnership Deed Requirements in India:

Essential Clauses:
1. Name and Address of Partnership Firm
2. Nature of Business
3. Names and Addresses of Partners
4. Capital Contribution of Each Partner
5. Profit and Loss Sharing Ratio
6. Rights and Duties of Partners
7. Salary/Remuneration (if any)
8. Interest on Capital and Drawings
9. Admission and Retirement of Partners
10. Dissolution of Partnership
11. Arbitration Clause
12. Duration of Partnership

Registration:
- Not mandatory but highly recommended
- Register with Registrar of Firms
- Benefits: Legal recognition, easier to sue third parties

Governed by: Indian Partnership Act 1932

Types:
- General Partnership
- Limited Liability Partnership (LLP Act 2008)

Important: LLP provides limited liability protection unlike general partnership.
            """,
            'metadata': {
                'source': 'Partnership Law Guide',
                'type': 'Guide',
                'category': 'Partnership Deed',
                'domain': 'corporate'
            }
        }
    ]
    
    return sample_docs


def populate_with_samples():
    """Populate database with sample documents"""
    try:
        logger.info("=" * 60)
        logger.info("📚 Populating Knowledge Base with Sample Documents")
        logger.info("=" * 60)
        
        # Create sample documents
        sample_docs = create_sample_legal_documents()
        
        # Add to vector database
        documents = [doc['text'] for doc in sample_docs]
        metadatas = [doc['metadata'] for doc in sample_docs]
        
        success = vector_db.add_documents(documents, metadatas)
        
        if success:
            logger.info(f"✅ Successfully added {len(sample_docs)} sample documents")
            logger.info("\nDocuments added:")
            for i, doc in enumerate(sample_docs, 1):
                meta = doc['metadata']
                logger.info(f"  {i}. {meta['type']}: {meta['source']} ({meta.get('domain', 'general')})")
            
            # Get stats
            stats = vector_db.get_stats()
            logger.info(f"\n📊 Knowledge Base Stats:")
            logger.info(f"   Total Documents: {stats.get('total_documents', 0)}")
            logger.info(f"   Collection: {stats.get('collection_name', 'N/A')}")
            
            logger.info("\n" + "=" * 60)
            logger.info("✅ Knowledge Base Population Complete!")
            logger.info("=" * 60)
            logger.info("\nYou can now use RAG endpoints:")
            logger.info("  - POST /api/chat/rag")
            logger.info("  - POST /api/knowledge/search")
            logger.info("  - GET  /api/knowledge/stats")
            
            return True
        else:
            logger.error("❌ Failed to add documents")
            return False
    
    except Exception as e:
        logger.error(f"❌ Population failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def populate_from_directory(directory_path):
    """Populate from a directory of documents"""
    try:
        logger.info(f"📁 Populating from directory: {directory_path}")
        
        result = rag_pipeline.populate_knowledge_base(
            directory=directory_path,
            recursive=True
        )
        
        if result['success']:
            logger.info(f"✅ Added {result['total_chunks']} chunks from {directory_path}")
        else:
            logger.error(f"❌ Failed: {result.get('error')}")
        
        return result['success']
    
    except Exception as e:
        logger.error(f"❌ Directory population failed: {e}")
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Populate Knowledge Base')
    parser.add_argument('--samples', action='store_true', help='Add sample Indian legal documents')
    parser.add_argument('--directory', type=str, help='Path to directory with documents')
    parser.add_argument('--clear', action='store_true', help='Clear existing knowledge base first')
    
    args = parser.parse_args()
    
    # Clear if requested
    if args.clear:
        logger.info("🗑️  Clearing existing knowledge base...")
        vector_db.delete_collection()
    
    # Populate
    if args.samples:
        populate_with_samples()
    elif args.directory:
        populate_from_directory(args.directory)
    else:
        # Default: add samples
        logger.info("No arguments provided. Adding sample documents...")
        populate_with_samples()
