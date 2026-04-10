# MournBit - Real-Time Garbage Dump Tracking App

A fully functional, real-time reactive web application for marking, volunteering to clean, and authorizing cleanup of garbage dumps. Built with Vanilla JavaScript frontend and Cloudflare Workers serverless backend.

## 📋 Features

### Three User Roles
- **Markers**: Report garbage dumps with photos and severity levels
- **Volunteers**: Claim tickets and complete cleanups within 3-day time limit
- **Authority**: Approve reports and verify cleanups (authorized domain emails only)

### Key Capabilities
- ✅ Real-time heat map showing garbage dump density (Low/Medium/High)
- ✅ Live ticket filtering by location and status
- ✅ Multi-day cleanup time tracking with countdown
- ✅ Photo uploads for both report and completion
- ✅ 10 km proximity filtering for volunteers
- ✅ JWT-based secure authentication with encrypted passwords
- ✅ Three distinct dashboards per user type
- ✅ WebSocket support for real-time updates (extensible)

### Dashboard Analytics
**Marker Dashboard**:
- Tickets generated, approved, cleared count
- Full ticket history with status tracking

**Volunteer Dashboard**:
- Tickets claimed and closed
- Nearby dumps within 10 km radius
- Time remaining countdown (3-day limit)

**Authority Dashboard**:
- Tickets approved
- Pending reviews queue
- Clearance verification queue

## 🏗️ Architecture

### Frontend (Vanilla JavaScript)
- **Entry Point**: `index.html` - Landing page with unauthenticated heat map
- **Styling**: `styles.css` - Dark mode, responsive design
- **Logic**: `script.js` - Complete app state, UI, and API integration

### Backend (Cloudflare Workers)
- **Worker**: `src/index.js` - REST API endpoints
- **Database**: Cloudflare D1 (SQLite)
- **Schema**: `db-schema.sql` - Tables for Users and Tickets

### Configuration
- `wrangler.toml` - Cloudflare Workers config with D1 binding

## 🚀 Deployment Guide

### Prerequisites
```bash
npm install -g wrangler
```

### 1. Setup Cloudflare D1 Database

```bash
# Create database
wrangler d1 create mournbit

# Initialize schema
wrangler d1 execute mournbit --file db-schema.sql --local

# In production
wrangler d1 execute mournbit --file db-schema.sql --remote
```

### 2. Update wrangler.toml
```toml
[[d1_databases]]
binding = "DB"
database_name = "mournbit"
database_id = "your-database-id"  # Get from `wrangler d1 create` output
```

### 3. Deploy Worker
```bash
# Local testing
wrangler dev

# Deploy to production
wrangler publish
```

### 4. Configure Frontend
Update `API_BASE_URL` and `WS_URL` in `script.js`:
```javascript
const API_BASE_URL = 'https://your-worker.workers.dev';
const WS_URL = 'wss://your-worker.workers.dev/ws';
```

### 5. Deploy Frontend
```bash
# Option A: Cloudflare Pages
wrangler pages publish . --project-name mournbit

# Option B: Any static host (GitHub Pages, Vercel, Netlify, etc.)
# Just upload the HTML, CSS, and JS files
```

## 📊 Database Schema

### Users Tables
- **markers**: id, username, full_name, email, password_hash, tickets_generated, tickets_approved, tickets_cleared
- **volunteers**: id, username, full_name, email, password_hash, tickets_claimed, tickets_closed
- **authority**: id, username, full_name, email, password_hash, tickets_approved

### Tickets Table
- id, generated_by, approved_by, claimed_by
- status (Unclaimed/In Progress/Cleared)
- severity (Low/Medium/High)
- latitude, longitude
- marker_photo_url, volunteer_photo_url
- ticket_generation_time, ticket_claim_time, ticket_cleared_time
- created_at, updated_at

## 🔐 Security Features

1. **Password Hashing**: SHA-256 (use bcryptjs for production)
2. **JWT Authentication**: 24-hour expiration
3. **Authorization Validation**: Authority role requires vdnry.com domain
4. **CORS Protection**: Configured endpoints only
5. **Input Validation**: All user inputs validated server-side

## 📱 API Endpoints

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login user

### Tickets
- `GET /tickets` - List tickets with filters
- `POST /tickets` - Create new ticket
- `POST /tickets/:id/claim` - Volunteer claims ticket
- `POST /tickets/:id/close` - Mark completed
- `POST /tickets/:id/approve` - Authority approves

### Users
- `GET /users/stats` - Get user dashboard stats

### Upload
- `POST /upload` - Upload photo (MVP: data URL storage)

## 🎨 UI/UX Features

- Dark theme with accent purple (#6b5ce7)
- Responsive grid layouts
- Smooth animations and transitions
- Toast notifications for user feedback
- Modal dialogs for ticket creation
- Real-time map visualization with Leaflet.js

## 📍 Location Services

- Geolocation API for current position
- Haversine formula for distance calculations
- Interactive map with heat layer visualization
- Fallback to default location if geolocation denied

## ⏰ Time Management

- 3-day volunteer cleanup deadline
- Countdown timer on dashboard
- Automatic deadline enforcement
- Timestamp tracking for all operations

## 🔄 Real-Time Updates

Currently uses 30-second polling for heat map and nearby tickets. To enable WebSocket:

1. Upgrade Cloudflare Workers plan (WebSocket support)
2. Implement Durable Objects in `src/index.js`
3. Update frontend to use WebSocket connection

## 🛠️ Local Development

```bash
# Start local Cloudflare development
wrangler dev

# Open browser
open http://localhost:8787

# Run with D1 database locally
wrangler dev --local
```

## 📝 Testing Accounts

### Testing Setup
1. Authority user: email@vdnry.com (only authorized domain)
2. Marker user: marker@example.com
3. Volunteer user: volunteer@example.com

### Testing Flow
1. Create marker account -> Create ticket with photo
2. Create volunteer account -> Claim ticket -> Upload completion photo
3. Create authority account -> Approve ticket -> Verify clearance

## 🔮 Future Enhancements

1. Real WebSocket implementation for live updates
2. Advanced location filtering (city, radius)
3. Notification system (email alerts)
4. Photo verification with ML (garbage-detection model)
5. Leaderboards and gamification
6. Admin dashboard for authority oversight
7. Mobile app (React Native)
8. Analytics dashboard
9. Two-factor authentication
10. File storage integration (Cloudflare R2)

## 🚨 Important Notes for Production

1. **Password Hashing**: Replace SHA-256 with bcryptjs:
   ```bash
   npm install bcryptjs --save
   ```

2. **Photo Storage**: Replace data URL with Cloudflare R2:
   ```javascript
   // In worker, use R2 bindings instead of returning data URLs
   ```

3. **Rate Limiting**: Add to wrangler.toml:
   ```toml
   rate_limiting = { key = "ip", requests_per_10_seconds = 100 }
   ```

4. **HTTPS Only**: Force HTTPS in production
5. **Environment Variables**: Use Cloudflare Secrets for JWT_SECRET
6. **Database Backups**: Enable D1 automated backups
7. **Monitoring**: Setup Cloudflare Analytics

## 📦 File Structure

```
MournBit/
├── index.html              # Landing page
├── styles.css             # Global styles
├── script.js              # Frontend app logic
├── db-schema.sql          # Database schema
├── wrangler.toml          # Cloudflare config
├── src/
│   └── index.js           # Worker API endpoints
└── README.md              # This file
```

## 🤝 Contributing

This is a hackathon project. For production use:
1. Add E2E tests
2. Setup CI/CD pipeline
3. Add error tracking (Sentry)
4. Implement monitoring
5. Add API rate limiting

## 📄 License

MIT License - Feel free to use for hackathons and personal projects.

---

**Built with 💚 for cleaner cities**
