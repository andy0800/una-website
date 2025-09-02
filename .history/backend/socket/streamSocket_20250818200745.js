const { Server } = require('socket.io');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Admin starts streaming
    socket.on('admin-start-stream', () => {
      console.log('🚀 Admin started streaming');
      socket.broadcast.emit('stream-started');
    });

    socket.on('admin-stop-stream', () => {
      console.log('🛑 Admin stopped streaming');
      socket.broadcast.emit('stream-stopped');
    });

    // Viewer joins
    socket.on('watcher', () => {
      console.log(`👁️ Watcher joined: ${socket.id}`);
      socket.broadcast.emit('watcher', socket.id);
    });

    // WebRTC signaling
    socket.on('offer', (target, offer) => {
      io.to(target).emit('offer', socket.id, offer);
    });

    socket.on('answer', (target, answer) => {
      io.to(target).emit('answer', socket.id, answer);
    });

    socket.on('candidate', (target, candidate) => {
      io.to(target).emit('candidate', socket.id, candidate);
    });

    // Chat relay
    socket.on('chat-message', (data) => {
      socket.broadcast.emit('chat-message', data);
    });

    // Mic request logic (simplified)
    socket.on('mic-request', (data) => {
      // Auto-approve for demo
      socket.emit('mic-approved');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected:', socket.id);
      socket.broadcast.emit('user-disconnected', socket.id);
    });
  });
}

module.exports = { initSocket };