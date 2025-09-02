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
    console.log('🔌 Connected:', socket.id);

    socket.on('admin-start-stream', () => {
      io.emit('stream-started');
    });

    socket.on('admin-stop-stream', () => {
      io.emit('stream-stopped');
    });

    socket.on('watcher', () => {
      socket.broadcast.emit('watcher', socket.id);
    });

    socket.on('offer', (target, offer) => {
      io.to(target).emit('offer', socket.id, offer);
    });

    socket.on('answer', (target, answer) => {
      io.to(target).emit('answer', socket.id, answer);
    });

    socket.on('candidate', (target, candidate) => {
      io.to(target).emit('candidate', socket.id, candidate);
    });

    socket.on('chat-message', (data) => {
      io.emit('chat-message', data);
    });

    socket.on('mic-request', () => {
      socket.emit('mic-approved');
    });

    socket.on('disconnect', () => {
      socket.broadcast.emit('user-disconnected', socket.id);
    });
  });
}

module.exports = { initSocket };