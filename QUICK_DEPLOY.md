# Quick Deployment Checklist for Render

## Before You Start
- [ ] Your code is pushed to GitHub
- [ ] You have a MongoDB Atlas account and connection string
- [ ] You have a Render account (sign up at render.com)

## Step-by-Step Deployment

### 1. Deploy Backend (5 minutes)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Fill in:
   - **Name**: `splitmint-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main` (or your main branch)
   - **Root Directory**: Leave empty (we'll specify in build command)
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

5. Click **"Advanced"** → Add Environment Variables:
   ```
   NODE_ENV = production
   PORT = 10000
   MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/
   JWT_SECRET = [Generate a random string - use: openssl rand -base64 32]
   FRONTEND_URL = [Leave empty for now, update after frontend deploy]
   ```

6. Click **"Create Web Service"**
7. Wait for deployment (2-3 minutes)
8. **Copy your backend URL** (e.g., `https://splitmint-backend.onrender.com`)

### 2. Deploy Frontend (5 minutes)

1. In Render dashboard, click **"New +"** → **"Static Site"**
2. Connect the same GitHub repository
3. Fill in:
   - **Name**: `splitmint-frontend`
   - **Branch**: `main` (or your main branch)
   - **Root Directory**: Leave empty
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

4. Add Environment Variable:
   ```
   VITE_API_URL = https://your-backend-url.onrender.com/api
   ```
   (Replace `your-backend-url` with your actual backend URL from Step 1)

5. Click **"Create Static Site"**
6. Wait for deployment (2-3 minutes)
7. **Copy your frontend URL** (e.g., `https://splitmint-frontend.onrender.com`)

### 3. Update Backend CORS (1 minute)

1. Go back to your backend service in Render
2. Go to **"Environment"** tab
3. Find `FRONTEND_URL` variable
4. Update it to your frontend URL from Step 2
5. Click **"Save Changes"** (this will auto-redeploy)

### 4. Test Your App

1. Visit your frontend URL
2. Register a new account
3. Create a group
4. Add expenses
5. Check balances

## Important Notes

⚠️ **Free Tier**: Services spin down after 15 min inactivity. First request may take 30-60 seconds.

🔒 **Security**: 
- Never commit `.env` files
- Use strong JWT_SECRET (32+ characters)
- MongoDB Atlas: Whitelist IP `0.0.0.0/0` or Render's IP ranges

🌐 **MongoDB Atlas Setup**:
1. Go to Network Access → Add IP Address
2. Click "Allow Access from Anywhere" (0.0.0.0/0) for testing
3. Or add Render's IP ranges for production

## Troubleshooting

**Backend won't start?**
- Check logs in Render dashboard
- Verify MONGODB_URI is correct
- Ensure JWT_SECRET is set

**Frontend can't connect?**
- Verify VITE_API_URL includes `/api` at the end
- Check backend CORS includes frontend URL
- Check browser console for errors

**Database errors?**
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Check database user permissions

## Your URLs After Deployment

- **Backend**: `https://splitmint-backend.onrender.com`
- **Frontend**: `https://splitmint-frontend.onrender.com`
- **API Health Check**: `https://splitmint-backend.onrender.com/api/health`

## Next Steps

- Add custom domain (optional)
- Set up monitoring
- Configure auto-deploy from GitHub
- Upgrade to paid plan for better performance
