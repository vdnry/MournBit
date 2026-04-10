// ========================================
// App — Main entry point
// ========================================

let currentView = 'public';

// i18n
const translations = {
  en: {
    'nav.liveMap': 'Live Map',
    'nav.leaderboard': 'Leaderboard',
    'nav.dashboard': 'Dashboard',
    'role.marker': 'Marker',
    'role.volunteer': 'Volunteer',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    'leaderboard.title': 'Volunteer Leaderboard',
    'map.heatBtn': '🔥 Heatmap',
    'map.myLocBtn': '📍 My Location',
    'map.clearedBtn': '👁️ Show Cleared',
    'status.pending': 'Pending',
    'status.unclaimed': 'Unclaimed',
    'status.inProgress': 'In Progress',
    'status.pendingProof': 'Pending Proof',
    'status.cleared': 'Cleared',
    'ticket.severity': 'Severity',
    'ticket.submit': 'Submit',
    'stat.total': 'Total Reports',
    'leaderboard.rank': 'Rank',
    'leaderboard.name': 'Name',
    'leaderboard.cleanups': 'Cleanups',
    'leaderboard.score': 'Score'
  },
  hi: {
    'nav.liveMap': 'लाइव मैप',
    'nav.leaderboard': 'लीडरबोर्ड',
    'nav.dashboard': 'डैशबोर्ड',
    'role.marker': 'मार्कर',
    'role.volunteer': 'स्वयंसेवक',
    'nav.login': 'लॉग इन करें',
    'nav.register': 'रजिस्टर करें',
    'nav.logout': 'लॉग आउट',
    'leaderboard.title': 'स्वयंसेवक लीडरबोर्ड',
    'map.heatBtn': '🔥 हीटमैप',
    'map.myLocBtn': '📍 मेरी लोकेशन',
    'map.clearedBtn': '👁️ साफ़ दिखाएं',
    'status.pending': 'लंबित',
    'status.unclaimed': 'लावारिस',
    'status.inProgress': 'प्रगति पर है',
    'status.pendingProof': 'प्रमाण लंबित',
    'status.cleared': 'साफ़ किया गया',
    'ticket.severity': 'तीव्रता',
    'ticket.submit': 'जमा करें',
    'stat.total': 'कुल रिपोर्ट',
    'leaderboard.rank': 'रैंक',
    'leaderboard.name': 'नाम',
    'leaderboard.cleanups': 'सफाई संख्या',
    'leaderboard.score': 'अंक'
  }
};

let currentLang = localStorage.getItem('i18n_lang') || 'en';

function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('i18n_lang', lang);
  document.getElementById('lang-switch').value = lang;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  if (currentView === 'leaderboard') refreshLeaderboard();
  if (currentView === 'dashboard') refreshDashboard();
  if (currentView === 'public' && typeof fetchTickets === 'function') fetchTickets();
}

function t(key) {
  return translations[currentLang][key] || key;
}

// View management
function showView(view) {
  currentView = view;

  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));

  // Show selected view
  document.getElementById(`view-${view}`).classList.add('active-view');

  // Update nav buttons
  document.getElementById('btn-public-view').classList.toggle('active', view === 'public');
  const btnLeaderboard = document.getElementById('btn-leaderboard');
  if (btnLeaderboard) btnLeaderboard.classList.toggle('active', view === 'leaderboard');
  
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

  if (view === 'leaderboard') {
    refreshLeaderboard();
  }
}

async function refreshLeaderboard() {
  try {
    const res = await fetch('/api/stats/leaderboard');
    const volunteers = await res.json();
    const container = document.getElementById('leaderboard-content');
    
    if (!volunteers.length) {
      container.innerHTML = `<p>${currentLang === 'hi' ? 'कोई डेटा नहीं' : 'No data yet.'}</p>`;
      return;
    }

    let html = `
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="border-bottom: 1px solid #444;">
            <th style="padding: 10px;">${t('leaderboard.rank')}</th>
            <th style="padding: 10px;">${t('leaderboard.name')}</th>
            <th style="padding: 10px;">${t('leaderboard.cleanups')}</th>
            <th style="padding: 10px;">${t('leaderboard.score')}</th>
          </tr>
        </thead>
        <tbody>
    `;

    volunteers.forEach((v, index) => {
      html += `
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 10px;">#${index + 1}</td>
          <td style="padding: 10px;">${v.fullName} <small style="color:#aaa;">(@${v.username})</small></td>
          <td style="padding: 10px;">${v.ticketsClosed}</td>
          <td style="padding: 10px; font-weight: bold; color: #4ade80;">${v.points}</td>
        </tr>
      `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
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

  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.transition = 'all 300ms ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100px)';
      setTimeout(() => toast.remove(), 300);
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

  switchLanguage(currentLang); // Init i18n
  
  // Always show leaderboard since it's public
  document.getElementById('btn-leaderboard').classList.remove('hidden');

  // Init auth from storage
  initAuth();

  // Init map
  initMap();

  // Create FAB
  createFab();

  console.log('✅ MournBit ready!');
});
