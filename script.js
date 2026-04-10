// MournBit Frontend Application
// Complete reactive app with authentication, real-time updates, and multi-user dashboards

// ==================== CONFIGURATION ====================
const API_BASE_URL = 'https://api.mournbit.workers.dev';
const WS_URL = 'wss://api.mournbit.workers.dev/ws';
const DISTANCE_THRESHOLD_KM = 10;
const VOLUNTEER_TIME_LIMIT_DAYS = 3;

// ==================== STATE MANAGEMENT ====================
const AppState = {
    user: null,
    token: null,
    role: null, // 'marker', 'volunteer', 'authority', or null
    userLocation: null,
    tickets: [],
    map: null,
    heatmapInstance: null,
    wsConnection: null,
    
    setUser(userData, token, role) {
        this.user = userData;
        this.token = token;
        this.role = role;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
    },

    getUser() {
        return this.user || JSON.parse(localStorage.getItem('user') || 'null');
    },

    getToken() {
        return this.token || localStorage.getItem('token');
    },

    logout() {
        this.user = null;
        this.token = null;
        this.role = null;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
    },

    isAuthenticated() {
        return !!this.getToken();
    }
};

// ==================== UTILITIES ====================
class Utils {
    static async hashPassword(password) {
        // For production, use bcryptjs library
        // For now, using a simple hash (replace with proper bcryptjs)
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    static generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        });
                    },
                    error => {
                        // Fallback to default location
                        resolve({ latitude: 40.7128, longitude: -74.0060 });
                    }
                );
            } else {
                resolve({ latitude: 40.7128, longitude: -74.0060 });
            }
        });
    }

    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    static formatDate(dateString) {
        return new Date(dateString).toLocaleString();
    }

    static getTimeRemaining(claimTime) {
        const claimDate = new Date(claimTime);
        const deadlineDate = new Date(claimDate.getTime() + VOLUNTEER_TIME_LIMIT_DAYS * 24 * 60 * 60 * 1000);
        const now = new Date();
        const msRemaining = deadlineDate - now;
        const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
        return Math.max(0, daysRemaining);
    }
}

// ==================== API CALLS ====================
class API {
    static async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (AppState.getToken()) {
            headers['Authorization'] = `Bearer ${AppState.getToken()}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    }

    static async login(email, password) {
        const passwordHash = await Utils.hashPassword(password);
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password: passwordHash })
        });
    }

    static async signup(role, username, fullName, email, password) {
        const passwordHash = await Utils.hashPassword(password);
        
        // Validate authority domain
        if (role === 'authority') {
            const authorizedDomains = ['vdnry.com'];
            const domain = email.split('@')[1];
            if (!authorizedDomains.includes(domain)) {
                throw new Error('Authority users must use an authorized domain email');
            }
        }

        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({
                role,
                username,
                full_name: fullName,
                email,
                password: passwordHash
            })
        });
    }

    static async createTicket(ticket) {
        return this.request('/tickets', {
            method: 'POST',
            body: JSON.stringify(ticket)
        });
    }

    static async getTickets(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/tickets?${params.toString()}`);
    }

    static async updateTicket(ticketId, updates) {
        return this.request(`/tickets/${ticketId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    static async claimTicket(ticketId) {
        return this.request(`/tickets/${ticketId}/claim`, {
            method: 'POST'
        });
    }

    static async closeTicket(ticketId, photoUrl) {
        return this.request(`/tickets/${ticketId}/close`, {
            method: 'POST',
            body: JSON.stringify({ volunteer_photo_url: photoUrl })
        });
    }

    static async approveTicket(ticketId) {
        return this.request(`/tickets/${ticketId}/approve`, {
            method: 'POST'
        });
    }

    static async getUserStats() {
        return this.request('/users/stats');
    }

    static async uploadPhoto(file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request('/upload', {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type
        });
    }
}

// ==================== UI ELEMENTS ====================
const UI = {
    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const view = document.getElementById(viewId);
        if (view) view.classList.add('active');
    },

    showAuthButtons() {
        document.getElementById('navLogin').style.display = 'inline-flex';
        document.getElementById('navSignup').style.display = 'inline-flex';
        document.getElementById('navDashboard').style.display = 'none';
        document.getElementById('navLogout').style.display = 'none';
    },

    showDashboardButtons() {
        document.getElementById('navLogin').style.display = 'none';
        document.getElementById('navSignup').style.display = 'none';
        document.getElementById('navDashboard').style.display = 'inline-flex';
        document.getElementById('navLogout').style.display = 'inline-flex';
    },

    async showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.getElementById('toastContainer').appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 100ms ease-out reverse';
            setTimeout(() => toast.remove(), 100);
        }, 3000);
    },

    createTicketCard(ticket) {
        const card = document.createElement('div');
        card.className = 'ticket-card';
        
        const statusIcon = ticket.status === 'Unclaimed' ? '📍' : 
                          ticket.status === 'In Progress' ? '🚀' : '✅';
        
        card.innerHTML = `
            <div class="ticket-header">
                <div>
                    <div class="ticket-id">#${ticket.id.slice(0, 8)}</div>
                    <span class="ticket-severity severity-${ticket.severity.toLowerCase()}">${ticket.severity}</span>
                </div>
                <span class="ticket-status status-${ticket.status.toLowerCase().replace(' ', '-')}">${statusIcon} ${ticket.status}</span>
            </div>
            <div class="ticket-location">📍 ${ticket.latitude.toFixed(4)}, ${ticket.longitude.toFixed(4)}</div>
            ${ticket.marker_photo_url ? `<img src="${ticket.marker_photo_url}" alt="Dump photo" class="ticket-photo">` : ''}
            <div style="font-size: 0.85rem; color: var(--text-secondary);">
                <div>Created: ${Utils.formatDate(ticket.ticket_generation_time)}</div>
                ${ticket.ticket_claim_time ? `<div>Claimed: ${Utils.formatDate(ticket.ticket_claim_time)}</div>` : ''}
                ${ticket.ticket_cleared_time ? `<div>Cleared: ${Utils.formatDate(ticket.ticket_cleared_time)}</div>` : ''}
            </div>
            <div id="actions-${ticket.id}" class="ticket-actions">
                <!-- Actions added dynamically -->
            </div>
        `;
        return card;
    }
};

// ==================== AUTHENTICATION ====================
class Auth {
    static async init() {
        const token = AppState.getToken();
        const user = AppState.getUser();
        const role = localStorage.getItem('role');

        if (token && user) {
            AppState.token = token;
            AppState.user = user;
            AppState.role = role;
            UI.showDashboardButtons();
            Dashboard.switchToDashboard(role);
        } else {
            UI.showAuthButtons();
            UI.switchView('landingPage');
        }

        this.attachEventListeners();
    }

    static attachEventListeners() {
        // Navigation
        document.getElementById('navLogin').onclick = () => {
            UI.switchView('authView');
            switchAuthForm(true);
        };

        document.getElementById('navSignup').onclick = () => {
            UI.switchView('authView');
            switchAuthForm(false);
        };

        document.getElementById('navDashboard').onclick = () => {
            Dashboard.switchToDashboard(AppState.role);
        };

        document.getElementById('navLogout').onclick = () => {
            AppState.logout();
            UI.showAuthButtons();
            UI.switchView('landingPage');
            UI.showToast('Logged out', 'info');
        };

        // Landing CTA buttons
        document.getElementById('ctaMarkDump').onclick = () => {
            if (AppState.isAuthenticated()) {
                Dashboard.switchToDashboard('marker');
            } else {
                UI.switchView('authView');
                switchAuthForm(false);
                document.getElementById('signupRole').value = 'marker';
            }
        };

        document.getElementById('ctaVolunteer').onclick = () => {
            if (AppState.isAuthenticated()) {
                Dashboard.switchToDashboard('volunteer');
            } else {
                UI.switchView('authView');
                switchAuthForm(false);
                document.getElementById('signupRole').value = 'volunteer';
            }
        };

        document.getElementById('ctaViewMap').onclick = () => {
            document.querySelector('.heatmap-section').scrollIntoView({ behavior: 'smooth' });
        };

        // Auth forms
        document.getElementById('loginFormElement').onsubmit = (e) => this.handleLogin(e);
        document.getElementById('signupFormElement').onsubmit = (e) => this.handleSignup(e);
    }

    static async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await API.login(email, password);
            AppState.setUser(response.user, response.token, response.role);
            UI.showToast('Login successful!', 'success');
            UI.showDashboardButtons();
            Dashboard.switchToDashboard(response.role);
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }

    static async handleSignup(e) {
        e.preventDefault();
        const role = document.getElementById('signupRole').value;
        const username = document.getElementById('signupUsername').value;
        const fullName = document.getElementById('signupFullName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        if (!role) {
            UI.showToast('Please select a role', 'error');
            return;
        }

        try {
            const response = await API.signup(role, username, fullName, email, password);
            AppState.setUser(response.user, response.token, response.role);
            UI.showToast('Account created successfully!', 'success');
            UI.showDashboardButtons();
            Dashboard.switchToDashboard(response.role);
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }
}

// ==================== DASHBOARD ====================
class Dashboard {
    static switchToDashboard(role) {
        UI.switchView(`${role}Dashboard`);
        this.loadDashboard(role);
    }

    static async loadDashboard(role) {
        try {
            const stats = await API.getUserStats();
            
            if (role === 'marker') {
                this.loadMarkerDashboard(stats);
            } else if (role === 'volunteer') {
                this.loadVolunteerDashboard(stats);
            } else if (role === 'authority') {
                this.loadAuthorityDashboard(stats);
            }
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }

    static async loadMarkerDashboard(stats) {
        document.getElementById('markerTicketsGenerated').textContent = stats.tickets_generated || 0;
        document.getElementById('markerTicketsApproved').textContent = stats.tickets_approved || 0;
        document.getElementById('markerTicketsCleared').textContent = stats.tickets_cleared || 0;

        const tickets = await API.getTickets({ generated_by: AppState.user.id });
        this.renderMarkerTickets(tickets);

        document.getElementById('createTicketBtn').onclick = () => this.showTicketModal();
    }

    static async loadVolunteerDashboard(stats) {
        const location = await Utils.getCurrentLocation();
        AppState.userLocation = location;

        document.getElementById('volunteerTicketsClaimed').textContent = stats.tickets_claimed || 0;
        document.getElementById('volunteerTicketsClosed').textContent = stats.tickets_closed || 0;

        const allTickets = await API.getTickets({ status: 'Unclaimed' });
        const nearbyTickets = allTickets.filter(ticket => {
            const distance = Utils.calculateDistance(
                location.latitude, location.longitude,
                ticket.latitude, ticket.longitude
            );
            return distance <= DISTANCE_THRESHOLD_KM;
        });
        
        document.getElementById('volunteerNearby').textContent = nearbyTickets.length;
        this.renderAvailableTickets(nearbyTickets);

        const myTickets = await API.getTickets({ claimed_by: AppState.user.id });
        this.renderClaimedTickets(myTickets.filter(t => t.status !== 'Cleared'));
    }

    static async loadAuthorityDashboard(stats) {
        document.getElementById('authorityApproved').textContent = stats.tickets_approved || 0;

        const pendingTickets = await API.getTickets({ status: 'Unclaimed' });
        document.getElementById('authorityPending').textContent = pendingTickets.length;

        const inProgressTickets = await API.getTickets({ status: 'In Progress' });
        this.renderPendingTickets(pendingTickets);
        this.renderClearanceTickets(inProgressTickets);
    }

    static renderMarkerTickets(tickets) {
        const container = document.getElementById('markerTickets');
        container.innerHTML = '';
        
        tickets.forEach(ticket => {
            const card = UI.createTicketCard(ticket);
            container.appendChild(card);
        });
    }

    static renderAvailableTickets(tickets) {
        const container = document.getElementById('availableTickets');
        container.innerHTML = '';

        tickets.forEach(ticket => {
            const card = UI.createTicketCard(ticket);
            const actionsDiv = card.querySelector('.ticket-actions');
            
            if (ticket.status === 'Unclaimed') {
                const claimBtn = document.createElement('button');
                claimBtn.className = 'btn btn-primary';
                claimBtn.textContent = 'Claim';
                claimBtn.onclick = async () => {
                    try {
                        await API.claimTicket(ticket.id);
                        UI.showToast('Ticket claimed successfully!', 'success');
                        Dashboard.loadDashboard('volunteer');
                    } catch (error) {
                        UI.showToast(error.message, 'error');
                    }
                };
                actionsDiv.appendChild(claimBtn);
            }
            
            container.appendChild(card);
        });
    }

    static renderClaimedTickets(tickets) {
        const container = document.getElementById('myClaimedTickets');
        container.innerHTML = '';

        tickets.forEach(ticket => {
            const card = UI.createTicketCard(ticket);
            const actionsDiv = card.querySelector('.ticket-actions');
            
            if (ticket.status === 'In Progress') {
                const daysRemaining = Utils.getTimeRemaining(ticket.ticket_claim_time);
                const timeWarning = document.createElement('div');
                timeWarning.style.marginBottom = '0.5rem';
                timeWarning.style.padding = '0.5rem';
                timeWarning.style.background = daysRemaining <= 1 ? 'rgba(231, 76, 60, 0.1)' : 'transparent';
                timeWarning.style.borderRadius = 'var(--radius-xs)';
                timeWarning.textContent = `⏳ ${daysRemaining} days remaining`;
                actionsDiv.parentElement.insertBefore(timeWarning, actionsDiv);

                const closeBtn = document.createElement('button');
                closeBtn.className = 'btn btn-success';
                closeBtn.textContent = 'Mark Complete';
                closeBtn.onclick = async () => {
                    this.showCloseTicketModal(ticket);
                };
                actionsDiv.appendChild(closeBtn);
            }
            
            container.appendChild(card);
        });
    }

    static renderPendingTickets(tickets) {
        const container = document.getElementById('pendingTickets');
        container.innerHTML = '';

        tickets.forEach(ticket => {
            const card = UI.createTicketCard(ticket);
            const actionsDiv = card.querySelector('.ticket-actions');
            
            const approveBtn = document.createElement('button');
            approveBtn.className = 'btn btn-success';
            approveBtn.textContent = 'Approve';
            approveBtn.onclick = async () => {
                try {
                    await API.approveTicket(ticket.id);
                    UI.showToast('Ticket approved!', 'success');
                    Dashboard.loadDashboard('authority');
                } catch (error) {
                    UI.showToast(error.message, 'error');
                }
            };
            actionsDiv.appendChild(approveBtn);
            
            container.appendChild(card);
        });
    }

    static renderClearanceTickets(tickets) {
        const container = document.getElementById('clearanceTickets');
        container.innerHTML = '';

        tickets.forEach(ticket => {
            const card = UI.createTicketCard(ticket);
            const actionsDiv = card.querySelector('.ticket-actions');
            
            const verifyBtn = document.createElement('button');
            verifyBtn.className = 'btn btn-success';
            verifyBtn.textContent = 'Verify Clearance';
            verifyBtn.onclick = async () => {
                try {
                    await API.updateTicket(ticket.id, { status: 'Cleared' });
                    UI.showToast('Ticket marked as cleared!', 'success');
                    Dashboard.loadDashboard('authority');
                } catch (error) {
                    UI.showToast(error.message, 'error');
                }
            };
            actionsDiv.appendChild(verifyBtn);
            
            container.appendChild(card);
        });
    }

    static showTicketModal() {
        const modal = document.getElementById('ticketModal');
        const form = document.getElementById('ticketForm');
        const title = document.getElementById('modalTitle');
        
        title.textContent = 'Create New Ticket';
        form.onsubmit = (e) => this.handleCreateTicket(e);
        document.getElementById('useLocationBtn').onclick = async () => {
            const location = await Utils.getCurrentLocation();
            AppState.userLocation = location;
            document.getElementById('ticketLocation').textContent = 
                `📍 ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
        };
        
        document.getElementById('ticketPhoto').onchange = (e) => {
            this.previewPhoto(e.target.files[0]);
        };
        
        form.reset();
        modal.classList.add('active');
    }

    static showCloseTicketModal(ticket) {
        const modal = document.getElementById('ticketModal');
        const form = document.getElementById('ticketForm');
        const title = document.getElementById('modalTitle');
        
        title.textContent = 'Complete Ticket';
        form.innerHTML = `
            <div class="form-group">
                <label for="closePhoto">Upload Photo of Cleared Dump *</label>
                <input type="file" id="closePhoto" accept="image/*" required>
                <div id="photoPreview" class="photo-preview"></div>
            </div>
            <button type="submit" class="btn btn-success" style="width: 100%;">Confirm Clearance</button>
        `;
        
        document.getElementById('closePhoto').onchange = (e) => {
            this.previewPhoto(e.target.files[0]);
        };
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            const photo = document.getElementById('closePhoto').files[0];
            if (photo) {
                try {
                    const photoUrl = await API.uploadPhoto(photo);
                    await API.closeTicket(ticket.id, photoUrl.url);
                    UI.showToast('Ticket completed!', 'success');
                    modal.classList.remove('active');
                    Dashboard.loadDashboard('volunteer');
                } catch (error) {
                    UI.showToast(error.message, 'error');
                }
            }
        };
        
        modal.classList.add('active');
    }

    static previewPhoto(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('photoPreview');
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    }

    static async handleCreateTicket(e) {
        e.preventDefault();
        
        const photo = document.getElementById('ticketPhoto').files[0];
        const severity = document.getElementById('ticketSeverity').value;
        const location = AppState.userLocation;

        if (!photo || !severity || !location) {
            UI.showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            const photoUrl = await API.uploadPhoto(photo);
            const ticket = {
                latitude: location.latitude,
                longitude: location.longitude,
                severity: severity,
                marker_photo_url: photoUrl.url
            };

            await API.createTicket(ticket);
            UI.showToast('Ticket created successfully!', 'success');
            document.getElementById('ticketModal').classList.remove('active');
            Dashboard.loadDashboard('marker');
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }
}

// ==================== HEAT MAP ====================
class HeatMap {
    static async initMap() {
        const location = await Utils.getCurrentLocation();
        
        // Initialize Leaflet map
        AppState.map = L.map('map').setView([location.latitude, location.longitude], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(AppState.map);

        // Load and display heat map data
        this.updateHeatMap();
    }

    static async updateHeatMap() {
        try {
            const tickets = await API.getTickets();
            
            // Prepare heat map data
            const heatData = tickets.map(ticket => {
                let intensity = 0.3; // Low
                if (ticket.severity === 'Medium') intensity = 0.6;
                if (ticket.severity === 'High') intensity = 0.9;
                
                return [ticket.latitude, ticket.longitude, intensity];
            });

            // Add heat map layer
            if (AppState.heatmapInstance) {
                AppState.map.removeLayer(AppState.heatmapInstance);
            }

            AppState.heatmapInstance = L.heatLayer(heatData, {
                radius: 25,
                blur: 15,
                maxZoom: 17,
                max: 1.0
            }).addTo(AppState.map);

            // Add markers for each ticket
            tickets.forEach(ticket => {
                const color = ticket.severity === 'Low' ? '#2ecc71' : 
                             ticket.severity === 'Medium' ? '#f39c12' : '#e74c3c';
                
                L.circleMarker([ticket.latitude, ticket.longitude], {
                    radius: 8,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 0.8,
                    fillOpacity: 0.7
                }).bindPopup(`<strong>${ticket.severity} Severity</strong><br>Status: ${ticket.status}`).addTo(AppState.map);
            });
        } catch (error) {
            console.error('Error updating heat map:', error);
        }
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize map on landing page
    try {
        await HeatMap.initMap();
    } catch (error) {
        console.error('Map initialization error:', error);
    }

    // Setup location filtering
    document.getElementById('useCurrentLocation').onclick = async () => {
        const location = await Utils.getCurrentLocation();
        AppState.userLocation = location;
        loadNearbyTickets();
    };

    // Initialize authentication
    await Auth.init();

    // Handle modal close
    document.querySelector('.close').onclick = () => {
        document.getElementById('ticketModal').classList.remove('active');
    };
});

// ==================== HELPER FUNCTIONS ====================
function switchAuthForm(isLogin) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (isLogin) {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
    }
}

async function loadNearbyTickets() {
    if (!AppState.userLocation) {
        UI.showToast('Please enable location access', 'info');
        return;
    }

    try {
        const allTickets = await API.getTickets();
        const status = document.getElementById('filterStatus').value;
        
        const nearbyTickets = allTickets.filter(ticket => {
            const distance = Utils.calculateDistance(
                AppState.userLocation.latitude,
                AppState.userLocation.longitude,
                ticket.latitude,
                ticket.longitude
            );
            
            const statusMatch = !status || ticket.status === status;
            const distanceMatch = distance <= 50; // 50 km default proximity
            const notCleared = ticket.status !== 'Cleared';
            
            return statusMatch && distanceMatch && notCleared;
        });

        const container = document.getElementById('ticketsList');
        container.innerHTML = '';
        
        nearbyTickets.forEach(ticket => {
            const card = UI.createTicketCard(ticket);
            container.appendChild(card);
        });

        if (nearbyTickets.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem;">No tickets found in your area</p>';
        }
    } catch (error) {
        UI.showToast(error.message, 'error');
    }
}

// Refresh nearby tickets and heat map every 30 seconds
setInterval(async () => {
    if (document.getElementById('landingPage').classList.contains('active')) {
        loadNearbyTickets();
        HeatMap.updateHeatMap();
    }
}, 30000);
