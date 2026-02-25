# Deployment Guide - WhatsApp-like Chat App

This guide walks you through deploying your chat application to production using **Vercel** (frontend) and **Convex** (backend).

---

## **Prerequisites**

- GitHub account (for version control)
- Vercel account (free tier available at https://vercel.com)
- Convex account (free tier available at https://convex.dev)
- Clerk account for authentication (already set up)
- Local git installed

---

## **Step 1: Push Code to GitHub**

### 1.1 Initialize Git Repository (if not already done)
```bash
cd /Users/apple/chat-app
git init
git add .
git commit -m "Initial commit: Chat app with advanced messaging features"
```

### 1.2 Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (e.g., `chat-app`)
3. Don't initialize with README/gitignore
4. Follow the instructions to push your local repo

```bash
git remote add origin https://github.com/YOUR_USERNAME/chat-app.git
git branch -M main
git push -u origin main
```

---

## **Step 2: Deploy Convex Backend**

### 2.1 Link Convex Project
```bash
cd /Users/apple/chat-app
npx convex deploy
```

This will:
- Ask you to sign in to Convex (or create an account)
- Create a new Convex project
- Deploy your schema and functions to production
- Generate `.env.local` with your production API key

### 2.2 Set Environment Variables
After deployment, you'll have:
- `CONVEX_DEPLOYMENT` - Your Convex deployment URL
- Save this in a secure location

---

## **Step 3: Deploy Frontend to Vercel**

### 3.1 Connect GitHub to Vercel
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository (`chat-app`)
4. Select your GitHub account and the repo

### 3.2 Configure Environment Variables in Vercel
1. In the Vercel project settings, go to **Settings** → **Environment Variables**
2. Add the following variables from your `.env.local`:

```
CONVEX_DEPLOYMENT=your-convex-deployment-url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-key
CLERK_SECRET_KEY=your-clerk-secret
```

Note:
- `CONVEX_DEPLOYMENT` comes from your Convex deployment
- Clerk keys are already set up in your project

### 3.3 Deploy
1. Vercel will automatically deploy when you push to `main`
2. Or click **"Deploy"** button manually
3. Wait for build to complete (~3-5 minutes)
4. Your app will be live at a `.vercel.app` URL

---

## **Step 4: Configure Custom Domain (Optional)**

### 4.1 Add Custom Domain
1. In Vercel project, go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Domain will be live in 24-48 hours

Example: `yourdomain.com`

---

## **Step 5: Configure Production Clerk (If Needed)**

1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Make sure your production URLs are configured:
   - Set Allowed Redirect URLs to include your Vercel domain
   - Update webhook URLs if using Clerk webhooks
3. Update Clerk keys in Vercel environment variables if needed

---

## **Step 6: Database Backup & Monitoring**

### 6.1 Convex Dashboard
- Monitor your backend at: https://convex.dev/dashboard
- View:
  - Usage statistics
  - Logs and errors
  - Database browser
  - API metrics

### 6.2 Vercel Monitoring
- Monitor frontend at: https://vercel.com/dashboard
- View:
  - Deployment logs
  - Performance metrics
  - Error tracking

---

## **Step 7: Post-Deployment Checklist**

- [ ] Test signup and login with Clerk
- [ ] Test sending messages
- [ ] Test voice messages
- [ ] Test message edit/delete
- [ ] Test reactions
- [ ] Test pinning and forwarding
- [ ] Test search functionality
- [ ] Test reply functionality
- [ ] Verify read receipts (double ticks)
- [ ] Test voice/video calls
- [ ] Test story/status posting
- [ ] Test contact sync
- [ ] Check console for errors (F12)
- [ ] Test on mobile device
- [ ] Verify all images/videos load correctly
- [ ] Check typing indicators
- [ ] Verify conversation list updates in real-time

---

## **Environment Variables Summary**

### Frontend (.env.local)
```
CONVEX_DEPLOYMENT=<your-convex-deployment-url>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-key>
CLERK_SECRET_KEY=<your-clerk-secret>
```

### Backend (Convex)
- Automatically managed by Convex
- No additional setup needed

---

## **Troubleshooting**

### "Convex API not available"
- Solution: Wait 2-3 minutes after deployment for API to initialize
- Or run `npx convex dev` locally to test

### "Message send fails"
- Check Convex deployment is active
- Verify environment variables in Vercel are correct
- Check Clerk authentication is working

### "Slow performance"
- Optimize images (use Next.js Image component)
- Enable compression in Vercel settings
- Monitor Convex usage

### "Build fails on Vercel"
- Check build logs in Vercel dashboard
- Ensure all imports are correct
- Verify TypeScript compilation: `npx tsc --noEmit`
- Run locally: `npm run build`

---

## **Scaling & Performance**

### Convex Features (Available on Pro plan)
- Unlimited requests
- Larger database storage
- Priority support
- Custom domains
- Snapshots & time travel

### Vercel Features (Available on Pro plan)
- Unlimited deployments
- Enhanced analytics
- Advanced caching
- Priority support
- Custom domains

### Performance Tips
1. **Images**: Use Next.js Image component for optimization
2. **Messages**: Implement pagination (currently loads all)
3. **Database**: Add indexes on frequently queried fields
4. **Caching**: Enable Vercel caching for static content
5. **Monitoring**: Set up Vercel Analytics for performance insights

---

## **Useful Commands**

```bash
# Deploy Convex
npx convex deploy

# Deploy Vercel (if using Vercel CLI)
vercel

# Check TypeScript
npx tsc --noEmit

# Build locally
npm run build

# Start locally
npm run start

# View Convex logs
npx convex logs

# Reset Convex database (BE CAREFUL!)
npx convex run --prod convex/schema.ts
```

---

## **Support**

- **Convex Docs**: https://convex.dev/docs
- **Vercel Docs**: https://vercel.com/docs
- **Clerk Docs**: https://clerk.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## **What's Next?**

After deployment, consider:
1. ✅ User feedback and testing
2. ✅ Performance optimization
3. ✅ Add more features (groups, channels, etc.)
4. ✅ Implement end-to-end encryption
5. ✅ Add push notifications
6. ✅ Set up analytics
7. ✅ Improve UI/UX based on feedback

---

**Your production chat app is now live! 🚀**
