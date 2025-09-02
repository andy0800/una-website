const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Admin starts streaming
    socket.on('admin-start', () => {
      socket.broadcast.emit('admin-started');
    });

    // Viewer joins
    socket.on('viewer-join', () => {
      socket.broadcast.emit('viewer-join', socket.id);
    });

    // WebRTC offer/answer/candidates
    socket.on('offer', (data) => {
      io.to(data.target).emit('offer', data.offer);
    });

    socket.on('answer', (data) => {
      io.to(data.target).emit('answer', { socketId: socket.id, answer: data.answer });
    });

    socket.on('ice-candidate', (data) => {
      io.to(data.target).emit('ice-candidate', {
        socketId: socket.id,
        candidate: data.candidate
      });
    });

    // Chat
    socket.on('chat-message', (data) => {
      io.emit('chat-message', data);
    });

    // Mic request
    socket.on('mic-request', (data) => {
      io.emit('mic-request', { ...data, socketId: socket.id });
    });

    // Mic approval
    socket.on('mic-approved', (data) => {
      io.to(data.target).emit('mic-approved');
    });
  });
};

module.exports = socketHandler;