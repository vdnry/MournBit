# 🚀 MournBit Production Deployment Checklist

## Status: READY FOR DEPLOYMENT ✅

Your code is committed and pushed to GitHub. Follow these exact steps to deploy to production:

---

## **IMMEDIATE ACTION ITEMS**

### 1️⃣ Install Heroku CLI (2 minutes)
**Windows Only:**
- Download: https://cli-assets.heroku.com/branches/stable/heroku-windows-x64.exe
- Run installer
- Restart terminal/PowerShell

**Verify installation:**
```powershell
heroku --version
```

---

### 2️⃣ Create MongoDB Atlas Cloud Database (5 minutes)

**Steps:**
1. Go to https://mongodb.com/cloud/atlas
2. Click "Sign Up" (or login if you have account)
3. Create new project named "MournBit"
4. Click "Create Database" → Choose **M0 Free Tier**
5. Select region (pick closest to your users)
6. Wait for cluster to build
7. Click "Connect" 
8. Choose "Connect your application"
9. **COPY THE CONNECTION STRING** - looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
10. Replace `/?` with `/mournbit?` to specify database name

**Example:**
```
mongodb+srv://myuser:mypass@cluster0.abcde.mongodb.net/mournbit?retryWrites=true&w=majority
```

---

### 3️⃣ Deploy to Heroku (5 minutes)

**In PowerShell, run these commands:**

```powershell
# Navigate to project
cd c:\Users\vdnry\MournBit

# 1. Login to Heroku (will open browser)
heroku login

# 2. Create Heroku app
heroku create mournbit-app

# 3. SET ENVIRONMENT VARIABLES - CRITICAL!
# Replace the MongoDB URI with YOUR connection string from step 2
heroku config:set MONGO_URI="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mournbit?retryWrites=true&w=majority"

# 4. Set JWT secret (any random string)
heroku config:set JWT_SECRET="super-secret-key-change-this-in-production"

# 5. Verify variables
heroku config

# 6. Deploy your code
git push heroku main

# 7. Watch deployment
heroku logs --tail

# 8. Open your live app
heroku open
```

---

## **EXPECTED OUTPUT**

After `git push heroku main`, you should see:
```
remote: -----> Building on the Heroku-20 stack
remote: -----> Using buildpack: heroku/nodejs
remote: -----> Installing dependencies
...
remote: -----> Launching...
remote:        Released v3
remote:        https://mournbit-app.herokuapp.com/ deployed to Heroku
```

Your app will be live at: **https://mournbit-app.herokuapp.com**

---

## **POST-DEPLOYMENT VERIFICATION**

```powershell
# Check if app is running
heroku ps

# View live logs
heroku logs --tail

# Check health endpoint
heroku open /api/health

# If something goes wrong
heroku restart
heroku logs --tail
```

---

## **TROUBLESHOOTING**

**"MongoDB connection failed"**
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0)
- Restart app: `heroku restart`

**"App crashes on startup"**
- Check logs: `heroku logs --tail`
- Verify all env vars are set: `heroku config`
- Common issue: Missing MONGO_URI or invalid format

**"Socket.io not connecting"**
- This is normal, Heroku supports WebSockets
- Check browser console for errors

---

## **YOUR APP IS NOW IN PRODUCTION!**

### Next Steps:
1. ✅ Test all features on **https://mournbit-app.herokuapp.com**
2. ✅ Share link with team
3. ✅ Monitor logs: `heroku logs --tail`
4. ✅ Future deploys: Just `git push heroku main`

---

## **QUICK REFERENCE COMMANDS**

```powershell
# View app
heroku open

# View logs
heroku logs --tail

# Restart app
heroku restart

# Set environment variable
heroku config:set KEY=VALUE

# View all variables
heroku config

# Delete app (if needed)
heroku apps:destroy --app mournbit-app
```

---

**You're ready! Start with step 1 above.** 🎉
