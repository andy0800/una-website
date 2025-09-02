module.exports = io => {
  let isStreamActive = false;
  let adminSocketId = null;
  let connectedUsers = new Map(); // Store socketId -> userInfo mapping
  let viewerCount = 0; // Track actual viewer count

  io.on('connection', socket => {
    console.log('🟢 connected:', socket.id);

    // Viewer joins and requests to watch
    socket.on('watcher', (userInfo) => {
      console.log('👀 watcher joined:', socket.id, 'User:', userInfo?.name || 'Anonymous');
      
      // Store user info for this socket
      if (userInfo) {
        connectedUsers.set(socket.id, userInfo);
      }
      
      if (isStreamActive && adminSocketId) {
        socket.emit('stream-started');
        viewerCount++;
        io.to(adminSocketId).emit('viewer-join', { 
          socketId: socket.id, 
          userInfo,
          viewerCount 
        });
      } else {
        socket.emit('stream-not-active');
      }
    });

    // Admin starts streaming
    socket.on('admin-start', () => {
      console.log('🎥 admin started stream:', socket.id);
      isStreamActive = true;
      adminSocketId = socket.id;
      viewerCount = 0; // Reset viewer count
      io.emit('stream-started');
    });

    // Admin stops streaming
    socket.on('admin-end', () => {
      console.log('⏹️ admin stopped stream:', socket.id);
      isStreamActive = false;
      adminSocketId = null;
      viewerCount = 0; // Reset viewer count
      io.emit('stream-stopped');
    });

    // WebRTC signaling
    socket.on('offer', ({ target, offer }) => {
      console.log('📤 offer from', socket.id, 'to', target);
      io.to(target).emit('offer', { socketId: socket.id, offer });
    });

    socket.on('user-mic-offer', ({ target, offer }) => {
      console.log('🎤 user-mic-offer from', socket.id, 'to', target);
      io.to(target).emit('user-mic-offer', { socketId: socket.id, offer });
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
      const userInfo = connectedUsers.get(socket.id);
      const requestData = {
        ...data,
        socketId: socket.id,
        user: userInfo?.name || 'Anonymous',
        userInfo: userInfo
      };
      console.log('🎤 mic request:', requestData);
      io.emit('mic-request', requestData);
    });

    // Unmute request functionality
    socket.on('unmute-request', data => {
      const userInfo = connectedUsers.get(socket.id);
      const requestData = {
        ...data,
        socketId: socket.id,
        user: userInfo?.name || 'Anonymous',
        userInfo: userInfo
      };
      console.log('🔊 unmute request:', requestData);
      io.emit('unmute-request', requestData);
    });

    socket.on('mic-approved', ({ target }) => {
      console.log('✅ mic approved for:', target);
      io.to(target).emit('mic-approved');
    });

    socket.on('unmute-approved', ({ target }) => {
      console.log('✅ unmute approved for:', target);
      io.to(target).emit('unmute-approved');
    });

    // Handle user mic stream
    socket.on('user-mic-stream', ({ target, streamData }) => {
      console.log('🎤 User mic stream from:', socket.id, 'to:', target);
      io.to(target).emit('user-mic-stream', { 
        socketId: socket.id, 
        streamData,
        userInfo: connectedUsers.get(socket.id)
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ disconnected:', socket.id);
      
      // Check if this was a viewer and update count
      if (connectedUsers.has(socket.id) && isStreamActive && adminSocketId) {
        viewerCount = Math.max(0, viewerCount - 1);
        console.log(`👤 Viewer ${socket.id} disconnected. New count: ${viewerCount}`);
      }
      
      // Remove user info from connected users
      connectedUsers.delete(socket.id);
      
      // If admin disconnects, stop the stream
      if (socket.id === adminSocketId) {
        isStreamActive = false;
        adminSocketId = null;
        viewerCount = 0;
        io.emit('stream-stopped');
      }
      
      // Notify admin about disconnection with updated count
      if (isStreamActive && adminSocketId) {
        io.to(adminSocketId).emit('disconnectPeer', { 
          socketId: socket.id, 
          viewerCount 
        });
      } else {
        io.emit('disconnectPeer', socket.id);
      }
    });
  });
};