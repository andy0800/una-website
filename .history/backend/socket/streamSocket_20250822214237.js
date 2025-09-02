const { Server } = require('socket.io');

module.exports = function (server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  let viewers = 0;

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);
    viewers++;
    io.emit('viewer-count', viewers);

    // Admin starts streaming
    socket.on('admin-start-stream', () => {
      console.log('🚀 Admin started streaming');
      io.emit('stream-started');
    });

    // Admin stops streaming
    socket.on('admin-stop-stream', () => {
      console.log('🛑 Admin stopped streaming');
      io.emit('stream-stopped');
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
      io.emit('chat-message', data);
    });

    // Mic request logic
    socket.on('mic-request', (data) => {
      socket.emit('mic-approved');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected:', socket.id);
      viewers = Math.max(viewers - 1, 0);
      io.emit('viewer-count', viewers);
      socket.broadcast.emit('user-disconnected', socket.id);
    });
  });
};