# QUICKSTART.md - Get MournBit Running in 5 Minutes

## 🚀 Super Quick Start (Vanilla JS + Cloudflare)

### 1. Create Cloudflare Account
- Go to https://dash.cloudflare.com
- Sign up (free tier works!)
- Verify email

### 2. Install Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

### 3. Create D1 Database
```bash
wrangler d1 create mournbit
```
Save the `database_id` from the output.

### 4. Update wrangler.toml
Find this section:
```toml
[[d1_databases]]
binding = "DB"
database_name = "mournbit"
database_id = "PASTE_ID_HERE"  # Paste the ID from step 3
```

### 5. Initialize Database
```bash
wrangler d1 execute mournbit --file db-schema.sql --local
```

### 6. Run Locally
```bash
wrangler dev --local
```

Open browser to `http://localhost:8787` ✅

---

## 📱 Test It Immediately

### Create Marker Account
1. Click "Sign Up"
2. Select Role: **Marker**
3. Fill in details (use any email)
4. Create account → Redirected to Marker Dashboard

### Create Ticket
1. Click "+ Create Ticket"
2. Upload any image as "garbage photo"
3. Click "Get Current Location" (uses your browser location)
4. Select severity (Low/Medium/High)
5. Click "Create Ticket" ✅

### Create Volunteer Account
1. Logout (top right)
2. Click "Sign Up" again
3. Select Role: **Volunteer**
4. Fill in details (different email)
5. Create account → Redirected to Volunteer Dashboard

### Claim Ticket
1. You should see the ticket you just created
2. Click "Claim" button ✅
3. Now on "My Claimed Tickets"

### Complete Cleanup
1. Click "Mark Complete"
2. Upload another image as "cleared photo"
3. Click "Confirm Clearance" ✅

### Create Authority Account
1. Logout
2. Sign Up with **Authority** role
3. **Important**: Use email like `name@vdnry.com` (must be from authorized domain)
4. Verify account
5. Go to Authority Dashboard
6. Review pending tickets
7. Click "Verify Clearance" to complete flow ✅

---

## 🎯 Core Features Working

- ✅ Three separate dashboards (Marker/Volunteer/Authority)
- ✅ Account creation with JWT tokens
- ✅ Real-time heat map with ticket density
- ✅ Location-based filtering
- ✅ Photo upload and preview
- ✅ Ticket status tracking (Unclaimed → In Progress → Cleared)
- ✅ Time countdown (3-day volunteer limit)
- ✅ Domain validation (Authority must be @vdnry.com)

---

## 🌍 Deploy to Production

### Deploy Worker (5 seconds)
```bash
wrangler publish
```
Output: `https://mournbit.your-account.workers.dev`

### Deploy Frontend (5 more seconds)
```bash
wrangler pages publish . --project-name mournbit
```
Output: `https://mournbit.pages.dev`

**Your app is live!** 🎉

---

## 🔧 What's Included

| File | Purpose |
|------|---------|
| `index.html` | Landing page + auth forms + 3 dashboards |
| `styles.css` | Dark theme, responsive, animations |
| `script.js` | Complete frontend logic (2000+ lines) |
| `src/index.js` | Cloudflare Workers API endpoints |
| `db-schema.sql` | Database schema with indices |
| `wrangler.toml` | Cloudflare configuration |

---

## 🐛 Troubleshooting

### Can't Login?
- Clear browser cache (Cmd+Shift+R or Ctrl+Shift+F5)
- Check email/password match signup

### Photos not showing?
- Photos stored as base64 data URLs (fine for MVP)
- For production, upgrade to Cloudflare R2

### Location not working?
- Allow location permission in browser
- Falls back to New York if denied

### Database error?
- Verify `database_id` in `wrangler.toml`
- Run: `wrangler d1 execute mournbit --file db-schema.sql --local`

---

## 📝 API Endpoints (Test with cURL)

```bash
# Signup
curl -X POST http://localhost:8787/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"role":"marker","username":"test","full_name":"Test User","email":"test@ex.com","password":"hashedpass"}'

# Login
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ex.com","password":"hashedpass"}'

# Get Tickets
curl http://localhost:8787/tickets

# Create Ticket
curl -X POST http://localhost:8787/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude":40.7128,"longitude":-74.0060,"severity":"High","marker_photo_url":"data:image/..."}'
```

---

## 🎨 Customize the Theme

Edit `styles.css`:
```css
:root {
    --primary: #6b5ce7;              /* Main brand color */
    --accent: #f39c12;               /* Highlights */
    --dark-bg: #0a0b0e;              /* Main background */
    --text-primary: #e0e0e0;         /* Text color */
}
```

---

## 📊 What Happens Behind The Scenes

1. **You sign up** → Account created in D1 database with encrypted password
2. **You create ticket** → Inserted as `Unclaimed` status with your coordinates
3. **Volunteer claims** → Status changes to `In Progress`, claimed_by updated
4. **You complete cleanup** → Photo uploaded, status stays `In Progress`
5. **Authority verifies** → Status changes to `Cleared`, ticket no longer shown

---

## 🚀 Next Steps for Production

1. Change `JWT_SECRET` in `wrangler.toml`
2. Enable Cloudflare R2 for photo storage (not data URLs)
3. Add email notifications
4. Setup WebSocket for real-time updates
5. Add rate limiting
6. Setup monitoring/logging

---

## 📚 Full Documentation

- See `README.md` for complete feature list
- See `DEPLOYMENT.md` for production setup
- See `db-schema.sql` for database structure

---

## 💡 Pro Tips

- Heat map updates every 30 seconds automatically
- Nearby tickets shown within 50 km radius
- Volunteers see only tickets within 10 km
- Authority must use @vdnry.com email (change in `wrangler.toml`)

---

**That's it! You now have a fully functional garbage dump tracking system! 🎉**

Next: Read `DEPLOYMENT.md` for production deployment steps.
