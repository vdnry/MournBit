// ========================================
// Map — Leaflet + Heatmap + Markers
// ========================================

let map;
let markersLayer;
let heatLayer;
let heatmapVisible = false;
let showCleared = false;
let allTickets = [];
let clickedLatLng = null;

// Severity color mapping
const SEVERITY_COLORS = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#ef4444'
};

const STATUS_ICONS = {
  Pending: '⏳',
  Unclaimed: '🗑️',
  'In Progress': '🔧',
  'Pending Proof': '📸',
  Cleared: '✅'
};

// Initialize map
function initMap() {
  map = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView([12.9716, 77.5946], 15); // Bangalore default

  // Dark-themed tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  // Add attribution back in corner
  L.control.attribution({
    prefix: false,
    position: 'bottomleft'
  }).addAttribution('© <a href="https://carto.com/">CARTO</a>').addTo(map);

  // Marker layer group
  markersLayer = L.layerGroup().addTo(map);

  // Click handler for creating tickets
  map.on('click', onMapClick);

  // Try to get user location
  goToMyLocation();

  // Load initial data
  refreshMap();
  refreshStats();
}

function onMapClick(e) {
  if (!currentUser || currentUser.activeRole !== 'Marker') return;

  clickedLatLng = e.latlng;
  document.getElementById('ticket-lat').textContent = e.latlng.lat.toFixed(6);
  document.getElementById('ticket-lng').textContent = e.latlng.lng.toFixed(6);
  openTicketModal();
}

// Refresh map markers
async function refreshMap() {
  try {
    const params = showCleared ? '?includeCleared=true' : '';
    const tickets = await fetch(`${API_BASE}/tickets${params}`).then(r => r.json());
    allTickets = tickets;
    renderMarkers(tickets);
    if (heatmapVisible) renderHeatmap(tickets);
  } catch (err) {
    console.error('Failed to load tickets:', err);
  }
}

// Render markers on map
function renderMarkers(tickets) {
  markersLayer.clearLayers();

  tickets.forEach(ticket => {
    const [lng, lat] = ticket.location.coordinates;
    const color = SEVERITY_COLORS[ticket.severity] || '#6366f1';
    const statusIcon = STATUS_ICONS[ticket.status] || '❓';

    // Create custom circle marker
    const marker = L.circleMarker([lat, lng], {
      radius: ticket.severity === 'High' ? 12 : ticket.severity === 'Medium' ? 10 : 8,
      fillColor: color,
      color: color,
      weight: 2,
      opacity: ticket.status === 'Cleared' ? 0.4 : 0.9,
      fillOpacity: ticket.status === 'Cleared' ? 0.2 : 0.6
    });

    // Popup content
    const popupHtml = buildPopupHtml(ticket, statusIcon);
    marker.bindPopup(popupHtml, { maxWidth: 300 });

    markersLayer.addLayer(marker);
  });
}

function buildPopupHtml(ticket, statusIcon) {
  const [lng, lat] = ticket.location.coordinates;
  const reporter = ticket.generatedBy ? ticket.generatedBy.fullName || ticket.generatedBy.username : 'Unknown';
  const timeAgo = getTimeAgo(ticket.generationTime);

  let actionsHtml = '';

  if (currentUser) {
    if (currentUser.activeRole === 'Authority' && ticket.status === 'Pending') {
      actionsHtml += `<button class="btn-approve" onclick="approveTicket('${ticket._id}')">✅ Approve</button>`;
    }
    if (currentUser.activeRole === 'Volunteer' && ticket.status === 'Unclaimed') {
      actionsHtml += `<button class="btn-claim" onclick="claimTicket('${ticket._id}')">🤝 Claim</button>`;
    }
    if (currentUser.activeRole === 'Volunteer' && ticket.status === 'In Progress' &&
        ticket.claimedBy && ticket.claimedBy._id === currentUser.volunteerId) {
      actionsHtml += `<button class="btn-clear" onclick="openCleanupModal('${ticket._id}')">📸 Submit Cleanup</button>`;
    }
    if (currentUser.activeRole === 'Authority' && ticket.status === 'Pending Proof') {
      actionsHtml += `<button class="btn-close-ticket" onclick="closeTicket('${ticket._id}')">✅ Close Ticket</button>`;
    }
  }

  actionsHtml += `<button class="btn-view" onclick="viewTicketDetail('${ticket._id}')">👁️ Details</button>`;

  let photosHtml = ticket.photoUrl ? `<img src="${ticket.photoUrl}" style="width:100%; border-radius:4px; margin-bottom:10px;" alt="Before">` : '';
  if (ticket.cleanupPhotoUrl) {
    photosHtml = `
      <div style="display:flex; gap:5px; margin-bottom:10px;">
        <img src="${ticket.photoUrl}" style="width:48%; border-radius:4px; object-fit:cover;" alt="Before">
        <img src="${ticket.cleanupPhotoUrl}" style="width:48%; border-radius:4px; object-fit:cover;" alt="After">
      </div>
    `;
  }

  return `
    <div class="popup-content">
      <h3>${statusIcon} Garbage Dump</h3>
      <div class="popup-info">
        <span><span class="severity-badge ${ticket.severity.toLowerCase()}">${ticket.severity}</span> <span class="status-badge ${ticket.status.toLowerCase().replace(/ /g, '-')}">${ticket.status}</span></span>
        <span>📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
        <span>👤 ${reporter} · ${timeAgo}</span>
        ${ticket.claimedBy ? `<span>🤝 Claimed by: ${ticket.claimedBy.fullName || ticket.claimedBy.username} ${ticket.claimedBy.points ? `(Score: ${ticket.claimedBy.points})` : ''}</span>` : ''}
        ${ticket.claimDeadline && ticket.status === 'In Progress' ? `<span class="countdown">⏰ Deadline: ${formatDeadline(ticket.claimDeadline)}</span>` : ''}
      </div>
      ${photosHtml}
      <div class="popup-actions">${actionsHtml}</div>
    </div>
  `;
}

// Heatmap
function renderHeatmap(tickets) {
  if (heatLayer) {
    map.removeLayer(heatLayer);
  }

  const heatData = tickets
    .filter(t => t.status !== 'Cleared')
    .map(t => {
      const [lng, lat] = t.location.coordinates;
      const intensity = t.severity === 'High' ? 1.0 : t.severity === 'Medium' ? 0.6 : 0.3;
      return [lat, lng, intensity];
    });

  heatLayer = L.heatLayer(heatData, {
    radius: 30,
    blur: 20,
    maxZoom: 17,
    gradient: {
      0.2: '#22c55e',
      0.5: '#f59e0b',
      0.8: '#ef4444',
      1.0: '#dc2626'
    }
  }).addTo(map);
}

function toggleHeatmap() {
  heatmapVisible = !heatmapVisible;
  const btn = document.getElementById('btn-toggle-heat');
  btn.classList.toggle('active', heatmapVisible);

  if (heatmapVisible) {
    renderHeatmap(allTickets);
  } else if (heatLayer) {
    map.removeLayer(heatLayer);
  }
}

function toggleCleared() {
  showCleared = !showCleared;
  const btn = document.getElementById('btn-toggle-cleared');
  btn.classList.toggle('active', showCleared);
  btn.textContent = showCleared ? '👁️ Hide Cleared' : '👁️ Show Cleared';
  refreshMap();
}

function goToMyLocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 15);
      },
      (err) => {
        console.log('Geolocation denied, using default (Bangalore)');
      },
      { timeout: 5000 }
    );
  }
}

// Refresh stats
async function refreshStats() {
  try {
    const stats = await fetch(`${API_BASE}/stats`).then(r => r.json());
    document.getElementById('stat-total').textContent = stats.totalReports;
    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-unclaimed').textContent = stats.unclaimed;
    document.getElementById('stat-inprogress').textContent = stats.inProgress;
    document.getElementById('stat-cleared').textContent = stats.cleared;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// ========================================
// Ticket Actions
// ========================================

async function approveTicket(id) {
  try {
    await api(`/tickets/${id}/approve`, { method: 'PATCH' });
    showToast('Ticket approved!', 'success');
    map.closePopup();
    refreshMap();
    refreshStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function claimTicket(id) {
  try {
    await api(`/tickets/${id}/claim`, { method: 'PATCH' });
    showToast('Ticket claimed! You have 3 days to clean up.', 'success');
    map.closePopup();
    refreshMap();
    refreshStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function closeTicket(id) {
  try {
    await api(`/tickets/${id}/close`, { method: 'PATCH' });
    showToast('Ticket closed! Garbage dump cleared! 🎉', 'success');
    map.closePopup();
    refreshMap();
    refreshStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========================================
// Create Ticket
// ========================================

function openTicketModal() {
  document.getElementById('ticket-modal').classList.remove('hidden');
}

function closeTicketModal() {
  document.getElementById('ticket-modal').classList.add('hidden');
  clickedLatLng = null;
}

function useMyLocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clickedLatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        document.getElementById('ticket-lat').textContent = pos.coords.latitude.toFixed(6);
        document.getElementById('ticket-lng').textContent = pos.coords.longitude.toFixed(6);
      },
      () => showToast('Could not get location', 'error'),
      { timeout: 5000 }
    );
  }
}

async function handleCreateTicket(e) {
  e.preventDefault();

  if (!clickedLatLng) {
    showToast('Please select a location on the map or use your location', 'error');
    return;
  }

  const severity = document.querySelector('input[name="severity"]:checked')?.value;
  const photoInput = document.getElementById('ticket-photo');

  if (!severity) {
    showToast('Please select severity level', 'error');
    return;
  }

  if (!photoInput.files[0]) {
    showToast('Please upload a photo', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('latitude', clickedLatLng.lat);
  formData.append('longitude', clickedLatLng.lng);
  formData.append('severity', severity);
  formData.append('photo', photoInput.files[0]);

  try {
    await api('/tickets', {
      method: 'POST',
      body: formData
    });

    showToast('Garbage report submitted! 🗑️', 'success');
    closeTicketModal();
    document.getElementById('form-ticket').reset();
    refreshMap();
    refreshStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Photo preview
document.addEventListener('DOMContentLoaded', () => {
  const photoInput = document.getElementById('ticket-photo');
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const preview = document.getElementById('photo-preview');
      const previewImg = document.getElementById('photo-preview-img');

      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImg.src = ev.target.result;
          preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      } else {
        preview.classList.add('hidden');
      }
    });
  }
});

// ========================================
// Cleanup Modal
// ========================================

function openCleanupModal(ticketId) {
  document.getElementById('cleanup-ticket-id').value = ticketId;
  document.getElementById('cleanup-modal').classList.remove('hidden');
  map.closePopup();
}

function closeCleanupModal() {
  document.getElementById('cleanup-modal').classList.add('hidden');
}

async function handleClearTicket(e) {
  e.preventDefault();

  const ticketId = document.getElementById('cleanup-ticket-id').value;
  const photoInput = document.getElementById('cleanup-photo');

  if (!photoInput.files[0]) {
    showToast('Please upload a cleanup photo', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('photo', photoInput.files[0]);

  try {
    await api(`/tickets/${ticketId}/clear`, {
      method: 'PATCH',
      body: formData
    });

    showToast('Cleanup photo submitted! Waiting for authority verification.', 'success');
    closeCleanupModal();
    document.getElementById('form-cleanup').reset();
    refreshMap();
    refreshStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========================================
// Ticket Detail Modal
// ========================================

async function viewTicketDetail(id) {
  try {
    const ticket = await fetch(`${API_BASE}/tickets/${id}`).then(r => r.json());
    const detailContent = document.getElementById('detail-content');
    const [lng, lat] = ticket.location.coordinates;

    let photosHtml = '';
    if (ticket.photoUrl) {
      photosHtml += `
        <div class="detail-photo-card">
          <img src="${ticket.photoUrl}" alt="Garbage dump" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\'><rect fill=\\'%231a1f2e\\' width=\\'200\\' height=\\'200\\'/><text x=\\'50%25\\' y=\\'50%25\\' fill=\\'%2364748b\\' text-anchor=\\'middle\\' dy=\\'0.3em\\' font-size=\\'14\\'>No Image</text></svg>'">
          <p>📸 Report Photo</p>
        </div>`;
    }
    if (ticket.cleanupPhotoUrl && ticket.cleanupPhotoUrl !== '') {
      photosHtml += `
        <div class="detail-photo-card">
          <img src="${ticket.cleanupPhotoUrl}" alt="Cleanup" onerror="this.style.display='none'">
          <p>🧹 Cleanup Photo</p>
        </div>`;
    }

    const reporter = ticket.generatedBy ? (ticket.generatedBy.fullName || ticket.generatedBy.username) : 'Unknown';
    const approver = ticket.approvedBy ? (ticket.approvedBy.fullName || ticket.approvedBy.username) : '—';
    const claimer = ticket.claimedBy ? (ticket.claimedBy.fullName || ticket.claimedBy.username) : '—';

    let actionsHtml = '';
    if (currentUser) {
      if (currentUser.activeRole === 'Authority' && ticket.status === 'Pending') {
        actionsHtml += `<button class="btn-approve" onclick="approveTicket('${ticket._id}');closeDetailModal();">✅ Approve</button>`;
      }
      if (currentUser.activeRole === 'Volunteer' && ticket.status === 'Unclaimed') {
        actionsHtml += `<button class="btn-claim" onclick="claimTicket('${ticket._id}');closeDetailModal();">🤝 Claim</button>`;
      }
      if (currentUser.activeRole === 'Volunteer' && ticket.status === 'In Progress' &&
          ticket.claimedBy && ticket.claimedBy._id === currentUser.volunteerId) {
        actionsHtml += `<button class="btn-clear" onclick="openCleanupModal('${ticket._id}');closeDetailModal();">📸 Submit Cleanup</button>`;
      }
      if (currentUser.activeRole === 'Authority' && ticket.status === 'Pending Proof') {
        actionsHtml += `<button class="btn-close-ticket" onclick="closeTicket('${ticket._id}');closeDetailModal();">✅ Close</button>`;
      }
    }

    detailContent.innerHTML = `
      <div class="detail-header">
        <h2>${STATUS_ICONS[ticket.status] || ''} Ticket Details</h2>
        <div>
          <span class="severity-badge ${ticket.severity.toLowerCase()}">${ticket.severity}</span>
          <span class="status-badge ${ticket.status.toLowerCase().replace(/ /g, '-')}">${ticket.status}</span>
        </div>
      </div>

      <div class="detail-photos ${!ticket.cleanupPhotoUrl || ticket.cleanupPhotoUrl === '' ? 'single' : ''}">
        ${photosHtml}
      </div>

      <div class="detail-info-grid">
        <div class="detail-info-item">
          <label>Location</label>
          <p>📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
        </div>
        <div class="detail-info-item">
          <label>Reported By</label>
          <p>👤 ${reporter}</p>
        </div>
        <div class="detail-info-item">
          <label>Approved By</label>
          <p>🏛️ ${approver}</p>
        </div>
        <div class="detail-info-item">
          <label>Claimed By</label>
          <p>🤝 ${claimer}</p>
        </div>
        <div class="detail-info-item">
          <label>Reported</label>
          <p>📅 ${formatDate(ticket.generationTime)}</p>
        </div>
        <div class="detail-info-item">
          <label>Cleared</label>
          <p>📅 ${ticket.clearedTime ? formatDate(ticket.clearedTime) : '—'}</p>
        </div>
        ${ticket.claimDeadline && ticket.status === 'In Progress' ? `
        <div class="detail-info-item" style="grid-column: span 2;">
          <label>Claim Deadline</label>
          <p class="countdown ${new Date(ticket.claimDeadline) < new Date() ? 'expired' : ''}">⏰ ${formatDeadline(ticket.claimDeadline)}</p>
        </div>` : ''}
      </div>

      ${actionsHtml ? `<div class="detail-actions">${actionsHtml}</div>` : ''}
    `;

    document.getElementById('detail-modal').classList.remove('hidden');
    map.closePopup();
  } catch (err) {
    showToast('Failed to load ticket details', 'error');
  }
}

function closeDetailModal() {
  document.getElementById('detail-modal').classList.add('hidden');
}

// ========================================
// Utilities
// ========================================

function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${diffDays}d ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDeadline(dateStr) {
  const deadline = new Date(dateStr);
  const now = new Date();
  const diffMs = deadline - now;

  if (diffMs <= 0) return 'EXPIRED';

  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;

  if (days > 0) return `${days}d ${remainHours}h remaining`;
  return `${hours}h remaining`;
}
