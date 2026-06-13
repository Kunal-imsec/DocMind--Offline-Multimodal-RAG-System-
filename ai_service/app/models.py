# app/models.py
from sentence_transformers import SentenceTransformer
import time

class EmbeddingSingleton:
    _model = None

    @classmethod
    def load(cls, model_name: str):
        if cls._model is None:
            print("🔄 Loading embedding model (first-time load)...")
            start = time.time()
            cls._model = SentenceTransformer(model_name)
            print(f"✅ Embedding model loaded in {time.time() - start:.2f}s")
        return cls._model

    @classmethod
    def get(cls):
        if cls._model is None:
            raise RuntimeError("❌ Embedding model not loaded. Run startup or load() first.")
        return cls._model
