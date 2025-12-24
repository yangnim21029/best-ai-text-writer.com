#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api/ai/generate"
SECRET="ajkghlkseugh!@#ghgu"

echo "=== Test: Validating Upstream Success with 'prompt' ==="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-ai-proxy-secret: $SECRET" \
  -d '{"model":"gemini-1.5-flash-exp","prompt":"Say hello world","promptId":"healthcheck"}' \
  -v
