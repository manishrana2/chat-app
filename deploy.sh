#!/bin/bash

# ==============================================================================
# Chat App - Deployment & Setup Script
# ==============================================================================
# This script helps you set up and deploy your chat application
# Usage: bash deploy.sh [dev|build|deploy]
# ==============================================================================

set -e  # Exit on error

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}"
}

print_step() {
    echo -e "${YELLOW}→ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Main commands
case "${1:-dev}" in
    dev)
        print_header "Starting Development Environment"
        
        if [ ! -f ".env.local" ]; then
            print_error ".env.local not found!"
            print_step "Creating .env.local from .env.example"
            cp .env.example .env.local
            print_step "Please edit .env.local with your Clerk keys"
            exit 1
        fi
        
        print_step "Installing dependencies..."
        npm install
        
        print_step "Starting Convex dev server (in background)..."
        if ! pgrep -f "npx convex dev" > /dev/null; then
            (npx convex dev &) && sleep 2
            print_success "Convex dev server started"
        else
            print_success "Convex dev server already running"
        fi
        
        print_step "Starting Next.js dev server..."
        npm run dev
        ;;
    
    build)
        print_header "Building for Production"
        
        if [ ! -f ".env.local" ]; then
            print_error ".env.local not found!"
            print_step "Copy .env.local from Convex deployment"
            exit 1
        fi
        
        print_step "Running type-check..."
        npx tsc --noEmit
        
        print_step "Building Next.js app..."
        npm run build
        
        print_success "Build completed successfully!"
        print_step "Next step: Push to GitHub → Deploy on Vercel"
        ;;
    
    codegen)
        print_header "Regenerating Convex API"
        
        print_step "Running Convex codegen..."
        npx convex codegen
        
        print_success "Convex API regenerated"
        ;;
    
    deploy)
        print_header "Deploying to Production"
        
        print_step "Checking git status..."
        if [ -n "$(git status --porcelain)" ]; then
            print_error "You have uncommitted changes!"
            print_step "Please commit your changes first:"
            echo "  git add ."
            echo "  git commit -m 'Production deployment'"
            echo "  git push"
            exit 1
        fi
        
        print_step "Deploying Convex backend..."
        npx convex deploy
        
        print_success "Convex deployed! Save your CONVEX_DEPLOYMENT URL"
        print_step "Now deploy frontend to Vercel:"
        print_step "  1. Push to GitHub: git push"
        print_step "  2. Go to https://vercel.com/dashboard"
        print_step "  3. Import your repository"
        print_step "  4. Add environment variables from .env.local"
        print_step "  5. Deploy!"
        ;;
    
    *)
        echo "Usage: bash deploy.sh [dev|build|codegen|deploy]"
        echo ""
        echo "Commands:"
        echo "  dev       - Start local development"
        echo "  build     - Build for production"
        echo "  codegen   - Regenerate Convex API"
        echo "  deploy    - Deploy to production"
        echo ""
        echo "Example: bash deploy.sh dev"
        ;;
esac
