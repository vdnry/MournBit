// MournBit Cloudflare Workers Backend
// API endpoints for handling authentication, tickets, and user operations

// ==================== CONSTANTS ====================
const AUTHORIZED_DOMAINS = ['vdnry.com'];
const JWT_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

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
                INSERT INTO volunteers (id, username, full_name, email, password_hash, tickets_claimed, tickets_closed, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)
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
            INSERT INTO tickets (id, generated_by, status, severity, latitude, longitude, marker_photo_url, ticket_generation_time, created_at, updated_at)
            VALUES (?, ?, 'Unclaimed', ?, ?, ?, ?, ?, ?, ?)
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
        
        return id;
    }

    async getTickets(filters = {}) {
        let query = 'SELECT * FROM tickets WHERE status != "Cleared"';
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
        
        query += ' ORDER BY created_at DESC';
        
        const result = await this.db.prepare(query).bind(...params).all();
        return result.results || [];
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
        let query, result;
        
        if (role === 'marker') {
            result = await this.db.prepare('SELECT tickets_generated, tickets_approved, tickets_cleared FROM markers WHERE id = ?').bind(userId).first();
            return {
                tickets_generated: result?.tickets_generated || 0,
                tickets_approved: result?.tickets_approved || 0,
                tickets_cleared: result?.tickets_cleared || 0
            };
        } else if (role === 'volunteer') {
            result = await this.db.prepare('SELECT tickets_claimed, tickets_closed FROM volunteers WHERE id = ?').bind(userId).first();
            return {
                tickets_claimed: result?.tickets_claimed || 0,
                tickets_closed: result?.tickets_closed || 0
            };
        } else if (role === 'authority') {
            result = await this.db.prepare('SELECT tickets_approved FROM authority WHERE id = ?').bind(userId).first();
            return {
                tickets_approved: result?.tickets_approved || 0
            };
        }
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
            claimed_by: url.searchParams.get('claimed_by')
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

        if (!volunteer_photo_url) {
            return errorResponse('Missing volunteer photo');
        }

        const db = new Database(env.DB);
        await db.updateTicket(ticketId, {
            status: 'In Progress', // Will be marked as Cleared after authority verification
            volunteer_photo_url
        });

        return successResponse({ status: 'submitted_for_clearance' });
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

            // User routes
            if (pathname === '/users/stats' && request.method === 'GET') {
                return handleGetUserStats(request, env);
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
