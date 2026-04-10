# MournBit - Heroku Deployment Guide

## Prerequisites
- GitHub account & Git installed locally
- Heroku account (free tier available at heroku.com)
- Heroku CLI installed
- MongoDB Atlas account (free tier available at mongodb.com/cloud/atlas)

## Step 1: Set Up MongoDB Atlas (if not done)

1. Go to https://mongodb.com/cloud/atlas
2. Sign up/log in and create a new project
3. Create a cluster (M0 free tier is fine)
4. Create a database user (note username and password)
5. Whitelist your IPs (or use 0.0.0.0/0 for testing)
6. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/mournbit?retryWrites=true&w=majority`

## Step 2: Initialize Git Repository

```bash
cd c:\Users\vdnry\MournBit
git init
git add .
git commit -m "Initial commit - MournBit app with updated UI"
```

## Step 3: Create Heroku App

```bash
# Login to Heroku
heroku login

# Create a new app (replace "mournbit-app" with your desired name)
heroku create mournbit-app

# Verify app created
heroku apps
```

## Step 4: Set Environment Variables on Heroku

```bash
# Set your MongoDB connection string
heroku config:set MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/mournbit?retryWrites=true&w=majority"

# Set JWT secret (generate a strong random string)
heroku config:set JWT_SECRET="your-secret-key-here-use-something-long-and-random"

# Check environment variables
heroku config
```

## Step 5: Deploy to Heroku

```bash
# Deploy your app
git push heroku main
# or if using master branch:
git push heroku master

# View logs
heroku logs --tail
```

## Step 6: Verify Deployment

```bash
# Open your app
heroku open

# Check health endpoint
heroku open /api/health
```

## Step 7: Monitor & Troubleshoot

```bash
# View real-time logs
heroku logs --tail

# Scale dynos (if needed)
heroku ps:scale web=1

# Restart app
heroku restart

# Access app shell
heroku run bash
```

## Important Notes

⚠️ **Uploads Directory**: Heroku has ephemeral storage - files are deleted on dyno restart.
   - For production: Use AWS S3, Cloudinary, or similar
   - Temporary fix: Uploads will work but won't persist

✅ **Environment Variables Required**:
   - `MONGO_URI` - MongoDB connection string
   - `JWT_SECRET` - JWT signing secret
   - `PORT` - (automatically set by Heroku)

📝 **Custom Domain** (Optional):
```bash
heroku domains:add yourdomain.com
# Then update your DNS provider's CNAME records
```

## Troubleshooting

**Build failed?**
- Check `git push heroku main` output for errors
- Ensure all dependencies are in package.json

**App crashes?**
- Run `heroku logs --tail` to see error messages
- Check MongoDB connection string is correct
- Verify environment variables are set

**Can't connect to MongoDB?**
- Check IP whitelist in MongoDB Atlas
- Verify connection string format
- Test connection locally first

**Socket.io not working?**
- Heroku supports WebSockets
- Check CORS settings if issues occur
