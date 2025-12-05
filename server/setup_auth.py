"""
Quick Setup Script for Authentication System
This will add the users table to your existing database.
"""

import psycopg2
import os
import sys
from dotenv import load_dotenv

load_dotenv()

def setup_auth_system():
    try:
        print("🔧 Connecting to database...")
        conn = psycopg2.connect(
            database=os.getenv('DATABASE_NAME'), 
            user=os.getenv('DATABASE_USER'),
            password=os.getenv('PASSWORD'), 
            host=os.getenv('DATABASE_HOST'), 
            port=os.getenv('DATABASE_PORT')
        )
        
        cur = conn.cursor()
        
        print("📋 Creating users table...")
        cur.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            );
        ''')
        
        conn.commit()
        print("✅ Users table created successfully!")
        
        # Check if table was created
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        """)
        
        columns = cur.fetchall()
        print("\n📊 Users table structure:")
        for col in columns:
            print(f"   - {col[0]}: {col[1]}")
        
        cur.close()
        conn.close()
        
        print("\n✨ Authentication system setup complete!")
        print("\n📝 Next steps:")
        print("   1. Restart your Flask server (python app.py)")
        print("   2. Test signup at: http://localhost:3000/signup")
        print("   3. Test login at: http://localhost:3000/login")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\n💡 Troubleshooting:")
        print("   - Check your .env file has correct database credentials")
        print("   - Make sure PostgreSQL is running")
        print("   - Verify DATABASE_NAME, DATABASE_USER, PASSWORD, DATABASE_HOST, DATABASE_PORT")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  🔐 AUTHENTICATION SYSTEM SETUP")
    print("=" * 60)
    print()
    
    success = setup_auth_system()
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)
