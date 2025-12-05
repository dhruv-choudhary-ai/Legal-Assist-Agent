"""
Complete Authentication System Setup Guide
==========================================

This guide will help you set up the user authentication system.

## What We've Built:

### 1. Backend (Flask) - app.py
   ✅ Added three new endpoints:
      - POST /api/signup - User registration
      - POST /api/login - User login
      - POST /api/logout - User logout
   ✅ Password hashing using werkzeug.security
   ✅ Session management
   ✅ CORS configured for credentials

### 2. Database - Users Table
   ✅ Created migration script: create_users_table.py
   Table structure:
      - user_id (Primary Key, Auto-increment)
      - email (Unique, Required)
      - password_hash (Required)
      - full_name (Optional)
      - created_at (Timestamp)
      - last_login (Timestamp)

### 3. Frontend (React)
   ✅ Updated signup.jsx:
      - Form state management
      - API integration
      - Error/success messages
      - Auto-redirect after signup
   
   ✅ Updated loginPage.jsx:
      - Form state management
      - API integration
      - Error handling
      - Session storage
      - Redirect to home after login

## Setup Instructions:

### Step 1: Create the Users Table (IMPORTANT!)
Run this command in the server directory:
```bash
cd server
python create_users_table.py
```

### Step 2: Restart the Flask Server
Stop the current server (Ctrl+C) and restart:
```bash
python app.py
```

### Step 3: Test the System

#### Testing Signup:
1. Navigate to http://localhost:3000/signup
2. Enter email and password
3. Click "Sign up"
4. Should redirect to login page

#### Testing Login:
1. Navigate to http://localhost:3000/login
2. Enter the email/password you just created
3. Click "Sign in"
4. Should redirect to home page

## How It Works:

### Signup Flow:
1. User fills form → Frontend sends POST to /api/signup
2. Backend checks if email exists
3. Password is hashed (NOT stored in plain text!)
4. User created in database
5. Success message + redirect to login

### Login Flow:
1. User fills form → Frontend sends POST to /api/login
2. Backend looks up user by email
3. Password verified using hash
4. Session created
5. User data stored in localStorage
6. Redirect to home

### Security Features:
✅ Passwords are NEVER stored in plain text
✅ Password hashing using werkzeug
✅ Session management
✅ CORS with credentials
✅ Input validation
✅ Error handling

## Troubleshooting:

### Error: "Unable to connect to server"
- Make sure Flask server is running on port 5000
- Check CORS configuration

### Error: "Email already registered"  
- This email already exists in database
- Use a different email or login instead

### Error: "Invalid email or password"
- Check your credentials
- Make sure you signed up first

### Database Connection Error:
- Check your .env file has correct database credentials
- Make sure PostgreSQL is running

## Next Steps (Optional Enhancements):

1. Add email validation
2. Add password strength requirements
3. Add "Forgot Password" functionality
4. Add user profile page
5. Add email verification
6. Add JWT tokens instead of sessions
7. Add OAuth (Google, Facebook login)

## Files Modified/Created:

Backend:
- ✅ server/app.py (added auth endpoints)
- ✅ server/create_users_table.py (new)
- ✅ server/README_AUTH.md (this file)

Frontend:
- ✅ client/src/signup.jsx (updated)
- ✅ client/src/loginPage.jsx (updated)

Database:
- ✅ users table (to be created)

Enjoy your new authentication system! 🎉
"""
