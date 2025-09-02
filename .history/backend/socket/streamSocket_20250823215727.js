const { Server } = require('socket.io');

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('📡 User connected to live stream');

    socket.on('stream', (data) => {
      socket.broadcast.emit('stream', data);
    });

    socket.on('chatMessage', (message) => {
      socket.broadcast.emit('chatMessage', message);
    });

    socket.on('requestMic', () => {
      socket.broadcast.emit('requestMic');
    });

    socket.on('disconnect', () => {
      console.log('❌ User disconnected from live stream');
    });
  });
};