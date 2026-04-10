# ⚡ START HERE - Production Deployment Right Now

## 3 Simple Steps to Go Live

### STEP 1: Install Heroku CLI (1 minute)
Download & run: https://cli-assets.heroku.com/branches/stable/heroku-windows-x64.exe

### STEP 2: Get MongoDB Connection String (5 minutes)
1. Go to https://mongodb.com/cloud/atlas
2. Sign up → Create Free Cluster
3. Click "Connect" → Copy connection string
4. It looks like: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/mournbit?retryWrites=true&w=majority`

### STEP 3: Run These Commands (5 minutes)

```powershell
cd c:\Users\vdnry\MournBit

# Login to Heroku
heroku login

# Create app
heroku create mournbit-app

# Paste your MongoDB string here (from step 2)
heroku config:set MONGO_URI="YOUR_MONGODB_STRING_HERE"

# Set JWT secret
heroku config:set JWT_SECRET="secret123"

# Deploy
git push heroku main

# Done! This opens your live app
heroku open
```

---

## That's It! 🎉

Your app will be live in 2-3 minutes at: **https://mournbit-app.herokuapp.com**

Need help? See:
- `PRODUCTION_CHECKLIST.md` - Detailed step-by-step
- `DEPLOYMENT.md` - Full documentation
- `DEPLOY_COMMANDS.md` - Command reference
