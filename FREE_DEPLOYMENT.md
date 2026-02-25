# 🚀 FREE Deployment Guide - Vercel + Convex

Your chat app is ready to deploy for **FREE** using Vercel and Convex!

## Step 1: Deploy Convex Backend (FREE)

### 1.1 Create Convex Account
1. Go to https://www.convex.dev (Free tier available)
2. Sign up with GitHub / Google / Email
3. Create a new project

### 1.2 Deploy Your Backend
```bash
cd /Users/apple/chat-app

# Login to Convex
npx convex auth

# Deploy to Convex cloud
npx convex deploy

# This will:
# - Create environment variables in .env.local
# - Deploy your database schema
# - Deploy all your functions
# - Generate API keys
```

### 1.3 Update .env.local
After deployment, Convex will automatically update `.env.local`:
```
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### 1.4 Verify Backend
```bash
# Test your backend
npx convex dev

# Should show:
# ✓ Database ready
# ✓ Functions deployed
# ✓ Subscriptions active
```

---

## Step 2: Deploy Frontend (Vercel - FREE)

### 2.1 Create Vercel Account
1. Go to https://vercel.com (Free tier available)
2. Sign up with GitHub (recommended)
3. Connect your GitHub repository

### 2.2 Push Your Code to GitHub
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Ready for production deployment"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/chat-app.git
git branch -M main
git push -u origin main
```

### 2.3 Deploy on Vercel
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select your `chat-app` repository
4. Vercel will auto-detect Next.js
5. **No need to change anything** - just click "Deploy"

### 2.4 Set Environment Variables in Vercel
1. In Vercel project → Settings → Environment Variables
2. Add your Clerk API keys:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
   CLERK_SECRET_KEY=your_secret
   NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
   ```
3. Redeploy after adding variables

### 2.5 Update Clerk Redirect URLs
1. Go to Clerk dashboard → Applications → Settings
2. Add Vercel URLs to Allowed redirect URLs:
   ```
   https://your-app.vercel.app
   https://your-app.vercel.app/sign-in
   https://your-app.vercel.app/sign-up
   ```

---

## Step 3: Deploy Database (Convex Cloud)

Your database is **automatically deployed** when you run `npx convex deploy`.

### Features Included (Free Tier)
- ✅ Up to 500MB storage
- ✅ Unlimited read/write operations
- ✅ Real-time subscriptions
- ✅ 99.9% uptime SLA
- ✅ Automatic backups
- ✅ SSL encrypted

---

## Complete Deployment Checklist

### Pre-Deployment
- ✅ Install dependencies: `npm install`
- ✅ Test locally: `npm run dev`
- ✅ Build for production: `npm run build` (Should complete without errors)

### Backend (Convex)
- ✅ Create Convex account
- ✅ Run `npx convex deploy`
- ✅ Copy `NEXT_PUBLIC_CONVEX_URL` from `.env.local`
- ✅ Verify `npx convex dev` works

### Frontend (Vercel)
- ✅ Create Vercel account
- ✅ Push code to GitHub
- ✅ Connect GitHub repo to Vercel
- ✅ Add environment variables
- ✅ Update Clerk redirect URLs

### Testing
- ✅ Visit your Vercel URL
- ✅ Sign up with email/phone
- ✅ Set username
- ✅ Search users by @username
- ✅ Send friend request
- ✅ Send encrypted message
- ✅ Use voice/video calls
- ✅ Post stories

---

## Free Tier Limits (More Than Enough!)

| Service | Free Tier | Your Needs |
|---------|-----------|-----------|
| **Convex** | 500MB storage | Small to medium app ✅ |
| **Convex** | Unlimited ops | Millions of messages possible ✅ |
| **Vercel** | 100GB bandwidth | Usually <1GB/month ✅ |
| **Vercel** | 12 builds/month | GitHub auto-deploys ✅ |
| **Clerk** | 10k users | More than enough ✅ |

**Everything you need is available for FREE!** ✨

---

## Quick Deploy Script

```bash
#!/bin/bash
# Save as: deploy.sh

echo "🚀 Deploying Chat App..."

# 1. Build for production
echo "📦 Building for production..."
npm run build

# 2. Deploy backend to Convex
echo "☁️ Deploying backend to Convex..."
npx convex deploy --prod

# 3. Push to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy to production"
git push origin main

echo "✅ Deployment complete!"
echo "📱 Your app is live at: https://your-app.vercel.app"
```

Run:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Troubleshooting Deployment

### Issue: "Environment variables not set"
**Solution**: Check Vercel → Settings → Environment Variables. Make sure all 3 variables are set.

### Issue: "Cannot connect to Convex"
**Solution**: Make sure `npx convex deploy` completed successfully. Check `NEXT_PUBLIC_CONVEX_URL` is correct.

### Issue: "Auth not working"
**Solution**: Update Clerk redirect URLs to include your Vercel domain.

### Issue: "Build fails on Vercel"
**Solution**: 
1. Run `npm run build` locally to verify it works
2. Check build logs on Vercel dashboard
3. Make sure all `.env` variables are set

---

## After Deployment

### Monitoring
- **Convex Dashboard**: https://www.convex.dev/dashboard
  - Check function execution
  - Monitor database usage
  - View real-time updates

- **Vercel Dashboard**: https://vercel.com/dashboard
  - Monitor deployments
  - Check analytics
  - View error logs

### Updates
To update your live app:
```bash
# Make code changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel auto-deploys, Convex auto-syncs
# Done! ✨
```

---

## Your App Features (Live!)

✅ Instagram-like username search  
✅ Friend requests via @username  
✅ End-to-end encrypted messages  
✅ Voice/video WebRTC calls  
✅ Voice messages  
✅ Message reactions & search  
✅ Message replies & threading  
✅ Message pinning & forwarding  
✅ Stories with 24h expiry  
✅ Real-time typing indicators  
✅ Read receipts (ticks)  
✅ And 30+ more features!

---

## Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| Convex | **FREE** | Up to 500MB ✅ |
| Vercel | **FREE** | Up to 100GB bandwidth ✅ |
| Clerk | **FREE** | Up to 10k users ✅ |
| **TOTAL** | **$0/month** | 🎉 |

---

## Next Steps

1. **TODAY**: Deploy backend with `npx convex deploy`
2. **TODAY**: Deploy frontend to Vercel
3. **TODAY**: Test live application
4. **TOMORROW**: Share with friends!

```bash
# Quick copy-paste to get started:

# 1. Deploy backend
npx convex deploy

# 2. Build locally to verify
npm run build

# 3. Push to GitHub (replaceYOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/chat-app.git
git add .
git commit -m "Ready for production"
git push -u origin main

# 4. Go to Vercel and connect your GitHub repo
# 5. Add environment variables to Vercel
# 6. Done! ✨
```

**Your app will be live in ~2 minutes!** 🚀

---

**Questions?** Check Convex & Vercel docs or reach out to their support!

**Congratulations on building an awesome chat app!** 🎉
