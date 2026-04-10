module.exports = function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client can join a room based on their role
    socket.on('join:role', (role) => {
      socket.join(role);
      console.log(`👤 ${socket.id} joined room: ${role}`);
    });

    // Client can join a location-based room
    socket.on('join:location', (data) => {
      const roomName = `loc:${data.lat}:${data.lng}`;
      socket.join(roomName);
      console.log(`📍 ${socket.id} joined location room: ${roomName}`);
    });

    // Authority notifies volunteers in an area
    socket.on('notify:area', (data) => {
      io.to('Volunteer').emit('notification:area', {
        message: data.message,
        area: data.area,
        timestamp: new Date()
      });
      console.log(`📢 Area notification sent to Volunteers: ${data.message}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};
