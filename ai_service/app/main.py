# merged_service.py
"""
AI Service (Single Vector Mode) + Whisper audio integration
- Single vector mode preserved (text + image vector concatenated)
- Adds offline Whisper-based audio processing and timestamped audio chunks
- Per-project Qdrant collections, per-project BM25 indices
- Tesseract OCR for images, CLIP image embeddings
"""

import os
import json
import uuid
import time
from pathlib import Path
from typing import List, Dict, Any, TypedDict, Optional
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Document processing
from unstructured.partition.pdf import partition_pdf
from unstructured.chunking.title import chunk_by_title

# Embeddings
from sentence_transformers import SentenceTransformer

# Qdrant
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# BM25
from rank_bm25 import BM25Okapi

# HTTP client
import requests

# OCR + Image
import pytesseract
from PIL import Image
import base64

# Whisper (audio transcription)
try:
    import whisper
except Exception:
    whisper = None

# ---------------------------------------------------------------------------
# Timer
# ---------------------------------------------------------------------------
class Timer:
    def __init__(self, name: str):
        self.name = name
        self.start = None
    def __enter__(self):
        self.start = time.time()
        print(f"⏱️  [{self.name}] Starting...")
        return self
    def __exit__(self, *args):
        elapsed = time.time() - self.start
        print(f"⏱️  [{self.name}] Completed in {elapsed:.3f}s")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
class Config:
    UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
    OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
    SLM_MODEL = os.getenv("SLM_MODEL", "phi3:latest")
    LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5:3b")
    EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-m3")
    CLIP_MODEL = os.getenv("CLIP_MODEL", "clip-ViT-B-32")
    TOP_K = int(os.getenv("TOP_K", "5"))
    DENSE_LIMIT = int(os.getenv("DENSE_LIMIT", "10"))
    SPARSE_LIMIT = int(os.getenv("SPARSE_LIMIT", "10"))
    MIN_IMAGE_VEC_LEN = 4
    # Whisper model name (use small by default)
    WHISPER_MODEL_NAME = os.getenv("WHISPER_MODEL_NAME", "small")

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class UploadResponse(BaseModel):
    message: str
    document_id: str
    filename: str
    chunks_processed: int

class QueryRequest(BaseModel):
    project_id: str
    query: str
    chat_id: Optional[str] = None
    top_k: int = Config.TOP_K

class Citation(BaseModel):
    text: str
    source: str
    page: int
    chunk_id: str
    confidence: float

class QueryResponse(BaseModel):
    query: str
    answer: str
    citations: List[Citation]
    processing_time: float

class RAGState(TypedDict):
    project_id: str
    query: str
    context: List[Dict[str, Any]]
    answer: str
    citations: List[Dict[str, Any]]
    top_k: int

# ---------------------------------------------------------------------------
# App init
# ---------------------------------------------------------------------------
app = FastAPI(title="AI Service (Single Vector Mode + Whisper)", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ---------------------------------------------------------------------------
# Qdrant client
# ---------------------------------------------------------------------------
qdrant_client = QdrantClient(url=Config.QDRANT_URL)

# ---------------------------------------------------------------------------
# Embedders
# ---------------------------------------------------------------------------
with Timer("Load Text Embedding Model"):
    try:
        text_embedder = SentenceTransformer(Config.EMBED_MODEL)
        print(f"✅ Loaded text embedder: {Config.EMBED_MODEL}")
    except Exception as e:
        print(f"⚠️ Failed to load {Config.EMBED_MODEL}: {e}")
        text_embedder = SentenceTransformer("all-MiniLM-L6-v2")

with Timer("Load CLIP Image Model"):
    try:
        image_embedder = SentenceTransformer(Config.CLIP_MODEL)
        print(f"✅ Loaded image embedder: {Config.CLIP_MODEL}")
    except Exception as e:
        print(f"⚠️ Failed to load {Config.CLIP_MODEL}: {e}")
        image_embedder = text_embedder

# Load Whisper once (module-level)
WHISPER_MODEL = None
if whisper is not None:
    try:
        with Timer(f"Loading Whisper model: {Config.WHISPER_MODEL_NAME}"):
            WHISPER_MODEL = whisper.load_model(Config.WHISPER_MODEL_NAME)
            print(f"✅ Whisper model loaded: {Config.WHISPER_MODEL_NAME}")
    except Exception as e:
        print(f"❌ Failed to load Whisper: {e}")
        WHISPER_MODEL = None
else:
    print("⚠️ whisper package not available — audio transcription disabled")

# ---------------------------------------------------------------------------
# Embedding helper functions (defined before init_vector_sizes)
# ---------------------------------------------------------------------------
def embed_text(text: str) -> List[float]:
    start = time.time()
    vec = text_embedder.encode(text, show_progress_bar=False)
    elapsed = time.time() - start
    print(f"    ⏱️  Embedding text ({len(text)} chars) took {elapsed:.3f}s")
    return vec.tolist()

def embed_image_pil(img: Image.Image) -> List[float]:
    start = time.time()
    # sentence-transformers encode returns an array of vectors for list input
    vec = image_embedder.encode([img], show_progress_bar=False)
    elapsed = time.time() - start
    print(f"    ⏱️  Embedding image took {elapsed:.3f}s")
    return vec[0].tolist()

# ---------------------------------------------------------------------------
# Cache vector sizes
# ---------------------------------------------------------------------------
TEXT_VECTOR_SIZE = None
IMAGE_VECTOR_SIZE = None
TOTAL_VECTOR_SIZE = None

def init_vector_sizes():
    global TEXT_VECTOR_SIZE, IMAGE_VECTOR_SIZE, TOTAL_VECTOR_SIZE
    if TEXT_VECTOR_SIZE is None:
        # safe defaults via a small test embedding
        TEXT_VECTOR_SIZE = len(embed_text("test"))
    if IMAGE_VECTOR_SIZE is None:
        # small PIL image for probing
        try:
            IMAGE_VECTOR_SIZE = len(embed_image_pil(Image.new('RGB', (32, 32))))
        except Exception:
            IMAGE_VECTOR_SIZE = TEXT_VECTOR_SIZE  # fallback to avoid zero
    TOTAL_VECTOR_SIZE = TEXT_VECTOR_SIZE + IMAGE_VECTOR_SIZE
    print(f"✅ Vector sizes: text={TEXT_VECTOR_SIZE}, image={IMAGE_VECTOR_SIZE}, total={TOTAL_VECTOR_SIZE}")

# ---------------------------------------------------------------------------
# Per-project BM25 & metadata
# ---------------------------------------------------------------------------
bm25_texts_by_project: Dict[str, List[str]] = {}
bm25_point_ids_by_project: Dict[str, List[str]] = {}
bm25_index_by_project: Dict[str, BM25Okapi] = {}
point_metadata_by_project: Dict[str, Dict[str, Dict[str, Any]]] = {}

# ---------------------------------------------------------------------------
# Helper: collection name
# ---------------------------------------------------------------------------
def get_collection_name(project_id: str) -> str:
    return f"project_{project_id.replace('-', '_')}"

# ---------------------------------------------------------------------------
# Ensure collection (SINGLE VECTOR ONLY)
# ---------------------------------------------------------------------------
def ensure_collection(collection_name: str):
    """Create collection with single concatenated vector"""
    init_vector_sizes()
    with Timer(f"Check/Create collection [{collection_name}]"):
        try:
            qdrant_client.get_collection(collection_name=collection_name)
            print(f"✅ Collection '{collection_name}' exists.")
        except Exception:
            print(f"📦 Creating SINGLE-VECTOR collection '{collection_name}'...")
            qdrant_client.recreate_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=TOTAL_VECTOR_SIZE,
                    distance=Distance.COSINE
                )
            )
            print(f"✅ Created collection (vector size={TOTAL_VECTOR_SIZE})")

# ---------------------------------------------------------------------------
# Ollama utilities
# ---------------------------------------------------------------------------
available_models_cache: Optional[List[str]] = None

def get_available_models() -> List[str]:
    global available_models_cache
    if available_models_cache:
        return available_models_cache
    try:
        r = requests.get(f"{Config.OLLAMA_URL.rstrip('/')}/api/tags", timeout=5)
        if r.status_code == 200:
            data = r.json()
            available_models_cache = [m.get("name", "") for m in data.get("models", [])]
            return available_models_cache
    except Exception as e:
        print(f"⚠️ Failed to fetch Ollama models: {e}")
    return []

def normalize_model_name(model: str) -> str:
    available = get_available_models()
    if model in available:
        return model
    for avail in available:
        if model in avail or avail in model:
            print(f"📝 Model normalized: '{model}' -> '{avail}'")
            return avail
        model_base = model.replace("-", "").replace("_", "").split(":")[0].lower()
        avail_base = avail.replace("-", "").replace("_", "").split(":")[0].lower()
        if model_base == avail_base:
            print(f"📝 Model normalized: '{model}' -> '{avail}'")
            return avail
    return model

def call_ollama(model: str, prompt: str, max_tokens: int = 1024, temperature: float = 0.7) -> str:
    model = normalize_model_name(model)
    url = f"{Config.OLLAMA_URL.rstrip('/')}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"num_predict": max_tokens, "temperature": temperature}
    }
    try:
        print(f"🤖 Calling {model} (prompt: {len(prompt)} chars)")
        start = time.time()
        r = requests.post(url, json=payload, timeout=180)
        elapsed = time.time() - start
        
        if r.status_code != 200:
            return f"[LLM_ERROR] {r.status_code}: {r.text[:200]}"
        
        data = r.json()
        if "response" in data:
            result = data["response"].strip()
            print(f"✅ LLM response in {elapsed:.3f}s ({len(result)} chars)")
            return result
        return json.dumps(data)
    except requests.exceptions.Timeout:
        return "[LLM_ERROR] Request timed out"
    except Exception as e:
        return f"[LLM_ERROR] {str(e)}"

# ---------------------------------------------------------------------------
# PDF processing
# ---------------------------------------------------------------------------
def process_pdf(file_path: str) -> List[Dict[str, Any]]:
    print(f"📄 Processing PDF: {file_path}")
    with Timer("PDF Partition"):
        elements = partition_pdf(
            filename=file_path,
            strategy="hi_res",
            infer_table_structure=True,
            extract_image_block_types=["Image"],
            extract_image_block_to_payload=True
        )
    
    with Timer("PDF Chunking"):
        chunks = chunk_by_title(
            elements,
            max_characters=3000,
            new_after_n_chars=2400,
            combine_text_under_n_chars=500
        )

    processed = []
    for chunk in chunks:
        chunk_data = {
            "chunk_id": str(uuid.uuid4()),
            "text": chunk.text or "",
            "tables": [],
            "images": [],
            "metadata": {
                "page": getattr(getattr(chunk, 'metadata', None), 'page_number', 0),
                "type": "mixed"
            }
        }
        
        if hasattr(chunk, "metadata") and hasattr(chunk.metadata, "orig_elements"):
            for el in chunk.metadata.orig_elements:
                et = type(el).__name__
                if et == "Table":
                    table_html = getattr(getattr(el, "metadata", None), "text_as_html", getattr(el, "text", None))
                    if table_html:
                        chunk_data["tables"].append(table_html)
                        chunk_data["metadata"]["type"] = "table"
                elif et == "Image":
                    img_b64 = getattr(getattr(el, "metadata", None), "image_base64", None)
                    if img_b64:
                        chunk_data["images"].append(img_b64)
                        chunk_data["metadata"]["type"] = "image"
        
        processed.append(chunk_data)
    
    print(f"✅ Extracted {len(processed)} chunks")
    return processed

# ---------------------------------------------------------------------------
# Image processing: OCR + CLIP
# ---------------------------------------------------------------------------
def process_image(file_path: str, filename: str) -> List[Dict[str, Any]]:
    print(f"🖼️  Processing image: {file_path}")
    
    with Timer("Load Image"):
        img = Image.open(file_path).convert('RGB')
        width, height = img.size
        with open(file_path, 'rb') as f:
            img_b64 = base64.b64encode(f.read()).decode('utf-8')

    chunk_data = {
        "chunk_id": str(uuid.uuid4()),
        "text": "",
        "ocr_text": "",
        "tables": [],
        "images": [img_b64],
        "metadata": {"page": 1, "type": "image", "width": width, "height": height}
    }

    # Tesseract OCR
    with Timer("Tesseract OCR"):
        try:
            ocr_result = pytesseract.image_to_string(img)
            chunk_data["ocr_text"] = ocr_result.strip()
            if ocr_result.strip():
                chunk_data["text"] = f"Image OCR: {ocr_result.strip()}"
                print(f"    OCR extracted {len(ocr_result.split())} words")
            else:
                print(f"    No OCR text found")
        except Exception as e:
            print(f"    OCR failed: {e}")

    # Optional caption if no OCR
    if not chunk_data["text"]:
        chunk_data["text"] = f"Image: {filename} ({width}x{height})"
        print(f"    Using filename as description")

    # CLIP embedding
    with Timer("Image embedding (CLIP)"):
        try:
            img_vec = embed_image_pil(img)
            chunk_data["image_vector"] = img_vec
        except Exception as e:
            print(f"    Image embedding failed: {e}")
            chunk_data["image_vector"] = []

    print(f"✅ Created 1 chunk for image")
    return [chunk_data]

# ---------------------------------------------------------------------------
# Audio Processing (Whisper Offline)
# ---------------------------------------------------------------------------
def process_audio(file_path: str, filename: str) -> List[Dict[str, Any]]:
    """Transcribe audio & create timestamped chunks (uses Whisper small)"""
    print(f"🔊 Processing Audio: {file_path}")

    if WHISPER_MODEL is None:
        raise RuntimeError("Whisper model not loaded (WHISPER_MODEL is None)")

    model = WHISPER_MODEL

    with Timer("Transcription"):
        result = model.transcribe(file_path)
        segments = result.get("segments", []) or []
        print(f"📝 Whisper returned {len(segments)} segments")

    if not segments:
        print("⚠️ No segments returned from Whisper — creating fallback chunk")
        return [{
            "chunk_id": str(uuid.uuid4()),
            "text": "",
            "tables": [],
            "images": [],
            "metadata": {"page": 0, "type": "audio", "start_time": 0.0, "end_time": 0.0}
        }]

    # Convert segments → RAG chunks safely
    chunks: List[Dict[str, Any]] = []
    current_text = ""
    start_time: Optional[float] = None
    MAX_CHARS = 800

    for seg in segments:
        seg_text = seg.get("text", "").strip()
        seg_start = seg.get("start", 0.0)
        seg_end = seg.get("end", seg_start)

        if start_time is None:
            start_time = seg_start

        # If single segment is very large and no current_text -> push as its own chunk
        if not current_text and len(seg_text) > MAX_CHARS:
            chunks.append({
                "chunk_id": str(uuid.uuid4()),
                "text": seg_text,
                "tables": [],
                "images": [],
                "metadata": {"page": 0, "type": "audio", "start_time": seg_start, "end_time": seg_end}
            })
            start_time = None
            current_text = ""
            continue

        # If adding this segment would overflow -> close previous chunk
        if len(current_text) + len(seg_text) > MAX_CHARS:
            chunks.append({
                "chunk_id": str(uuid.uuid4()),
                "text": current_text.strip(),
                "tables": [],
                "images": [],
                "metadata": {"page": 0, "type": "audio", "start_time": start_time, "end_time": seg_start}
            })
            current_text = seg_text
            start_time = seg_start
        else:
            current_text = (current_text + " " + seg_text).strip()

    # Final flush
    if current_text:
        chunks.append({
            "chunk_id": str(uuid.uuid4()),
            "text": current_text.strip(),
            "tables": [],
            "images": [],
            "metadata": {"page": 0, "type": "audio", "start_time": start_time, "end_time": segments[-1].get("end", start_time)}
        })

    print(f"🎯 Created {len(chunks)} audio text chunks")
    return chunks

# ---------------------------------------------------------------------------
# Store in Qdrant + BM25 (SINGLE VECTOR MODE)
# ---------------------------------------------------------------------------
def store_in_vectordb(
    chunks: List[Dict[str, Any]],
    document_id: str,
    filename: str,
    project_id: str,
    chat_id: Optional[str] = None
):
    """Store chunks using SINGLE concatenated vector (text + image)"""
    collection = get_collection_name(project_id)
    ensure_collection(collection)
    
    print(f"💾 Storing {len(chunks)} chunks in project '{project_id}'")

    # Init BM25 structures
    bm25_texts = bm25_texts_by_project.setdefault(project_id, [])
    bm25_point_ids = bm25_point_ids_by_project.setdefault(project_id, [])
    metadata_map = point_metadata_by_project.setdefault(project_id, {})

    # Generate summaries (SLM)
    with Timer("Generate Summaries"):
        summaries = []
        for i, chunk in enumerate(chunks):
            short_text = (chunk.get("text") or "")[:1200]
            if not short_text.strip():
                summaries.append("")
                continue
            
            prompt = f"Summarize in 2-3 sentences:\n\n{short_text}\n\nSummary:"
            summary = call_ollama(Config.SLM_MODEL, prompt, max_tokens=200, temperature=0.3)
            
            if summary.startswith("[LLM_ERROR]"):
                summary = short_text[:400]
            summaries.append(summary)

    # Generate embeddings and create points
    points = []
    with Timer("Generate Embeddings"):
        init_vector_sizes()  # Ensure sizes are set
        
        for i, (chunk, summary) in enumerate(zip(chunks, summaries)):
            searchable_text = summary
            if chunk.get("text"):
                searchable_text += "\n\n" + chunk["text"]
            searchable_text = searchable_text.strip()[:2000]

            print(f"  Embedding chunk {i+1}/{len(chunks)}")

            # TEXT VECTOR
            text_vec = embed_text(searchable_text if searchable_text else "empty")

            # IMAGE VECTOR (if available)
            image_vec = chunk.get("image_vector", [])

            # CONCATENATE: text + image (or text + zeros if no image)
            if image_vec and len(image_vec) >= Config.MIN_IMAGE_VEC_LEN:
                combined_vec = text_vec + image_vec
            else:
                # Pad with zeros to maintain consistent vector size
                combined_vec = text_vec + ([0.0] * IMAGE_VECTOR_SIZE)

            pid = str(uuid.uuid4())

            payload = {
                "document_id": document_id,
                "chunk_id": chunk["chunk_id"],
                "filename": filename,
                "text": chunk.get("text", ""),
                "ocr_text": chunk.get("ocr_text", ""),
                "tables": json.dumps(chunk.get("tables", [])),
                "images": json.dumps(chunk.get("images", [])),
                "page": chunk.get("metadata", {}).get("page", 0),
                "content_type": chunk.get("metadata", {}).get("type", "mixed"),
                "searchable_text": searchable_text,
                "chat_id": chat_id or "",
                # preserve timestamps for audio chunks if any
                "start_time": chunk.get("metadata", {}).get("start_time"),
                "end_time": chunk.get("metadata", {}).get("end_time"),
            }

            # Create point with SINGLE vector
            points.append(PointStruct(id=pid, vector=combined_vec, payload=payload))

            bm25_point_ids.append(pid)
            bm25_texts.append(searchable_text)
            metadata_map[pid] = payload

    # Upsert to Qdrant
    with Timer("Upsert to Qdrant"):
        if points:
            qdrant_client.upsert(collection_name=collection, points=points)
            print(f"✅ Upserted {len(points)} points")

    # Rebuild BM25
    with Timer("Rebuild BM25 Index"):
        if bm25_texts:
            tokenized = [doc.split() for doc in bm25_texts]
            bm25_index_by_project[project_id] = BM25Okapi(tokenized)
            print(f"✅ BM25 updated ({len(bm25_texts)} docs)")

# ---------------------------------------------------------------------------
# Hybrid search (SINGLE VECTOR MODE)
# ---------------------------------------------------------------------------
def rrf_fusion(dense_hits: List[Any], sparse_ids: List[str], top_k: int) -> List[Dict[str, Any]]:
    score_map = {}
    k = 60
    
    for rank, hit in enumerate(dense_hits, start=1):
        pid = hit.id
        score_map.setdefault(pid, 0.0)
        score_map[pid] += 1.0 / (k + rank)
    
    for rank, pid in enumerate(sparse_ids, start=1):
        score_map.setdefault(pid, 0.0)
        score_map[pid] += 1.0 / (k + rank)
    
    merged = sorted(score_map.items(), key=lambda x: x[1], reverse=True)[:top_k]
    
    return [{"point_id": pid, "score": sc} for pid, sc in merged]

def hybrid_search(project_id: str, query: str, top_k: int = Config.TOP_K) -> List[Dict[str, Any]]:
    print(f"🔍 Project '{project_id}' searching: '{query}'")
    collection = get_collection_name(project_id)
    init_vector_sizes()

    # Query embedding (text + padded zeros for image part)
    with Timer("Query Embedding"):
        text_qvec = embed_text(query)
        qvec = text_qvec + ([0.0] * IMAGE_VECTOR_SIZE)

    # Dense search
    dense_hits = []
    with Timer("Dense Search (Qdrant)"):
        try:
            dense_hits = qdrant_client.query_points(
                collection_name=collection,
                vector=qvec,
                limit=Config.DENSE_LIMIT,
                with_payload=True
            ).points
            print(f"    Found {len(dense_hits)} dense results")
        except Exception as e:
            print(f"    ❌ Dense search failed: {e}")

    # Sparse search (BM25)
    sparse_ids = []
    with Timer("Sparse Search (BM25)"):
        try:
            bm25_texts = bm25_texts_by_project.get(project_id, [])
            bm25_index = bm25_index_by_project.get(project_id)
            
            if bm25_index and bm25_texts:
                tokenized_query = query.split()
                top_docs = bm25_index.get_top_n(tokenized_query, bm25_texts, n=Config.SPARSE_LIMIT)
                
                for doc in top_docs:
                    try:
                        idx = bm25_texts.index(doc)
                        sparse_ids.append(bm25_point_ids_by_project[project_id][idx])
                    except ValueError:
                        continue
                
                print(f"    Found {len(sparse_ids)} sparse results")
        except Exception as e:
            print(f"    ⚠️  BM25 search failed: {e}")

    # Fusion
    with Timer("RRF Fusion"):
        merged = rrf_fusion(dense_hits, sparse_ids, top_k)
        print(f"    Merged to {len(merged)} results")

    # Build context
    context = []
    metadata_map = point_metadata_by_project.get(project_id, {})
    
    for item in merged:
        pid = item["point_id"]
        meta = metadata_map.get(pid, {})
        
        context.append({
            "chunk_id": meta.get("chunk_id"),
            "text": meta.get("text"),
            "ocr_text": meta.get("ocr_text"),
            "tables": json.loads(meta.get("tables", "[]")),
            "images": json.loads(meta.get("images", "[]")),
            "source": meta.get("filename"),
            "page": meta.get("page"),
            "score": float(item["score"]),
            "searchable_text": meta.get("searchable_text", ""),
            "chat_id": meta.get("chat_id"),
            "start_time": meta.get("start_time"),
            "end_time": meta.get("end_time")
        })
    
    return context

# ---------------------------------------------------------------------------
# Answer generation
# ---------------------------------------------------------------------------
def generate_cited_answer(project_id: str, query: str, context: List[Dict[str, Any]]) -> Dict[str, Any]:
    print(f"🤖 Generating answer for project '{project_id}'")
    
    with Timer("Build Context"):
        context_text = ""
        for idx, chunk in enumerate(context):
            # If audio chunk includes timestamps, show as Audio in context
            if chunk.get("start_time") is not None:
                context_text += f"\n[{idx+1}] Audio: {chunk.get('source')} (start: {chunk.get('start_time')}s → end: {chunk.get('end_time')}s)\n"
            else:
                context_text += f"\n[{idx+1}] Source: {chunk.get('source')} (Page {chunk.get('page')})\n"
            display_text = chunk.get('ocr_text') or chunk.get('text') or ""
            context_text += f"{display_text[:1000]}\n"

    prompt = f"""Answer using ONLY the provided sources. Include citations like [1], [2].

QUESTION: {query}

SOURCES:
{context_text}

ANSWER (with citations):"""

    with Timer("LLM Generation"):
        answer_text = call_ollama(Config.LLM_MODEL, prompt, max_tokens=512, temperature=0.7)

    with Timer("Extract Citations"):
        citations = []
        for idx, chunk in enumerate(context):
            tag = f"[{idx+1}]"
            if tag in answer_text:
                citations.append(Citation(
                    text=(chunk.get("ocr_text") or chunk.get("text") or "")[:200] + "...",
                    source=chunk.get("source"),
                    page=int(chunk.get("page") or 0),
                    chunk_id=chunk.get("chunk_id"),
                    confidence=float(chunk.get("score") or 0.0)
                ))
        print(f"    Extracted {len(citations)} citations")

    return {"answer": answer_text, "citations": citations}

# ---------------------------------------------------------------------------
# Workflow nodes
# ---------------------------------------------------------------------------
def retrieval_node(state: RAGState) -> RAGState:
    state["context"] = hybrid_search(state["project_id"], state["query"], top_k=state.get("top_k", Config.TOP_K))
    return state

def generation_node(state: RAGState) -> RAGState:
    res = generate_cited_answer(state["project_id"], state["query"], state["context"])
    state["answer"] = res["answer"]
    state["citations"] = res["citations"]
    return state

# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------
@app.post("/upload", response_model=UploadResponse)
async def upload_document(
    project_id: str = Form(...),
    chat_id: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    print("\n" + "="*80)
    print(f"📤 UPLOAD: {file.filename} (project={project_id}, chat={chat_id})")
    print("="*80)
    
    file_ext = file.filename.lower().split('.')[-1]
    supported_images = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
    supported_audio = ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'wav']

    if file_ext not in ['pdf'] + supported_images + supported_audio:
        raise HTTPException(400, f"Unsupported file. Supported: PDF, {', '.join(supported_images)}, audio: {', '.join(supported_audio)}")

    document_id = str(uuid.uuid4())
    file_path = Config.UPLOAD_DIR / f"{document_id}_{file.filename}"

    with Timer("Save Upload"):
        with open(file_path, "wb") as f:
            f.write(await file.read())

    try:
        with Timer("Process Document"):
            if file_ext == 'pdf':
                chunks = process_pdf(str(file_path))
            elif file_ext in supported_audio:
                # audio -> whisper transcription chunks
                chunks = process_audio(str(file_path), file.filename)
            else:
                chunks = process_image(str(file_path), file.filename)
            
            # store (single-vector) in project collection
            store_in_vectordb(chunks, document_id, file.filename, project_id, chat_id)

        print(f"\n✅ Upload completed")
        print("="*80 + "\n")
        
        if file_ext == 'pdf':
            message_type = "PDF"
        elif file_ext in supported_audio:
            message_type = "Audio"
        else:
            message_type = "Image"

        return UploadResponse(
            message=f"{message_type} processed successfully",
            document_id=document_id,
            filename=file.filename,
            chunks_processed=len(chunks)
        )
    except Exception as e:
        print(f"❌ Upload error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, detail=f"Processing failed: {str(e)}")

@app.post("/query", response_model=QueryResponse)
async def query_documents(req: QueryRequest):
    print("\n" + "="*80)
    print(f"📥 QUERY: project={req.project_id} query='{req.query}'")
    print("="*80)
    
    start = datetime.now()

    try:
        with Timer("TOTAL QUERY TIME"):
            state: RAGState = {
                "project_id": req.project_id,
                "query": req.query,
                "context": [],
                "answer": "",
                "citations": [],
                "top_k": req.top_k
            }
            
            with Timer("Retrieval Phase"):
                state = retrieval_node(state)
            
            with Timer("Generation Phase"):
                state = generation_node(state)

        elapsed = (datetime.now() - start).total_seconds()
        print(f"\n✅ Query completed in {elapsed:.3f}s")
        print("="*80 + "\n")

        return QueryResponse(
            query=req.query,
            answer=state["answer"],
            citations=state["citations"],
            processing_time=elapsed
        )
    except Exception as e:
        print(f"❌ Query error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, detail=f"Query failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0-single-vector-whisper",
        "models": {
            "slm": Config.SLM_MODEL,
            "llm": Config.LLM_MODEL,
            "embedder": Config.EMBED_MODEL,
            "clip": Config.CLIP_MODEL,
            "whisper": (Config.WHISPER_MODEL_NAME if WHISPER_MODEL is not None else "not_loaded")
        }
    }

@app.get("/debug/ollama")
async def debug_ollama():
    try:
        models = get_available_models()
        test = call_ollama(Config.SLM_MODEL, "Hello", max_tokens=10)
        return {
            "status": "healthy",
            "available_models": models,
            "test_generation": test[:100]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/debug/qdrant")
async def debug_qdrant():
    try:
        collections = qdrant_client.get_collections().collections
        return {
            "status": "healthy",
            "collections": [c.name for c in collections],
            "projects": list(bm25_texts_by_project.keys()),
            "vector_size": TOTAL_VECTOR_SIZE
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ---------------------------------------------------------------------------
# Startup
# merged_service.py
"""
AI Service (Single Vector Mode) + Whisper audio integration
- Single vector mode preserved (text + image vector concatenated)
- Adds offline Whisper-based audio processing and timestamped audio chunks
- Per-project Qdrant collections, per-project BM25 indices
- Tesseract OCR for images, CLIP image embeddings
"""

import os
import json
import uuid
import time
from pathlib import Path
from typing import List, Dict, Any, TypedDict, Optional
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Document processing
from unstructured.partition.pdf import partition_pdf
from unstructured.chunking.title import chunk_by_title

# Embeddings
from sentence_transformers import SentenceTransformer

# Qdrant
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# BM25
from rank_bm25 import BM25Okapi

# HTTP client
import requests

# OCR + Image
import pytesseract
from PIL import Image
import base64

# Whisper (audio transcription)
try:
    import whisper
except Exception:
    whisper = None

# ---------------------------------------------------------------------------
# Timer
# ---------------------------------------------------------------------------
class Timer:
    def __init__(self, name: str):
        self.name = name
        self.start = None
    def __enter__(self):
        self.start = time.time()
        print(f"⏱️  [{self.name}] Starting...")
        return self
    def __exit__(self, *args):
        elapsed = time.time() - self.start
        print(f"⏱️  [{self.name}] Completed in {elapsed:.3f}s")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
class Config:
    UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
    OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
    SLM_MODEL = os.getenv("SLM_MODEL", "phi3:latest")
    LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5:3b")
    EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-m3")
    CLIP_MODEL = os.getenv("CLIP_MODEL", "clip-ViT-B-32")
    TOP_K = int(os.getenv("TOP_K", "5"))
    DENSE_LIMIT = int(os.getenv("DENSE_LIMIT", "10"))
    SPARSE_LIMIT = int(os.getenv("SPARSE_LIMIT", "10"))
    MIN_IMAGE_VEC_LEN = 4
    # Whisper model name (use small by default)
    WHISPER_MODEL_NAME = os.getenv("WHISPER_MODEL_NAME", "small")

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class UploadResponse(BaseModel):
    message: str
    document_id: str
    filename: str
    chunks_processed: int

class QueryRequest(BaseModel):
    project_id: str
    query: str
    chat_id: Optional[str] = None
    top_k: int = Config.TOP_K

class Citation(BaseModel):
    text: str
    source: str
    page: int
    chunk_id: str
    confidence: float

class QueryResponse(BaseModel):
    query: str
    answer: str
    citations: List[Citation]
    processing_time: float

class RAGState(TypedDict):
    project_id: str
    query: str
    context: List[Dict[str, Any]]
    answer: str
    citations: List[Dict[str, Any]]
    top_k: int

# ---------------------------------------------------------------------------
# App init
# ---------------------------------------------------------------------------
app = FastAPI(title="AI Service (Single Vector Mode + Whisper)", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ---------------------------------------------------------------------------
# Qdrant client
# ---------------------------------------------------------------------------
qdrant_client = QdrantClient(url=Config.QDRANT_URL)

# ---------------------------------------------------------------------------
# Embedders
# ---------------------------------------------------------------------------
with Timer("Load Text Embedding Model"):
    try:
        text_embedder = SentenceTransformer(Config.EMBED_MODEL)
        print(f"✅ Loaded text embedder: {Config.EMBED_MODEL}")
    except Exception as e:
        print(f"⚠️ Failed to load {Config.EMBED_MODEL}: {e}")
        text_embedder = SentenceTransformer("all-MiniLM-L6-v2")

with Timer("Load CLIP Image Model"):
    try:
        image_embedder = SentenceTransformer(Config.CLIP_MODEL)
        print(f"✅ Loaded image embedder: {Config.CLIP_MODEL}")
    except Exception as e:
        print(f"⚠️ Failed to load {Config.CLIP_MODEL}: {e}")
        image_embedder = text_embedder

# Load Whisper once (module-level)
WHISPER_MODEL = None
if whisper is not None:
    try:
        with Timer(f"Loading Whisper model: {Config.WHISPER_MODEL_NAME}"):
            WHISPER_MODEL = whisper.load_model(Config.WHISPER_MODEL_NAME)
            print(f"✅ Whisper model loaded: {Config.WHISPER_MODEL_NAME}")
    except Exception as e:
        print(f"❌ Failed to load Whisper: {e}")
        WHISPER_MODEL = None
else:
    print("⚠️ whisper package not available — audio transcription disabled")

# ---------------------------------------------------------------------------
# Embedding helper functions (defined before init_vector_sizes)
# ---------------------------------------------------------------------------
def embed_text(text: str) -> List[float]:
    start = time.time()
    vec = text_embedder.encode(text, show_progress_bar=False)
    elapsed = time.time() - start
    print(f"    ⏱️  Embedding text ({len(text)} chars) took {elapsed:.3f}s")
    return vec.tolist()

def embed_image_pil(img: Image.Image) -> List[float]:
    start = time.time()
    # sentence-transformers encode returns an array of vectors for list input
    vec = image_embedder.encode([img], show_progress_bar=False)
    elapsed = time.time() - start
    print(f"    ⏱️  Embedding image took {elapsed:.3f}s")
    return vec[0].tolist()

# ---------------------------------------------------------------------------
# Cache vector sizes
# ---------------------------------------------------------------------------
TEXT_VECTOR_SIZE = None
IMAGE_VECTOR_SIZE = None
TOTAL_VECTOR_SIZE = None

def init_vector_sizes():
    global TEXT_VECTOR_SIZE, IMAGE_VECTOR_SIZE, TOTAL_VECTOR_SIZE
    if TEXT_VECTOR_SIZE is None:
        # safe defaults via a small test embedding
        TEXT_VECTOR_SIZE = len(embed_text("test"))
    if IMAGE_VECTOR_SIZE is None:
        # small PIL image for probing
        try:
            IMAGE_VECTOR_SIZE = len(embed_image_pil(Image.new('RGB', (32, 32))))
        except Exception:
            IMAGE_VECTOR_SIZE = TEXT_VECTOR_SIZE  # fallback to avoid zero
    TOTAL_VECTOR_SIZE = TEXT_VECTOR_SIZE + IMAGE_VECTOR_SIZE
    print(f"✅ Vector sizes: text={TEXT_VECTOR_SIZE}, image={IMAGE_VECTOR_SIZE}, total={TOTAL_VECTOR_SIZE}")

# ---------------------------------------------------------------------------
# Per-project BM25 & metadata
# ---------------------------------------------------------------------------
bm25_texts_by_project: Dict[str, List[str]] = {}
bm25_point_ids_by_project: Dict[str, List[str]] = {}
bm25_index_by_project: Dict[str, BM25Okapi] = {}
point_metadata_by_project: Dict[str, Dict[str, Dict[str, Any]]] = {}

# ---------------------------------------------------------------------------
# Helper: collection name
# ---------------------------------------------------------------------------
def get_collection_name(project_id: str) -> str:
    return f"project_{project_id.replace('-', '_')}"

# ---------------------------------------------------------------------------
# Ensure collection (SINGLE VECTOR ONLY)
# ---------------------------------------------------------------------------
def ensure_collection(collection_name: str):
    """Create collection with single concatenated vector"""
    init_vector_sizes()
    with Timer(f"Check/Create collection [{collection_name}]"):
        try:
            qdrant_client.get_collection(collection_name=collection_name)
            print(f"✅ Collection '{collection_name}' exists.")
        except Exception:
            print(f"📦 Creating SINGLE-VECTOR collection '{collection_name}'...")
            qdrant_client.recreate_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=TOTAL_VECTOR_SIZE,
                    distance=Distance.COSINE
                )
            )
            print(f"✅ Created collection (vector size={TOTAL_VECTOR_SIZE})")

# ---------------------------------------------------------------------------
# Ollama utilities
# ---------------------------------------------------------------------------
available_models_cache: Optional[List[str]] = None

def get_available_models() -> List[str]:
    global available_models_cache
    if available_models_cache:
        return available_models_cache
    try:
        r = requests.get(f"{Config.OLLAMA_URL.rstrip('/')}/api/tags", timeout=5)
        if r.status_code == 200:
            data = r.json()
            available_models_cache = [m.get("name", "") for m in data.get("models", [])]
            return available_models_cache
    except Exception as e:
        print(f"⚠️ Failed to fetch Ollama models: {e}")
    return []

def normalize_model_name(model: str) -> str:
    available = get_available_models()
    if model in available:
        return model
    for avail in available:
        if model in avail or avail in model:
            print(f"📝 Model normalized: '{model}' -> '{avail}'")
            return avail
        model_base = model.replace("-", "").replace("_", "").split(":")[0].lower()
        avail_base = avail.replace("-", "").replace("_", "").split(":")[0].lower()
        if model_base == avail_base:
            print(f"📝 Model normalized: '{model}' -> '{avail}'")
            return avail
    return model

def call_ollama(model: str, prompt: str, max_tokens: int = 1024, temperature: float = 0.7) -> str:
    model = normalize_model_name(model)
    url = f"{Config.OLLAMA_URL.rstrip('/')}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"num_predict": max_tokens, "temperature": temperature}
    }
    try:
        print(f"🤖 Calling {model} (prompt: {len(prompt)} chars)")
        start = time.time()
        r = requests.post(url, json=payload, timeout=180)
        elapsed = time.time() - start
        
        if r.status_code != 200:
            return f"[LLM_ERROR] {r.status_code}: {r.text[:200]}"
        
        data = r.json()
        if "response" in data:
            result = data["response"].strip()
            print(f"✅ LLM response in {elapsed:.3f}s ({len(result)} chars)")
            return result
        return json.dumps(data)
    except requests.exceptions.Timeout:
        return "[LLM_ERROR] Request timed out"
    except Exception as e:
        return f"[LLM_ERROR] {str(e)}"

# ---------------------------------------------------------------------------
# PDF processing
# ---------------------------------------------------------------------------
def process_pdf(file_path: str) -> List[Dict[str, Any]]:
    print(f"📄 Processing PDF: {file_path}")
    with Timer("PDF Partition"):
        elements = partition_pdf(
            filename=file_path,
            strategy="hi_res",
            infer_table_structure=True,
            extract_image_block_types=["Image"],
            extract_image_block_to_payload=True
        )
    
    with Timer("PDF Chunking"):
        chunks = chunk_by_title(
            elements,
            max_characters=3000,
            new_after_n_chars=2400,
            combine_text_under_n_chars=500
        )

    processed = []
    for chunk in chunks:
        chunk_data = {
            "chunk_id": str(uuid.uuid4()),
            "text": chunk.text or "",
            "tables": [],
            "images": [],
            "metadata": {
                "page": getattr(getattr(chunk, 'metadata', None), 'page_number', 0),
                "type": "mixed"
            }
        }
        
        if hasattr(chunk, "metadata") and hasattr(chunk.metadata, "orig_elements"):
            for el in chunk.metadata.orig_elements:
                et = type(el).__name__
                if et == "Table":
                    table_html = getattr(getattr(el, "metadata", None), "text_as_html", getattr(el, "text", None))
                    if table_html:
                        chunk_data["tables"].append(table_html)
                        chunk_data["metadata"]["type"] = "table"
                elif et == "Image":
                    img_b64 = getattr(getattr(el, "metadata", None), "image_base64", None)
                    if img_b64:
                        chunk_data["images"].append(img_b64)
                        chunk_data["metadata"]["type"] = "image"
        
        processed.append(chunk_data)
    
    print(f"✅ Extracted {len(processed)} chunks")
    return processed

# ---------------------------------------------------------------------------
# Image processing: OCR + CLIP
# ---------------------------------------------------------------------------
def process_image(file_path: str, filename: str) -> List[Dict[str, Any]]:
    print(f"🖼️  Processing image: {file_path}")
    
    with Timer("Load Image"):
        img = Image.open(file_path).convert('RGB')
        width, height = img.size
        with open(file_path, 'rb') as f:
            img_b64 = base64.b64encode(f.read()).decode('utf-8')

    chunk_data = {
        "chunk_id": str(uuid.uuid4()),
        "text": "",
        "ocr_text": "",
        "tables": [],
        "images": [img_b64],
        "metadata": {"page": 1, "type": "image", "width": width, "height": height}
    }

    # Tesseract OCR
    with Timer("Tesseract OCR"):
        try:
            ocr_result = pytesseract.image_to_string(img)
            chunk_data["ocr_text"] = ocr_result.strip()
            if ocr_result.strip():
                chunk_data["text"] = f"Image OCR: {ocr_result.strip()}"
                print(f"    OCR extracted {len(ocr_result.split())} words")
            else:
                print(f"    No OCR text found")
        except Exception as e:
            print(f"    OCR failed: {e}")

    # Optional caption if no OCR
    if not chunk_data["text"]:
        chunk_data["text"] = f"Image: {filename} ({width}x{height})"
        print(f"    Using filename as description")

    # CLIP embedding
    with Timer("Image embedding (CLIP)"):
        try:
            img_vec = embed_image_pil(img)
            chunk_data["image_vector"] = img_vec
        except Exception as e:
            print(f"    Image embedding failed: {e}")
            chunk_data["image_vector"] = []

    print(f"✅ Created 1 chunk for image")
    return [chunk_data]

# ---------------------------------------------------------------------------
# Audio Processing (Whisper Offline)
# ---------------------------------------------------------------------------
def process_audio(file_path: str, filename: str) -> List[Dict[str, Any]]:
    """Transcribe audio & create timestamped chunks (uses Whisper small)"""
    print(f"🔊 Processing Audio: {file_path}")

    if WHISPER_MODEL is None:
        raise RuntimeError("Whisper model not loaded (WHISPER_MODEL is None)")

    model = WHISPER_MODEL

    with Timer("Transcription"):
        result = model.transcribe(file_path)
        segments = result.get("segments", []) or []
        print(f"📝 Whisper returned {len(segments)} segments")

    if not segments:
        print("⚠️ No segments returned from Whisper — creating fallback chunk")
        return [{
            "chunk_id": str(uuid.uuid4()),
            "text": "",
            "tables": [],
            "images": [],
            "metadata": {"page": 0, "type": "audio", "start_time": 0.0, "end_time": 0.0}
        }]

    # Convert segments → RAG chunks safely
    chunks: List[Dict[str, Any]] = []
    current_text = ""
    start_time: Optional[float] = None
    MAX_CHARS = 800

    for seg in segments:
        seg_text = seg.get("text", "").strip()
        seg_start = seg.get("start", 0.0)
        seg_end = seg.get("end", seg_start)

        if start_time is None:
            start_time = seg_start

        # If single segment is very large and no current_text -> push as its own chunk
        if not current_text and len(seg_text) > MAX_CHARS:
            chunks.append({
                "chunk_id": str(uuid.uuid4()),
                "text": seg_text,
                "tables": [],
                "images": [],
                "metadata": {"page": 0, "type": "audio", "start_time": seg_start, "end_time": seg_end}
            })
            start_time = None
            current_text = ""
            continue

        # If adding this segment would overflow -> close previous chunk
        if len(current_text) + len(seg_text) > MAX_CHARS:
            chunks.append({
                "chunk_id": str(uuid.uuid4()),
                "text": current_text.strip(),
                "tables": [],
                "images": [],
                "metadata": {"page": 0, "type": "audio", "start_time": start_time, "end_time": seg_start}
            })
            current_text = seg_text
            start_time = seg_start
        else:
            current_text = (current_text + " " + seg_text).strip()

    # Final flush
    if current_text:
        chunks.append({
            "chunk_id": str(uuid.uuid4()),
            "text": current_text.strip(),
            "tables": [],
            "images": [],
            "metadata": {"page": 0, "type": "audio", "start_time": start_time, "end_time": segments[-1].get("end", start_time)}
        })

    print(f"🎯 Created {len(chunks)} audio text chunks")
    return chunks

# ---------------------------------------------------------------------------
# Store in Qdrant + BM25 (SINGLE VECTOR MODE)
# ---------------------------------------------------------------------------
def store_in_vectordb(
    chunks: List[Dict[str, Any]],
    document_id: str,
    filename: str,
    project_id: str,
    chat_id: Optional[str] = None
):
    """Store chunks using SINGLE concatenated vector (text + image)"""
    collection = get_collection_name(project_id)
    ensure_collection(collection)
    
    print(f"💾 Storing {len(chunks)} chunks in project '{project_id}'")

    # Init BM25 structures
    bm25_texts = bm25_texts_by_project.setdefault(project_id, [])
    bm25_point_ids = bm25_point_ids_by_project.setdefault(project_id, [])
    metadata_map = point_metadata_by_project.setdefault(project_id, {})

    # Generate summaries (SLM)
    with Timer("Generate Summaries"):
        summaries = []
        for i, chunk in enumerate(chunks):
            short_text = (chunk.get("text") or "")[:1200]
            if not short_text.strip():
                summaries.append("")
                continue
            
            prompt = f"Summarize in 2-3 sentences:\n\n{short_text}\n\nSummary:"
            summary = call_ollama(Config.SLM_MODEL, prompt, max_tokens=200, temperature=0.3)
            
            if summary.startswith("[LLM_ERROR]"):
                summary = short_text[:400]
            summaries.append(summary)

    # Generate embeddings and create points
    points = []
    with Timer("Generate Embeddings"):
        init_vector_sizes()  # Ensure sizes are set
        
        for i, (chunk, summary) in enumerate(zip(chunks, summaries)):
            searchable_text = summary
            if chunk.get("text"):
                searchable_text += "\n\n" + chunk["text"]
            searchable_text = searchable_text.strip()[:2000]

            print(f"  Embedding chunk {i+1}/{len(chunks)}")

            # TEXT VECTOR
            text_vec = embed_text(searchable_text if searchable_text else "empty")

            # IMAGE VECTOR (if available)
            image_vec = chunk.get("image_vector", [])

            # CONCATENATE: text + image (or text + zeros if no image)
            if image_vec and len(image_vec) >= Config.MIN_IMAGE_VEC_LEN:
                combined_vec = text_vec + image_vec
            else:
                # Pad with zeros to maintain consistent vector size
                combined_vec = text_vec + ([0.0] * IMAGE_VECTOR_SIZE)

            pid = str(uuid.uuid4())

            payload = {
                "document_id": document_id,
                "chunk_id": chunk["chunk_id"],
                "filename": filename,
                "text": chunk.get("text", ""),
                "ocr_text": chunk.get("ocr_text", ""),
                "tables": json.dumps(chunk.get("tables", [])),
                "images": json.dumps(chunk.get("images", [])),
                "page": chunk.get("metadata", {}).get("page", 0),
                "content_type": chunk.get("metadata", {}).get("type", "mixed"),
                "searchable_text": searchable_text,
                "chat_id": chat_id or "",
                # preserve timestamps for audio chunks if any
                "start_time": chunk.get("metadata", {}).get("start_time"),
                "end_time": chunk.get("metadata", {}).get("end_time"),
            }

            # Create point with SINGLE vector
            points.append(PointStruct(id=pid, vector=combined_vec, payload=payload))

            bm25_point_ids.append(pid)
            bm25_texts.append(searchable_text)
            metadata_map[pid] = payload

    # Upsert to Qdrant
    with Timer("Upsert to Qdrant"):
        if points:
            qdrant_client.upsert(collection_name=collection, points=points)
            print(f"✅ Upserted {len(points)} points")

    # Rebuild BM25
    with Timer("Rebuild BM25 Index"):
        if bm25_texts:
            tokenized = [doc.split() for doc in bm25_texts]
            bm25_index_by_project[project_id] = BM25Okapi(tokenized)
            print(f"✅ BM25 updated ({len(bm25_texts)} docs)")

# ---------------------------------------------------------------------------
# Hybrid search (SINGLE VECTOR MODE)
# ---------------------------------------------------------------------------
def rrf_fusion(dense_hits: List[Any], sparse_ids: List[str], top_k: int) -> List[Dict[str, Any]]:
    score_map = {}
    k = 60
    
    for rank, hit in enumerate(dense_hits, start=1):
        pid = hit.id
        score_map.setdefault(pid, 0.0)
        score_map[pid] += 1.0 / (k + rank)
    
    for rank, pid in enumerate(sparse_ids, start=1):
        score_map.setdefault(pid, 0.0)
        score_map[pid] += 1.0 / (k + rank)
    
    merged = sorted(score_map.items(), key=lambda x: x[1], reverse=True)[:top_k]
    
    return [{"point_id": pid, "score": sc} for pid, sc in merged]

def hybrid_search(project_id: str, query: str, top_k: int = Config.TOP_K) -> List[Dict[str, Any]]:
    print(f"🔍 Project '{project_id}' searching: '{query}'")
    collection = get_collection_name(project_id)
    init_vector_sizes()

    # Query embedding (text + padded zeros for image part)
    with Timer("Query Embedding"):
        text_qvec = embed_text(query)
        qvec = text_qvec + ([0.0] * IMAGE_VECTOR_SIZE)

    # Dense search
    dense_hits = []
    with Timer("Dense Search (Qdrant)"):
        try:
            dense_hits = qdrant_client.query_points(
                collection_name=collection,
                vector=qvec,
                limit=Config.DENSE_LIMIT,
                with_payload=True
            ).points
            print(f"    Found {len(dense_hits)} dense results")
        except Exception as e:
            print(f"    ❌ Dense search failed: {e}")

    # Sparse search (BM25)
    sparse_ids = []
    with Timer("Sparse Search (BM25)"):
        try:
            bm25_texts = bm25_texts_by_project.get(project_id, [])
            bm25_index = bm25_index_by_project.get(project_id)
            
            if bm25_index and bm25_texts:
                tokenized_query = query.split()
                top_docs = bm25_index.get_top_n(tokenized_query, bm25_texts, n=Config.SPARSE_LIMIT)
                
                for doc in top_docs:
                    try:
                        idx = bm25_texts.index(doc)
                        sparse_ids.append(bm25_point_ids_by_project[project_id][idx])
                    except ValueError:
                        continue
                
                print(f"    Found {len(sparse_ids)} sparse results")
        except Exception as e:
            print(f"    ⚠️  BM25 search failed: {e}")

    # Fusion
    with Timer("RRF Fusion"):
        merged = rrf_fusion(dense_hits, sparse_ids, top_k)
        print(f"    Merged to {len(merged)} results")

    # Build context
    context = []
    metadata_map = point_metadata_by_project.get(project_id, {})
    
    for item in merged:
        pid = item["point_id"]
        meta = metadata_map.get(pid, {})
        
        context.append({
            "chunk_id": meta.get("chunk_id"),
            "text": meta.get("text"),
            "ocr_text": meta.get("ocr_text"),
            "tables": json.loads(meta.get("tables", "[]")),
            "images": json.loads(meta.get("images", "[]")),
            "source": meta.get("filename"),
            "page": meta.get("page"),
            "score": float(item["score"]),
            "searchable_text": meta.get("searchable_text", ""),
            "chat_id": meta.get("chat_id"),
            "start_time": meta.get("start_time"),
            "end_time": meta.get("end_time")
        })
    
    return context

# ---------------------------------------------------------------------------
# Answer generation
# ---------------------------------------------------------------------------
def generate_cited_answer(project_id: str, query: str, context: List[Dict[str, Any]]) -> Dict[str, Any]:
    print(f"🤖 Generating answer for project '{project_id}'")
    
    with Timer("Build Context"):
        context_text = ""
        for idx, chunk in enumerate(context):
            # If audio chunk includes timestamps, show as Audio in context
            if chunk.get("start_time") is not None:
                context_text += f"\n[{idx+1}] Audio: {chunk.get('source')} (start: {chunk.get('start_time')}s → end: {chunk.get('end_time')}s)\n"
            else:
                context_text += f"\n[{idx+1}] Source: {chunk.get('source')} (Page {chunk.get('page')})\n"
            display_text = chunk.get('ocr_text') or chunk.get('text') or ""
            context_text += f"{display_text[:1000]}\n"

    prompt = f"""Answer using ONLY the provided sources. Include citations like [1], [2].

QUESTION: {query}

SOURCES:
{context_text}

ANSWER (with citations):"""

    with Timer("LLM Generation"):
        answer_text = call_ollama(Config.LLM_MODEL, prompt, max_tokens=512, temperature=0.7)

    with Timer("Extract Citations"):
        citations = []
        for idx, chunk in enumerate(context):
            tag = f"[{idx+1}]"
            if tag in answer_text:
                citations.append(Citation(
                    text=(chunk.get("ocr_text") or chunk.get("text") or "")[:200] + "...",
                    source=chunk.get("source"),
                    page=int(chunk.get("page") or 0),
                    chunk_id=chunk.get("chunk_id"),
                    confidence=float(chunk.get("score") or 0.0)
                ))
        print(f"    Extracted {len(citations)} citations")

    return {"answer": answer_text, "citations": citations}

# ---------------------------------------------------------------------------
# Workflow nodes
# ---------------------------------------------------------------------------
def retrieval_node(state: RAGState) -> RAGState:
    state["context"] = hybrid_search(state["project_id"], state["query"], top_k=state.get("top_k", Config.TOP_K))
    return state

def generation_node(state: RAGState) -> RAGState:
    res = generate_cited_answer(state["project_id"], state["query"], state["context"])
    state["answer"] = res["answer"]
    state["citations"] = res["citations"]
    return state

# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------
@app.post("/upload", response_model=UploadResponse)
async def upload_document(
    project_id: str = Form(...),
    chat_id: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    print("\n" + "="*80)
    print(f"📤 UPLOAD: {file.filename} (project={project_id}, chat={chat_id})")
    print("="*80)
    
    file_ext = file.filename.lower().split('.')[-1]
    supported_images = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
    supported_audio = ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'wav']

    if file_ext not in ['pdf'] + supported_images + supported_audio:
        raise HTTPException(400, f"Unsupported file. Supported: PDF, {', '.join(supported_images)}, audio: {', '.join(supported_audio)}")

    document_id = str(uuid.uuid4())
    file_path = Config.UPLOAD_DIR / f"{document_id}_{file.filename}"

    with Timer("Save Upload"):
        with open(file_path, "wb") as f:
            f.write(await file.read())

    try:
        with Timer("Process Document"):
            if file_ext == 'pdf':
                chunks = process_pdf(str(file_path))
            elif file_ext in supported_audio:
                # audio -> whisper transcription chunks
                chunks = process_audio(str(file_path), file.filename)
            else:
                chunks = process_image(str(file_path), file.filename)
            
            # store (single-vector) in project collection
            store_in_vectordb(chunks, document_id, file.filename, project_id, chat_id)

        print(f"\n✅ Upload completed")
        print("="*80 + "\n")
        
        if file_ext == 'pdf':
            message_type = "PDF"
        elif file_ext in supported_audio:
            message_type = "Audio"
        else:
            message_type = "Image"

        return UploadResponse(
            message=f"{message_type} processed successfully",
            document_id=document_id,
            filename=file.filename,
            chunks_processed=len(chunks)
        )
    except Exception as e:
        print(f"❌ Upload error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, detail=f"Processing failed: {str(e)}")

@app.post("/query", response_model=QueryResponse)
async def query_documents(req: QueryRequest):
    print("\n" + "="*80)
    print(f"📥 QUERY: project={req.project_id} query='{req.query}'")
    print("="*80)
    
    start = datetime.now()

    try:
        with Timer("TOTAL QUERY TIME"):
            state: RAGState = {
                "project_id": req.project_id,
                "query": req.query,
                "context": [],
                "answer": "",
                "citations": [],
                "top_k": req.top_k
            }
            
            with Timer("Retrieval Phase"):
                state = retrieval_node(state)
            
            with Timer("Generation Phase"):
                state = generation_node(state)

        elapsed = (datetime.now() - start).total_seconds()
        print(f"\n✅ Query completed in {elapsed:.3f}s")
        print("="*80 + "\n")

        return QueryResponse(
            query=req.query,
            answer=state["answer"],
            citations=state["citations"],
            processing_time=elapsed
        )
    except Exception as e:
        print(f"❌ Query error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, detail=f"Query failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0-single-vector-whisper",
        "models": {
            "slm": Config.SLM_MODEL,
            "llm": Config.LLM_MODEL,
            "embedder": Config.EMBED_MODEL,
            "clip": Config.CLIP_MODEL,
            "whisper": (Config.WHISPER_MODEL_NAME if WHISPER_MODEL is not None else "not_loaded")
        }
    }

@app.get("/debug/ollama")
async def debug_ollama():
    try:
        models = get_available_models()
        test = call_ollama(Config.SLM_MODEL, "Hello", max_tokens=10)
        return {
            "status": "healthy",
            "available_models": models,
            "test_generation": test[:100]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/debug/qdrant")
async def debug_qdrant():
    try:
        collections = qdrant_client.get_collections().collections
        return {
            "status": "healthy",
            "collections": [c.name for c in collections],
            "projects": list(bm25_texts_by_project.keys()),
            "vector_size": TOTAL_VECTOR_SIZE
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    print("\n" + "="*80)
    print("🚀 AI Service (Single Vector Mode + Whisper)")
    print("="*80)
    print(f"📍 Qdrant: {Config.QDRANT_URL}")
    print(f"🤖 Ollama: {Config.OLLAMA_URL}")
    print(f"🔢 Text Embedder: {Config.EMBED_MODEL}")
    print(f"🎯 CLIP Embedder: {Config.CLIP_MODEL}")
    print(f"🔊 Whisper: {Config.WHISPER_MODEL_NAME} (loaded: {WHISPER_MODEL is not None})")
    print("="*80 + "\n")

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("merged_service:app", host="0.0.0.0", port=8000, reload=False)
