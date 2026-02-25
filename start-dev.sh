#!/bin/bash
cd /Users/apple/chat-app
echo "Starting Convex dev server..."
npx convex dev &
CONVEX_PID=$!
sleep 5
echo "Convex started (PID: $CONVEX_PID)"
echo "Starting Next.js dev server..."
npm run dev &
NEXT_PID=$!
echo "Next.js started (PID: $NEXT_PID)"
echo ""
echo "Both servers are running!"
echo "Visit http://localhost:3000"
echo ""
wait
