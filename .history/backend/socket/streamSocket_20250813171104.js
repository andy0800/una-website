
const { Server } = require('socket.io');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000', // allow frontend to connect
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  let broadcasterSocket = null;

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Admin starts the stream
    socket.on('admin-start-stream', () => {
      console.log('🚀 Admin started stream');
      broadcasterSocket = socket;
      socket.broadcast.emit('stream-started');
    });

    // Admin sends track info (just for logging now)
    socket.on('admin-track', (trackKind) => {
      console.log(`🎥 Admin sent track: ${trackKind}`);
    });

    // Admin stops the stream
    socket.on('admin-stop-stream', () => {
      console.log('🛑 Admin stopped stream');
      broadcasterSocket = null;
      socket.broadcast.emit('stream-stopped');
    });

    // Viewer joins
    socket.on('watcher', () => {
      console.log(`👁️ Watcher joined: ${socket.id}`);
      if (broadcasterSocket) {
        broadcasterSocket.emit('watcher', socket.id);
      }
    });

    // WebRTC signaling
    socket.on('offer', (id, message) => {
      io.to(id).emit('offer', socket.id, message);
    });

    socket.on('answer', (id, message) => {
      io.to(id).emit('answer', socket.id, message);
    });

    socket.on('candidate', (id, message) => {
      io.to(id).emit('candidate', socket.id, message);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('❌ Disconnected:', socket.id);
      socket.broadcast.emit('user-disconnected', socket.id);
    });
  });
}

module.exports = { initSocket };