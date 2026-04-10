# MournBit API Documentation

## Base URL
- Development: `http://localhost:8787`
- Production: `https://mournbit.your-account.workers.dev`

## Authentication
All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens obtained from `/auth/login` or `/auth/signup`, valid for 24 hours.

---

## Authentication Endpoints

### Sign Up
Create a new user account

**Endpoint**: `POST /auth/signup`

**Request Body**:
```json
{
  "role": "marker",
  "username": "john_doe",
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "sha256_hashed_password"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": "1704067200000_a1b2c3d4e",
    "username": "john_doe",
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "marker"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "marker"
}
```

**Roles**:
- `marker`: Report garbage dumps
- `volunteer`: Clean up dumps
- `authority`: Approve and verify (must use @vdnry.com email)

**Error Responses**:
- 400: Missing required fields
- 409: Email already registered
- 400: Authority users must use authorized domain

---

### Login
Authenticate existing user

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "sha256_hashed_password"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "1704067200000_a1b2c3d4e",
    "username": "john_doe",
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "marker"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "marker"
}
```

**Error Responses**:
- 400: Missing email or password
- 401: Invalid email or password

---

## Ticket Endpoints

### Create Ticket
Report a new garbage dump (Markers only)

**Endpoint**: `POST /tickets`

**Authentication**: Required (Marker role)

**Request Body**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "severity": "High",
  "marker_photo_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
}
```

**Response** (201 Created):
```json
{
  "id": "1704067200000_x1y2z3w4a",
  "status": "created"
}
```

**Field Details**:
- `latitude`: Number (decimal degrees, -90 to 90)
- `longitude`: Number (decimal degrees, -180 to 180)
- `severity`: String (Low, Medium, High)
- `marker_photo_url`: String (data URL or image URL)

**Error Responses**:
- 400: Missing required fields
- 403: Only markers can create tickets
- 401: Unauthorized

---

### Get Tickets
List tickets with optional filters

**Endpoint**: `GET /tickets`

**Authentication**: Optional (returns non-cleared tickets)

**Query Parameters**:
- `status`: String (Unclaimed, In Progress, Cleared) - optional
- `generated_by`: String (user ID) - optional
- `claimed_by`: String (user ID) - optional

**Examples**:
```
GET /tickets
GET /tickets?status=Unclaimed
GET /tickets?generated_by=1704067200000_a1b2c3d4e
GET /tickets?claimed_by=1704067200000_v1o2l3u4n&status=In%20Progress
```

**Response** (200 OK):
```json
{
  "tickets": [
    {
      "id": "1704067200000_t1i2c3k4e",
      "generated_by": "1704067200000_a1b2c3d4e",
      "approved_by": null,
      "claimed_by": null,
      "status": "Unclaimed",
      "severity": "High",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "marker_photo_url": "data:image/jpeg;base64/...",
      "volunteer_photo_url": null,
      "ticket_generation_time": "2024-01-01T12:00:00.000Z",
      "ticket_claim_time": null,
      "ticket_cleared_time": null,
      "created_at": "2024-01-01T12:00:00.000Z",
      "updated_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Note**: Cleared tickets are automatically excluded from results.

---

### Claim Ticket
Volunteer claims a ticket to clean up

**Endpoint**: `POST /tickets/:id/claim`

**Authentication**: Required (Volunteer role)

**URL Parameters**:
- `id`: String (ticket ID)

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "status": "claimed"
}
```

**Field Updates**:
- `status` → "In Progress"
- `claimed_by` → volunteer user ID
- `ticket_claim_time` → current timestamp

**Error Responses**:
- 403: Only volunteers can claim tickets
- 404: Ticket not found
- 400: Ticket already claimed

---

### Close Ticket
Volunteer submits completion (with photo)

**Endpoint**: `POST /tickets/:id/close`

**Authentication**: Required (Volunteer role)

**URL Parameters**:
- `id`: String (ticket ID)

**Request Body**:
```json
{
  "volunteer_photo_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
}
```

**Response** (200 OK):
```json
{
  "status": "submitted_for_clearance"
}
```

**Field Updates**:
- `volunteer_photo_url` → submitted photo URL
- Status remains "In Progress" (Authority must verify)

**Error Responses**:
- 403: Only volunteers can close tickets
- 400: Missing volunteer_photo_url
- 404: Ticket not found

---

### Approve Ticket
Authority approves a new ticket (before cleanup)

**Endpoint**: `POST /tickets/:id/approve`

**Authentication**: Required (Authority role)

**URL Parameters**:
- `id`: String (ticket ID)

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "status": "approved"
}
```

**Field Updates**:
- `approved_by` → authority user ID
- `status` → "Unclaimed" (now available for volunteers to claim)

**Error Responses**:
- 403: Only authority can approve tickets
- 404: Ticket not found

---

## User Endpoints

### Get User Stats
Get dashboard statistics for current user

**Endpoint**: `GET /users/stats`

**Authentication**: Required

**Response** (200 OK):

For Markers:
```json
{
  "tickets_generated": 5,
  "tickets_approved": 3,
  "tickets_cleared": 2
}
```

For Volunteers:
```json
{
  "tickets_claimed": 4,
  "tickets_closed": 3
}
```

For Authority:
```json
{
  "tickets_approved": 10
}
```

---

## Upload Endpoints

### Upload Photo
Upload a photo (marker report or volunteer completion)

**Endpoint**: `POST /upload`

**Authentication**: Optional

**Request Body**: FormData with file
```javascript
const formData = new FormData();
formData.append('file', fileInputElement.files[0]);
```

**Response** (200 OK):
```json
{
  "url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
}
```

**File Constraints**:
- Accepted: image/* (jpeg, png, gif, webp)
- Max size: 5MB (recommended)
- MVP: Stored as data URL (production: use R2)

**Error Responses**:
- 400: No file provided
- 413: File too large

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes
- 200: Success
- 201: Resource created
- 400: Bad request (invalid input)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 409: Conflict (e.g., email already registered)
- 500: Internal server error

---

## Frontend Integration Examples

### Login and Get Token
```javascript
const response = await API.login('john@example.com', 'sha256hash');
// token stored in localStorage
```

### Create Ticket as Marker
```javascript
const ticket = await API.createTicket({
  latitude: 40.7128,
  longitude: -74.0060,
  severity: 'High',
  marker_photo_url: base64DataUrl
});
```

### Claim Ticket as Volunteer
```javascript
await API.claimTicket(ticketId);
```

### Close Ticket as Volunteer
```javascript
await API.closeTicket(ticketId, completionPhotoUrl);
```

### Approve Ticket as Authority
```javascript
await API.approveTicket(ticketId);
```

### Get Nearby Unclaimed Tickets
```javascript
const tickets = await API.getTickets({ status: 'Unclaimed' });
const nearby = tickets.filter(t => 
  Utils.calculateDistance(...) <= 10 // 10 km radius
);
```

---

## Rate Limiting
Current: No rate limiting (add in production)

Recommended for production:
- Authentication: 10 requests/minute per IP
- Tickets creation: 5 requests/minute per user
- General: 100 requests/minute per user

---

## CORS Policy
Requests from any origin accepted (configured in CORS_HEADERS). For production, restrict to specific domains.

---

## WebSocket (Optional - Upgrade Required)
See WEBSOCKET_UPGRADE.md for real-time synchronization setup.

---

## API Response Time
- Development: <100ms (local)
- Production: <200ms (Cloudflare edge)
- Database queries: <50ms typical

---

## Testing with cURL

### Create Account
```bash
curl -X POST http://localhost:8787/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "role":"marker",
    "username":"testuser",
    "full_name":"Test User",
    "email":"test@example.com",
    "password":"dac9e97c6fb0f84eec4ed2a50c8c5b09ce0e26c7a44626bcf6d84c6cf50a7c8"
  }'
```

### Get Tickets
```bash
curl http://localhost:8787/tickets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Claim Ticket
```bash
curl -X POST http://localhost:8787/tickets/TICKET_ID/claim \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Changelog

### v1.0.0 (Current)
- ✅ Complete three-role system
- ✅ JWT authentication
- ✅ Ticket lifecycle management
- ✅ Photo uploads
- ✅ Location-based filtering
- ⏳ WebSocket (optional upgrade)

### Future Versions
- Real-time notifications
- Advanced search filters
- Analytics dashboard
- Mobile app API
- Video support for damage documentation
