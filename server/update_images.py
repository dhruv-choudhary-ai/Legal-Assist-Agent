import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    database=os.getenv('DATABASE_NAME'),
    user=os.getenv('DATABASE_USER'),
    password=os.getenv('PASSWORD'),
    host=os.getenv('DATABASE_HOST'),
    port=os.getenv('DATABASE_PORT')
)

cur = conn.cursor()

# ====== CHANGE THESE VALUES ======
service_id = 6
image_filename = "download6.png"  # Just store the filename
new_image_url = f"http://localhost:5000/api/local-images/{image_filename}"
# =================================

cur.execute("""
    UPDATE services
    SET img_link = %s
    WHERE service_id = %s
""", (new_image_url, service_id))

conn.commit()
cur.close()
conn.close()

print("Image updated successfully!")