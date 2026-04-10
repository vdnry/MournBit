# MournBit - Quick Deploy Commands

## Prerequisites Installation
```bash
# Install Heroku CLI (Windows)
# Download from: https://cli-assets.heroku.com/branches/stable/heroku-windows-x64.exe
# Or via Chocolatey:
choco install heroku-cli

# Verify installation
heroku --version
git --version
```

## One-Time Setup

```bash
# 1. Login to Heroku
heroku login

# 2. Create MongoDB Atlas cluster (free tier M0)
# Go to: https://mongodb.com/cloud/atlas
# Get connection string from cluster connect dialog

# 3. In your project directory, create Heroku app
cd c:\Users\vdnry\MournBit
heroku create mournbit-app

# 4. Set environment variables
heroku config:set MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/mournbit?retryWrites=true&w=majority"
heroku config:set JWT_SECRET="generate-a-random-string-here"

# 5. Verify config
heroku config
```

## Deploy (Repeat Each Time)

```bash
# Stage changes
git add .
git commit -m "Your message here"

# Deploy to Heroku
git push heroku main

# Watch deployment logs
heroku logs --tail

# Open your deployed app
heroku open
```

## Common Commands

```bash
# View all your Heroku apps
heroku apps

# Set/update environment variables
heroku config:set KEY=value

# View app logs
heroku logs --tail

# Restart app
heroku restart

# View connected remote
git remote -v

# Delete app (if needed)
heroku apps:destroy --app mournbit-app
```

## Useful Links
- Heroku Dashboard: https://dashboard.heroku.com/
- App URL: https://mournbit-app.herokuapp.com/
- MongoDB Atlas: https://cloud.mongodb.com/

## Notes
- First deployment takes 2-3 minutes
- Subsequent deployments take 30-60 seconds
- Free Heroku dyno sleeps after 30 mins of inactivity
- MongoDB Atlas free tier has 512MB storage limit
