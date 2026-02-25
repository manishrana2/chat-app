#!/bin/bash

# 🚀 Quick Deployment Script for Chat App
# Deploys to FREE Vercel + Convex

set -e  # Exit on error

echo "╔═══════════════════════════════════════╗"
echo "║   🚀 Chat App Deployment Script      ║"
echo "║   Deploy to FREE Vercel + Convex     ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Step 1: Check dependencies
echo "✓ Checking environment..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ git not found. Please install Git"
    exit 1
fi

# Step 2: Build for production
echo ""
echo "📦 Building for production..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Fix errors above."
    exit 1
fi
echo "✅ Build successful!"

# Step 3: Deploy backend to Convex
echo ""
echo "☁️  Deploying backend to Convex..."
echo "    (Make sure you're logged in: npx convex auth)"
npx convex deploy

if [ $? -eq 0 ]; then
    echo "✅ Convex deployment successful!"
    echo "✓ Check .env.local for NEXT_PUBLIC_CONVEX_URL"
else
    echo "⚠️  Convex deployment skipped"
fi

# Step 4: Setup Git (if not already setup)
echo ""
echo "📤 Setting up Git repository..."

if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "   Initializing git..."
    git init
    git branch -M main
    git add .
    git commit -m "Initial commit: Ready for production deployment"
    echo "⚠️  Remote not set. You need to:"
    echo "   1. Create a new repo on GitHub"
    echo "   2. Run: git remote add origin https://github.com/YOUR_USERNAME/chat-app.git"
    echo "   3. Run: git push -u origin main"
else
    echo "   Git already initialized"
    if git remote get-url origin > /dev/null 2>&1; then
        echo "✓ Remote configured"
        # Commit and push
        git add .
        git diff --cached --quiet || git commit -m "Deployment commit"
        git push origin main || echo "⚠️  Push failed. Check your GitHub connection."
    else
        echo "⚠️  No remote set. Add remote before deploying:"
        echo "   git remote add origin https://github.com/YOUR_USERNAME/chat-app.git"
        echo "   git push -u origin main"
    fi
fi

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║   ✅ Local Deployment Complete!      ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Remote Repository (if not done):"
echo "   git remote add origin https://github.com/YOUR_USERNAME/chat-app.git"
echo "   git push -u origin main"
echo ""
echo "2️⃣  Deploy Frontend to Vercel:"
echo "   • Go to https://vercel.com/dashboard"
echo "   • Click 'Add New' → 'Project'"
echo "   • Select your GitHub repository"
echo "   • Vercel auto-detects Next.js config"
echo "   • Click 'Deploy'"
echo ""
echo "3️⃣  Add Environment Variables in Vercel:"
echo "   Go to Settings → Environment Variables, add:"
echo "   • NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (from Clerk)"
echo "   • CLERK_SECRET_KEY (from Clerk)"
echo "   • NEXT_PUBLIC_CONVEX_URL (from .env.local)"
echo ""
echo "4️⃣  Update Clerk Redirect URLs:"
echo "   Go to Clerk dashboard and add:"
echo "   • https://your-app.vercel.app"
echo "   • https://your-app.vercel.app/sign-in"
echo "   • https://your-app.vercel.app/sign-up"
echo ""
echo "5️⃣  Test Live:"
echo "   • Visit: https://your-app.vercel.app"
echo "   • Sign up with email/phone"
echo "   • Set username & start chatting! 🎉"
echo ""
echo "💰 Cost: $0/month (FREE tier for Vercel, Convex, Clerk)"
echo ""
echo "📚 Full guide: See FREE_DEPLOYMENT.md"
echo ""
