# 🧠 DocMind — Offline Multimodal RAG System

> **Smart India Hackathon 2025 – Grand Finale**
> A fully offline, project-based document intelligence platform with multimodal ingestion, hybrid retrieval, and grounded LLM answers.

---

## 📌 Overview

**DocMind** is a three-tier desktop application that lets users upload documents (PDFs, images, audio), index them into a local vector store, and chat with them using a locally-running LLM — all **without any cloud dependency**.

The system is organized around **Projects**: users create a project, upload files into it, open chat sessions, and ask natural-language questions. The AI service retrieves the most relevant chunks via hybrid search (dense + sparse) and generates a cited answer using an Ollama-served LLM.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│          frontend-docmind  (Electron + React)           │
│  Login · Dashboard · ProjectWorkspace · ChatPanel       │
│  DocumentsPanel · StudioPanel · FileUploadZone          │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP / REST  (port 5173 → 5000)
┌────────────────────▼────────────────────────────────────┐
│         backend-docmind  (Node.js / Express)            │
│  Auth · Projects · ChatSessions · Messages              │
│  Ingestion · Indexing · MongoDB ODM                     │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP  (port 5000 → 8000)
┌────────────────────▼────────────────────────────────────┐
│          ai_service  (FastAPI / Python)                 │
│  PDF · Image · Audio ingestion pipelines               │
│  BAAI/bge-m3 text embeddings                           │
│  CLIP (clip-ViT-B-32) image embeddings                 │
│  Whisper (small) audio transcription                   │
│  Qdrant vector DB  (dense, cosine, per-project)        │
│  BM25Okapi sparse index  (per-project, in-memory)      │
│  Reciprocal Rank Fusion (RRF) hybrid retrieval         │
│  Ollama LLM: phi3 (SLM summaries) + qwen2.5:3b (RAG)  │
└────────────────────┬────────────────────────────────────┘
                     │ Docker Compose
          ┌──────────┴──────────┐
     Qdrant :6333          Ollama :11434
```

---

## 📂 Project Structure

```
sih-main/
├── frontend-jalsetu/          # Electron + React desktop app
│   ├── electron/              # Electron main & preload scripts
│   ├── src/
│   │   ├── components/        # ChatPanel, DocumentsPanel, StudioPanel,
│   │   │                      # FileUploadZone, Sidebar, ProjectCard, …
│   │   ├── pages/             # Login, SignUp, Dashboard, ProjectWorkspace,
│   │   │                      # Profile, DocumentUpload, ChangePassword
│   │   ├── services/          # Axios API wrappers + mockApi.js
│   │   ├── store/             # Zustand auth store
│   │   ├── config.js          # Toggle USE_MOCK_API / API_BASE_URL
│   │   └── App.jsx            # React Router routes
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend-docmind/           # Node.js / Express API gateway
│   ├── src/
│   │   ├── config/db.js       # MongoDB connection
│   │   ├── models/            # User, Project, ChatSession, Message,
│   │   │                      # IngestionDocument, Job, IndexSnapshot,
│   │   │                      # OnboardingRequest
│   │   ├── controllers/       # authController, projectController,
│   │   │                      # chatSessionController, messageController,
│   │   │                      # ingestionController, indexingController
│   │   ├── routes/            # /api/auth, /api/projects,
│   │   │                      # /api/chat-sessions, /api/chat-messages,
│   │   │                      # /api/ingestion, /api/indexes
│   │   ├── middleware/        # JWT auth, Multer upload, error handler,
│   │   │                      # input validator
│   │   └── server.js          # Express entry point (port 5000)
│   ├── seed.js                # Seeds initial admin user
│   ├── .env.example
│   └── package.json
│
├── ai_service/                # FastAPI AI engine
│   ├── app/
│   │   ├── main.py            # Primary service (Single-Vector + Whisper)
│   │   ├── semioffline.py     # Alternate semi-offline variant
│   │   ├── models.py          # Pydantic schemas
│   │   ├── startup.py         # App lifespan hooks
│   │   └── data/              # Persisted uploads / vector data
│   ├── requirements.txt
│   └── Dockerfile             # python:3.11-bookworm + tesseract + ffmpeg
│
├── docs/
│   ├── module.md              # Work-breakdown structure (7 modules)
│   └── research.md
│
├── docker-compose.yml         # Qdrant + Ollama containers
├── Dockerfile.ai_service      # AI service Docker image
├── start.bat                  # Windows one-click launcher (WSL paths)
├── run.sh                     # Linux/WSL launcher
└── setup.sh                   # Dependency setup helper
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| **Desktop shell** | Electron 28, electron-builder |
| **Frontend UI** | React 18, Vite 5, Tailwind CSS 3, Framer Motion |
| **State management** | Zustand |
| **HTTP client** | Axios |
| **Backend API** | Node.js, Express 4, ES Modules |
| **Database** | MongoDB + Mongoose 8 |
| **Auth** | JWT (access 30 m / refresh 7 d), bcryptjs |
| **File upload** | Multer (50 MB limit) |
| **AI service** | FastAPI + Uvicorn, Python 3.11 |
| **PDF parsing** | `unstructured` (hi-res strategy, table + image extraction) |
| **OCR** | Tesseract via `pytesseract` |
| **Image embedding** | CLIP `clip-ViT-B-32` (sentence-transformers) |
| **Text embedding** | `BAAI/bge-m3` (sentence-transformers) |
| **Audio** | OpenAI Whisper `small` (offline) |
| **Vector DB** | Qdrant (Docker, per-project collections) |
| **Sparse retrieval** | BM25Okapi (`rank-bm25`, in-memory per project) |
| **Fusion** | Reciprocal Rank Fusion (RRF k=60) |
| **LLM** | Ollama — `phi3:latest` (chunk summaries) + `qwen2.5:3b` (RAG answers) |
| **Containerisation** | Docker Compose (Qdrant + Ollama) |

---

## 🚀 How It Works — End-to-End

### 1. Ingestion
User uploads a file → Backend stores metadata → Calls AI service `/upload`:
- **PDF** → `unstructured` hi-res partition → `chunk_by_title` (3 000-char chunks, table/image extraction)
- **Image** (jpg/png/webp/…) → Tesseract OCR text + CLIP embedding
- **Audio** (mp3/wav/m4a/…) → Whisper transcription → timestamped 800-char chunks

### 2. Embedding & Indexing
Each chunk is:
1. Summarised by a small LLM (`phi3`) via Ollama
2. Text-embedded with `BAAI/bge-m3`
3. Image-embedded with CLIP (zeros-padded for non-image chunks)
4. Stored in Qdrant as a **single concatenated vector** `[text_vec | image_vec]` under a per-project collection
5. Added to an in-memory **BM25** index for sparse retrieval

### 3. Querying
User sends a chat message → Backend → AI service `/query`:
1. Query text is embedded (`bge-m3` → zeros-padded to match total vector size)
2. **Dense search** on Qdrant (cosine, top-10)
3. **Sparse search** on BM25 (top-10)
4. Results merged via **RRF** → top-K context chunks
5. Cited answer generated by `qwen2.5:3b` via Ollama, with `[1]`, `[2]` … inline citations

### 4. Display
The Electron frontend renders the AI answer, expandable citations (source file + page / audio timestamp), and a document/studio panel for file management.

---

## ⚙️ Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js ≥ 18** | For frontend and backend |
| **Python 3.11** | For AI service |
| **MongoDB** | Local (`mongod`) or Atlas |
| **Docker & Docker Compose** | For Qdrant + Ollama containers |
| **Tesseract OCR** | System package (`apt install tesseract-ocr` / `choco install tesseract`) |
| **ffmpeg** | Required by Whisper (`apt install ffmpeg`) |
| **~8 GB disk** | For embedding models + Whisper + LLM weights |

---

## 🛠️ Installation & Setup

### Step 1 — Start infrastructure (Qdrant + Ollama)

```bash
docker compose up -d
```

Then pull LLM models into Ollama:

```bash
docker exec ollama ollama pull phi3
docker exec ollama ollama pull qwen2.5:3b
```

### Step 2 — AI Service

```bash
cd ai_service
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Key environment variables (set before starting):

| Variable | Default | Description |
|---|---|---|
| `QDRANT_URL` | `http://localhost:6333` | Qdrant endpoint |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama endpoint |
| `SLM_MODEL` | `phi3:latest` | Summary LLM |
| `LLM_MODEL` | `qwen2.5:3b` | RAG answer LLM |
| `EMBED_MODEL` | `BAAI/bge-m3` | Text embedding model |
| `CLIP_MODEL` | `clip-ViT-B-32` | Image embedding model |
| `WHISPER_MODEL_NAME` | `small` | Whisper model size |
| `TOP_K` | `5` | Final results returned |
| `UPLOAD_DIR` | `uploads` | File upload directory |

### Step 3 — Backend (Node.js)

```bash
cd backend-docmind
cp .env.example .env          # fill in MongoDB URI and JWT secrets
npm install
npm run seed                  # create the initial SUPER_ADMIN user
npm run dev                   # runs on port 5000
```

Key `.env` variables:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Express server port |
| `MONGODB_URI` | `mongodb://localhost:27017/docmind` | MongoDB connection |
| `JWT_SECRET` | — | **Change before production** |
| `JWT_REFRESH_SECRET` | — | **Change before production** |
| `JWT_ACCESS_EXPIRY` | `30m` | Access token TTL |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token TTL |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |
| `MAX_FILE_SIZE` | `52428800` | 50 MB upload limit |

### Step 4 — Frontend (Electron)

```bash
cd frontend-jalsetu
npm install

# Web-only dev mode (no Electron)
npm run dev

# Full Electron dev mode
npm run electron:dev
```

> **Mock API**: By default `src/config.js` has `USE_MOCK_API = true`. Switch to `false` and set `API_BASE_URL = 'http://localhost:5000/api'` to use the real backend.

Default dev credentials: **`admin` / `Admin@123`**

---

## 🌐 API Reference

Base URL: `http://localhost:5000/api`  
All protected routes require: `Authorization: Bearer <access_token>`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Login, returns access + refresh tokens |
| `POST` | `/auth/signup` | Register (self-service) |
| `POST` | `/auth/token/refresh` | Refresh access token |
| `GET` | `/auth/me` | Get current user profile |
| `PATCH` | `/auth/me` | Update profile |
| `POST` | `/auth/change-password` | Change password |
| `GET` | `/projects` | List user's projects |
| `POST` | `/projects` | Create project |
| `PATCH` | `/projects/:id` | Update project |
| `DELETE` | `/projects/:id` | Delete project (cascades chats + docs) |
| `POST` | `/ingestion/upload` | Upload document to project |
| `GET` | `/ingestion/jobs/:jobId` | Check ingestion job status |
| `POST` | `/indexes/rebuild` | Trigger index rebuild |
| `GET` | `/indexes/snapshots` | List index snapshots |
| `GET` | `/chat-sessions` | List chat sessions (`?project=id`) |
| `POST` | `/chat-sessions` | Create chat session |
| `GET` | `/chat-messages` | List messages (`?session=id`) |
| `POST` | `/chat-messages` | Send message (triggers AI response) |

**AI Service endpoints** (port 8000):

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Ingest file into project vector store |
| `POST` | `/query` | Hybrid RAG query |
| `GET` | `/health` | Health + loaded model info |
| `GET` | `/debug/ollama` | Ollama connectivity check |
| `GET` | `/debug/qdrant` | Qdrant collections status |

---

## 🗂️ Data Models

| Model | Key Fields |
|---|---|
| `User` | username, email, password (bcrypt), role (`SUPER_ADMIN`), department |
| `Project` | name, description, owner (ref User), members[], is_archived |
| `ChatSession` | project (ref), title, created_at |
| `Message` | session (ref), content, role (USER/ASSISTANT), citations[] |
| `IngestionDocument` | project_id, filename, classification, status, job_id |
| `Job` | type, status, progress, result |
| `IndexSnapshot` | modality, mode, created_by, notes |
| `OnboardingRequest` | email, full_name, requested_role, status, remark |

---

## 🪟 Windows Quick-Start (`start.bat`)

Edit the three path variables at the top of `start.bat`:

```bat
set DJANGO_WIN=\\wsl.localhost\Ubuntu\home\<user>\sih\backend
set FASTAPI_WIN=                   REM (leave empty if running natively)
set ELECTRON_WIN=C:\path\to\frontend-jalsetu
```

Then double-click `start.bat` — it opens three terminal windows (backend, AI service, Electron).

---

## 🐳 Docker (AI Service)

```bash
docker build -f Dockerfile.ai_service -t docmind-ai .
docker run -p 8000:8000 \
  -e QDRANT_URL=http://host.docker.internal:6333 \
  -e OLLAMA_URL=http://host.docker.internal:11434 \
  docmind-ai
```

---

## 🧪 Testing

The frontend ships with a **mock API** (`src/services/mockApi.js`) that simulates all backend responses locally.

```javascript
// src/config.js
export const USE_MOCK_API = true;
```

See [`frontend-jalsetu/TESTING.md`](./frontend-jalsetu/TESTING.md) and [`frontend-jalsetu/TROUBLESHOOTING.md`](./frontend-jalsetu/TROUBLESHOOTING.md) for detailed guidance.

---

## 📋 Supported File Types

| Category | Extensions |
|---|---|
| Documents | `.pdf` |
| Images | `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp` |
| Audio | `.mp3`, `.wav`, `.m4a`, `.flac`, `.ogg` |

---

## 🧑‍💻 Module Division (SIH Work Breakdown)

| Module | Responsibility |
|---|---|
| 1. Ingestion Engine | PDF/Image/Audio parsing, chunking, metadata |
| 2. Embedding + Vector Store | bge-m3, CLIP, Qdrant indexing |
| 3. Graph Store *(planned)* | Neo4j cross-modal relationships |
| 4. Retrieval Engine | BM25 + Qdrant dense search, RRF fusion |
| 5. LLM Reasoning | Ollama prompt engineering, citation extraction |
| 6. Node.js Backend | REST API gateway, MongoDB, auth, file management |
| 7. Electron Frontend | UI, routing, state, mock API |

---

## 📜 License

MIT License © 2025 DocMind Team
