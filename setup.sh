#!/bin/bash

echo "=== ACTIVATING PYTHON VENV ==="
source ai-venv/bin/activate

echo "=== STARTING QDRANT + OLLAMA CONTAINERS ==="
docker compose up -d

echo "=== WAITING 3 SECONDS FOR SERVICES ==="
sleep 3

echo "=== AVAILABLE OLLAMA MODELS ==="
curl -s http://localhost:11434/api/tags | jq .

echo "=== STARTING FASTAPI BACKEND ==="
cd ai-service
uvicorn app.main:app --host 0.0.0.0 --port 8000
