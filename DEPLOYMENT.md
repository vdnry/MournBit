# MournBit Deployment Guide

## Quick Start (5 minutes)

### Step 1: Clone and Install
```bash
cd MournBit
npm install
```

### Step 2: Setup Cloudflare
```bash
# Authenticate with Cloudflare
wrangler login

# Create D1 Database
wrangler d1 create mournbit

# Copy the database_id to wrangler.toml
```

### Step 3: Initialize Database
```bash
# Create tables locally
wrangler d1 execute mournbit --file db-schema.sql --local
```

### Step 4: Run Locally
```bash
npm run dev
```
Open `http://localhost:8787` in your browser.

---

## Full Production Deployment

### Prerequisites
- Node.js 16+
- npm or yarn
- Cloudflare account (free tier works)
- Git (optional)

### Step 1: Setup Cloudflare Project

```bash
# Install wrangler globally
npm install -g wrangler

# Authenticate
wrangler login

# Create D1 database
wrangler d1 create mournbit
```

You'll see output like:
```
✓ Successfully created D1 database 'mournbit'
Binding is available as 'DB' in your code.
Database ID: 12345678-abcd-efgh-ijkl-mnopqrstuvwx
```

### Step 2: Configure wrangler.toml

Update `wrangler.toml`:

```toml
name = "mournbit"
main = "src/index.js"
compatibility_date = "2024-01-15"

[[d1_databases]]
binding = "DB"
database_name = "mournbit"
database_id = "12345678-abcd-efgh-ijkl-mnopqrstuvwx"  # <-- Paste ID here
preview_database_id = "12345678-abcd-efgh-ijkl-mnopqrstuvwx"

[env.production]
vars = { 
    ENVIRONMENT = "production", 
    JWT_SECRET = "your-secret-key-change-this",
    AUTHORIZED_DOMAINS = "vdnry.com"
}

[build]
command = ""
cwd = "./"
watch_paths = ["src/**/*.js"]

compatibility_flags = ["nodejs_compat"]
```

### Step 3: Initialize Database

```bash
# Create tables
wrangler d1 execute mournbit --file db-schema.sql --local

# Deploy schema to production (after initial deploy)
wrangler d1 execute mournbit --file db-schema.sql --remote
```

### Step 4: Deploy Worker

```bash
# Test locally first
wrangler dev --local

# When ready, deploy to production
wrangler publish

# Get your worker URL from the output
# https://mournbit.your-account.workers.dev
```

### Step 5: Update Frontend Configuration

In `script.js`, update:

```javascript
const API_BASE_URL = 'https://mournbit.your-account.workers.dev';
const WS_URL = 'wss://mournbit.your-account.workers.dev/ws';
```

### Step 6: Deploy Frontend

#### Option A: Cloudflare Pages (Recommended)

```bash
# Deploy directly to Pages
wrangler pages publish . --project-name mournbit

# Or drag and drop folder in Cloudflare Pages dashboard
# https://dash.cloudflare.com → Pages → Create project
```

#### Option B: GitHub Pages

```bash
# Push to GitHub
git add .
git commit -m "Deploy MournBit"
git push origin main

# Enable Page in repository settings
# → Settings → Pages → Source: main branch
```

#### Option C: Vercel/Netlify

```bash
# Vercel
vercel

# Netlify
netlify deploy --prod --dir=.
```

#### Option D: Any Static Host

Just upload these files:
- `index.html`
- `styles.css`
- `script.js`

---

## Environment Variables

Create `.env.local`:

```env
ENVIRONMENT=production
JWT_SECRET=your_super_secret_change_this
AUTHORIZED_DOMAINS=vdnry.com
```

**Important**: In production, use Cloudflare Secrets:

```bash
# Set secret
echo "your_secret_value" | wrangler secret put JWT_SECRET

# Verify
wrangler secret list
```

---

## Testing the Deployment

### Create Test Account
1. Go to your deployed app URL
2. Click "Sign Up"
3. Select role: "Marker"
4. Fill in details (use dev email)
5. Create account

### Test Marker Flow
1. Login with marker account
2. Click "+ Create Ticket"
3. Upload a photo
4. Get location
5. Select severity
6. Submit

### Test Volunteer Flow
1. Create new volunteer account
2. Login as volunteer
3. View available tickets
4. Claim a ticket
5. Complete cleanup (upload photo)

### Test Authority Flow
1. Create new authority account (use vdnry.com email)
2. Login
3. Verify pending tickets
4. Approve tickets

---

## Monitoring & Debugging

### View Worker Logs

```bash
# Real-time logs
wrangler tail

# With filters
wrangler tail --format pretty
```

### Check Database

```bash
# List all databases
wrangler d1 list

# Query data
wrangler d1 query mournbit "SELECT COUNT(*) FROM tickets"
```

### Test API Endpoints

```bash
# Signup
curl -X POST https://mournbit.workers.dev/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "role": "marker",
    "username": "testuser",
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "hashed_password"
  }'

# Get tickets
curl https://mournbit.workers.dev/tickets \
  -H "Authorization: Bearer TOKEN_HERE"
```

---

## Common Issues

### Issue: Database not found
**Solution**: Check `database_id` in `wrangler.toml` matches output from `wrangler d1 create`

### Issue: CORS errors
**Solution**: Ensure `API_BASE_URL` in `script.js` matches deployed worker URL

### Issue: Location permission denied
**Solution**: App fallback to default location (New York). Allow location access in browser settings.

### Issue: Photos not saving
**Solution**: For MVP, photos stored as data URLs. For production, setup Cloudflare R2:

```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "mournbit-photos"

[env.production]
r2_buckets = [
  { binding = "BUCKET", bucket_name = "mournbit-photos" }
]
```

### Issue: JWT token expired
**Solution**: Token automatically refreshes on next login. Clear browser cache if needed.

---

## Performance Optimization

### Enable Caching

```toml
# In wrangler.toml
routes = [
  { pattern = "*.js", zone_name = "example.com" },
  { pattern = "*.css", zone_name = "example.com" }
]
```

### Setup CDN

Automatic with Cloudflare Pages/Workers. All static assets cached.

### Database Indexes

Already included in `db-schema.sql` for:
- `markers.email`, `markers.username`
- `volunteers.email`, `volunteers.username`
- `tickets.status`, `tickets.coordinates`

### Reduce Payload Size

All API responses use JSON compression via Brotli (automatic with Cloudflare).

---

## Security Checklist

- [ ] Change `JWT_SECRET` to random 32+ char string
- [ ] Use `wrangler secret put` for secrets
- [ ] Enable HTTPS (automatic with Cloudflare)
- [ ] Test authority domain validation
- [ ] Test CORS policies
- [ ] Validate all inputs server-side
- [ ] Use environment-specific configs

---

## Maintenance

### Weekly
- Monitor error rates in Cloudflare Analytics
- Check database performance

### Monthly
- Review logs for suspicious activity
- Update npm dependencies

### Quarterly
- Database backup verification
- Security audit
- Performance optimization

---

## Scaling Considerations

For high traffic (>10k concurrent users):

1. **Enable Durable Objects** for WebSocket support
2. **Setup R2** for photo storage instead of data URLs
3. **Add Cloudflare Cache Rules** for static assets
4. **Monitor D1 performance** - may need to optimize queries
5. **Setup Load Balancing** if expanding beyond single worker

---

## Support & Resources

- **Cloudflare Docs**: https://developers.cloudflare.com
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler
- **D1 Database**: https://developers.cloudflare.com/d1
- **Pages Deployment**: https://developers.cloudflare.com/pages

---

**Ready to deploy? Start with `npm run dev`! 🚀**
