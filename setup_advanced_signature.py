#!/usr/bin/env python3
"""
Advanced Digital Signature Features - Setup Script
Installs dependencies and verifies configuration
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60 + "\n")

def print_step(step_num, total_steps, description):
    """Print step information"""
    print(f"[{step_num}/{total_steps}] {description}...")

def run_command(command, cwd=None, shell=True):
    """Run shell command and return output"""
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            shell=shell,
            check=True,
            capture_output=True,
            text=True
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def check_node_installed():
    """Check if Node.js is installed"""
    success, output = run_command("node --version")
    if success:
        version = output.strip()
        print(f"   ✓ Node.js {version} detected")
        return True
    else:
        print("   ✗ Node.js not found. Please install Node.js first.")
        return False

def check_python_installed():
    """Check if Python is installed"""
    version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    print(f"   ✓ Python {version} detected")
    return True

def install_frontend_dependencies():
    """Install frontend dependencies including qrcode.react"""
    frontend_dir = Path(__file__).parent / "frontend"
    
    if not frontend_dir.exists():
        print("   ✗ Frontend directory not found!")
        return False
    
    # Check if package.json has qrcode.react
    package_json_path = frontend_dir / "package.json"
    with open(package_json_path, 'r', encoding='utf-8') as f:
        package_json = json.load(f)
    
    if "qrcode.react" in package_json.get("dependencies", {}):
        print("   ✓ qrcode.react already in package.json")
    else:
        print("   ✗ qrcode.react not found in package.json!")
        return False
    
    # Install dependencies
    print("   Installing npm packages...")
    success, output = run_command("npm install", cwd=frontend_dir)
    
    if success:
        print("   ✓ Frontend dependencies installed")
        return True
    else:
        print(f"   ✗ Failed to install dependencies:\n{output}")
        return False

def install_backend_dependencies():
    """Install backend dependencies"""
    backend_dir = Path(__file__).parent / "backend"
    
    if not backend_dir.exists():
        print("   ✗ Backend directory not found!")
        return False
    
    requirements_path = backend_dir / "requirements.txt"
    if not requirements_path.exists():
        print("   ✗ requirements.txt not found!")
        return False
    
    print("   Installing Python packages...")
    success, output = run_command(
        f"{sys.executable} -m pip install -r requirements.txt",
        cwd=backend_dir
    )
    
    if success:
        print("   ✓ Backend dependencies installed")
        return True
    else:
        print(f"   ✗ Failed to install dependencies:\n{output}")
        return False

def verify_new_files():
    """Verify that new files were created"""
    files_to_check = [
        "frontend/src/components/SignatureWorkflow.jsx",
        "frontend/src/components/SignatureWorkflow.css",
        "frontend/src/components/SignedDocumentViewer.jsx",
        "frontend/src/components/SignedDocumentViewer.css",
        "docs/ADVANCED_SIGNATURE_FEATURES.md"
    ]
    
    all_exist = True
    for file_path in files_to_check:
        full_path = Path(__file__).parent / file_path
        if full_path.exists():
            print(f"   ✓ {file_path}")
        else:
            print(f"   ✗ {file_path} NOT FOUND")
            all_exist = False
    
    return all_exist

def verify_api_endpoints():
    """Verify new API endpoints were added"""
    routes_file = Path(__file__).parent / "backend/api/signature_routes.py"
    
    if not routes_file.exists():
        print("   ✗ signature_routes.py not found!")
        return False
    
    try:
        with open(routes_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f"   ⚠️  Could not read signature_routes.py: {str(e)}")
        print("   Skipping API endpoint verification...")
        return True  # Don't fail setup for this
    
    endpoints_to_check = [
        "workflow/create",
        "workflow/<int:workflow_id>/status",
        "workflow/<int:workflow_id>/signatory",
        "workflow/<int:workflow_id>/reminders",
        "bulk/initiate",
        "audit/<int:signature_id>"
    ]
    
    all_found = True
    for endpoint in endpoints_to_check:
        if endpoint in content:
            print(f"   ✓ {endpoint}")
        else:
            print(f"   ✗ {endpoint} NOT FOUND")
            all_found = False
    
    return all_found

def display_next_steps():
    """Display next steps for user"""
    print_header("🎉 Installation Complete!")
    
    print("Next Steps:")
    print("\n1. Start the backend server:")
    print("   cd backend")
    print("   python app.py")
    
    print("\n2. Start the frontend (in new terminal):")
    print("   cd frontend")
    print("   npm start")
    
    print("\n3. Access the features:")
    print("   - Open document in workspace")
    print("   - Navigate to 'Export' stage")
    print("   - Click '👥 Workflow' for multi-party signing")
    print("   - Click '🔍 View Certificate' after signing")
    
    print("\n4. Documentation:")
    print("   - docs/ADVANCED_SIGNATURE_FEATURES.md")
    print("   - docs/DIGITAL_SIGNATURE_PLAN.md")
    print("   - QUICK_START_SIGNATURE.md")
    
    print("\n" + "=" * 60)
    print("  Advanced signature features are ready to use!")
    print("=" * 60 + "\n")

def main():
    """Main setup function"""
    print_header("Advanced Digital Signature Features - Setup")
    
    total_steps = 6
    current_step = 0
    
    # Step 1: Check Python
    current_step += 1
    print_step(current_step, total_steps, "Checking Python installation")
    if not check_python_installed():
        sys.exit(1)
    
    # Step 2: Check Node.js
    current_step += 1
    print_step(current_step, total_steps, "Checking Node.js installation")
    if not check_node_installed():
        sys.exit(1)
    
    # Step 3: Verify new files
    current_step += 1
    print_step(current_step, total_steps, "Verifying new component files")
    if not verify_new_files():
        print("\n   ⚠️  Some files are missing. Please ensure all files are committed.")
        response = input("   Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Step 4: Verify API endpoints
    current_step += 1
    print_step(current_step, total_steps, "Verifying API endpoints")
    if not verify_api_endpoints():
        print("\n   ⚠️  Some API endpoints are missing.")
        response = input("   Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Step 5: Install backend dependencies
    current_step += 1
    print_step(current_step, total_steps, "Installing backend dependencies")
    if not install_backend_dependencies():
        print("\n   ⚠️  Backend installation had issues.")
        response = input("   Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Step 6: Install frontend dependencies
    current_step += 1
    print_step(current_step, total_steps, "Installing frontend dependencies")
    if not install_frontend_dependencies():
        print("\n   ⚠️  Frontend installation had issues.")
        response = input("   Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Display success and next steps
    display_next_steps()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Setup failed with error: {str(e)}")
        sys.exit(1)
