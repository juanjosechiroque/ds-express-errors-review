#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="$(mktemp)"
BASE_URL="${BASE_URL:-http://localhost:3000}"

cleanup() {
    if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
        kill -9 "$SERVER_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

echo "--- starting server ---"
npx tsx index.ts > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

for i in $(seq 1 20); do
    if grep -q "Server started" "$LOG_FILE" 2>/dev/null; then
        break
    fi
    sleep 0.5
done

if ! grep -q "Server started" "$LOG_FILE"; then
    echo "Server never started, log:"
    cat "$LOG_FILE"
    exit 1
fi
echo "server up, pid=$SERVER_PID"

echo "--- firing a request in the background ---"
curl -s -o /dev/null -w 'in-flight request finished with HTTP %{http_code} after %{time_total}s\n' \
    "$BASE_URL/v1/products" &
CURL_PID=$!

sleep 0.2
echo "--- sending SIGTERM to pid=$SERVER_PID ---"
kill -TERM "$SERVER_PID"

echo "--- waiting for the in-flight request to finish ---"
wait "$CURL_PID" || true

echo "--- waiting up to 10s for the process to exit ---"
for i in $(seq 1 20); do
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "process exited on its own after SIGTERM"
        break
    fi
    sleep 0.5
done

if kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "!! process did NOT exit within 10s of SIGTERM"
else
    SERVER_PID=""
fi

echo
echo "--- full server log ---"
cat "$LOG_FILE"
rm -f "$LOG_FILE"
