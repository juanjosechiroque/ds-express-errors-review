#!/usr/bin/env bash
# Manual comparison script — NOT part of the automated test suite.
# Run against the live dev server (npm run dev) to compare error response
# shapes before/after integrating ds-express-errors. Requires the server
# on :3000 and MongoDB up (docker compose up -d mongo).
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="smoke-$(date +%s)@example.com"
PASSWORD="test1234"

hr() { printf '\n--- %s ---\n' "$1"; }

hr "1) signup"
curl -s -w '\n-> %{http_code}\n' -X POST "$BASE_URL/v1/auth/signup" \
  -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"

hr "2) duplicate signup"
curl -s -w '\n-> %{http_code}\n' -X POST "$BASE_URL/v1/auth/signup" \
  -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"

hr "3) successful login"
TOKEN=$(curl -s -X POST "$BASE_URL/v1/auth/login" \
  -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).data))")
echo "token: ${TOKEN:0:20}..."

hr "4) failed login (wrong password)"
curl -s -w '\n-> %{http_code}\n' -X POST "$BASE_URL/v1/auth/login" \
  -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"wrongpass\"}"

hr "5) create product without token"
curl -s -w '\n-> %{http_code}\n' -X POST "$BASE_URL/v1/products" \
  -H "Content-Type: application/json" -d '{"name":"Widget","price":9.99}'

hr "6) create product with token"
curl -s -w '\n-> %{http_code}\n' -X POST "$BASE_URL/v1/products" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Widget","price":9.99}'

hr "7) create product with invalid body (negative price)"
curl -s -w '\n-> %{http_code}\n' -X POST "$BASE_URL/v1/products" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Widget","price":-5}'

hr "8) GET product with malformed id"
curl -s -w '\n-> %{http_code}\n' "$BASE_URL/v1/products/not-a-valid-id"

hr "9) GET valid but nonexistent product"
curl -s -w '\n-> %{http_code}\n' "$BASE_URL/v1/products/64b7f3f3f3f3f3f3f3f3f3f3"

hr "10) GET product list"
curl -s -w '\n-> %{http_code}\n' "$BASE_URL/v1/products"
