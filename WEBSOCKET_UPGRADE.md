// Optional: WebSocket Real-Time Support for MournBit
// This file shows how to upgrade from polling to WebSocket real-time updates
// Requires upgrading Cloudflare Workers plan to support Durable Objects

// ==================== CLOUDFLARE DURABLE OBJECTS ====================
// Add to wrangler.toml:
/*
[[durable_objects.bindings]]
name = "ROOM"
class_name = "ChatRoom"
script_name = "mournbit"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "mournbit-photos"
preview_bucket_name = "mournbit-photos-preview"
*/

// ==================== DURABLE OBJECT CLASS ====================
export class ChatRoom {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.clients = new Set();
    }

    async fetch(request) {
        if (request.headers.get('Upgrade') !== 'websocket') {
            return new Response('Not a WebSocket request', { status: 400 });
        }

        // Accept WebSocket connection
        const { 0: client, 1: server } = new WebSocketPair();
        this.handleClient(server);
        return new Response(null, { status: 101, webSocket: client });
    }

    async handleClient(server) {
        this.clients.add(server);

        server.accept();

        server.addEventListener('message', async (msg) => {
            try {
                const data = JSON.parse(msg.data);
                
                // Broadcast to all connected clients
                this.broadcast({
                    type: 'update',
                    data: data,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Message error:', error);
            }
        });

        server.addEventListener('close', () => {
            this.clients.delete(server);
        });

        server.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
            this.clients.delete(server);
        });
    }

    broadcast(message) {
        const msg = JSON.stringify(message);
        for (const client of this.clients) {
            try {
                client.send(msg);
            } catch (error) {
                this.clients.delete(client);
            }
        }
    }
}

// ==================== UPDATED WORKER ENDPOINT ====================
// In src/index.js, add WebSocket handler:

export async function handleWebSocket(request, env) {
    const durable_object_stub = env.ROOM.get('default');
    return durable_object_stub.fetch(request);
}

// Add to router:
/*
if (pathname === '/ws' && request.headers.get('Upgrade') === 'websocket') {
    return handleWebSocket(request, env);
}
*/

// ==================== FRONTEND WEBSOCKET CLIENT ====================
class RealtimeManager {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this.messageHandlers = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
    }

    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.wsUrl);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.reconnectAttempts = 0;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (error) {
                        console.error('WebSocket message error:', error);
                    }
                };

                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.attemptReconnect();
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    handleMessage(data) {
        const { type } = data;
        const handlers = this.messageHandlers[type];
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    on(type, handler) {
        if (!this.messageHandlers[type]) {
            this.messageHandlers[type] = [];
        }
        this.messageHandlers[type].push(handler);
    }

    off(type, handler) {
        if (this.messageHandlers[type]) {
            this.messageHandlers[type] = this.messageHandlers[type].filter(h => h !== handler);
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// ==================== USAGE IN FRONTEND ====================
// In script.js, replace polling with WebSocket:

const realtime = new RealtimeManager(WS_URL);

// Connect on init
async function initRealtime() {
    try {
        await realtime.connect();

        // Listen for ticket updates
        realtime.on('update', (data) => {
            if (data.type === 'ticket_created') {
                loadNearbyTickets();
                HeatMap.updateHeatMap();
            }
            if (data.type === 'ticket_claimed') {
                loadNearbyTickets();
            }
            if (data.type === 'ticket_cleared') {
                HeatMap.updateHeatMap();
                if (AppState.role === 'authority') {
                    Dashboard.loadDashboard('authority');
                }
            }
        });
    } catch (error) {
        console.warn('WebSocket unavailable, falling back to polling:', error);
        // Fallback to polling
    }
}

// Send updates through WebSocket
async function notifyRealtime(type, data) {
    if (realtime.ws && realtime.ws.readyState === WebSocket.OPEN) {
        realtime.send({ type, data });
    }
}

// Call after creating/updating tickets
realtime.on('ticket_created', (data) => {
    console.log('New ticket from another user:', data);
    HeatMap.updateHeatMap(); // Refresh map
});

// ==================== PRODUCTION UPGRADES ====================

/*
BEFORE WebSocket (Free Tier):
- Polling every 30 seconds
- ✓ Works fine for <100 users
- ✗ Higher latency (30 seconds delay)
- ✗ More API calls

AFTER WebSocket (Upgrade Needed):
- Real-time updates via Durable Objects
- ✓ <100ms latency
- ✓ Scales to 10k+ concurrent users
- ✓ Lower bandwidth (WebSocket compression)
- ✓ Better user experience

COST:
- Free tier: Polling approach (current)
- Workers Pro: $5/month + WebSocket support
- R2 storage: $0.015 per GB for photos
*/

// ==================== MIGRATION PATH ====================
/*
1. Current Setup (Polling - Works now):
   - 30 second refresh interval
   - Simple polling-based updates
   - Cost: $0/month

2. Next Phase (WebSocket - Upgrade to Pro):
   - Durable Objects for real-time
   - Live collaborative updates
   - Multiple rooms for different areas
   - Cost: $5+/month

3. Enhanced Phase (Full Real-time):
   - Photo storage on R2
   - Push notifications
   - Mobile app with WebSocket
   - Cost: $10+/month
*/

// ==================== DURABLE OBJECTS ROOM STRUCTURE ====================
/*
Each area can have its own room:
- /ws/area/manhattan
- /ws/area/brooklyn
- /ws/area/downtown

This keeps bandwidth low and allows regional filtering.
*/

export async function handleWebSocketWithArea(request, env, areaId) {
    const roomId = `area-${areaId}`;
    const durable_object_stub = env.ROOM.get(roomId);
    return durable_object_stub.fetch(request);
}

// ==================== EXAMPLE: REAL-TIME HEAT MAP ====================
// Replace the 30-second polling with WebSocket updates:

// POLLING (Current - in script.js)
/*
setInterval(async () => {
    if (document.getElementById('landingPage').classList.contains('active')) {
        loadNearbyTickets();
        HeatMap.updateHeatMap();  // <-- 30 second delay
    }
}, 30000);
*/

// WEBSOCKET (Future - instant updates)
/*
realtime.on('update', (data) => {
    if (data.type === 'ticket_created' || data.type === 'ticket_cleared') {
        HeatMap.updateHeatMap();  // <-- Instant
    }
});
*/

// ==================== MONITORING WEB SOCKET CONNECTIONS ====================
// In Durable Object:
let connectionCount = 0;

constructor(state, env) {
    this.state = state;
    this.env = env;
    this.clients = new Set();
    this.stats = {
        connectionsOpened: 0,
        connectionsClosed: 0,
        messagesHandled: 0
    };
}

async handleClient(server) {
    this.clients.add(server);
    this.stats.connectionsOpened++;
    connectionCount = this.clients.size;

    server.accept();

    server.addEventListener('message', async (msg) => {
        this.stats.messagesHandled++;
        // ... handle message
    });

    server.addEventListener('close', () => {
        this.clients.delete(server);
        this.stats.connectionsClosed++;
        connectionCount = this.clients.size;
    });
}

// Export stats endpoint
if (pathname === '/stats') {
    return successResponse(durable_object.stats);
}
