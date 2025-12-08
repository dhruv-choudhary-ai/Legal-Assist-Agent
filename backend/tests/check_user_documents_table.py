import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

# Connect to database
conn = psycopg2.connect(
    database=os.getenv('DATABASE_NAME'),
    user=os.getenv('DATABASE_USER'),
    password=os.getenv('PASSWORD'),
    host=os.getenv('DATABASE_HOST'),
    port=os.getenv('DATABASE_PORT'),
    connect_timeout=5
)

cur = conn.cursor()

# Check if user_documents table exists
cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'user_documents'
    ORDER BY ordinal_position;
""")

columns = cur.fetchall()

if columns:
    print("user_documents table structure:")
    for col in columns:
        print(f"  - {col[0]} ({col[1]})")
else:
    print("❌ user_documents table does not exist!")
    print("\nCreating user_documents table...")
    
    # Create the table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_documents (
            doc_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            form_name VARCHAR(200) NOT NULL,
            document_content TEXT,
            field_values JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    print("✅ user_documents table created!")

cur.close()
conn.close()
