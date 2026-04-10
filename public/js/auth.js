// ========================================
// Auth — Login, Register, Session
// ========================================

const API_BASE = '/api';

let currentUser = null;
let authToken = null;

// Initialize auth from localStorage
function initAuth() {
  const saved = localStorage.getItem('mournbit_auth');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      authToken = data.token;
      currentUser = data.user;
      onAuthStateChanged();
    } catch (e) {
      localStorage.removeItem('mournbit_auth');
    }
  }
}

// API helper
async function api(endpoint, options = {}) {
  const headers = { ...options.headers };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const role = document.getElementById('login-role').value;

  try {
    hideAuthError();
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });

    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('mournbit_auth', JSON.stringify(data));

    closeAuthModal();
    onAuthStateChanged();
    showToast(`Welcome back, ${currentUser.fullName}!`, 'success');
  } catch (err) {
    showAuthError(err.message);
  }
}

// Register
async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const fullName = document.getElementById('reg-fullname').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;

  try {
    hideAuthError();
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, fullName, email, password, role })
    });

    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('mournbit_auth', JSON.stringify(data));

    closeAuthModal();
    onAuthStateChanged();
    showToast(`Welcome, ${currentUser.fullName}! Account created.`, 'success');
  } catch (err) {
    showAuthError(err.message);
  }
}

// Switch role (Marker ↔ Volunteer)
async function switchRole(targetRole) {
  if (!currentUser) return;
  if (currentUser.activeRole === targetRole) return;

  try {
    const data = await api('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ targetRole })
    });

    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('mournbit_auth', JSON.stringify(data));

    onAuthStateChanged();
    showToast(`Switched to ${targetRole} mode`, 'info');

    if (currentView === 'dashboard') refreshDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Logout
function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('mournbit_auth');
  onAuthStateChanged();
  showView('public');
  showToast('Logged out successfully', 'info');
}

// UI updates on auth state change
function onAuthStateChanged() {
  const btnLogin = document.getElementById('btn-login');
  const btnRegister = document.getElementById('btn-register');
  const btnLogout = document.getElementById('btn-logout');
  const btnDashboard = document.getElementById('btn-dashboard');
  const greeting = document.getElementById('user-greeting');
  const roleBadge = document.getElementById('user-role-badge');
  const roleSwitcher = document.getElementById('role-switcher');
  const fab = document.getElementById('fab-create');

  if (currentUser) {
    btnLogin.classList.add('hidden');
    btnRegister.classList.add('hidden');
    btnLogout.classList.remove('hidden');
    btnDashboard.classList.remove('hidden');
    greeting.classList.remove('hidden');
    greeting.textContent = currentUser.fullName;

    // Role badge
    roleBadge.classList.remove('hidden');
    roleBadge.textContent = currentUser.activeRole;
    roleBadge.className = `role-badge ${currentUser.activeRole.toLowerCase()}`;

    // Role switcher (only for Marker/Volunteer)
    if (currentUser.activeRole !== 'Authority') {
      roleSwitcher.classList.remove('hidden');
      document.getElementById('btn-switch-marker').classList.toggle('active', currentUser.activeRole === 'Marker');
      document.getElementById('btn-switch-volunteer').classList.toggle('active', currentUser.activeRole === 'Volunteer');
    } else {
      roleSwitcher.classList.add('hidden');
    }

    // FAB for creating tickets (Marker only)
    if (fab) {
      fab.classList.toggle('visible', currentUser.activeRole === 'Marker');
    }

    // Join socket room
    joinRoleRoom(currentUser.activeRole);
  } else {
    btnLogin.classList.remove('hidden');
    btnRegister.classList.remove('hidden');
    btnLogout.classList.add('hidden');
    btnDashboard.classList.add('hidden');
    greeting.classList.add('hidden');
    roleBadge.classList.add('hidden');
    roleSwitcher.classList.add('hidden');
    if (fab) fab.classList.remove('visible');
  }

  refreshMap();
}

// Modal helpers
function showAuthModal(type) {
  const modal = document.getElementById('auth-modal');
  const title = document.getElementById('auth-modal-title');
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');

  modal.classList.remove('hidden');
  hideAuthError();

  if (type === 'login') {
    title.textContent = 'Login';
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    title.textContent = 'Create Account';
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  }
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideAuthError() {
  document.getElementById('auth-error').classList.add('hidden');
}
