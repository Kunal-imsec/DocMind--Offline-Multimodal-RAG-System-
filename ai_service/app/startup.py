# app/startup.py
from ai_service.app.models import EmbeddingSingleton
from ai_service.app.main import Config

print("🚀 Preloading embedding model before starting FastAPI...")
EmbeddingSingleton.load(Config.EMBED_MODEL)
print("🎉 Embedding model preloaded successfully!")
