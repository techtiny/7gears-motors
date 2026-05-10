#!/bin/bash
echo "Stopping 7Gears Motors servers..."
pkill -f "motors-1.0.0.jar" 2>/dev/null && echo "✅ Backend stopped" || echo "Backend was not running"
pkill -f "vite" 2>/dev/null && echo "✅ Frontend stopped" || echo "Frontend was not running"
