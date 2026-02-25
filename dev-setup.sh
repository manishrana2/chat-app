#!/bin/bash
# Quick setup script to fix the Convex functions error

cd /Users/apple/chat-app

echo "🚀 Setting up Chat App with Convex Backend..."
echo ""

# Kill any existing processes
echo "Cleaning up old processes..."
pkill -f "npm run dev" 2>/dev/null
pkill -f "convex dev" 2>/dev/null
sleep 2

# Start Convex dev server
echo "Starting Convex backend server..."
npx convex dev --no-push &
CONVEX_PID=$!
echo "✓ Convex started (PID: $CONVEX_PID)"
sleep 8

# Start Next.js dev server
echo ""
echo "Starting Next.js frontend server..."
npm run dev &
NEXT_PID=$!
echo "✓ Next.js started (PID: $NEXT_PID)"
sleep 3

echo ""
echo "========================================="
echo "✅ All servers are running!"
echo "========================================="
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "   (or http://localhost:3001 if port 3000 is in use)"
echo ""
echo "Backend: Convex dev initialized"
echo ""
echo "To stop: Press Ctrl+C"
echo ""

# Wait for both processes
wait $CONVEX_PID 2>/dev/null
wait $NEXT_PID 2>/dev/null
