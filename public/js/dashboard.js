// ========================================
// Dashboard — Role-specific views
// ========================================

async function refreshDashboard() {
  if (!currentUser) return;

  const container = document.getElementById('dashboard-content');
  const role = currentUser.activeRole;

  try {
    // Get role-specific stats
    const stats = await api('/stats/me');

    // Get tickets for listing
    let tickets = [];
    try {
      tickets = await api('/tickets/all');
    } catch {
      tickets = await fetch(`${API_BASE}/tickets?includeCleared=true`).then(r => r.json());
    }

    if (role === 'Marker') {
      renderMarkerDashboard(container, stats, tickets);
    } else if (role === 'Volunteer') {
      renderVolunteerDashboard(container, stats, tickets);
    } else if (role === 'Authority') {
      renderAuthorityDashboard(container, stats, tickets);
    }
  } catch (err) {
    container.innerHTML = `<div class="dashboard-header"><h1>Dashboard</h1><p style="color:var(--red)">Error loading dashboard: ${err.message}</p></div>`;
  }
}

// ========================================
// Marker Dashboard
// ========================================

function renderMarkerDashboard(container, stats, tickets) {
  const myTickets = tickets.filter(t =>
    t.generatedBy && (t.generatedBy._id === currentUser.markerId || t.generatedBy._id === currentUser.id)
  );

  container.innerHTML = `
    <div class="dashboard-header">
      <h1>📍 Marker Dashboard</h1>
      <p>Track your garbage reports and their progress</p>
    </div>

    <div class="dashboard-stats">
      <div class="dash-stat-card">
        <div class="dash-stat-icon">🗑️</div>
        <div class="dash-stat-value" style="color:var(--blue)">${stats.ticketsGenerated}</div>
        <div class="dash-stat-label">Reports Generated</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-icon">✅</div>
        <div class="dash-stat-value" style="color:var(--green)">${stats.ticketsApproved}</div>
        <div class="dash-stat-label">Approved</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-icon">🎉</div>
        <div class="dash-stat-value" style="color:var(--purple)">${stats.ticketsCleared}</div>
        <div class="dash-stat-label">Cleared</div>
      </div>
    </div>

    <div class="dashboard-section">
      <h2>📋 Your Reports</h2>
      <div class="ticket-list">
        ${myTickets.length === 0 ? '<p style="color:var(--text-muted)">No reports yet. Click on the map to create one!</p>' : ''}
        ${myTickets.map(t => renderTicketCard(t)).join('')}
      </div>
    </div>
  `;
}

// ========================================
// Volunteer Dashboard
// ========================================

function renderVolunteerDashboard(container, stats, tickets) {
  const claimedTickets = tickets.filter(t =>
    t.claimedBy && (t.claimedBy._id === currentUser.volunteerId || t.claimedBy._id === currentUser.id)
  );
  const availableTickets = tickets.filter(t => t.status === 'Unclaimed');

  container.innerHTML = `
    <div class="dashboard-header">
      <h1>🤝 Volunteer Dashboard</h1>
      <p>Clean garbage dumps and make a difference</p>
    </div>

    <div class="dashboard-stats">
      <div class="dash-stat-card">
        <div class="dash-stat-icon">🤝</div>
        <div class="dash-stat-value" style="color:var(--blue)">${stats.ticketsClaimed}</div>
        <div class="dash-stat-label">Claimed</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-icon">🎉</div>
        <div class="dash-stat-value" style="color:var(--green)">${stats.ticketsClosed}</div>
        <div class="dash-stat-label">Closed</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-icon">📍</div>
        <div class="dash-stat-value" style="color:var(--orange)">${stats.nearbyTickets || 0}</div>
        <div class="dash-stat-label">Nearby (10km)</div>
      </div>
    </div>

    <div class="dashboard-section">
      <h2>🔧 Your Active Claims</h2>
      <div class="ticket-list">
        ${claimedTickets.length === 0 ? '<p style="color:var(--text-muted)">No active claims. Browse the map to find garbage dumps!</p>' : ''}
        ${claimedTickets.filter(t => t.status === 'In Progress').map(t => renderTicketCard(t, 'volunteer')).join('')}
      </div>
    </div>

    <div class="dashboard-section">
      <h2>🗑️ Available Tickets</h2>
      <div class="ticket-list">
        ${availableTickets.length === 0 ? '<p style="color:var(--text-muted)">No unclaimed tickets at the moment.</p>' : ''}
        ${availableTickets.map(t => renderTicketCard(t, 'volunteer')).join('')}
      </div>
    </div>
  `;
}

// ========================================
// Authority Dashboard
// ========================================

function renderAuthorityDashboard(container, stats, tickets) {
  const pendingTickets = tickets.filter(t => t.status === 'Pending');
  const awaitingClose = tickets.filter(t =>
    t.status === 'In Progress' && t.cleanupPhotoUrl && t.cleanupPhotoUrl !== ''
  );
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress');

  container.innerHTML = `
    <div class="dashboard-header">
      <h1>🏛️ Authority Dashboard</h1>
      <p>Review and manage garbage cleanup operations</p>
    </div>

    <div class="dashboard-stats">
      <div class="dash-stat-card">
        <div class="dash-stat-icon">✅</div>
        <div class="dash-stat-value" style="color:var(--green)">${stats.ticketsApproved}</div>
        <div class="dash-stat-label">Approved</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-icon">⏳</div>
        <div class="dash-stat-value" style="color:var(--orange)">${stats.pendingApproval}</div>
        <div class="dash-stat-label">Pending Approval</div>
      </div>
      <div class="dash-stat-card">
        <div class="dash-stat-icon">📸</div>
        <div class="dash-stat-value" style="color:var(--purple)">${stats.awaitingClose}</div>
        <div class="dash-stat-label">Awaiting Closure</div>
      </div>
    </div>

    <div class="dashboard-section">
      <h2>⏳ Pending Approval (${pendingTickets.length})</h2>
      <div class="ticket-list">
        ${pendingTickets.length === 0 ? '<p style="color:var(--text-muted)">No tickets pending approval.</p>' : ''}
        ${pendingTickets.map(t => renderTicketCard(t, 'authority')).join('')}
      </div>
    </div>

    <div class="dashboard-section">
      <h2>📸 Awaiting Closure (${awaitingClose.length})</h2>
      <div class="ticket-list">
        ${awaitingClose.length === 0 ? '<p style="color:var(--text-muted)">No tickets awaiting closure.</p>' : ''}
        ${awaitingClose.map(t => renderTicketCard(t, 'authority-close')).join('')}
      </div>
    </div>

    <div class="dashboard-section">
      <h2>🔧 In Progress (${inProgressTickets.length})</h2>
      <div class="ticket-list">
        ${inProgressTickets.length === 0 ? '<p style="color:var(--text-muted)">No tickets in progress.</p>' : ''}
        ${inProgressTickets.map(t => renderTicketCard(t)).join('')}
      </div>
    </div>
  `;
}

// ========================================
// Ticket Card Component
// ========================================

function renderTicketCard(ticket, context = '') {
  const [lng, lat] = ticket.location.coordinates;
  const reporter = ticket.generatedBy ? (ticket.generatedBy.fullName || ticket.generatedBy.username) : 'Unknown';
  const timeAgo = getTimeAgo(ticket.generationTime);

  let actionsHtml = '';
  if (context === 'volunteer' && ticket.status === 'Unclaimed') {
    actionsHtml = `<button class="btn-claim" onclick="claimTicket('${ticket._id}'); refreshDashboard();">🤝 Claim</button>`;
  } else if (context === 'volunteer' && ticket.status === 'In Progress') {
    actionsHtml = `<button class="btn-clear" onclick="openCleanupModal('${ticket._id}')">📸 Clear</button>`;
  } else if (context === 'authority' && ticket.status === 'Pending') {
    actionsHtml = `<button class="btn-approve" onclick="approveTicket('${ticket._id}'); refreshDashboard();">✅ Approve</button>`;
  } else if (context === 'authority-close') {
    actionsHtml = `<button class="btn-close-ticket" onclick="closeTicket('${ticket._id}'); refreshDashboard();">✅ Close</button>`;
  }

  actionsHtml += `<button class="btn-view" onclick="viewTicketDetail('${ticket._id}')">👁️</button>`;

  return `
    <div class="ticket-card">
      <img class="ticket-card-photo" src="${ticket.photoUrl}" alt="Garbage" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'80\\'><rect fill=\\'%231a1f2e\\' width=\\'80\\' height=\\'80\\'/><text x=\\'50%25\\' y=\\'50%25\\' fill=\\'%2364748b\\' text-anchor=\\'middle\\' dy=\\'0.3em\\' font-size=\\'10\\'>📷</text></svg>'">
      <div class="ticket-card-info">
        <h3>📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</h3>
        <p>👤 ${reporter} · ${timeAgo}</p>
        <div class="ticket-card-meta">
          <span class="severity-badge ${ticket.severity.toLowerCase()}">${ticket.severity}</span>
          <span class="status-badge ${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span>
          ${ticket.claimDeadline && ticket.status === 'In Progress' ?
            `<span class="countdown ${new Date(ticket.claimDeadline) < new Date() ? 'expired' : ''}">⏰ ${formatDeadline(ticket.claimDeadline)}</span>` : ''}
        </div>
      </div>
      <div class="ticket-card-actions">
        ${actionsHtml}
      </div>
    </div>
  `;
}
