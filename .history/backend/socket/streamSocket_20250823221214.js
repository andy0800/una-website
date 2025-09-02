const { Server } = require('socket.io');
module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log('🟢 New client connected');


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