#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api/ai/generate"
SECRET="ajkghlkseugh!@#ghgu"
MODEL="gemini-3-flash-preview"

echo "=== Test: Validating Upstream Success with Model: $MODEL ==="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-ai-proxy-secret: $SECRET" \
  -d "{\"model\":\"$MODEL\",\"prompt\":\"Say hello world\",\"promptId\":\"healthcheck\"}" \
  -v
