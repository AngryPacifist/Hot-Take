# Hot Take - Social Prediction Platform

## Deployment Guide

### Overview
Hot Take is a TikTok-style social prediction platform where users can stake points on predictions and hot takes. It features an infinite scroll feed of predictions with user authentication and real-time interactions.

### Tech Stack
- **Frontend**: React + TypeScript with Vite
- **Backend**: Node.js + Express + TypeScript  
- **Database**: PostgreSQL with Neon (serverless)
- **ORM**: Drizzle ORM
- **UI**: Tailwind CSS + Radix UI components
- **Authentication**: Express sessions with PostgreSQL store

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (local installation or cloud service like Neon)
- npm or yarn

### Step 1: Clone and Setup
```bash
git clone <repository-url>
cd Hot-Take
npm install
```

### Step 2: Environment Configuration
Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/hot_take

# Session Secret
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Server Configuration
PORT=5000
NODE_ENV=development
```

**Important Notes:**
- Replace `username`, `password`, and database details with your actual PostgreSQL credentials
- For local PostgreSQL: `postgresql://postgres@localhost:5432/hot_take`
- For Neon cloud: Get your connection string from Neon dashboard
- The app automatically detects if you're using Neon/cloud vs local PostgreSQL and uses the appropriate driver

### Step 3: Database Setup
```bash
# Create database (if using local PostgreSQL)
createdb hot_take

# Or using psql
psql -U postgres -c "CREATE DATABASE hot_take;"

# Push database schema
npm run db:push
```

### Step 4: Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

---

## 🌐 Production Deployment

### Option 1: Cloud Platforms (Recommended)

#### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` (from Neon or your PostgreSQL provider)
   - `SESSION_SECRET` (generate a secure random string)
   - `NODE_ENV=production`
3. Deploy automatically

#### Railway Deployment
1. Connect repository to Railway
2. Add environment variables
3. Railway will auto-detect and deploy

#### Render Deployment
1. Create a new Web Service on Render
2. Connect your repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables

### Option 2: VPS/Server Deployment

#### Prerequisites
- Ubuntu/CentOS server with Node.js and PostgreSQL
- Domain name (optional)
- SSL certificate (recommended)

#### Steps
```bash
# 1. Clone repository
git clone <repository-url>
cd Hot-Take

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your production values

# 4. Build the application
npm run build

# 5. Set up PostgreSQL and run migrations
npm run db:push

# 6. Install PM2 for process management
npm install -g pm2

# 7. Start the application
pm2 start npm --name "hot-take" -- start

# 8. Set up auto-start
pm2 startup
pm2 save
```

---

## 🗄️ Database Setup Options

### Option 1: Neon (Recommended for Cloud)
1. Visit [neon.tech](https://neon.tech)
2. Create a free account
3. Create a new database
4. Copy the connection string
5. Use it as your `DATABASE_URL`

### Option 2: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb hot_take

# Connection string
DATABASE_URL=postgresql://postgres@localhost:5432/hot_take
```

### Option 3: Docker PostgreSQL
```bash
# Run PostgreSQL in Docker
docker run --name postgres-db -e POSTGRES_DB=hot_take -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/hot_take
```

---

## 🔧 Configuration

### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `SESSION_SECRET` | ⚠️ | fallback | Secret key for session management |
| `PORT` | ❌ | 5000 | Server port |
| `NODE_ENV` | ❌ | development | Environment mode |

### Security Notes
- Always use a strong `SESSION_SECRET` in production
- Use HTTPS in production
- Keep your `DATABASE_URL` secure and never commit it to version control

---

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run db:push      # Push database schema
npm run check        # TypeScript type checking
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: DATABASE_URL must be set
```
**Solution**: Ensure your `.env` file has a valid `DATABASE_URL`

#### 2. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change the PORT in your `.env` file or kill the process using the port

#### 3. Build Errors
**Solution**: 
- Ensure Node.js version is 18+
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Check TypeScript errors: `npm run check`

#### 4. Windows-specific Issues
- If you get `NODE_ENV is not recognized`, the scripts have been updated to work on Windows
- For PostgreSQL connection issues, ensure PostgreSQL service is running

#### 5. WebSocket/Database Connection Errors
```
Error registering user: ErrorEvent { ... ECONNREFUSED ... wss://localhost/v2 }
```
**Solution**: This happens when using Neon driver with local PostgreSQL. The app has been updated to automatically detect and use the correct database driver. Ensure you have the latest version of the code.

### Getting Help
- Check the browser console for frontend errors
- Check the server logs for backend errors
- Ensure all environment variables are set correctly

---

## 📝 Project Structure

```
Hot-Take/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
├── server/                # Express backend
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database connection
│   ├── routes.ts         # API routes
│   └── index.ts          # Server entry point
├── shared/               # Shared types/schemas
│   └── schema.ts         # Database schema
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── drizzle.config.ts     # Database configuration
└── .env                  # Environment variables
```

---

## ✅ Verification Checklist

After deployment, verify:
- [ ] Application loads at your domain/URL
- [ ] User registration works
- [ ] User login works
- [ ] Creating predictions works
- [ ] Voting on predictions works
- [ ] Database is properly connected
- [ ] No console errors in browser
- [ ] Server logs show no errors

---

## 🎯 Features

- **User Authentication**: Register/login with username and password
- **Prediction Creation**: Create predictions with categories and resolution dates
- **Voting System**: Stake points on predictions (Yes/No votes)
- **Leaderboard**: Track user accuracy and points
- **Portfolio**: View your predictions and votes
- **Categories**: Organize predictions by topics (Tech, Sports, Crypto, etc.)
- **Real-time Updates**: WebSocket support for live interactions

The application is now confirmed working! 🎉
