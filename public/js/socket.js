// ========================================
// Socket.io Client — Real-time connection
// ========================================

const socket = io();

socket.on('connect', () => {
  console.log('🔌 Connected to server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

// Listen for real-time ticket events
socket.on('ticket:created', (ticket) => {
  console.log('📣 New ticket created:', ticket);
  showToast('🗑️ New garbage report submitted!', 'info');
  refreshMap();
  refreshStats();
  if (currentView === 'dashboard') refreshDashboard();
});

socket.on('ticket:approved', (ticket) => {
  console.log('✅ Ticket approved:', ticket);
  showToast('✅ A ticket has been approved!', 'success');
  refreshMap();
  refreshStats();
  if (currentView === 'dashboard') refreshDashboard();
});

socket.on('ticket:claimed', (ticket) => {
  console.log('🤝 Ticket claimed:', ticket);
  showToast('🤝 A volunteer has claimed a ticket!', 'info');
  refreshMap();
  refreshStats();
  if (currentView === 'dashboard') refreshDashboard();
});

socket.on('ticket:clearRequested', (ticket) => {
  console.log('📸 Cleanup photo submitted:', ticket);
  showToast('📸 Volunteer submitted cleanup photo!', 'info');
  refreshMap();
  refreshStats();
  if (currentView === 'dashboard') refreshDashboard();
});

socket.on('ticket:closed', (ticket) => {
  console.log('🎉 Ticket closed:', ticket);
  showToast('🎉 A garbage dump has been cleaned!', 'success');
  refreshMap();
  refreshStats();
  if (currentView === 'dashboard') refreshDashboard();
});

socket.on('notification:area', (data) => {
  console.log('📢 Area notification:', data);
  showToast(`📢 ${data.message}`, 'warning');
});

// Join role room when authenticated
function joinRoleRoom(role) {
  socket.emit('join:role', role);
}
