"""
Digital Signature Database Setup Script
Creates tables for digital signature functionality with NSDL e-Sign integration
"""

import psycopg2
import os
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

def create_signature_tables():
    """Create digital signature related tables in the database"""
    try:
        # Create database connection
        conn = psycopg2.connect(
            database=os.getenv('DATABASE_NAME'),
            user=os.getenv('DATABASE_USER'),
            password=os.getenv('PASSWORD'),
            host=os.getenv('DATABASE_HOST'),
            port=os.getenv('DATABASE_PORT'),
            sslmode='require'
        )
        
        cur = conn.cursor()
        
        print("=" * 70)
        print("🔐 Digital Signature Database Setup")
        print("=" * 70)
        print()
        
        # 1. Create digital_signatures table
        print("📝 Creating digital_signatures table...")
        cur.execute('''
            CREATE TABLE IF NOT EXISTS digital_signatures (
                signature_id SERIAL PRIMARY KEY,
                document_id INTEGER REFERENCES user_documents(doc_id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(user_id),
                
                -- Aadhaar (hashed, never plain text)
                aadhaar_number_hash VARCHAR(64) NOT NULL,
                
                -- Signature status
                signature_status VARCHAR(50) DEFAULT 'pending',
                -- Status: pending, otp_sent, verified, signed, failed, expired
                
                -- NSDL e-Sign Integration
                transaction_id VARCHAR(100) UNIQUE,
                esign_request_id VARCHAR(100),
                esign_response_data JSONB,
                
                -- OTP Verification
                otp_request_time TIMESTAMP,
                otp_verified_time TIMESTAMP,
                aadhaar_verified BOOLEAN DEFAULT FALSE,
                
                -- Signature Details
                signature_certificate_url TEXT,
                signed_document_url TEXT,
                signature_metadata JSONB,
                -- Metadata: {signer_name, location, timestamp, certificate_id}
                
                -- Security & Integrity
                document_hash VARCHAR(64),
                signed_document_hash VARCHAR(64),
                ip_address VARCHAR(45),
                device_info JSONB,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                signed_at TIMESTAMP,
                expires_at TIMESTAMP,
                
                -- Audit & Error Handling
                retry_count INTEGER DEFAULT 0,
                error_message TEXT,
                is_demo_mode BOOLEAN DEFAULT FALSE
            );
        ''')
        print("✅ Created 'digital_signatures' table")
        
        # 2. Create signature_workflows table (multi-party signing)
        print("📝 Creating signature_workflows table...")
        cur.execute('''
            CREATE TABLE IF NOT EXISTS signature_workflows (
                workflow_id SERIAL PRIMARY KEY,
                document_id INTEGER REFERENCES user_documents(doc_id) ON DELETE CASCADE,
                created_by INTEGER REFERENCES users(user_id),
                
                -- Workflow status
                workflow_status VARCHAR(50) DEFAULT 'active',
                -- Status: active, partially_signed, completed, cancelled
                
                -- Signatory counts
                total_signatories INTEGER NOT NULL,
                signed_count INTEGER DEFAULT 0,
                
                -- Workflow settings
                signing_order VARCHAR(20) DEFAULT 'parallel',
                -- parallel: all can sign simultaneously
                -- sequential: must sign in order
                
                reminder_enabled BOOLEAN DEFAULT TRUE,
                auto_reminder_hours INTEGER DEFAULT 24,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                cancelled_at TIMESTAMP,
                
                -- Additional data
                workflow_metadata JSONB
            );
        ''')
        print("✅ Created 'signature_workflows' table")
        
        # 3. Create signatories table
        print("📝 Creating signatories table...")
        cur.execute('''
            CREATE TABLE IF NOT EXISTS signatories (
                signatory_id SERIAL PRIMARY KEY,
                workflow_id INTEGER REFERENCES signature_workflows(workflow_id) ON DELETE CASCADE,
                signature_id INTEGER REFERENCES digital_signatures(signature_id),
                
                -- Signatory information
                user_id INTEGER REFERENCES users(user_id),
                email VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                role VARCHAR(50) DEFAULT 'party',
                -- Roles: party_1, party_2, witness, notary, approver
                
                -- Signing order (for sequential workflows)
                signing_order INTEGER DEFAULT 1,
                
                -- Status tracking
                status VARCHAR(50) DEFAULT 'pending',
                -- pending, notified, viewed, signed, declined, expired
                
                -- Notifications
                invitation_sent_at TIMESTAMP,
                last_reminder_at TIMESTAMP,
                signed_at TIMESTAMP,
                declined_at TIMESTAMP,
                decline_reason TEXT,
                
                -- Security
                invitation_token VARCHAR(100) UNIQUE,
                token_expires_at TIMESTAMP,
                
                UNIQUE(workflow_id, email)
            );
        ''')
        print("✅ Created 'signatories' table")
        
        # 4. Create signature_audit_log table
        print("📝 Creating signature_audit_log table...")
        cur.execute('''
            CREATE TABLE IF NOT EXISTS signature_audit_log (
                log_id SERIAL PRIMARY KEY,
                signature_id INTEGER REFERENCES digital_signatures(signature_id) ON DELETE CASCADE,
                workflow_id INTEGER REFERENCES signature_workflows(workflow_id),
                
                -- Event details
                event_type VARCHAR(50) NOT NULL,
                -- Events: otp_requested, otp_verified, document_signed, 
                --         signature_failed, workflow_created, signatory_invited, etc.
                
                event_data JSONB,
                event_message TEXT,
                
                -- Security context
                ip_address VARCHAR(45),
                user_agent TEXT,
                user_id INTEGER REFERENCES users(user_id),
                
                -- Timestamp
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        print("✅ Created 'signature_audit_log' table")
        
        # 5. Create indexes for performance
        print("📝 Creating indexes...")
        
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_signatures_document 
            ON digital_signatures(document_id);
        ''')
        
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_signatures_user 
            ON digital_signatures(user_id);
        ''')
        
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_signatures_status 
            ON digital_signatures(signature_status);
        ''')
        
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_signatures_transaction 
            ON digital_signatures(transaction_id);
        ''')
        
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_workflows_document 
            ON signature_workflows(document_id);
        ''')
        
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_workflows_status 
            ON signature_workflows(workflow_status);
        ''')
        
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_signatories_workflow 
            ON signatories(workflow_id);
        ''')
        
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_signatories_email 
            ON signatories(email);
        ''')
        
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_signatories_status 
            ON signatories(status);
        ''')
        
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_audit_signature 
            ON signature_audit_log(signature_id);
        ''')
        
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_audit_event_type 
            ON signature_audit_log(event_type);
        ''')
        
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_audit_created 
            ON signature_audit_log(created_at DESC);
        ''')
        
        print("✅ Created all indexes")
        
        # Commit changes
        conn.commit()
        
        print()
        print("=" * 70)
        print("🎉 Digital Signature Tables Created Successfully!")
        print("=" * 70)
        print()
        print("Tables created:")
        print("  1. digital_signatures - Core signature data")
        print("  2. signature_workflows - Multi-party signing workflows")
        print("  3. signatories - Individual signers in workflows")
        print("  4. signature_audit_log - Complete audit trail")
        print()
        print("Indexes created: 12 indexes for optimal query performance")
        print()
        
        # Display table info
        cur.execute("""
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name IN ('digital_signatures', 'signature_workflows', 
                                'signatories', 'signature_audit_log')
            ORDER BY table_name, ordinal_position;
        """)
        
        print("📊 Database Schema Summary:")
        current_table = None
        for row in cur.fetchall():
            table_name, column_name, data_type, is_nullable = row
            if table_name != current_table:
                print(f"\n  📋 {table_name}:")
                current_table = table_name
            nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
            print(f"    • {column_name:<30} {data_type:<20} {nullable}")
        
        cur.close()
        conn.close()
        
        return True
        
    except psycopg2.Error as e:
        print(f"\n❌ Database Error: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print()
    success = create_signature_tables()
    
    if success:
        print()
        print("=" * 70)
        print("✅ Setup Complete!")
        print("=" * 70)
        print()
        print("Next steps:")
        print("  1. Configure NSDL e-Sign credentials in .env file")
        print("  2. Install signature dependencies: pip install PyPDF2 reportlab cryptography")
        print("  3. Implement signature service: backend/ai/signature/")
        print("  4. Test with demo mode (works without NSDL credentials)")
        print()
    else:
        print()
        print("=" * 70)
        print("❌ Setup Failed")
        print("=" * 70)
        print()
        print("Please check:")
        print("  1. PostgreSQL database is running")
        print("  2. .env file has correct database credentials")
        print("  3. 'users' and 'user_documents' tables exist")
        print()
        sys.exit(1)
