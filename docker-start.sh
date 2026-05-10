#!/bin/sh
set -e

echo "🚗 Starting 7Gears Motors Service Tracker..."
echo ""

# ── Validate required environment variables ────────────────────────────────────
: "${MYSQL_HOST:?MYSQL_HOST is required}"
: "${MYSQL_PORT:?MYSQL_PORT is required}"
: "${MYSQL_USER:?MYSQL_USER is required}"
: "${MYSQL_DATABASE:?MYSQL_DATABASE is required}"
# MYSQL_PASSWORD may be empty, so we don't force it

echo "📦 Database : ${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}"
echo ""

# ── Start Spring Boot backend ──────────────────────────────────────────────────
echo "🔧 Starting Spring Boot backend on port 8080..."
java \
  -Dspring.datasource.url="jdbc:mysql://${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata" \
  -Dspring.datasource.username="${MYSQL_USER}" \
  -Dspring.datasource.password="${MYSQL_PASSWORD:-}" \
  -jar /app/app.jar &
BACKEND_PID=$!
echo "   Backend PID: ${BACKEND_PID}"

# ── Wait for backend to become healthy ────────────────────────────────────────
echo "   Waiting for backend to be ready..."
RETRIES=30
until wget -qO- http://localhost:8080/api/jobs/dashboard >/dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ "${RETRIES}" -le 0 ]; then
    echo "⚠️  Backend did not become ready in time — continuing anyway"
    break
  fi
  sleep 2
done
echo "✅ Backend ready at http://localhost:8080"

# ── Serve React frontend ───────────────────────────────────────────────────────
echo "⚛️  Serving React frontend on port 3000..."
serve -s /app/frontend/dist -l 3000 &
FRONTEND_PID=$!
echo "   Frontend PID: ${FRONTEND_PID}"

echo ""
echo "==========================================="
echo "  7GEARS MOTORS SERVICE TRACKER IS LIVE!"
echo "==========================================="
echo "  Backend API : http://localhost:8080"
echo "  Frontend    : http://localhost:3000"
echo "==========================================="

# ── Graceful shutdown ──────────────────────────────────────────────────────────
_shutdown() {
  echo ""
  echo "🛑 Shutting down..."
  kill "${FRONTEND_PID}" 2>/dev/null || true
  kill "${BACKEND_PID}"  2>/dev/null || true
  wait "${FRONTEND_PID}" 2>/dev/null || true
  wait "${BACKEND_PID}"  2>/dev/null || true
  echo "✅ Stopped."
}

trap _shutdown INT TERM

# Keep the container alive by waiting on the backend process
wait "${BACKEND_PID}"
