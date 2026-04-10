// ========================================
// App — Main entry point
// ========================================

let currentView = 'public';

// View management
function showView(view) {
  currentView = view;

  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));

  // Show selected view
  document.getElementById(`view-${view}`).classList.add('active-view');

  // Update nav buttons
  document.getElementById('btn-public-view').classList.toggle('active', view === 'public');
  const btnDash = document.getElementById('btn-dashboard');
  if (btnDash) btnDash.classList.toggle('active', view === 'dashboard');

  if (view === 'public') {
    // Invalidate map size on view switch
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 100);
  }

  if (view === 'dashboard') {
    refreshDashboard();
  }
}

// Toast notification system
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');

  const icons = {
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  // Auto-remove after 4 seconds - minimal fade
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 100);
    }
  }, 4000);
}

// FAB button for creating tickets
function createFab() {
  const fab = document.createElement('button');
  fab.id = 'fab-create';
  fab.className = 'fab';
  fab.innerHTML = '＋';
  fab.title = 'Report Garbage Dump';
  fab.onclick = () => {
    // If no location clicked, prompt user
    if (!clickedLatLng) {
      useMyLocation();
      setTimeout(() => {
        openTicketModal();
      }, 500);
    } else {
      openTicketModal();
    }
  };
  document.body.appendChild(fab);

  // Show/hide based on auth
  if (currentUser && currentUser.activeRole === 'Marker') {
    fab.classList.add('visible');
  }
}

// ========================================
// Initialize App
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🗑️ MournBit initializing...');

  // Init auth from storage
  initAuth();

  // Init map
  initMap();

  // Create FAB
  createFab();

  console.log('✅ MournBit ready!');
});
