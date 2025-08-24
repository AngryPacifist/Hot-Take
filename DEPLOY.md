# Railway Deployment Guide

## Quick Deploy to Railway

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Deploy to Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Connect your GitHub repository
   - Select this Hot-Take repo

3. **Railway will automatically**:
   - Detect it's a Node.js app
   - Set build command: `npm run build`
   - Set start command: `npm start`
   - Provide a PostgreSQL database
   - Generate a public URL

4. **Add Environment Variables** in Railway dashboard:
   - `SESSION_SECRET`: Generate a random string
   - Railway will auto-provide `DATABASE_URL`

5. **Deploy**:
   - Railway will build and deploy automatically
   - You'll get a live URL to share

## Alternative: Vercel + Neon

If you prefer Vercel:
1. Connect repo to Vercel
2. Create a Neon database account
3. Add DATABASE_URL and SESSION_SECRET to Vercel env vars
4. Deploy

The app is ready for deployment! 🎉
