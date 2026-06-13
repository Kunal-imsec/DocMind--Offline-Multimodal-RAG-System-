#!/bin/bash

# Activate venv
source ai-venv/bin/activate

# echo "🔥 Preloading embeddings..."
# python3 -m ai_service.app.startup

echo "🚀 Starting FastAPI..."
uvicorn ai_service.app.main:app --host 0.0.0.0 --port 8000
