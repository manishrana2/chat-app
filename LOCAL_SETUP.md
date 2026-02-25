# 🚀 Chat App - Setup & Deployment Guide

## ✨ Features Included

✅ Custom Username/Password Authentication  
✅ Forgot Password Recovery (Email-based)  
✅ End-to-End Encrypted Messages (E2E)  
✅ Voice & Video Calls (WebRTC)  
✅ Stories (24h expiry)  
✅ Real-time Typing Indicators  
✅ Message Reactions, Replies, Pinning  
✅ 50+ Advanced Features  
✅ Fully Responsive (Mobile, Tablet, Desktop)  

---

## 🛠️ Prerequisites

Before starting, make sure you have:
- **Node.js** v18+ ([https://nodejs.org](https://nodejs.org))
- **npm** or **yarn** (comes with Node.js)
- **Git** ([https://git-scm.com](https://git-scm.com))

---

## 📱 LOCAL SETUP (For Development)

### Step 1: Clone & Install
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/chat-app.git
cd chat-app

# Install dependencies
npm install
```

### Step 2: Start Development Servers (2 Terminals Required!)

**Terminal 1 - Start Convex Backend:**
```bash
npx convex dev
```
Wait until you see: `🎉 Ready! Push this deployment with: npx convex deploy`

**Terminal 2 - Start Next.js Frontend:**
```bash
npm run dev
```
You'll see: `✓ Ready in XXXX ms`

### Step 3: Open in Browser
- **Desktop/Laptop**: http://localhost:3000
- **Mobile/Tablet**: http://YOUR_IP:3000 (find IP: `ipconfig getifaddr en0`)

---

## 🚀 PRODUCTION DEPLOYMENT (Free on Vercel + Convex)

### Step 1: Deploy Convex Backend

```bash
# Login to Convex
npx convex auth

# Deploy backend to Convex Cloud
npx convex deploy --prod
```

This will:
- Create `.env.local` with `NEXT_PUBLIC_CONVEX_URL`
- Deploy all functions to Convex
- Create a cloud database (FREE tier: 500MB)

### Step 2: Deploy Frontend to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Ready for production"
git push origin main

# Go to https://vercel.com/dashboard
# Click "Add New" → "Project"
# Select your repository
# Click "Deploy"
```

Vercel will automatically:
- Detect Next.js configuration
- Set up environment variables
- Deploy your app in ~2 minutes
- Give you a live URL: `https://your-app.vercel.app`

### Step 3: Verify Live Deployment
1. Visit your Vercel URL
2. Sign up with a test account
3. Try forgot password flow
4. Send a message to another user
5. Everything should work! ✅

---

## 📱 MOBILE ACCESS (iOS & Android)

### Option 1: Using Ngrok (Tunneling)
```bash
# Install ngrok: https://ngrok.com/download

# After npm run dev is running:
ngrok http 3000

# You'll get a URL like: https://xxxxx.ngrok.io
# Use this on your phone's browser
```

### Option 2: Same WiFi Network
1. Find your laptop IP: `ipconfig getifaddr en0`
2. On phone, visit: `http://YOUR_IP:3000`
3. Make sure both devices on same WiFi

### Option 3: Production URL
- After Vercel deployment, use: `https://your-app.vercel.app`
- Works on any device, anywhere! 🌍

---

## 🔐 Authentication Flow

### Sign Up
1. Go to `/sign-up`
2. Enter: username (3+ chars), name, email, phone, password (6+ chars)
3. Click "Sign Up" → Auto-login → Redirects to chat

### Sign In
1. Go to `/sign-in`
2. Enter: username/email + password
3. Click "Sign In" → Redirects to chat
4. Session persists on refresh (localStorage)

### Forgot Password
1. Go to sign-in page
2. Click "Forgot password?" link
3. Enter email → Get reset token
4. Paste token → Set new password
5. Auto-redirect to login

---

## ⚙️ Configuration

### Environment Variables
File: `.env.local`
```
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

This is auto-created by `npx convex deploy`.

### Customize Styling
- Sign-in page: `src/app/sign-in/page.tsx`
- Sign-up page: `src/app/sign-up/page.tsx`
- Forgot password: `src/app/forgot-password/page.tsx`
- Components: `src/components/`

---

## 🧪 Testing

### Test Forget Password
```bash
# On site:
1. Click "Forgot password?" on sign-in page
2. Enter your email
3. Copy the token from the response
4. Paste it into the token field
5. Set a new password
6. Try logging in with new password ✅
```

### Test on Multiple Devices
1. Open app on laptop: http://localhost:3000
2. Open app on phone: http://YOUR_IP:3000
3. Sign up different accounts
4. Send messages between them
5. Everything should work smoothly! ✅

---

## 🐛 Troubleshooting

### "Could not find public function"
**Solution**: Make sure `npx convex dev` is running in another terminal!

### "Connection refused"
**Solution**: 
- Check both servers are running (Convex + Next.js)
- Try: `pkill -f "npm run dev" && pkill -f "convex dev"`
- Then restart both

### "Port 3000/3001 already in use"
**Solution**:
```bash
# Kill the process using that port
lsof -ti:3000 | xargs kill -9
npx convex dev &
npm run dev
```

### "Build fails on Vercel"
**Solution**:
- Run `npm run build` locally to verify it passes
- Check Vercel logs: Settings → Deployments → Failed build
- Make sure all `.env` variables are set in Vercel

### "Session not persisting"
**Solution**: localStorage should auto-save. Check:
- DevTools → Application → localStorage
- Should have `authUser` key with user data
- If missing, manually re-login

---

## 📊 Free Tier Limits

| Service | Limit | Your App |
|---------|-------|----------|
| Convex | 500MB storage | ✅ More than enough |
| Convex | Unlimited ops | ✅ Millions possible |
| Vercel | 100GB bandwidth | ✅ Usually <1GB/month |
| Voice/Video | WebRTC (P2P) | ✅ No server cost |

**Total cost: $0/month** 🎉

---

## 📚 Project Structure

```
chat-app/
├── src/
│   ├── app/
│   │   ├── page.tsx (Main chat)
│   │   ├── sign-in/page.tsx (Login)
│   │   ├── sign-up/page.tsx (Register)
│   │   ├── forgot-password/page.tsx (Password reset)
│   │   └── providers.tsx (Auth context setup)
│   ├── components/
│   │   ├── ChatWindow.tsx
│   │   ├── Sidebar.tsx
│   │   └── ... (50+ more components)
│   ├── hooks/
│   │   ├── useAuth.ts (Authentication)
│   │   ├── useEncryption.ts (E2E encryption)
│   │   └── ... (other custom hooks)
│   └── lib/
│       └── crypto.ts (Encryption utilities)
├── convex/
│   ├── auth.ts (Auth functions - signup, login, forgot password)
│   ├── schema.ts (Database schema)
│   ├── messages.ts (Message handling)
│   ├── users.ts (User management)
│   └── ... (20+ more files)
├── package.json (Dependencies)
├── tsconfig.json (TypeScript config)
└── next.config.ts (Next.js config)
```

---

## 🎯 Quick Commands

```bash
# Development
npm run dev          # Start dev server
npx convex dev       # Start Convex backend

# Production
npm run build        # Build for production
npm start            # Run production build locally

# Database
npx convex codegen   # Generate API types
npx convex deploy    # Deploy to Convex Cloud

# Cleanup
npx convex reset     # Clear local database (dev only!)
```

---

## 🤝 Contributing

Found a bug? Want to add features?
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and create a Pull Request

---

## 📞 Support

- **Convex Docs**: https://docs.convex.dev
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs

---

## 📄 License

MIT License - Feel free to use this for personal or commercial projects!

---

**Happy coding! 🚀✨**

Built with ❤️ using Next.js + Convex + TypeScript
