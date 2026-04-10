// MournBit Cloudflare Workers Backend
// API endpoints for handling authentication, tickets, leaderboard, and analytics

// ==================== CONSTANTS ====================
const AUTHORIZED_DOMAINS = ['vdnry.com'];
const JWT_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

// Scoring constants
const SEVERITY_POINTS = { 'Low': 10, 'Medium': 25, 'High': 50 };
const FAST_CLEANUP_BONUS = 5;
const FAST_CLEANUP_THRESHOLD_MINUTES = 120; // 2 hours
const TRUST_SCORE_CLEANUP = 3;
const TRUST_SCORE_VERIFICATION = 1;
const TRUST_SCORE_ABANDON = -10;
const TRUST_SCORE_MAX = 100;
const TRUST_SCORE_MIN = 0;

// Badge definitions
const BADGE_DEFINITIONS = [
    { id: 'first_cleanup', name: 'First Cleanup', condition: (stats) => stats.tickets_closed >= 1 },
    { id: 'five_cleanups', name: '5 Cleanups', condition: (stats) => stats.tickets_closed >= 5 },
    { id: 'ten_cleanups', name: '10 Cleanups', condition: (stats) => stats.tickets_closed >= 10 },
    { id: 'century_club', name: '100 Points Club', condition: (stats) => stats.total_score >= 100 },
    { id: 'high_trust', name: 'Trusted Volunteer', condition: (stats) => stats.trust_score >= 80 },
];

// ==================== UTILITIES ====================
async function generateJWT(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Date.now();
    const exp = now + JWT_EXPIRATION;
    
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify({ ...payload, iat: now, exp }));
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    return `${data}.${encodedSignature}`;
}

async function verifyJWT(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );
    
    const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(data));
    
    if (!isValid) throw new Error('Invalid signature');
    
    const payload = JSON.parse(atob(encodedPayload));
    if (payload.exp < Date.now()) throw new Error('Token expired');
    
    return payload;
}

function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== ERROR HANDLING ====================
function errorResponse(message, status = 400) {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: CORS_HEADERS
    });
}

function successResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: CORS_HEADERS
    });
}

async function getAuth(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Missing authorization header');
    }
    
    const token = authHeader.slice(7);
    const payload = await verifyJWT(token, env.JWT_SECRET);
    return payload;
}

// ==================== DATABASE OPERATIONS ====================
class Database {
    constructor(db) {
        this.db = db;
    }

    async createUser(role, userData) {
        const id = generateId();
        const now = new Date().toISOString();
        
        if (role === 'marker') {
            await this.db.prepare(`
                INSERT INTO markers (id, username, full_name, email, password_hash, tickets_generated, tickets_approved, tickets_cleared, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
            `).bind(id, userData.username, userData.full_name, userData.email, userData.password, now, now).run();
        } else if (role === 'volunteer') {
            await this.db.prepare(`
                INSERT INTO volunteers (id, username, full_name, email, password_hash, tickets_claimed, tickets_closed, total_score, trust_score, badges, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, 0, 0, 50, '[]', ?, ?)
            `).bind(id, userData.username, userData.full_name, userData.email, userData.password, now, now).run();
        } else if (role === 'authority') {
            await this.db.prepare(`
                INSERT INTO authority (id, username, full_name, email, password_hash, tickets_approved, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?)
            `).bind(id, userData.username, userData.full_name, userData.email, userData.password, now, now).run();
        }
        
        return id;
    }

    async findUserByEmail(role, email) {
        let query;
        if (role === 'marker') {
            query = 'SELECT * FROM markers WHERE email = ?';
        } else if (role === 'volunteer') {
            query = 'SELECT * FROM volunteers WHERE email = ?';
        } else if (role === 'authority') {
            query = 'SELECT * FROM authority WHERE email = ?';
        }
        
        const result = await this.db.prepare(query).bind(email).first();
        return result;
    }

    async createTicket(ticketData) {
        const id = generateId();
        const now = new Date().toISOString();
        
        await this.db.prepare(`
            INSERT INTO tickets (id, generated_by, status, severity, latitude, longitude, marker_photo_url, ticket_generation_time, verification_count, created_at, updated_at)
            VALUES (?, ?, 'Unclaimed', ?, ?, ?, ?, ?, 0, ?, ?)
        `).bind(
            id,
            ticketData.generated_by,
            ticketData.severity,
            ticketData.latitude,
            ticketData.longitude,
            ticketData.marker_photo_url,
            now,
            now,
            now
        ).run();
        
        // Update marker stats
        await this.db.prepare('UPDATE markers SET tickets_generated = tickets_generated + 1, updated_at = ? WHERE id = ?')
            .bind(now, ticketData.generated_by).run();
        
        return id;
    }

    async getTickets(filters = {}) {
        let query = 'SELECT * FROM tickets WHERE 1=1';
        const params = [];
        
        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }
        
        if (filters.generated_by) {
            query += ' AND generated_by = ?';
            params.push(filters.generated_by);
        }
        
        if (filters.claimed_by) {
            query += ' AND claimed_by = ?';
            params.push(filters.claimed_by);
        }

        if (filters.include_cleared !== 'true') {
            query += ' AND status != "Cleared"';
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await this.db.prepare(query).bind(...params).all();
        return result.results || [];
    }

    async getTicketById(ticketId) {
        return await this.db.prepare('SELECT * FROM tickets WHERE id = ?').bind(ticketId).first();
    }

    async updateTicket(ticketId, updates) {
        const now = new Date().toISOString();
        const setClauses = [];
        const values = [];
        
        for (const [key, value] of Object.entries(updates)) {
            setClauses.push(`${key} = ?`);
            if (key === 'status') {
                values.push(value);
                if (value === 'In Progress' && !updates.ticket_claim_time) {
                    setClauses.push('ticket_claim_time = ?');
                    values.push(now);
                    setClauses.push('cleanup_started_at = ?');
                    values.push(now);
                } else if (value === 'Cleared' && !updates.ticket_cleared_time) {
                    setClauses.push('ticket_cleared_time = ?');
                    values.push(now);
                }
            } else {
                values.push(value);
            }
        }
        
        setClauses.push('updated_at = ?');
        values.push(now);
        values.push(ticketId);
        
        await this.db.prepare(`
            UPDATE tickets SET ${setClauses.join(', ')} WHERE id = ?
        `).bind(...values).run();
    }

    async getUserStats(role, userId) {
        if (role === 'marker') {
            const result = await this.db.prepare('SELECT tickets_generated, tickets_approved, tickets_cleared FROM markers WHERE id = ?').bind(userId).first();
            return {
                tickets_generated: result?.tickets_generated || 0,
                tickets_approved: result?.tickets_approved || 0,
                tickets_cleared: result?.tickets_cleared || 0
            };
        } else if (role === 'volunteer') {
            const result = await this.db.prepare('SELECT tickets_claimed, tickets_closed, total_score, trust_score, badges FROM volunteers WHERE id = ?').bind(userId).first();
            return {
                tickets_claimed: result?.tickets_claimed || 0,
                tickets_closed: result?.tickets_closed || 0,
                total_score: result?.total_score || 0,
                trust_score: result?.trust_score || 50,
                badges: result?.badges ? JSON.parse(result.badges) : []
            };
        } else if (role === 'authority') {
            const result = await this.db.prepare('SELECT tickets_approved FROM authority WHERE id = ?').bind(userId).first();
            return {
                tickets_approved: result?.tickets_approved || 0
            };
        }
    }

    // Leaderboard
    async getLeaderboard(limit = 10) {
        const result = await this.db.prepare(`
            SELECT id, username, full_name, tickets_closed, total_score, trust_score, badges
            FROM volunteers
            ORDER BY total_score DESC, tickets_closed DESC
            LIMIT ?
        `).bind(limit).all();
        
        return (result.results || []).map((row, index) => ({
            rank: index + 1,
            id: row.id,
            username: row.username,
            full_name: row.full_name,
            total_cleanups: row.tickets_closed,
            total_score: row.total_score,
            trust_score: row.trust_score,
            badges: row.badges ? JSON.parse(row.badges) : []
        }));
    }

    async getVolunteerRank(userId) {
        const user = await this.db.prepare('SELECT total_score FROM volunteers WHERE id = ?').bind(userId).first();
        if (!user) return null;
        
        const rank = await this.db.prepare('SELECT COUNT(*) as rank FROM volunteers WHERE total_score > ?').bind(user.total_score).first();
        return (rank?.rank || 0) + 1;
    }

    // Score and badge management
    async awardPoints(volunteerId, points, ticket) {
        const now = new Date().toISOString();
        
        // Calculate cleanup duration in minutes
        let durationMinutes = null;
        let bonusPoints = 0;
        if (ticket.cleanup_started_at) {
            const started = new Date(ticket.cleanup_started_at);
            const finished = new Date(now);
            durationMinutes = Math.round((finished - started) / (1000 * 60));
            
            if (durationMinutes <= FAST_CLEANUP_THRESHOLD_MINUTES) {
                bonusPoints = FAST_CLEANUP_BONUS;
            }
        }
        
        const totalPoints = points + bonusPoints;
        
        // Update volunteer score + close count
        await this.db.prepare(`
            UPDATE volunteers SET 
                total_score = total_score + ?, 
                tickets_closed = tickets_closed + 1,
                trust_score = MIN(?, trust_score + ?),
                updated_at = ?
            WHERE id = ?
        `).bind(totalPoints, TRUST_SCORE_MAX, TRUST_SCORE_CLEANUP, now, volunteerId).run();
        
        // Update cleanup duration on ticket
        if (durationMinutes !== null) {
            await this.db.prepare('UPDATE tickets SET cleanup_duration_minutes = ? WHERE id = ?')
                .bind(durationMinutes, ticket.id).run();
        }
        
        // Check and award badges
        const stats = await this.getUserStats('volunteer', volunteerId);
        stats.total_score += totalPoints; // Include the points we just added
        stats.tickets_closed += 1;
        
        let hasFastCleanup = false;
        if (durationMinutes !== null && durationMinutes <= 60) {
            hasFastCleanup = true;
        }
        
        const currentBadges = stats.badges || [];
        const newBadges = [...currentBadges];
        
        for (const badge of BADGE_DEFINITIONS) {
            if (!newBadges.includes(badge.id) && badge.condition(stats)) {
                newBadges.push(badge.id);
            }
        }
        
        if (hasFastCleanup && !newBadges.includes('fast_cleaner')) {
            newBadges.push('fast_cleaner');
        }
        
        if (newBadges.length !== currentBadges.length) {
            await this.db.prepare('UPDATE volunteers SET badges = ? WHERE id = ?')
                .bind(JSON.stringify(newBadges), volunteerId).run();
        }
        
        return { totalPoints, bonusPoints, durationMinutes, newBadges };
    }

    // Analytics
    async getAnalytics() {
        const totalSpots = await this.db.prepare('SELECT COUNT(*) as count FROM tickets').first();
        const clearedSpots = await this.db.prepare('SELECT COUNT(*) as count FROM tickets WHERE status = "Cleared"').first();
        const activeSpots = await this.db.prepare('SELECT COUNT(*) as count FROM tickets WHERE status != "Cleared"').first();
        const topVolunteer = await this.db.prepare('SELECT full_name, total_score FROM volunteers ORDER BY total_score DESC LIMIT 1').first();
        const avgCleanup = await this.db.prepare('SELECT AVG(cleanup_duration_minutes) as avg_time FROM tickets WHERE cleanup_duration_minutes IS NOT NULL').first();
        const totalVolunteers = await this.db.prepare('SELECT COUNT(*) as count FROM volunteers').first();
        
        return {
            total_spots: totalSpots?.count || 0,
            cleared_spots: clearedSpots?.count || 0,
            active_spots: activeSpots?.count || 0,
            top_volunteer: topVolunteer?.full_name || 'N/A',
            top_score: topVolunteer?.total_score || 0,
            avg_cleanup_minutes: Math.round(avgCleanup?.avg_time || 0),
            total_volunteers: totalVolunteers?.count || 0
        };
    }

    // Hotspots — areas with multiple reports
    async getHotspots() {
        // Get all active tickets and cluster them
        const result = await this.db.prepare(`
            SELECT latitude, longitude, severity, COUNT(*) as report_count
            FROM tickets
            WHERE status != 'Cleared'
            GROUP BY ROUND(latitude, 2), ROUND(longitude, 2)
            HAVING report_count >= 2
            ORDER BY report_count DESC
        `).all();
        
        return (result.results || []).map(row => ({
            latitude: row.latitude,
            longitude: row.longitude,
            report_count: row.report_count,
            risk_level: row.report_count >= 5 ? 'Critical' : row.report_count >= 3 ? 'High' : 'Moderate'
        }));
    }

    // Increment verification count
    async verifyTicket(ticketId) {
        const now = new Date().toISOString();
        await this.db.prepare('UPDATE tickets SET verification_count = verification_count + 1, updated_at = ? WHERE id = ?')
            .bind(now, ticketId).run();
        
        const ticket = await this.getTicketById(ticketId);
        
        // If claimed by a volunteer, increase their trust score
        if (ticket?.claimed_by) {
            await this.db.prepare(`
                UPDATE volunteers SET trust_score = MIN(?, trust_score + ?), updated_at = ? WHERE id = ?
            `).bind(TRUST_SCORE_MAX, TRUST_SCORE_VERIFICATION, now, ticket.claimed_by).run();
        }
        
        return ticket?.verification_count || 0;
    }
}

// ==================== API HANDLERS ====================
async function handleAuthSignup(request, env) {
    const data = await request.json();
    const { role, username, full_name, email, password } = data;

    if (!role || !username || !full_name || !email || !password) {
        return errorResponse('Missing required fields');
    }

    // Validate authority domain
    if (role === 'authority') {
        const domain = email.split('@')[1];
        if (!AUTHORIZED_DOMAINS.includes(domain)) {
            return errorResponse('Authority users must use an authorized domain');
        }
    }

    try {
        const db = new Database(env.DB);
        
        // Check if user exists
        const existingUser = await db.findUserByEmail(role, email);
        if (existingUser) {
            return errorResponse('Email already registered', 409);
        }

        // Create user
        const userId = await db.createUser(role, {
            username,
            full_name,
            email,
            password
        });

        // Generate JWT
        const token = await generateJWT({ userId, role }, env.JWT_SECRET);

        return successResponse({
            user: { id: userId, username, full_name, email, role },
            token,
            role
        }, 201);
    } catch (error) {
        console.error('Signup error:', error);
        return errorResponse(error.message, 500);
    }
}

async function handleAuthLogin(request, env) {
    const data = await request.json();
    const { email, password } = data;

    if (!email || !password) {
        return errorResponse('Missing email or password');
    }

    try {
        const db = new Database(env.DB);
        
        // Try all roles
        const roles = ['marker', 'volunteer', 'authority'];
        for (const role of roles) {
            const user = await db.findUserByEmail(role, email);
            if (user && user.password_hash === password) {
                const token = await generateJWT({ userId: user.id, role }, env.JWT_SECRET);
                return successResponse({
                    user: { id: user.id, username: user.username, full_name: user.full_name, email: user.email, role },
                    token,
                    role
                });
            }
        }

        return errorResponse('Invalid email or password', 401);
    } catch (error) {
        console.error('Login error:', error);
        return errorResponse(error.message, 500);
    }
}

async function handleCreateTicket(request, env) {
    try {
        const auth = await getAuth(request, env);
        if (auth.role !== 'marker') {
            return errorResponse('Only markers can create tickets', 403);
        }

        const data = await request.json();
        const { latitude, longitude, severity, marker_photo_url } = data;

        if (!latitude || !longitude || !severity || !marker_photo_url) {
            return errorResponse('Missing required fields');
        }

        const db = new Database(env.DB);
        const ticketId = await db.createTicket({
            generated_by: auth.userId,
            severity,
            latitude,
            longitude,
            marker_photo_url
        });

        return successResponse({ id: ticketId, status: 'created' }, 201);
    } catch (error) {
        console.error('Create ticket error:', error);
        return errorResponse(error.message, 500);
    }
}

async function handleGetTickets(request, env) {
    try {
        const url = new URL(request.url);
        const filters = {
            status: url.searchParams.get('status'),
            generated_by: url.searchParams.get('generated_by'),
            claimed_by: url.searchParams.get('claimed_by'),
            include_cleared: url.searchParams.get('include_cleared')
        };

        Object.keys(filters).forEach(key => !filters[key] && delete filters[key]);

        const db = new Database(env.DB);
        const tickets = await db.getTickets(filters);

        return successResponse({ tickets });
    } catch (error) {
        console.error('Get tickets error:', error);
        return errorResponse(error.message, 500);
    }
}

async function handleClaimTicket(request, env, ticketId) {
    try {
        const auth = await getAuth(request, env);
        if (auth.role !== 'volunteer') {
            return errorResponse('Only volunteers can claim tickets', 403);
        }

        const db = new Database(env.DB);
        await db.updateTicket(ticketId, {
            status: 'In Progress',
            claimed_by: auth.userId
        });

        // Update volunteer claimed count
        const now = new Date().toISOString();
        await db.db.prepare('UPDATE volunteers SET tickets_claimed = tickets_claimed + 1, updated_at = ? WHERE id = ?')
            .bind(now, auth.userId).run();

        return successResponse({ status: 'claimed' });
    } catch (error) {
        console.error('Claim ticket error:', error);
        return errorResponse(error.message, 500);
    }
}

async function handleCloseTicket(request, env, ticketId) {
    try {
        const auth = await getAuth(request, env);
        if (auth.role !== 'volunteer') {
            return errorResponse('Only volunteers can close tickets', 403);
        }

        const data = await request.json();
        const { volunteer_photo_url } = data;

        // STRICT: No photo = cannot mark as cleaned
        if (!volunteer_photo_url) {
            // Set status to Pending Proof
            const db = new Database(env.DB);
            await db.updateTicket(ticketId, {
                status: 'Pending Proof'
            });
            return errorResponse('Photo proof is required to mark as cleaned. Status set to Pending Proof.', 422);
        }

        const db = new Database(env.DB);
        const ticket = await db.getTicketById(ticketId);
        
        if (!ticket) {
            return errorResponse('Ticket not found', 404);
        }

        // Calculate and award points
        const points = SEVERITY_POINTS[ticket.severity] || 10;
        const result = await db.awardPoints(auth.userId, points, ticket);

        // Update ticket status
        await db.updateTicket(ticketId, {
            status: 'Cleared',
            volunteer_photo_url
        });

        return successResponse({ 
            status: 'cleared',
            points_earned: result.totalPoints,
            bonus_points: result.bonusPoints,
            cleanup_duration_minutes: result.durationMinutes,
            new_badges: result.newBadges
        });
    } catch (error) {
        console.error('Close ticket error:', error);
        return errorResponse(error.message, 500);
    }
}

async function handleApproveTicket(request, env, ticketId) {
    try {
        const auth = await getAuth(request, env);
        if (auth.role !== 'authority') {
            return errorResponse('Only authority can approve tickets', 403);
        }

        const db = new Database(env.DB);
        await db.updateTicket(ticketId, {
            approved_by: auth.userId,
            status: 'Unclaimed'
        });

        const now = new Date().toISOString();
        await db.db.prepare('UPDATE authority SET tickets_approved = tickets_approved + 1, updated_at = ? WHERE id = ?')
            .bind(now, auth.userId).run();

        return successResponse({ status: 'approved' });
    } catch (error) {
        console.error('Approve ticket error:', error);
        return errorResponse(error.message, 500);
    }
}

async function handleGetUserStats(request, env) {
    try {
        const auth = await getAuth(request, env);
        const db = new Database(env.DB);
        const stats = await db.getUserStats(auth.role, auth.userId);

        return successResponse(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        return errorResponse(error.message, 500);
    }
}

async function handleGetLeaderboard(request, env) {
    try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        const db = new Database(env.DB);
        const leaderboard = await db.getLeaderboard(limit);

        return successResponse({ leaderboard });
    } catch (error) {
        console.error('Leaderboard error:', error);
        return errorResponse(error.message, 500);
    }
}

async function handleGetMyRank(request, env) {
    try {
        const auth = await getAuth(request, env);
        if (auth.role !== 'volunteer') {
            return errorResponse('Only volunteers have leaderboard rank', 403);
        }

        const db = new Database(env.DB);
        const rank = await db.getVolunteerRank(auth.userId);
        const stats = await db.getUserStats('volunteer', auth.userId);

        return successResponse({ rank, ...stats });
    } catch (error) {
        console.error('My rank error:', error);
        return errorResponse(error.message, 500);
    }
}

async function handleGetAnalytics(request, env) {
    try {
        const db = new Database(env.DB);
        const analytics = await db.getAnalytics();
        return successResponse(analytics);
    } catch (error) {
        console.error('Analytics error:', error);
        return errorResponse(error.message, 500);
    }
}

async function handleGetHotspots(request, env) {
    try {
        const db = new Database(env.DB);
        const hotspots = await db.getHotspots();
        return successResponse({ hotspots });
    } catch (error) {
        console.error('Hotspots error:', error);
        return errorResponse(error.message, 500);
    }
}

async function handleVerifyTicket(request, env, ticketId) {
    try {
        const db = new Database(env.DB);
        const count = await db.verifyTicket(ticketId);
        return successResponse({ verification_count: count });
    } catch (error) {
        console.error('Verify error:', error);
        return errorResponse(error.message, 500);
    }
}

async function handleUpload(request, env) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return errorResponse('No file provided');
        }

        // For MVP: Store as data URL (in production, use R2 or similar)
        const buffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const dataUrl = `data:${file.type};base64,${base64}`;

        return successResponse({ url: dataUrl });
    } catch (error) {
        console.error('Upload error:', error);
        return errorResponse(error.message, 500);
    }
}

// ==================== ROUTER ====================
export default {
    async fetch(request, env) {
        // CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: CORS_HEADERS });
        }

        const url = new URL(request.url);
        const pathname = url.pathname;

        try {
            // Auth routes
            if (pathname === '/auth/signup' && request.method === 'POST') {
                return handleAuthSignup(request, env);
            }
            if (pathname === '/auth/login' && request.method === 'POST') {
                return handleAuthLogin(request, env);
            }

            // Ticket routes
            if (pathname === '/tickets' && request.method === 'POST') {
                return handleCreateTicket(request, env);
            }
            if (pathname === '/tickets' && request.method === 'GET') {
                return handleGetTickets(request, env);
            }
            if (pathname.match(/^\/tickets\/(.+)\/claim$/) && request.method === 'POST') {
                const ticketId = pathname.split('/')[2];
                return handleClaimTicket(request, env, ticketId);
            }
            if (pathname.match(/^\/tickets\/(.+)\/close$/) && request.method === 'POST') {
                const ticketId = pathname.split('/')[2];
                return handleCloseTicket(request, env, ticketId);
            }
            if (pathname.match(/^\/tickets\/(.+)\/approve$/) && request.method === 'POST') {
                const ticketId = pathname.split('/')[2];
                return handleApproveTicket(request, env, ticketId);
            }
            if (pathname.match(/^\/tickets\/(.+)\/verify$/) && request.method === 'POST') {
                const ticketId = pathname.split('/')[2];
                return handleVerifyTicket(request, env, ticketId);
            }

            // User routes
            if (pathname === '/users/stats' && request.method === 'GET') {
                return handleGetUserStats(request, env);
            }

            // Leaderboard routes
            if (pathname === '/leaderboard' && request.method === 'GET') {
                return handleGetLeaderboard(request, env);
            }
            if (pathname === '/leaderboard/me' && request.method === 'GET') {
                return handleGetMyRank(request, env);
            }

            // Analytics route
            if (pathname === '/analytics' && request.method === 'GET') {
                return handleGetAnalytics(request, env);
            }

            // Hotspots route
            if (pathname === '/hotspots' && request.method === 'GET') {
                return handleGetHotspots(request, env);
            }

            // Upload route
            if (pathname === '/upload' && request.method === 'POST') {
                return handleUpload(request, env);
            }

            return errorResponse('Not found', 404);
        } catch (error) {
            console.error('Request error:', error);
            return errorResponse('Internal server error', 500);
        }
    }
};
