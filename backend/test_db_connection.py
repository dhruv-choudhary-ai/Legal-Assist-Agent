import os
from dotenv import load_dotenv

load_dotenv()

print("Database Configuration:")
print(f"  DATABASE_NAME: {os.getenv('DATABASE_NAME', 'NOT SET')}")
print(f"  DATABASE_USER: {os.getenv('DATABASE_USER', 'NOT SET')}")
print(f"  DATABASE_HOST: {os.getenv('DATABASE_HOST', 'NOT SET')}")
print(f"  DATABASE_PORT: {os.getenv('DATABASE_PORT', 'NOT SET')}")
print(f"  PASSWORD: {'***SET***' if os.getenv('PASSWORD') else 'NOT SET'}")

# Test connection
try:
    import psycopg2
    conn = psycopg2.connect(
        database=os.getenv('DATABASE_NAME'),
        user=os.getenv('DATABASE_USER'),
        password=os.getenv('PASSWORD'),
        host=os.getenv('DATABASE_HOST'),
        port=os.getenv('DATABASE_PORT'),
        connect_timeout=5
    )
    print("\n✅ Database connection successful!")
    conn.close()
except Exception as e:
    print(f"\n❌ Database connection failed: {e}")
    print("\nPossible solutions:")
    print("  1. Make sure PostgreSQL is running")
    print("  2. Check if credentials in .env are correct")
    print("  3. Verify firewall allows connection to database")
