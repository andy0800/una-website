module.exports = io => {
  let isStreamActive = false;
  let adminSocketId = null;

  io.on('connection', socket => {
    console.log('🟢 connected:', socket.id);

    // Viewer joins and requests to watch
    socket.on('watcher', () => {
      console.log('👀 watcher joined:', socket.id);
      if (isStreamActive && adminSocketId) {
        socket.emit('stream-started');
        io.to(adminSocketId).emit('viewer-join', socket.id);
      } else {
        socket.emit('stream-not-active');
      }
    });

    // Admin starts streaming
    socket.on('admin-start', () => {
      console.log('🎥 admin started stream:', socket.id);
      isStreamActive = true;
      adminSocketId = socket.id;
      io.emit('stream-started');
    });

    // Admin stops streaming
    socket.on('admin-end', () => {
      console.log('⏹️ admin stopped stream:', socket.id);
      isStreamActive = false;
      adminSocketId = null;
      io.emit('stream-stopped');
    });

    // WebRTC signaling
    socket.on('offer', ({ target, offer }) => {
      console.log('📤 offer from', socket.id, 'to', target);
      io.to(target).emit('offer', { socketId: socket.id, offer });
    });

    socket.on('answer', ({ target, answer }) => {
      console.log('📤 answer from', socket.id, 'to', target);
      io.to(target).emit('answer', { socketId: socket.id, answer });
    });

    socket.on('ice-candidate', ({ target, candidate }) => {
      io.to(target).emit('ice-candidate', { socketId: socket.id, candidate });
    });

    // Chat functionality
    socket.on('chat-message', data => {
      console.log('💬 chat message:', data);
      io.emit('chat-message', data);
    });

    // Mic request functionality
    socket.on('mic-request', data => {
      console.log('🎤 mic request:', data);
      io.emit('mic-request', { ...data, socketId: socket.id });
    });

    socket.on('mic-approved', ({ target }) => {
      console.log('✅ mic approved for:', target);
      io.to(target).emit('mic-approved');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ disconnected:', socket.id);
      
      // If admin disconnects, stop the stream
      if (socket.id === adminSocketId) {
        isStreamActive = false;
        adminSocketId = null;
        io.emit('stream-stopped');
      }
      
      io.emit('disconnectPeer', socket.id);
    });
  });
};