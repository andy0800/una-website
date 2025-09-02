module.exports = io => {
  let isStreamActive = false;
  let adminSocketId = null;
  let connectedUsers = new Map(); // Store socketId -> userInfo mapping
  let viewerCount = 0; // Track actual viewer count
  
  // NEW: Recording functionality
  let isRecording = false;
  let recordingStartTime = null;
  let currentLectureId = null;

  io.on('connection', socket => {
    // Production-ready: Console logging removed

    // Viewer joins and requests to watch
    socket.on('watcher', (userInfo) => {
      // Production-ready: Console logging removed
      
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

    // NEW: Admin starts recording
    socket.on('admin-start-recording', (lectureId) => {
      console.log('🎬 admin started recording:', socket.id, 'Lecture ID:', lectureId);
      if (socket.id === adminSocketId) {
        isRecording = true;
        recordingStartTime = Date.now();
        currentLectureId = lectureId;
        io.emit('recording-started', { lectureId, startTime: recordingStartTime });
      }
    });

    // NEW: Admin stops recording
    socket.on('admin-stop-recording', () => {
      console.log('⏹️ admin stopped recording:', socket.id);
      if (socket.id === adminSocketId && isRecording) {
        isRecording = false;
        const recordingDuration = Math.floor((Date.now() - recordingStartTime) / 1000);
        io.emit('recording-stopped', { 
          lectureId: currentLectureId, 
          duration: recordingDuration,
          startTime: recordingStartTime 
        });
        
        // Reset recording state
        recordingStartTime = null;
        currentLectureId = null;
      }
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

    socket.on('admin-chat', message => {
      console.log('💬 admin chat:', message);
      io.emit('chat-message', { sender: 'Admin', message });
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
      io.to(adminSocketId).emit('mic-request', requestData);
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
      io.to(adminSocketId).emit('unmute-request', requestData);
    });

    // NEW: Mic approval system
    socket.on('approve-mic', (targetSocketId) => {
      console.log('✅ Admin approved mic for viewer:', targetSocketId);
      io.to(targetSocketId).emit('mic-approved');
    });

    socket.on('reject-mic', (targetSocketId) => {
      console.log('❌ Admin rejected mic for viewer:', targetSocketId);
      io.to(targetSocketId).emit('mic-rejected');
    });

    socket.on('mute-user-mic', (targetSocketId) => {
      console.log('🔇 Admin muted mic for viewer:', targetSocketId);
      io.to(targetSocketId).emit('mic-muted');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ disconnected:', socket.id);
      
      // If this was a viewer, update count
      if (connectedUsers.has(socket.id) && isStreamActive && adminSocketId) {
        viewerCount = Math.max(0, viewerCount - 1);
        io.to(adminSocketId).emit('disconnectPeer', { 
          socketId: socket.id, 
          viewerCount 
        });
        console.log('👤 Viewer', socket.id, 'disconnected. New count:', viewerCount);
      }
      
      // If this was the admin, stop the stream
      if (socket.id === adminSocketId) {
        isStreamActive = false;
        adminSocketId = null;
        viewerCount = 0;
        io.emit('stream-stopped');
        console.log('⏹️ Admin disconnected, stream stopped');
      }
      
      // Remove from connected users
      connectedUsers.delete(socket.id);
    });
  });
};