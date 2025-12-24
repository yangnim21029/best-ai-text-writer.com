#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api/ai/generate"
# Use the secret from .env.local
SECRET="ajkghlkseugh!@#ghgu"

echo "=== Test 1: Shared Secret Header (x-ai-proxy-secret) ==="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-ai-proxy-secret: $SECRET" \
  -d '{"model":"gemini-1.5-flash","contents":[{"parts":[{"text":"Hello"}]}]}' \
  -v

echo -e "\n\n=== Test 2: Cookie Authentication (app_access_granted) ==="
# Simulating a browser request with the cookie
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  --cookie "app_access_granted=1" \
  -d '{"model":"gemini-1.5-flash","contents":[{"parts":[{"text":"Hello"}]}]}' \
  -v

echo -e "\n\n=== Test 3: Unauthorized Request (No Secret, No Cookie) ==="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-1.5-flash","contents":[{"parts":[{"text":"Hello"}]}]}' \
  -v
