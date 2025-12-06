# Legal Documentation Assistant - Architecture

## System Overview

The Legal Documentation Assistant is a full-stack application that uses AI to help users create legal documents through conversational interfaces and template-based generation.

## Technology Stack

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Context API** - State management

### Backend
- **Python/Flask** - API server
- **Azure OpenAI** (GPT-4) - Natural language processing
- **ChromaDB** - Vector database for RAG
- **python-docx-template** - Document generation
- **Jinja2** - Template processing

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ ModernHome   │ │ Dashboard    │ │ UnifiedWork  │        │
│  │              │ │              │ │   space      │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Flask)                         │
│  /api/chat  /api/assemble  /api/template/*                  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI Processing Layer                        │
│  ┌──────────────────────────────────────────────┐           │
│  │  Conversation Manager                        │           │
│  │  - Context tracking                          │           │
│  │  - Intent detection                          │           │
│  └──────────────────────────────────────────────┘           │
│  ┌──────────────────────────────────────────────┐           │
│  │  Variable Extractor                          │           │
│  │  - Entity extraction                         │           │
│  │  - Smart value cleaning                      │           │
│  └──────────────────────────────────────────────┘           │
│  ┌──────────────────────────────────────────────┐           │
│  │  Document Assembler                          │           │
│  │  - Template filling                          │           │
│  │  - Format preservation                       │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data & Storage Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Templates   │  │ ChromaDB    │  │ Generated   │         │
│  │ (Jinja2)    │  │ (Vectors)   │  │ Documents   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Template Management
- **TemplateManager** (`ai/template_manager_v2.py`)
  - Manages system and user templates
  - Template discovery and validation
  - Variable schema extraction

- **TemplateConverter** (`ai/template_converter.py`)
  - Converts uploaded documents to Jinja2 format
  - Auto-detects placeholders (8 different styles)
  - AI-powered variable naming

### 2. Document Assembly
- **DocumentAssembler** (`ai/document_assembler.py`)
  - Fills templates with extracted variables
  - Preserves formatting and styling
  - Exports to DOCX

- **VariableExtractor** (`ai/variable_extractor.py`)
  - Extracts values from natural language
  - Context-aware extraction
  - Type validation and formatting

### 3. RAG (Retrieval Augmented Generation)
- **RAGPipeline** (`ai/rag_pipeline.py`)
  - Semantic search over legal knowledge
  - Context retrieval for chat

- **VectorDBManager** (`ai/vectordb_manager.py`)
  - ChromaDB management
  - Embedding storage and retrieval

- **EmbeddingService** (`ai/embedding_service.py`)
  - BGE-M3 embeddings
  - Text vectorization

### 4. Conversational AI
- **ConversationManager** (`ai/conversation_manager.py`)
  - Chat session management
  - Context maintenance
  - Intent routing

- **AzureOpenAIService** (`ai/azure_openai_service.py`)
  - GPT-4 integration
  - Prompt management
  - Response streaming

### 5. Legal Intelligence
- **LegalVerifier** (`ai/legal_verifier.py`)
  - Document validation
  - Legal compliance checking

- **LegalOntology** (`ai/legal_ontology.py`)
  - Domain knowledge representation
  - Legal term relationships

## Data Flow

### Template-Based Document Generation
```
User Input → Variable Extraction → Template Selection → 
Document Assembly → Validation → Download
```

### Conversational Assembly
```
User Message → Conversation Manager → Variable Extractor →
Missing Variables Check → Follow-up Questions → Document Assembly
```

### Template Upload
```
Upload DOCX → Placeholder Detection → AI Variable Naming →
Jinja2 Conversion → Schema Generation → Save to Library
```

## API Endpoints

### Chat & Conversation
- `POST /api/chat` - Send chat message
- `POST /api/chat/clear` - Clear chat history

### Document Assembly
- `POST /api/assemble` - Generate document from template
- `POST /api/smart-assemble` - Conversational assembly

### Template Management
- `GET /api/templates` - List available templates
- `POST /api/template/upload-and-analyze` - Upload and analyze
- `POST /api/template/convert` - Convert to Jinja2
- `POST /api/template/save-to-library` - Save template
- `GET /api/template/user-templates` - List user templates
- `DELETE /api/template/delete/<name>` - Delete template

## Security Considerations

- Environment variables for API keys (.env)
- User authentication (planned)
- Input validation on all endpoints
- File upload restrictions

## Deployment

- Frontend: Build optimized React bundle
- Backend: Flask WSGI server (Gunicorn)
- Database: ChromaDB persistent storage
- Documents: Secure file storage

## Future Enhancements

1. Multi-user support with authentication
2. Document version control
3. Collaborative editing
4. Advanced legal analytics
5. Multi-language support
