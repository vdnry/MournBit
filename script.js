// MournBit Frontend Application
// Complete app with i18n, leaderboard, proof system, analytics, badges, hotspots, dark mode

// ==================== CONFIGURATION ====================
const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://localhost:8787'
    : 'https://api.mournbit.workers.dev';
const DISTANCE_THRESHOLD_KM = 10;
const VOLUNTEER_TIME_LIMIT_DAYS = 3;
const LEADERBOARD_POLL_INTERVAL = 5000; // 5 seconds
const ANALYTICS_POLL_INTERVAL = 15000; // 15 seconds

// ==================== i18n — ENGLISH / HINDI ====================
const translations = {
    // Navigation
    nav_home: { en: 'Home', hi: 'होम' },
    nav_leaderboard: { en: 'Leaderboard', hi: 'लीडरबोर्ड' },
    nav_analytics: { en: 'Analytics', hi: 'विश्लेषण' },
    login: { en: 'Login', hi: 'लॉगिन' },
    signup: { en: 'Sign Up', hi: 'साइन अप' },
    dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड' },
    logout: { en: 'Logout', hi: 'लॉगआउट' },

    // Hero
    hero_badge: { en: 'Real-Time Platform', hi: 'रियल-टाइम प्लेटफ़ॉर्म' },
    hero_title: { en: 'Intelligent Waste Tracking & Cleanup Coordination', hi: 'बुद्धिमान कचरा ट्रैकिंग और सफाई समन्वय' },
    hero_subtitle: { en: 'Mark garbage dumps, volunteer for cleanup, and track impact with live leaderboards, proof verification, and community analytics.', hi: 'कचरे के ढेर चिह्नित करें, सफाई के लिए स्वयंसेवा करें, और लाइव लीडरबोर्ड, प्रमाण सत्यापन और सामुदायिक विश्लेषण के साथ प्रभाव ट्रैक करें।' },
    cta_mark: { en: 'Report a Dump', hi: 'कचरा रिपोर्ट करें' },
    cta_volunteer: { en: 'Volunteer to Clean', hi: 'सफाई के लिए स्वयंसेवा' },
    cta_map: { en: 'View Heat Map', hi: 'हीट मैप देखें' },

    // Analytics strip
    analytics_total_spots: { en: 'Total Reports', hi: 'कुल रिपोर्ट' },
    analytics_cleared: { en: 'Spots Cleared', hi: 'साफ किए गए स्थान' },
    analytics_volunteers: { en: 'Active Volunteers', hi: 'सक्रिय स्वयंसेवक' },
    analytics_avg_time: { en: 'Avg. Cleanup Time', hi: 'औसत सफाई समय' },

    // Map
    map_title: { en: 'Live Garbage Density Map', hi: 'लाइव कचरा घनत्व मानचित्र' },
    live: { en: 'Live', hi: 'लाइव' },
    live_updates: { en: 'Updates every 5s', hi: 'हर 5 सेकंड अपडेट' },
    legend_low: { en: 'Low Density', hi: 'कम घनत्व' },
    legend_medium: { en: 'Medium Density', hi: 'मध्यम घनत्व' },
    legend_high: { en: 'High Density', hi: 'उच्च घनत्व' },
    legend_hotspot: { en: 'Hotspot Zone', hi: 'हॉटस्पॉट ज़ोन' },

    // Filter
    nearby_title: { en: 'Tickets Near You', hi: 'आपके पास के टिकट' },
    location_placeholder: { en: 'Enter location or use current location', hi: 'स्थान दर्ज करें या वर्तमान स्थान का उपयोग करें' },
    use_location: { en: 'Use Current Location', hi: 'वर्तमान स्थान का उपयोग करें' },
    all_status: { en: 'All Status', hi: 'सभी स्थिति' },
    status_unclaimed: { en: 'Unclaimed', hi: 'अनक्लेम्ड' },
    status_in_progress: { en: 'In Progress', hi: 'प्रगति में' },

    // Leaderboard
    leaderboard_title: { en: 'Volunteer Leaderboard', hi: 'स्वयंसेवक लीडरबोर्ड' },
    your_rank: { en: 'Your Rank', hi: 'आपकी रैंक' },
    points: { en: 'pts', hi: 'अंक' },
    cleanups: { en: 'cleanups', hi: 'सफाई' },
    trust: { en: 'trust', hi: 'विश्वास' },
    rank: { en: 'Rank', hi: 'रैंक' },
    volunteer_name: { en: 'Volunteer', hi: 'स्वयंसेवक' },
    cleanups_col: { en: 'Cleanups', hi: 'सफाई' },
    score: { en: 'Score', hi: 'स्कोर' },
    trust_score: { en: 'Trust', hi: 'विश्वास' },
    badges_col: { en: 'Badges', hi: 'बैज' },

    // Analytics
    analytics_dashboard: { en: 'Analytics Dashboard', hi: 'विश्लेषण डैशबोर्ड' },
    an_total_reports: { en: 'Total Reports', hi: 'कुल रिपोर्ट' },
    an_cleared: { en: 'Spots Cleared', hi: 'साफ किए गए स्थान' },
    an_active: { en: 'Active Spots', hi: 'सक्रिय स्थान' },
    an_volunteers: { en: 'Volunteers', hi: 'स्वयंसेवक' },
    an_top_volunteer: { en: 'Top Volunteer', hi: 'शीर्ष स्वयंसेवक' },
    an_avg_cleanup: { en: 'Avg. Cleanup Time', hi: 'औसत सफाई समय' },
    hotspot_title: { en: 'Hotspot Zones', hi: 'हॉटस्पॉट ज़ोन' },
    hotspot_desc: { en: 'Areas with repeated garbage reports requiring urgent attention.', hi: 'बार-बार कचरा रिपोर्ट वाले क्षेत्र जिन पर तत्काल ध्यान आवश्यक है।' },

    // Auth
    login_title: { en: 'Welcome Back', hi: 'वापसी पर स्वागत' },
    login_subtitle: { en: 'Sign in to your account', hi: 'अपने खाते में साइन इन करें' },
    signup_title: { en: 'Create Account', hi: 'खाता बनाएं' },
    signup_subtitle: { en: 'Join the cleanup movement', hi: 'सफाई अभियान से जुड़ें' },
    email: { en: 'Email', hi: 'ईमेल' },
    password: { en: 'Password', hi: 'पासवर्ड' },
    username: { en: 'Username', hi: 'उपयोगकर्ता नाम' },
    full_name: { en: 'Full Name', hi: 'पूरा नाम' },
    select_role: { en: 'I am a...', hi: 'मैं हूं...' },
    select_role_placeholder: { en: 'Select Role', hi: 'भूमिका चुनें' },
    role_marker: { en: 'Marker (Report Garbage)', hi: 'मार्कर (कचरा रिपोर्ट करें)' },
    role_volunteer: { en: 'Volunteer (Clean Garbage)', hi: 'स्वयंसेवक (कचरा साफ करें)' },
    role_authority: { en: 'Authority (Approve Cleanup)', hi: 'प्राधिकरण (सफाई स्वीकृत करें)' },
    no_account: { en: "Don't have an account?", hi: 'खाता नहीं है?' },
    has_account: { en: 'Already have an account?', hi: 'पहले से खाता है?' },

    // Dashboards
    marker_dashboard: { en: 'Marker Dashboard', hi: 'मार्कर डैशबोर्ड' },
    volunteer_dashboard: { en: 'Volunteer Dashboard', hi: 'स्वयंसेवक डैशबोर्ड' },
    authority_dashboard: { en: 'Authority Dashboard', hi: 'प्राधिकरण डैशबोर्ड' },
    create_ticket: { en: '+ Create Ticket', hi: '+ टिकट बनाएं' },
    tickets_generated: { en: 'Tickets Generated', hi: 'टिकट बनाए गए' },
    tickets_approved: { en: 'Tickets Approved', hi: 'टिकट स्वीकृत' },
    tickets_cleared: { en: 'Tickets Cleared', hi: 'टिकट साफ किए' },
    tickets_claimed: { en: 'Tickets Claimed', hi: 'टिकट दावा किए' },
    tickets_closed: { en: 'Tickets Completed', hi: 'टिकट पूरे किए' },
    total_score: { en: 'Total Score', hi: 'कुल स्कोर' },
    trust_score_label: { en: 'Trust Score', hi: 'विश्वास स्कोर' },
    your_badges: { en: 'Your Badges', hi: 'आपके बैज' },
    available_tickets: { en: 'Available Tickets', hi: 'उपलब्ध टिकट' },
    my_claimed_tickets: { en: 'My Claimed Tickets', hi: 'मेरे दावा किए गए टिकट' },
    pending_review: { en: 'Pending Review', hi: 'समीक्षा लंबित' },
    pending_approval: { en: 'Pending Tickets for Approval', hi: 'स्वीकृति के लिए लंबित टिकट' },
    pending_clearance: { en: 'Tickets Pending Clearance Verification', hi: 'निकासी सत्यापन के लिए लंबित टिकट' },

    // Ticket modal
    create_new_ticket: { en: 'Create New Ticket', hi: 'नया टिकट बनाएं' },
    upload_photo: { en: 'Upload Photo of Garbage Dump *', hi: 'कचरे के ढेर की फोटो अपलोड करें *' },
    location: { en: 'Location', hi: 'स्थान' },
    get_location: { en: 'Get Current Location', hi: 'वर्तमान स्थान प्राप्त करें' },
    severity_level: { en: 'Severity Level *', hi: 'गंभीरता स्तर *' },
    select_severity: { en: 'Select Severity', hi: 'गंभीरता चुनें' },
    severity_low: { en: 'Low', hi: 'कम' },
    severity_medium: { en: 'Medium', hi: 'मध्यम' },
    severity_high: { en: 'High', hi: 'उच्च' },
    create_ticket_submit: { en: 'Create Ticket', hi: 'टिकट बनाएं' },

    // Proof modal
    proof_title: { en: 'Submit Cleanup Proof', hi: 'सफाई प्रमाण जमा करें' },
    proof_desc: { en: 'Upload an after photo to verify cleanup. Without proof, the ticket cannot be marked as cleaned.', hi: 'सफाई सत्यापित करने के लिए बाद की फोटो अपलोड करें। प्रमाण के बिना, टिकट को साफ के रूप में चिह्नित नहीं किया जा सकता।' },
    before: { en: 'Before', hi: 'पहले' },
    after: { en: 'After', hi: 'बाद' },
    upload_after_photo: { en: 'Upload After Photo', hi: 'बाद की फोटो अपलोड करें' },
    confirm_cleanup: { en: 'Confirm Cleanup', hi: 'सफाई की पुष्टि करें' },

    // Actions
    claim: { en: 'Claim', hi: 'दावा करें' },
    mark_complete: { en: 'Mark Complete', hi: 'पूर्ण चिह्नित करें' },
    approve: { en: 'Approve', hi: 'स्वीकृत करें' },
    verify_clearance: { en: 'Verify Clearance', hi: 'निकासी सत्यापित करें' },
    looks_clean: { en: 'Looks Clean', hi: 'साफ दिखता है' },
    days_remaining: { en: 'days remaining', hi: 'दिन शेष' },
    elapsed: { en: 'elapsed', hi: 'बीत गए' },
    no_tickets_found: { en: 'No tickets found in your area', hi: 'आपके क्षेत्र में कोई टिकट नहीं मिला' },

    // Toasts
    login_success: { en: 'Login successful!', hi: 'लॉगिन सफल!' },
    signup_success: { en: 'Account created successfully!', hi: 'खाता सफलतापूर्वक बनाया गया!' },
    logged_out: { en: 'Logged out', hi: 'लॉग आउट हो गए' },
    ticket_claimed: { en: 'Ticket claimed successfully!', hi: 'टिकट सफलतापूर्वक दावा किया गया!' },
    ticket_completed: { en: 'Ticket completed!', hi: 'टिकट पूरा हो गया!' },
    ticket_approved: { en: 'Ticket approved!', hi: 'टिकट स्वीकृत!' },
    ticket_cleared: { en: 'Ticket marked as cleared!', hi: 'टिकट साफ के रूप में चिह्नित!' },
    ticket_created: { en: 'Ticket created successfully!', hi: 'टिकट सफलतापूर्वक बनाया गया!' },
    select_role_error: { en: 'Please select a role', hi: 'कृपया एक भूमिका चुनें' },
    fill_fields: { en: 'Please fill in all required fields', hi: 'कृपया सभी आवश्यक फ़ील्ड भरें' },
    enable_location: { en: 'Please enable location access', hi: 'कृपया स्थान एक्सेस सक्षम करें' },
    proof_required: { en: 'Photo proof is required!', hi: 'फोटो प्रमाण आवश्यक है!' },
    points_earned: { en: 'Points earned', hi: 'अंक अर्जित' },

    // Badge names
    badge_first_cleanup: { en: 'First Cleanup', hi: 'पहली सफाई' },
    badge_five_cleanups: { en: '5 Cleanups', hi: '5 सफाई' },
    badge_ten_cleanups: { en: '10 Cleanups', hi: '10 सफाई' },
    badge_century_club: { en: '100 Points Club', hi: '100 अंक क्लब' },
    badge_high_trust: { en: 'Trusted Volunteer', hi: 'विश्वसनीय स्वयंसेवक' },
    badge_fast_cleaner: { en: 'Fast Cleaner', hi: 'तेज सफाईकर्ता' },

    // Hotspot
    reports: { en: 'reports', hi: 'रिपोर्ट' },
    critical: { en: 'Critical', hi: 'गंभीर' },
    high: { en: 'High', hi: 'उच्च' },
    moderate: { en: 'Moderate', hi: 'मध्यम' },
};

// ==================== i18n ENGINE ====================
const I18n = {
    currentLang: 'en',

    init() {
        const saved = localStorage.getItem('mournbit_lang');
        if (saved && (saved === 'en' || saved === 'hi')) {
            this.currentLang = saved;
        }
        this.apply();
        this.updateToggle();
    },

    setLang(lang) {
        this.currentLang = lang;
        localStorage.setItem('mournbit_lang', lang);
        this.apply();
        this.updateToggle();
    },

    t(key) {
        const entry = translations[key];
        if (!entry) return key;
        return entry[this.currentLang] || entry['en'] || key;
    },

    apply() {
        // Text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);
            if (text) el.textContent = text;
        });

        // Placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const text = this.t(key);
            if (text) el.placeholder = text;
        });
    },

    updateToggle() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
        });
    }
};

// ==================== STATE MANAGEMENT ====================
const AppState = {
    user: null,
    token: null,
    role: null,
    userLocation: null,
    tickets: [],
    map: null,
    heatmapLayer: null,
    markerLayers: [],
    leaderboardInterval: null,
    analyticsInterval: null,
    currentProofTicket: null,

    setUser(userData, token, role) {
        this.user = userData;
        this.token = token;
        this.role = role;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
    },

    getUser() {
        if (!this.user) {
            this.user = JSON.parse(localStorage.getItem('user') || 'null');
        }
        return this.user;
    },

    getToken() {
        return this.token || localStorage.getItem('token');
    },

    getRole() {
        return this.role || localStorage.getItem('role');
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
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    static getCurrentLocation() {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        });
                    },
                    () => { resolve({ latitude: 13.0827, longitude: 80.2707 }); }
                );
            } else {
                resolve({ latitude: 13.0827, longitude: 80.2707 });
            }
        });
    }

    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    static formatDate(dateString) {
        if (!dateString) return '--';
        return new Date(dateString).toLocaleString();
    }

    static getTimeRemaining(claimTime) {
        if (!claimTime) return 0;
        const claimDate = new Date(claimTime);
        const deadlineDate = new Date(claimDate.getTime() + VOLUNTEER_TIME_LIMIT_DAYS * 24 * 60 * 60 * 1000);
        const now = new Date();
        const msRemaining = deadlineDate - now;
        return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
    }

    static getElapsedTime(startTime) {
        if (!startTime) return '--';
        const start = new Date(startTime);
        const now = new Date();
        const diffMs = now - start;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    static formatMinutes(minutes) {
        if (!minutes || minutes === 0) return '--';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }
}

// ==================== API CALLS ====================
class API {
    static async request(endpoint, options = {}) {
        const headers = { ...options.headers };

        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

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
        if (role === 'authority') {
            const domain = email.split('@')[1];
            if (!['vdnry.com'].includes(domain)) {
                throw new Error('Authority users must use an authorized domain email');
            }
        }
        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ role, username, full_name: fullName, email, password: passwordHash })
        });
    }

    static async createTicket(ticket) {
        return this.request('/tickets', { method: 'POST', body: JSON.stringify(ticket) });
    }

    static async getTickets(filters = {}) {
        const params = new URLSearchParams(filters);
        const result = await this.request(`/tickets?${params.toString()}`);
        return result.tickets || [];
    }

    static async claimTicket(ticketId) {
        return this.request(`/tickets/${ticketId}/claim`, { method: 'POST' });
    }

    static async closeTicket(ticketId, photoUrl) {
        return this.request(`/tickets/${ticketId}/close`, {
            method: 'POST',
            body: JSON.stringify({ volunteer_photo_url: photoUrl })
        });
    }

    static async approveTicket(ticketId) {
        return this.request(`/tickets/${ticketId}/approve`, { method: 'POST' });
    }

    static async verifyTicket(ticketId) {
        return this.request(`/tickets/${ticketId}/verify`, { method: 'POST' });
    }

    static async getUserStats() {
        return this.request('/users/stats');
    }

    static async getLeaderboard() {
        return this.request('/leaderboard');
    }

    static async getMyRank() {
        return this.request('/leaderboard/me');
    }

    static async getAnalytics() {
        return this.request('/analytics');
    }

    static async getHotspots() {
        return this.request('/hotspots');
    }

    static async uploadPhoto(file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request('/upload', { method: 'POST', body: formData, headers: {} });
    }
}

// ==================== UI SYSTEM ====================
const UI = {
    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const view = document.getElementById(viewId);
        if (view) view.classList.add('active');

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        if (viewId === 'landingPage') document.getElementById('navHome')?.classList.add('active');
        if (viewId === 'leaderboardView') document.getElementById('navLeaderboard')?.classList.add('active');
        if (viewId === 'analyticsView') document.getElementById('navAnalytics')?.classList.add('active');
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

    showToast(messageKey, type = 'info', dynamic = null) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        let text = I18n.t(messageKey);
        if (text === messageKey) text = messageKey; // fallback for dynamic messages
        if (dynamic) text += ` ${dynamic}`;
        toast.textContent = text;
        document.getElementById('toastContainer').appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 200ms ease reverse';
            setTimeout(() => toast.remove(), 200);
        }, 3500);
    },

    createTicketCard(ticket, options = {}) {
        const card = document.createElement('div');
        card.className = 'ticket-card';
        card.id = `ticket-${ticket.id}`;

        const statusKey = ticket.status.toLowerCase().replace(/\s+/g, '-');

        card.innerHTML = `
            <div class="ticket-header">
                <div>
                    <div class="ticket-id">#${ticket.id.slice(0, 8)}</div>
                    <span class="ticket-severity severity-${ticket.severity.toLowerCase()}">${ticket.severity}</span>
                </div>
                <span class="ticket-status status-${statusKey}">${ticket.status}</span>
            </div>
            <div class="ticket-location">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${ticket.latitude.toFixed(4)}, ${ticket.longitude.toFixed(4)}
            </div>
            ${ticket.marker_photo_url ? `<img src="${ticket.marker_photo_url}" alt="Report" class="ticket-photo">` : ''}
            ${ticket.volunteer_photo_url ? `<img src="${ticket.volunteer_photo_url}" alt="Proof" class="ticket-photo" style="border: 2px solid var(--success);">` : ''}
            <div class="ticket-meta">
                <div>${I18n.t('create_new_ticket').split(' ')[0]}: ${Utils.formatDate(ticket.ticket_generation_time)}</div>
                ${ticket.ticket_claim_time ? `<div>${I18n.t('tickets_claimed').split(' ')[0]}: ${Utils.formatDate(ticket.ticket_claim_time)}</div>` : ''}
                ${ticket.ticket_cleared_time ? `<div>${I18n.t('tickets_cleared').split(' ')[0]}: ${Utils.formatDate(ticket.ticket_cleared_time)}</div>` : ''}
            </div>
            ${ticket.verification_count > 0 ? `<div class="ticket-meta" style="color: var(--success);">${ticket.verification_count}x verified</div>` : ''}
            <div id="actions-${ticket.id}" class="ticket-actions"></div>
        `;
        return card;
    }
};

// ==================== BADGE SYSTEM ====================
const BadgeSystem = {
    definitions: [
        { id: 'first_cleanup', icon: '1', iconClass: 'badge-icon-first', nameKey: 'badge_first_cleanup' },
        { id: 'five_cleanups', icon: '5', iconClass: 'badge-icon-five', nameKey: 'badge_five_cleanups' },
        { id: 'ten_cleanups', icon: '10', iconClass: 'badge-icon-ten', nameKey: 'badge_ten_cleanups' },
        { id: 'century_club', icon: 'C', iconClass: 'badge-icon-century', nameKey: 'badge_century_club' },
        { id: 'high_trust', icon: 'T', iconClass: 'badge-icon-trust', nameKey: 'badge_high_trust' },
        { id: 'fast_cleaner', icon: 'F', iconClass: 'badge-icon-fast', nameKey: 'badge_fast_cleaner' },
    ],

    renderBadges(earnedBadges, container) {
        container.innerHTML = '';
        this.definitions.forEach(badge => {
            const earned = earnedBadges.includes(badge.id);
            const item = document.createElement('div');
            item.className = `badge-item ${earned ? 'earned' : 'locked'}`;
            item.innerHTML = `
                <div class="badge-icon ${badge.iconClass}">${badge.icon}</div>
                <div class="badge-name">${I18n.t(badge.nameKey)}</div>
            `;
            container.appendChild(item);
        });
    },

    renderLeaderboardBadges(earnedBadges) {
        return earnedBadges.map(badgeId => {
            const def = this.definitions.find(d => d.id === badgeId);
            if (!def) return '';
            return `<div class="leaderboard-badge ${def.iconClass}" title="${I18n.t(def.nameKey)}">${def.icon}</div>`;
        }).join('');
    }
};

// ==================== DARK MODE ====================
const DarkMode = {
    init() {
        const saved = localStorage.getItem('mournbit_darkmode');
        if (saved === 'light') {
            document.body.classList.add('light-mode');
        }
        this.updateIcon();
    },

    toggle() {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('mournbit_darkmode', isLight ? 'light' : 'dark');
        this.updateIcon();
    },

    updateIcon() {
        const isLight = document.body.classList.contains('light-mode');
        const icon = document.getElementById('darkModeIcon');
        if (icon) {
            icon.innerHTML = isLight
                ? '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>'
                : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        }
    }
};

// ==================== LEADERBOARD ====================
const LeaderboardView = {
    async load() {
        try {
            const data = await API.getLeaderboard();
            this.render(data.leaderboard || []);

            // Load personal rank if volunteer
            if (AppState.getRole() === 'volunteer') {
                try {
                    const me = await API.getMyRank();
                    this.renderMyRank(me);
                } catch (e) { /* not logged in or not volunteer */ }
            }
        } catch (error) {
            console.error('Leaderboard load error:', error);
        }
    },

    render(leaderboard) {
        const tbody = document.getElementById('leaderboardBody');
        if (!tbody) return;
        const currentUserId = AppState.getUser()?.id;

        tbody.innerHTML = leaderboard.map(entry => {
            const rankClass = entry.rank <= 3 ? `rank-${entry.rank}` : 'rank-default';
            const isCurrentUser = entry.id === currentUserId;
            const trustLevel = entry.trust_score >= 70 ? 'trust-high' : entry.trust_score >= 40 ? 'trust-medium' : 'trust-low';
            const trustWidth = Math.min(100, entry.trust_score);

            return `
                <tr class="${isCurrentUser ? 'current-user' : ''}">
                    <td><span class="rank-badge ${rankClass}">${entry.rank}</span></td>
                    <td>
                        <div class="volunteer-name">${entry.full_name}</div>
                        <div class="volunteer-username">@${entry.username}</div>
                    </td>
                    <td>${entry.total_cleanups}</td>
                    <td><strong>${entry.total_score}</strong></td>
                    <td>
                        <span class="trust-bar"><span class="trust-bar-fill ${trustLevel}" style="width:${trustWidth}%"></span></span>
                        ${entry.trust_score}%
                    </td>
                    <td>
                        <div class="leaderboard-badges">${BadgeSystem.renderLeaderboardBadges(entry.badges)}</div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderMyRank(data) {
        const card = document.getElementById('myRankCard');
        if (!card) return;
        card.style.display = 'flex';
        document.getElementById('myRankValue').textContent = `#${data.rank || '--'}`;
        document.getElementById('myScore').textContent = data.total_score || 0;
        document.getElementById('myCleanups').textContent = data.tickets_closed || 0;
        document.getElementById('myTrust').textContent = data.trust_score || 50;
    },

    startPolling() {
        if (AppState.leaderboardInterval) clearInterval(AppState.leaderboardInterval);
        AppState.leaderboardInterval = setInterval(() => {
            if (document.getElementById('leaderboardView')?.classList.contains('active')) {
                this.load();
            }
        }, LEADERBOARD_POLL_INTERVAL);
    }
};

// ==================== ANALYTICS ====================
const AnalyticsView = {
    async load() {
        try {
            const data = await API.getAnalytics();
            document.getElementById('anTotalSpots').textContent = data.total_spots || 0;
            document.getElementById('anClearedSpots').textContent = data.cleared_spots || 0;
            document.getElementById('anActiveSpots').textContent = data.active_spots || 0;
            document.getElementById('anVolunteers').textContent = data.total_volunteers || 0;
            document.getElementById('anTopVolunteer').textContent = data.top_volunteer || '--';
            document.getElementById('anAvgTime').textContent = Utils.formatMinutes(data.avg_cleanup_minutes);

            // Strip analytics
            document.getElementById('analyticsTotalSpots').textContent = data.total_spots || 0;
            document.getElementById('analyticsCleared').textContent = data.cleared_spots || 0;
            document.getElementById('analyticsVolunteers').textContent = data.total_volunteers || 0;
            document.getElementById('analyticsAvgTime').textContent = Utils.formatMinutes(data.avg_cleanup_minutes);

            await this.loadHotspots();
        } catch (error) {
            console.error('Analytics load error:', error);
        }
    },

    async loadHotspots() {
        try {
            const data = await API.getHotspots();
            const container = document.getElementById('hotspotList');
            if (!container) return;

            const hotspots = data.hotspots || [];
            if (hotspots.length === 0) {
                container.innerHTML = `<div class="empty-state"><p>${I18n.t('no_tickets_found')}</p></div>`;
                return;
            }

            container.innerHTML = hotspots.map(hs => {
                const riskClass = hs.risk_level === 'Critical' ? 'critical' : hs.risk_level === 'High' ? 'high' : 'moderate';
                const riskKey = hs.risk_level.toLowerCase();
                return `
                    <div class="hotspot-card">
                        <div class="hotspot-indicator hotspot-${riskClass}"></div>
                        <div class="hotspot-info">
                            <div class="hotspot-coords">${hs.latitude.toFixed(4)}, ${hs.longitude.toFixed(4)}</div>
                            <div>${hs.report_count} ${I18n.t('reports')}</div>
                        </div>
                        <span class="hotspot-risk risk-${riskClass}">${I18n.t(riskKey)}</span>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Hotspots error:', error);
        }
    },

    startPolling() {
        if (AppState.analyticsInterval) clearInterval(AppState.analyticsInterval);
        AppState.analyticsInterval = setInterval(() => {
            this.load();
        }, ANALYTICS_POLL_INTERVAL);
    }
};

// ==================== AUTHENTICATION ====================
class Auth {
    static async init() {
        const token = AppState.getToken();
        const user = AppState.getUser();
        const role = AppState.getRole();

        if (token && user) {
            AppState.token = token;
            AppState.user = user;
            AppState.role = role;
            UI.showDashboardButtons();
        } else {
            UI.showAuthButtons();
            UI.switchView('landingPage');
        }

        this.attachEventListeners();
    }

    static attachEventListeners() {
        // Navigation
        document.getElementById('navHome').onclick = () => {
            UI.switchView('landingPage');
        };

        document.getElementById('navLeaderboard').onclick = () => {
            UI.switchView('leaderboardView');
            LeaderboardView.load();
        };

        document.getElementById('navAnalytics').onclick = () => {
            UI.switchView('analyticsView');
            AnalyticsView.load();
        };

        document.getElementById('navLogin').onclick = () => {
            UI.switchView('authView');
            switchAuthForm(true);
        };

        document.getElementById('navSignup').onclick = () => {
            UI.switchView('authView');
            switchAuthForm(false);
        };

        document.getElementById('navDashboard').onclick = () => {
            Dashboard.switchToDashboard(AppState.getRole());
        };

        document.getElementById('navLogout').onclick = () => {
            AppState.logout();
            UI.showAuthButtons();
            UI.switchView('landingPage');
            UI.showToast('logged_out', 'info');
        };

        // Landing CTA
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
            document.querySelector('.map-container')?.scrollIntoView({ behavior: 'smooth' });
        };

        // Auth forms
        document.getElementById('loginFormElement').onsubmit = (e) => this.handleLogin(e);
        document.getElementById('signupFormElement').onsubmit = (e) => this.handleSignup(e);

        // Language toggle
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.onclick = () => I18n.setLang(btn.dataset.lang);
        });

        // Dark mode
        document.getElementById('darkModeToggle').onclick = () => DarkMode.toggle();
    }

    static async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await API.login(email, password);
            AppState.setUser(response.user, response.token, response.role);
            UI.showToast('login_success', 'success');
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
            UI.showToast('select_role_error', 'error');
            return;
        }

        try {
            const response = await API.signup(role, username, fullName, email, password);
            AppState.setUser(response.user, response.token, response.role);
            UI.showToast('signup_success', 'success');
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

        try {
            const tickets = await API.getTickets({ generated_by: AppState.getUser().id });
            this.renderMarkerTickets(tickets);
        } catch (e) { console.error(e); }

        document.getElementById('createTicketBtn').onclick = () => this.showTicketModal();
    }

    static async loadVolunteerDashboard(stats) {
        const location = await Utils.getCurrentLocation();
        AppState.userLocation = location;

        document.getElementById('volunteerTicketsClaimed').textContent = stats.tickets_claimed || 0;
        document.getElementById('volunteerTicketsClosed').textContent = stats.tickets_closed || 0;
        document.getElementById('volunteerScore').textContent = stats.total_score || 0;
        document.getElementById('volunteerTrust').textContent = `${stats.trust_score || 50}%`;

        // Render badges
        BadgeSystem.renderBadges(stats.badges || [], document.getElementById('badgesGrid'));

        try {
            const allTickets = await API.getTickets({ status: 'Unclaimed' });
            const nearbyTickets = allTickets.filter(ticket => {
                const distance = Utils.calculateDistance(
                    location.latitude, location.longitude,
                    ticket.latitude, ticket.longitude
                );
                return distance <= DISTANCE_THRESHOLD_KM;
            });

            this.renderAvailableTickets(nearbyTickets);
        } catch (e) { console.error(e); }

        try {
            const myTickets = await API.getTickets({ claimed_by: AppState.getUser().id });
            this.renderClaimedTickets(myTickets.filter(t => t.status !== 'Cleared'));
        } catch (e) { console.error(e); }
    }

    static async loadAuthorityDashboard(stats) {
        document.getElementById('authorityApproved').textContent = stats.tickets_approved || 0;

        try {
            const pendingTickets = await API.getTickets({ status: 'Unclaimed' });
            document.getElementById('authorityPending').textContent = pendingTickets.length;
            this.renderPendingTickets(pendingTickets);
        } catch (e) { console.error(e); }

        try {
            const inProgressTickets = await API.getTickets({ status: 'In Progress' });
            this.renderClearanceTickets(inProgressTickets);
        } catch (e) { console.error(e); }
    }

    static renderMarkerTickets(tickets) {
        const container = document.getElementById('markerTickets');
        container.innerHTML = '';
        if (tickets.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>${I18n.t('no_tickets_found')}</p></div>`;
            return;
        }
        tickets.forEach(ticket => {
            const card = UI.createTicketCard(ticket);
            container.appendChild(card);
        });
    }

    static renderAvailableTickets(tickets) {
        const container = document.getElementById('availableTickets');
        container.innerHTML = '';
        if (tickets.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>${I18n.t('no_tickets_found')}</p></div>`;
            return;
        }

        tickets.forEach(ticket => {
            const card = UI.createTicketCard(ticket);
            const actionsDiv = card.querySelector('.ticket-actions');

            if (ticket.status === 'Unclaimed') {
                const claimBtn = document.createElement('button');
                claimBtn.className = 'btn btn-primary';
                claimBtn.textContent = I18n.t('claim');
                claimBtn.onclick = async () => {
                    try {
                        await API.claimTicket(ticket.id);
                        UI.showToast('ticket_claimed', 'success');
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
        if (tickets.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>${I18n.t('no_tickets_found')}</p></div>`;
            return;
        }

        tickets.forEach(ticket => {
            const card = UI.createTicketCard(ticket);
            const actionsDiv = card.querySelector('.ticket-actions');

            if (ticket.status === 'In Progress' || ticket.status === 'Pending Proof') {
                // Timer
                const timerDiv = document.createElement('div');
                timerDiv.className = 'ticket-timer';
                timerDiv.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    ${Utils.getElapsedTime(ticket.cleanup_started_at || ticket.ticket_claim_time)} ${I18n.t('elapsed')}
                `;
                actionsDiv.parentElement.insertBefore(timerDiv, actionsDiv);

                // Days remaining
                const daysRemaining = Utils.getTimeRemaining(ticket.ticket_claim_time);
                const timeDiv = document.createElement('div');
                timeDiv.className = 'ticket-timer';
                timeDiv.style.color = daysRemaining <= 1 ? 'var(--danger)' : 'var(--text-secondary)';
                timeDiv.textContent = `${daysRemaining} ${I18n.t('days_remaining')}`;
                actionsDiv.parentElement.insertBefore(timeDiv, actionsDiv);

                // Mark Complete button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'btn btn-success';
                closeBtn.textContent = I18n.t('mark_complete');
                closeBtn.onclick = () => {
                    this.showProofModal(ticket);
                };
                actionsDiv.appendChild(closeBtn);
            }

            container.appendChild(card);
        });
    }

    static renderPendingTickets(tickets) {
        const container = document.getElementById('pendingTickets');
        container.innerHTML = '';
        if (tickets.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>${I18n.t('no_tickets_found')}</p></div>`;
            return;
        }

        tickets.forEach(ticket => {
            const card = UI.createTicketCard(ticket);
            const actionsDiv = card.querySelector('.ticket-actions');

            const approveBtn = document.createElement('button');
            approveBtn.className = 'btn btn-success';
            approveBtn.textContent = I18n.t('approve');
            approveBtn.onclick = async () => {
                try {
                    await API.approveTicket(ticket.id);
                    UI.showToast('ticket_approved', 'success');
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
        if (tickets.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>${I18n.t('no_tickets_found')}</p></div>`;
            return;
        }

        tickets.forEach(ticket => {
            const card = UI.createTicketCard(ticket);
            const actionsDiv = card.querySelector('.ticket-actions');

            if (ticket.volunteer_photo_url) {
                // Show before/after
                const verifyBtn = document.createElement('button');
                verifyBtn.className = 'btn btn-success';
                verifyBtn.textContent = I18n.t('verify_clearance');
                verifyBtn.onclick = async () => {
                    try {
                        await API.approveTicket(ticket.id); // reuses approve to set Cleared
                        UI.showToast('ticket_cleared', 'success');
                        Dashboard.loadDashboard('authority');
                    } catch (error) {
                        UI.showToast(error.message, 'error');
                    }
                };
                actionsDiv.appendChild(verifyBtn);
            }

            // Community verification button
            const communityBtn = document.createElement('button');
            communityBtn.className = 'verification-btn';
            communityBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ${I18n.t('looks_clean')} ${ticket.verification_count > 0 ? `(${ticket.verification_count})` : ''}
            `;
            communityBtn.onclick = async () => {
                try {
                    await API.verifyTicket(ticket.id);
                    communityBtn.style.color = 'var(--success)';
                    communityBtn.style.borderColor = 'var(--success)';
                } catch (error) {
                    UI.showToast(error.message, 'error');
                }
            };
            actionsDiv.appendChild(communityBtn);

            container.appendChild(card);
        });
    }

    // ==================== MODALS ====================
    static showTicketModal() {
        const modal = document.getElementById('ticketModal');
        const form = document.getElementById('ticketForm');

        // Reset form to original state
        form.innerHTML = `
            <div class="form-group">
                <label for="ticketPhoto" data-i18n="upload_photo">${I18n.t('upload_photo')}</label>
                <input type="file" id="ticketPhoto" accept="image/*" required>
                <div id="photoPreview" class="photo-preview"></div>
            </div>
            <div class="form-group">
                <label for="ticketLocation" data-i18n="location">${I18n.t('location')}</label>
                <div id="ticketLocation" class="location-display"></div>
                <button type="button" id="useLocationBtn" class="btn btn-secondary" data-i18n="get_location">${I18n.t('get_location')}</button>
            </div>
            <div class="form-group">
                <label for="ticketSeverity" data-i18n="severity_level">${I18n.t('severity_level')}</label>
                <select id="ticketSeverity" required>
                    <option value="">${I18n.t('select_severity')}</option>
                    <option value="Low">${I18n.t('severity_low')}</option>
                    <option value="Medium">${I18n.t('severity_medium')}</option>
                    <option value="High">${I18n.t('severity_high')}</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary btn-full">${I18n.t('create_ticket_submit')}</button>
        `;

        document.getElementById('modalTitle').textContent = I18n.t('create_new_ticket');

        form.onsubmit = (e) => this.handleCreateTicket(e);

        document.getElementById('useLocationBtn').onclick = async () => {
            const location = await Utils.getCurrentLocation();
            AppState.userLocation = location;
            document.getElementById('ticketLocation').textContent =
                `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
        };

        document.getElementById('ticketPhoto').onchange = (e) => {
            this.previewPhoto(e.target.files[0], 'photoPreview');
        };

        modal.classList.add('active');
    }

    static showProofModal(ticket) {
        const modal = document.getElementById('proofModal');
        AppState.currentProofTicket = ticket;

        // Show before image
        const beforeContainer = document.getElementById('proofBefore');
        if (ticket.marker_photo_url) {
            beforeContainer.innerHTML = `<img src="${ticket.marker_photo_url}" alt="Before">`;
        } else {
            beforeContainer.innerHTML = '<div class="proof-upload-placeholder"><span>No image</span></div>';
        }

        // Reset after
        const afterPlaceholder = document.getElementById('proofAfterPlaceholder');
        const afterContainer = document.getElementById('proofAfter');
        afterContainer.classList.remove('has-image');
        if (afterPlaceholder) afterPlaceholder.style.display = '';

        const photoInput = document.getElementById('proofAfterPhoto');
        photoInput.value = '';
        photoInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    afterContainer.classList.add('has-image');
                    // Remove placeholder and add image
                    const existingImg = afterContainer.querySelector('img');
                    if (existingImg) existingImg.remove();
                    const img = document.createElement('img');
                    img.src = ev.target.result;
                    img.alt = 'After';
                    afterContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        };

        document.getElementById('proofSubmitBtn').onclick = () => this.handleProofSubmit();
        modal.classList.add('active');
    }

    static async handleProofSubmit() {
        const ticket = AppState.currentProofTicket;
        if (!ticket) return;

        const photoInput = document.getElementById('proofAfterPhoto');
        const file = photoInput.files[0];

        if (!file) {
            UI.showToast('proof_required', 'error');
            return;
        }

        try {
            const photoResult = await API.uploadPhoto(file);
            const result = await API.closeTicket(ticket.id, photoResult.url);

            UI.showToast('ticket_completed', 'success');
            if (result.points_earned) {
                UI.showToast('points_earned', 'info', `+${result.points_earned}`);
            }

            document.getElementById('proofModal').classList.remove('active');
            AppState.currentProofTicket = null;
            Dashboard.loadDashboard('volunteer');
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }

    static previewPhoto(file, containerId) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById(containerId);
                if (preview) preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
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
            UI.showToast('fill_fields', 'error');
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
            UI.showToast('ticket_created', 'success');
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

        AppState.map = L.map('map').setView([location.latitude, location.longitude], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
        }).addTo(AppState.map);

        this.updateMap();
    }

    static async updateMap() {
        try {
            const tickets = await API.getTickets();

            // Remove old markers
            if (AppState.markerLayers) {
                AppState.markerLayers.forEach(m => AppState.map.removeLayer(m));
            }
            AppState.markerLayers = [];

            // Add markers
            tickets.forEach(ticket => {
                const color = ticket.severity === 'Low' ? '#34d399' :
                              ticket.severity === 'Medium' ? '#fbbf24' : '#ef4444';

                const marker = L.circleMarker([ticket.latitude, ticket.longitude], {
                    radius: 8,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 0.9,
                    fillOpacity: 0.8
                });

                const popupContent = `
                    <div style="font-family: Inter, sans-serif; font-size: 13px; line-height: 1.5;">
                        <strong>${ticket.severity} Severity</strong><br>
                        Status: ${ticket.status}<br>
                        ${ticket.marker_photo_url ? `<img src="${ticket.marker_photo_url}" style="width:100%;max-height:120px;object-fit:cover;margin-top:6px;border-radius:6px;">` : ''}
                        ${ticket.volunteer_photo_url ? `<br><strong>After:</strong><br><img src="${ticket.volunteer_photo_url}" style="width:100%;max-height:120px;object-fit:cover;margin-top:4px;border-radius:6px;border:2px solid #34d399;">` : ''}
                    </div>
                `;

                marker.bindPopup(popupContent);
                marker.addTo(AppState.map);
                AppState.markerLayers.push(marker);
            });

            // Load and show hotspots
            try {
                const hsData = await API.getHotspots();
                (hsData.hotspots || []).forEach(hs => {
                    const hotspotCircle = L.circle([hs.latitude, hs.longitude], {
                        radius: 500,
                        color: '#ef4444',
                        fillColor: '#ef4444',
                        fillOpacity: 0.15,
                        weight: 2,
                        dashArray: '5, 10'
                    });
                    hotspotCircle.bindPopup(
                        `<strong>Hotspot Zone</strong><br>${hs.report_count} reports<br>Risk: ${hs.risk_level}`
                    );
                    hotspotCircle.addTo(AppState.map);
                    AppState.markerLayers.push(hotspotCircle);
                });
            } catch (e) { /* hotspots optional */ }

        } catch (error) {
            console.error('Map update error:', error);
        }
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize i18n FIRST
    I18n.init();

    // Initialize dark mode
    DarkMode.init();

    // Initialize map
    try {
        await HeatMap.initMap();
    } catch (error) {
        console.error('Map initialization error:', error);
    }

    // Load analytics for strip
    try {
        AnalyticsView.load();
    } catch (error) {
        console.error('Analytics init error:', error);
    }

    // Setup location filtering
    document.getElementById('useCurrentLocation').onclick = async () => {
        const location = await Utils.getCurrentLocation();
        AppState.userLocation = location;
        loadNearbyTickets();
    };

    // Initialize authentication
    await Auth.init();

    // Modal close handlers
    document.getElementById('modalCloseBtn').onclick = () => {
        document.getElementById('ticketModal').classList.remove('active');
    };

    document.getElementById('proofModalCloseBtn').onclick = () => {
        document.getElementById('proofModal').classList.remove('active');
    };

    // Close modals on overlay click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('active');
        };
    });

    // Start live polling
    LeaderboardView.startPolling();
    AnalyticsView.startPolling();
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
        UI.showToast('enable_location', 'info');
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
            const distanceMatch = distance <= 50;
            const notCleared = ticket.status !== 'Cleared';

            return statusMatch && distanceMatch && notCleared;
        });

        const container = document.getElementById('ticketsList');
        container.innerHTML = '';

        nearbyTickets.forEach(ticket => {
            const card = UI.createTicketCard(ticket);

            // Add community verify button
            const actionsDiv = card.querySelector('.ticket-actions');
            if (ticket.status === 'In Progress' || ticket.status === 'Cleared') {
                const verifyBtn = document.createElement('button');
                verifyBtn.className = 'verification-btn';
                verifyBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ${I18n.t('looks_clean')} ${ticket.verification_count > 0 ? `(${ticket.verification_count})` : ''}
                `;
                verifyBtn.onclick = async () => {
                    try {
                        await API.verifyTicket(ticket.id);
                        verifyBtn.style.color = 'var(--success)';
                        verifyBtn.style.borderColor = 'var(--success)';
                    } catch (error) {
                        UI.showToast(error.message, 'error');
                    }
                };
                actionsDiv.appendChild(verifyBtn);
            }

            container.appendChild(card);
        });

        if (nearbyTickets.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>${I18n.t('no_tickets_found')}</p></div>`;
        }
    } catch (error) {
        UI.showToast(error.message, 'error');
    }
}

// Refresh data every 30 seconds when on landing page
setInterval(async () => {
    if (document.getElementById('landingPage')?.classList.contains('active')) {
        loadNearbyTickets();
        HeatMap.updateMap();
    }
}, 30000);
