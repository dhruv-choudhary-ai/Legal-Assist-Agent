import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Create connection with the database
conn = psycopg2.connect(
    database=os.getenv('DATABASE_NAME'), 
    user=os.getenv('DATABASE_USER'),
    password=os.getenv('PASSWORD'), 
    host=os.getenv('DATABASE_HOST'), 
    port=os.getenv('DATABASE_PORT')
)

# Create cursor
cur = conn.cursor()

# Create users table
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

print("Users table created successfully!")

# Commit changes
conn.commit()

# Close cursor and connection
cur.close()
conn.close()
