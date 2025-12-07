# Legal-Documentation-Assistant

## Table of Contents

- [Project](#legal-documentation-assistant)
  - [Table of Contents](#table-of-contents)
  - [About The Project](#about-the-project)
  - [Demo](#demo)
  - [Tech Stack](#tech-stack)
  - [File Structure](#file-structure)
  - [Getting started](#getting-started)
  - [Screenshots of Website](#screenshots-of-the-website)
  - [Contributors](#contributors)
  - [References](#references)
  - [License](#license)

## About The Project

Legal documentation can be a complicated and time-consuming process, especially for individuals and small businesses who may not have access to legal resources. In addition, the language and jargon used in legal documents can be difficult for non-lawyers to understand, which can lead to errors and misunderstandings. 

**Objective**: This project is an AI-powered legal documentation assistant that simplifies the entire process of creating, editing, and managing legal documents through natural language conversations. Powered by Azure OpenAI GPT-4o and advanced RAG (Retrieval-Augmented Generation), it understands user intent and generates accurate legal documents with minimal input.

**Key Features**: 

1. **🤖 Conversational AI Assistant**: Simply describe what you need in plain English - the AI understands your intent and guides you through the process.

2. **🧠 Smart Field Extraction**: Automatically extracts relevant information from your initial request, minimizing repetitive questions.

3. **📚 RAG-Powered Knowledge Base**: Leverages ChromaDB vector database with legal knowledge, precedents, and templates for accurate document generation.

4. **✨ Intelligent Template Matching**: AI automatically selects the most appropriate legal document template based on your description.

5. **📝 Custom Template Support**: Upload and use your own legal templates with AI-powered field detection.

6. **🎨 Modern Interactive Workspace**: Real-time document preview, chat-based editing, and seamless workflow.

7. **💾 Document Management**: Save, edit, and download documents in multiple formats (DOCX, PDF).

**Impact**: This AI-first approach democratizes access to legal documentation, making it faster, more affordable, and accessible to everyone - from individuals to small businesses across India.

**Technology**: Built with Azure OpenAI GPT-4o, ChromaDB vector database, Jinja2 templating, and a modern React frontend. Legal templates sourced from [LawRato](https://lawrato.com/legal-documents).

## Demo

🎥 Video Walkthrough

Check out a live demonstration of the project in action: https://github.com/PritK99/Legal-Documentation-Assistant/assets/103848930/023f19a9-dea2-458b-ae53-6f6c7f36d74f

🌐 Live Website

Explore the deployed website here: <a href="https://legal-documentation-assistant-frontend.onrender.com">https://legal-documentation-assistant-frontend.onrender.com
</a>

> **Note** <br>
> The server may take a few minutes to launch, as we are using a free service provided by Render. Please note that this service is only available for 30 days, so access might be unavailable if the free period has expired.

## Tech Stack

**Frontend:**
- ![react](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
- ![tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
- React Router, Context API, React Toastify

**Backend:**
- ![python](https://img.shields.io/badge/Python-FFD43B?style=for-the-badge&logo=python&logoColor=blue)
- ![flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)
- ![psql](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

**AI & ML:**
- Azure OpenAI (GPT-4o, text-embedding-ada-002)
- ChromaDB (Vector Database)
- Jinja2 Template Engine
- RAG Pipeline

**Document Processing:**
- python-docx, pypdf2, pdfplumber
- docx2pdf for conversion

## File Structure
```
👨‍💻Legal-Documentation-Assistant
 ┣ 📂assets                            // Reference images & demos
 ┣ 📂frontend                          // React Frontend        
 ┃ ┣ 📂src                                      
 ┃ ┃ ┣ 📂components  
 ┃ ┃ ┃ ┣ 📄ModernHome.jsx              // Landing page
 ┃ ┃ ┃ ┣ 📄Dashboard.jsx               // User dashboard
 ┃ ┃ ┃ ┣ 📄PromptModal.jsx             // Initial prompt interface
 ┃ ┃ ┃ ┣ 📄WorkspaceAssistant.jsx     // AI conversational workspace
 ┃ ┃ ┃ ┣ 📄DocumentEditor.jsx         // Document preview & edit
 ┃ ┃ ┃ ┣ 📄About.jsx, FAQ.jsx
 ┃ ┃ ┣ 📂context
 ┃ ┃ ┃ ┣ 📄WorkspaceContext.jsx       // Global state management
 ┃ ┃ ┣ 📄App.js
 ┃ ┣ 📂public 
 ┃ ┃ ┣ 📄index.html
 ┣ 📂backend                           // Python Backend 
 ┃ ┣ 📂ai                              // AI/ML modules
 ┃ ┃ ┣ 📄azure_openai_service.py      // GPT-4o integration
 ┃ ┃ ┣ 📄rag_pipeline.py              // RAG implementation
 ┃ ┃ ┣ 📄document_assembler.py        // Smart document assembly
 ┃ ┃ ┣ 📄embedding_service.py         // Vector embeddings
 ┃ ┃ ┣ 📄vectordb_manager.py          // ChromaDB management
 ┃ ┃ ┣ 📄template_manager.py          // Template handling
 ┃ ┣ 📂api                             // API routes
 ┃ ┃ ┣ 📄template_routes.py
 ┃ ┣ 📂data                            // Legal data & templates
 ┃ ┃ ┣ 📂templates                    // Jinja2 templates
 ┃ ┃ ┣ 📂legal_knowledge              // Legal knowledge base
 ┃ ┃ ┣ 📂precedents                   // Legal precedents
 ┃ ┣ 📂chroma_db                       // Vector database
 ┃ ┣ 📄app.py                         // Flask application
 ┃ ┣ 📄auth_database.py               // User authentication
 ┃ ┣ 📄createdatabase.py              // Database setup
 ┃ ┣ 📄requirements.txt      
 ┣ 📂docs                              // Documentation
 ┃ ┣ 📄API.md, ARCHITECTURE.md
 ┣ 📄README.md, QUICK_START.md
``` 

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- Azure OpenAI API access (GPT-4o deployment)
- PostgreSQL database (optional, for production)

### Installation

**1. Clone the repository:**

```bash
git clone https://github.com/PritK99/Legal-Documentation-Assistant.git
cd Legal-Documentation-Assistant
```

**2. Backend Setup:**

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**3. Configure Azure OpenAI:**

Create a `.env` file in the `backend/` directory:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-ada-002
AZURE_OPENAI_API_VERSION=2024-12-01-preview

# Database (Optional - for production)
DATABASE_HOST=your_database_host
DATABASE_NAME=your_database_name
DATABASE_USER=your_database_username
PASSWORD=your_database_password
DATABASE_PORT=5432
```

**4. Initialize Vector Database:**

```bash
# Populate ChromaDB with legal knowledge
python scripts/populate_vectordb.py
```

**5. Run Backend:**

```bash
python app.py
```

Backend will run at `http://localhost:5000`

**6. Frontend Setup:**

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run at `http://localhost:3000`

### Quick Start Guide

See [QUICK_START.md](QUICK_START.md) for detailed setup and usage instructions.

### Database Setup (Optional - For Production)

The application works without a database for development. For production with user authentication:

**Option 1: Render PostgreSQL (Free)**

1. Visit [render.com](https://render.com/) and create an account
2. Create a new PostgreSQL service
3. Copy the database credentials to your `.env` file
4. Run the database setup script:

```bash
python backend/createdatabase.py
```

**Option 2: Local PostgreSQL**

1. Install PostgreSQL locally
2. Create a database and update `.env` with local credentials
3. Run `python backend/createdatabase.py`

> **Note**: Database is only required for user authentication and document storage. The AI features work independently.

## Screenshots of the Platform

- #### Modern Home Page

    ![home](./assets/image.png)

- #### AI Prompt Interface

    Interactive modal where users describe their legal document needs in plain English.

- #### Conversational Workspace

    AI assistant guides users through document creation with smart questions and real-time feedback.

- #### Document Editor & Preview

    Live document preview with editing capabilities and download options (DOCX, PDF).
    ![doc_editor](./assets/image-4.png)

- #### Dashboard

    Manage saved documents, custom templates, and document history.
    ![forms](./assets/image-1.png)

- #### FAQ & About Pages

    ![faq](./assets/image-7.png)
    ![about_page](./assets/image-5.png)

## Contributors
- [Devayani Chandane](https://github.com/devayani03)
- [Kavan Gandhi](https://github.com/KGan31)
- [Mihir Rathod](https://github.com/m-g-rathod)
- [Prit Kanadiya](https://github.com/PritK99)
- [Shardul Khade](https://github.com/shark-21)
- [Vedant Nimje](https://github.com/vrnimje)

## References
- [LawRato](https://lawrato.com/legal-documents) for the dataset of legal documents.

## License
[MIT License](https://opensource.org/licenses/MIT)
