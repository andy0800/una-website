module.exports = io => {
  let isStreamActive = false;
  let adminSocketId = null;
  let connectedUsers = new Map(); // Store socketId -> userInfo mapping
  let viewerCount = 0; // Track actual viewer count
  
  // NEW: Recording functionality
  let isRecording = false;
  let recordingStartTime = null;
  let currentLectureId = null;
  
  // WebRTC room management
  let webrtcRooms = new Map(); // roomId -> { adminSocketId, viewers: Set }

  io.on('connection', socket => {
    // Production-ready: Console logging removed
    
    // Add connection logging
    console.log('🔌 New socket connection:', socket.id);
    
    // Add error handling
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
    
    // Add disconnect logging
    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', socket.id, 'Reason:', reason);
      
      // Clean up user data
      if (connectedUsers.has(socket.id)) {
        connectedUsers.delete(socket.id);
        if (viewerCount > 0) viewerCount--;
      }
      
      // If admin disconnects, stop stream
      if (socket.id === adminSocketId) {
        isStreamActive = false;
        adminSocketId = null;
        viewerCount = 0;
        io.emit('stream-stopped');
      }
    });

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
      // Production-ready: Console logging removed
      isStreamActive = true;
      adminSocketId = socket.id;
      viewerCount = 0; // Reset viewer count
      
      // Generate a default room ID for the stream
      const defaultRoomId = `livestream-${Date.now()}`;
      
      // Create WebRTC room automatically
      webrtcRooms.set(defaultRoomId, {
        adminSocketId: socket.id,
        viewers: new Set()
      });
      
      console.log('🚀 Stream started with WebRTC room:', defaultRoomId);
      
      // Emit stream started with room ID
      io.emit('stream-started', { roomId: defaultRoomId });
    });

    // NEW: Admin starts recording
    socket.on('admin-start-recording', (lectureId) => {
      // Production-ready: Console logging removed
      if (socket.id === adminSocketId) {
        isRecording = true;
        recordingStartTime = Date.now();
        currentLectureId = lectureId;
        io.emit('recording-started', { lectureId, startTime: recordingStartTime });
      }
    });

    // NEW: Admin stops recording
    socket.on('admin-stop-recording', () => {
      // Production-ready: Console logging removed
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

    // 🚀 CUSTOM WEBRTC LIVESTREAMING EVENTS
    
    // Admin creates WebRTC room
    socket.on('createRoom', ({ roomId }) => {
      if (roomId) {
        webrtcRooms.set(roomId, {
          adminSocketId: socket.id,
          viewers: new Set()
        });
        console.log('🚀 Custom WebRTC room created:', roomId);
        socket.emit('roomCreated', { roomId, success: true });
      }
    });

    // Viewer joins WebRTC room
    socket.on('joinRoom', ({ roomId, viewerId }) => {
      const room = webrtcRooms.get(roomId);
      if (room) {
        room.viewers.add(viewerId);
        console.log('👤 Viewer joined Custom WebRTC room:', roomId, 'Viewer:', viewerId);
        
        // Notify admin
        io.to(room.adminSocketId).emit('viewerJoined', viewerId);
        
        // Notify viewer
        socket.emit('roomJoined', { roomId, success: true });
      } else {
        socket.emit('roomNotFound', { roomId });
      }
    });

    // Viewer leaves WebRTC room
    socket.on('leaveRoom', ({ roomId, viewerId }) => {
      const room = webrtcRooms.get(roomId);
      if (room && room.viewers.has(viewerId)) {
        room.viewers.delete(viewerId);
        console.log('👤 Viewer left Custom WebRTC room:', roomId, 'Viewer:', viewerId);
        
        // Notify admin
        io.to(room.adminSocketId).emit('viewerLeft', viewerId);
      }
    });

    // ICE candidate exchange
    socket.on('iceCandidate', ({ viewerId, candidate }) => {
      // Forward ICE candidate to the appropriate peer
      socket.broadcast.emit('iceCandidate', { viewerId, candidate });
    });

    // WebRTC offer/answer exchange
    socket.on('offer', ({ viewerId, offer }) => {
      // Forward offer to admin
      socket.broadcast.emit('offer', { viewerId, offer });
    });

    socket.on('answer', ({ viewerId, answer }) => {
      // Forward answer to viewer
      socket.broadcast.emit('answer', { viewerId, answer });
    });

    // Admin leaves WebRTC room
    socket.on('leaveRoom', ({ roomId }) => {
      const room = webrtcRooms.get(roomId);
      if (room && room.adminSocketId === socket.id) {
        // Notify all viewers
        room.viewers.forEach(viewerId => {
          io.emit('adminLeft', { roomId });
        });
        
        // Clean up room
        webrtcRooms.delete(roomId);
        console.log('🛑 Custom WebRTC room closed:', roomId);
      }
    });

    // Admin stops streaming
    socket.on('admin-end', () => {
      // Production-ready: Console logging removed
      isStreamActive = false;
      adminSocketId = null;
      viewerCount = 0; // Reset viewer count
      io.emit('stream-stopped');
    });

    // 🚀 CUSTOM WEBRTC SIGNALING EVENTS
    
    // WebRTC offer from admin to specific viewer
    socket.on('webrtc-offer', ({ roomId, offer, targetViewerId }) => {
      const room = webrtcRooms.get(roomId);
      if (room && targetViewerId) {
        // Forward offer to specific viewer only
        if (room.viewers.has(targetViewerId)) {
          io.to(targetViewerId).emit('webrtc-offer', { offer });
          console.log('📤 WebRTC offer forwarded to specific viewer:', targetViewerId);
        } else {
          console.log('⚠️ Target viewer not found in room:', targetViewerId);
        }
      } else {
        console.log('⚠️ Invalid offer data:', { roomId, targetViewerId });
      }
    });

    // WebRTC answer from viewer to admin
    socket.on('webrtc-answer', ({ roomId, answer }) => {
      const room = webrtcRooms.get(roomId);
      if (room && room.adminSocketId) {
        io.to(room.adminSocketId).emit('webrtc-answer', { 
          socketId: socket.id, 
          answer 
        });
        console.log('📥 WebRTC answer from viewer to admin');
      }
    });

    // ICE candidate exchange
    socket.on('ice-candidate', ({ roomId, candidate, targetViewerId }) => {
      const room = webrtcRooms.get(roomId);
      if (room) {
        if (socket.id === room.adminSocketId) {
          // Forward admin's ICE candidate to specific viewer
          if (targetViewerId && room.viewers.has(targetViewerId)) {
            io.to(targetViewerId).emit('ice-candidate', { candidate });
            console.log('🧊 Admin ICE candidate forwarded to viewer:', targetViewerId);
          } else {
            console.log('⚠️ Target viewer not found for admin ICE candidate:', targetViewerId);
          }
        } else {
          // Forward viewer's ICE candidate to admin
          io.to(room.adminSocketId).emit('ice-candidate', { 
            socketId: socket.id, 
            candidate 
          });
          console.log('🧊 Viewer ICE candidate forwarded to admin');
        }
      }
    });

    // Viewer joins stream
    socket.on('join-stream', ({ roomId, userInfo }) => {
      const room = webrtcRooms.get(roomId);
      if (room) {
        room.viewers.add(socket.id);
        
        // Store user info for this socket
        if (userInfo) {
          connectedUsers.set(socket.id, userInfo);
        }
        
        console.log('👤 Viewer joined stream in room:', roomId, 'User:', userInfo?.name || 'Anonymous');
        
        // Notify admin with user info
        io.to(room.adminSocketId).emit('viewer-join', { 
          socketId: socket.id, 
          userInfo: userInfo || connectedUsers.get(socket.id),
          viewerCount: room.viewers.size 
        });
      }
    });

    // Legacy WebRTC signaling (for backward compatibility)
    socket.on('offer', ({ target, offer }) => {
      // Production-ready: Console logging removed
      
      // Handle special case where target is 'admin'
      if (target === 'admin' && adminSocketId) {
        console.log('📥 WebRTC offer from viewer to admin:', socket.id);
        io.to(adminSocketId).emit('offer', { socketId: socket.id, offer });
      } else if (target && target !== 'admin') {
        // Regular socket-to-socket routing
        io.to(target).emit('offer', { socketId: socket.id, offer });
      } else {
        console.log('⚠️ Invalid offer target or admin not connected:', { target, adminSocketId });
      }
    });

    socket.on('answer', ({ target, answer }) => {
      // Production-ready: Console logging removed
      
      // Handle special case where target is 'admin'
      if (target === 'admin' && adminSocketId) {
        console.log('📥 WebRTC answer from viewer to admin:', socket.id);
        io.to(adminSocketId).emit('answer', { socketId: socket.id, answer });
      } else if (target && target !== 'admin') {
        // Regular socket-to-socket routing
        io.to(target).emit('answer', { socketId: socket.id, answer });
      } else {
        console.log('⚠️ Invalid answer target or admin not connected:', { target, adminSocketId });
      }
    });

    // Chat functionality
    socket.on('chat-message', data => {
      // Production-ready: Console logging removed
      io.emit('chat-message', data);
    });

    socket.on('admin-chat', message => {
      // Production-ready: Console logging removed
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

    // 🚀 CUSTOM WEBRTC MIC REQUEST RESPONSE
    socket.on('mic-request-response', ({ targetSocketId, approved }) => {
      console.log('🎤 Mic request response:', { targetSocketId, approved });
      io.to(targetSocketId).emit('mic-request-response', { approved });
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