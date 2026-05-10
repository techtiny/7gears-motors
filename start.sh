#!/bin/bash
set -e

echo "🚗 Starting 7Gears Motors Service Tracker..."
echo ""

# Check MySQL
if ! mysql -u root -e "SELECT 1" &>/dev/null; then
  echo "⚠️  MySQL is not running. Start it with: brew services start mysql"
  exit 1
fi

# Ensure DB exists
mysql -u root -e "CREATE DATABASE IF NOT EXISTS sevengears_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
echo "✅ Database ready"

# Kill existing processes
pkill -f "motors-1.0.0.jar" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

# Start backend
cd "$(dirname "$0")/backend"
echo "🔧 Starting Spring Boot backend on port 9090..."
java -jar target/motors-1.0.0.jar > /tmp/7gears-backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend
echo "   Waiting for backend to start..."
for i in {1..20}; do
  if curl -s http://localhost:9090/api/jobs/dashboard > /dev/null 2>&1; then
    echo "✅ Backend ready at http://localhost:9090"
    break
  fi
  sleep 1
done

# Start frontend
cd "$(dirname "$0")/frontend"
echo "⚛️  Starting React frontend..."
npm run dev > /tmp/7gears-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
sleep 3

FRONTEND_URL=$(grep "Local:" /tmp/7gears-frontend.log | awk '{print $NF}')
echo "✅ Frontend ready at $FRONTEND_URL"

echo ""
echo "==========================================="
echo "  7GEARS MOTORS SERVICE TRACKER IS LIVE!"
echo "==========================================="
echo "  Backend API : http://localhost:9090"
echo "  Frontend    : $FRONTEND_URL"
echo "  Dashboard   : http://localhost:9090/api/jobs/dashboard"
echo ""
echo "  Logs:"
echo "    Backend  → /tmp/7gears-backend.log"
echo "    Frontend → /tmp/7gears-frontend.log"
echo ""
echo "  Stop: pkill -f 'motors-1.0.0.jar'; pkill -f vite"
echo "==========================================="

open "$FRONTEND_URL" 2>/dev/null || true
