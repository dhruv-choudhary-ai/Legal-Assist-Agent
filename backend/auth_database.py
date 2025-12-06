"""
Authentication Database Setup Script
Creates users and user_documents tables for authentication system
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_auth_tables():
    """Create authentication-related tables in the database"""
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
        
        print("🔄 Creating authentication tables...")
        
        # Create users table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                is_verified BOOLEAN DEFAULT FALSE
            );
        ''')
        print("✅ Created 'users' table")
        
        # Create index on email for faster lookups
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        ''')
        print("✅ Created email index")
        
        # Create user_documents table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS user_documents (
                doc_id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
                form_id INT REFERENCES forms(form_id),
                form_name VARCHAR(100),
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        print("✅ Created 'user_documents' table")
        
        # Create indexes for faster queries
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
        ''')
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_user_documents_created_at ON user_documents(created_at DESC);
        ''')
        print("✅ Created document indexes")
        
        # Commit changes
        conn.commit()
        
        print("\n🎉 Authentication tables created successfully!")
        print("\nTables created:")
        print("  1. users (user_id, email, password_hash, full_name, phone, created_at, last_login, is_active, is_verified)")
        print("  2. user_documents (doc_id, user_id, form_id, form_name, content, created_at, updated_at)")
        
        # Display table info
        cur.execute("""
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('users', 'user_documents')
            ORDER BY table_name, ordinal_position;
        """)
        
        print("\n📊 Database Schema:")
        current_table = None
        for row in cur.fetchall():
            table_name, column_name, data_type = row
            if table_name != current_table:
                print(f"\n  {table_name}:")
                current_table = table_name
            print(f"    - {column_name}: {data_type}")
        
        cur.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error creating authentication tables: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Authentication Database Setup")
    print("=" * 60)
    print()
    
    success = create_auth_tables()
    
    if success:
        print("\n" + "=" * 60)
        print("✅ Setup Complete!")
        print("=" * 60)
        print("\nNext steps:")
        print("  1. Install auth dependencies: pip install flask-bcrypt flask-jwt-extended")
        print("  2. Update backend/app.py with authentication endpoints")
        print("  3. Update frontend login/signup pages")
        print("  4. Test authentication flow")
    else:
        print("\n" + "=" * 60)
        print("❌ Setup Failed")
        print("=" * 60)
        print("\nPlease check:")
        print("  1. PostgreSQL is running")
        print("  2. .env file has correct database credentials")
        print("  3. Database exists and is accessible")
