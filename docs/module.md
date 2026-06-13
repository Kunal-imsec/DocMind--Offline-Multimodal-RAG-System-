

# 🚀 **FINAL MODULE DIVISION FOR SIH (Work Breakdown Structure)**

**7 Core Modules** — perfectly covering the entire offline multimodal RAG system.

---

# **MODULE 1 — Ingestion Engine (PDF / DOCX / IMAGES / AUDIO)**

### **Owner:** Backend AI Team Member 1

### **Goal:** Convert any uploaded file into structured data + embeddings-ready chunks.

### **Sub-Tasks**

* PDF parsing (PyPDF2 / pdfminer)
* DOCX extraction
* HTML conversion (unstructured)
* Image OCR (PaddleOCR / Tesseract)
* Image embedding (CLIP / SigLIP)
* Audio transcription (Whisper)
* Chunking logic (300–500 token text chunks + audio timestamps)
* Metadata creation (file_name, page_no, ts_start, ts_end)

### **Inputs**

* PDF
* DOCX
* Image
* Audio files

### **Outputs**

* Clean text
* OCR text
* Image embeddings
* Audio transcript chunks
* Metadata JSON

---

# **MODULE 2 — Embedding + Vector Store (FAISS)**

### **Owner:** Backend AI Team Member 2

### **Goal:** Convert all text/image/audio chunks into embeddings and index them.

### **Sub-Tasks**

* Load embedding model (bge, CLIP, Voyage Multimodal)
* Generate embeddings for:

  * text chunks
  * images
  * audio transcript chunks
* Build and maintain 3 FAISS indexes:

  * text.index
  * image.index
  * audio.index
* Vector serialization (save/load indexes)

### **Inputs**

* Chunked text
* OCR text
* Image arrays
* Audio transcripts

### **Outputs**

* FAISS indexes
* Embedding-to-chunk mapping

---

# **MODULE 3 — Graph Store (Neo4j) for Cross-Modal Reasoning**

### **Owner:** Backend AI Team Member 3

### **Goal:** Enable multi-hop retrieval & cross-modal linking.

### **Sub-Tasks**

* Define Neo4j graph schema:

  * Document
  * Section
  * Paragraph
  * Image
  * Audio segment
  * Entity node
* Build relationships:

  * REFERENCES
  * CONTAINS
  * MENTIONS
  * RELATED_TO
* Store cross-format links:

  * PDF paragraph → image
  * audio timestamp → paragraph
  * image → OCR text → document segment

### **Inputs**

* Metadata from ingestion
* Named entities
* OCR chunks
* Audio timestamps

### **Outputs**

* Graph database with searchable nodes
* Cross-document graph traversal capability

---

# **MODULE 4 — Retrieval Engine (Hybrid Search + RRF Fusion)**

### **Owner:** Backend AI Member 1 & 2 together

### **Goal:** Combine FAISS + Graph search → produce top-K ranked results.

### **Sub-Tasks**

* Query embedding generation
* Parallel search:

  * text FAISS
  * image FAISS
  * audio FAISS
  * graph traversal
* Reciprocal Rank Fusion (RRF)
* Score normalization
* Build context bundle (1200–1800 tokens)

### **Inputs**

* User query (text, image, audio)
* Vector indexes
* Graph DB

### **Outputs**

* Top-K chunks
* Top relevant images
* Top audio clips
* Ranked context bundle

---

# **MODULE 5 — LLM Module (Offline RAG Inference)**

### **Owner:** Backend AI Team Member 3

### **Goal:** Generate grounded answers with citations.

### **Sub-Tasks**

* Load Qwen-7B/14B or LLaMA 3-8B (GGUF)
* Construct RAG prompt template:

  * citations
  * multi-modal reasoning instructions
* Grounded answer generation (Chain-of-Thought)
* Format citations as `[CIT1]`, `[CIT2]`
* Return final answer + citation payload

### **Inputs**

* Ranked context bundle
* User query

### **Outputs**

* Final answer
* Citations
* Raw chunks used

---

# **MODULE 6 — Django Backend (API Gateway + File Manager)**

### **Owner:** Full-stack Member / Backend Team

### **Goal:** Manage files, maintain metadata, connect Electron ↔ AI service.

### **Sub-Tasks**

* File upload endpoints
* File metadata registry (DB)
* Route ingestion calls to AI-service
* Route query calls to AI-service
* Expose endpoints:

  * `/upload`
  * `/ingest`
  * `/query`
  * `/get_citation/<id>`
* Serve files to Electron (PDF page, image, audio snippet)

### **Inputs**

* User uploads
* User queries
* AI-service responses

### **Outputs**

* Ingestion triggers
* Query responses
* Source preview data

---

# **MODULE 7 — Electron Desktop App (UI/UX)**

### **Owner:** Frontend Developer

### **Goal:** Provide simple offline UI for search, chat, uploads, and citation previews.

### **Sub-Tasks**

* UI components:

  * Chat window
  * File uploader
  * Citation viewer
  * PDF preview
  * Image preview
  * Audio playback
* API integration with Django backend
* Local caching of previous queries
* Smooth UI for multimodal search

### **Inputs**

* User query
* Uploaded files
* Django responses

### **Outputs**

* Displayed answer
* Citations
* Source preview
* File listing

---

# 🔥 FINAL SUMMARY: MODULE WORK DIVISION TABLE

| Module                    | Description                     | Owner                |
| ------------------------- | ------------------------------- | -------------------- |
| **1. Ingestion Engine**   | PDF/DOCX/Image/Audio extraction | AI Member 1          |
| **2. Embeddings + FAISS** | Embedding models + vector store | AI Member 2          |
| **3. Neo4j Graph**        | Cross-modal relationships       | AI Member 3          |
| **4. Retrieval Engine**   | FAISS + Graph + Fusion          | AI Team 1+2          |
| **5. LLM Reasoning**      | RAG LLM + CoT + Citations       | AI Member 3          |
| **6. Django Backend**     | API Gateway + file manager      | Full-stack / Backend |
| **7. Electron UI**        | Desktop app + chat UI           | Frontend             |

---


