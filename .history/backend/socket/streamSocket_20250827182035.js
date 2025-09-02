module.exports = io => {
  // NEW: Support multiple concurrent streams
  let activeStreams = new Map(); // roomId -> streamInfo
  let adminStreams = new Map(); // adminSocketId -> Set of roomIds
  let connectedUsers = new Map(); // Store socketId -> userInfo mapping
  
  // NEW: Recording functionality
  let isRecording = false;
  let recordingStartTime = null;
  let currentLectureId = null;
  
  // WebRTC room management
  let webrtcRooms = new Map(); // roomId -> { adminSocketId, viewers: Set }
  
  // NEW: Event sequencing and state validation
  let pendingSignals = new Map(); // socketId -> pending signals queue
  let connectionStates = new Map(); // socketId -> connection state
  
  // NEW: Rate limiting for WebRTC events
  let rateLimitMap = new Map(); // socketId -> { eventCounts: Map, lastReset: number }
  const RATE_LIMIT_WINDOW = 60000; // 1 minute
  const RATE_LIMITS = {
    'offer': 10,        // Max 10 offers per minute
    'answer': 10,       // Max 10 answers per minute
    'ice-candidate': 50, // Max 50 ICE candidates per minute
    'chat-message': 20,  // Max 20 chat messages per minute
    'mic-request': 5,    // Max 5 mic requests per minute
    'default': 30        // Default limit for other events
  };

  // NEW: Helper function to get stream info
  const getStreamInfo = (roomId) => {
    return activeStreams.get(roomId);
  };

  // NEW: Helper function to get admin streams
  const getAdminStreams = (adminSocketId) => {
    return adminStreams.get(adminSocketId) || new Set();
  };

  // NEW: Helper function to add stream
  const addStream = (roomId, adminSocketId, streamInfo = {}) => {
    const streamData = {
      roomId,
      adminSocketId,
      startTime: Date.now(),
      viewerCount: 0,
      isActive: true,
      ...streamInfo
    };
    
    activeStreams.set(roomId, streamData);
    
    if (!adminStreams.has(adminSocketId)) {
      adminStreams.set(adminSocketId, new Set());
    }
    adminStreams.get(adminSocketId).add(roomId);
    
    return streamData;
  };

  // NEW: Helper function to remove stream
  const removeStream = (roomId) => {
    const streamInfo = activeStreams.get(roomId);
    if (streamInfo) {
      const adminSocketId = streamInfo.adminSocketId;
      if (adminStreams.has(adminSocketId)) {
        adminStreams.get(adminSocketId).delete(roomId);
        if (adminStreams.get(adminSocketId).size === 0) {
          adminStreams.delete(adminSocketId);
        }
      }
      activeStreams.delete(roomId);
      webrtcRooms.delete(roomId);
    }
  };

  // NEW: Helper function to get all active streams
  const getAllActiveStreams = () => {
    return Array.from(activeStreams.values());
  };

  // NEW: Helper function to get stream count
  const getStreamCount = () => {
    return activeStreams.size;
  };

  // Rate limiting helper function
  const checkRateLimit = (socketId, eventType) => {
    const now = Date.now();
    
    if (!rateLimitMap.has(socketId)) {
      rateLimitMap.set(socketId, {
        eventCounts: new Map(),
        lastReset: now
      });
    }
    
    const rateLimit = rateLimitMap.get(socketId);
    
    // Reset counters if window has passed
    if (now - rateLimit.lastReset > RATE_LIMIT_WINDOW) {
      rateLimit.eventCounts.clear();
      rateLimit.lastReset = now;
    }
    
    // Get current count for this event type
    const currentCount = rateLimit.eventCounts.get(eventType) || 0;
    const limit = RATE_LIMITS[eventType] || RATE_LIMITS.default;
    
    // Check if limit exceeded
    if (currentCount >= limit) {
      return false; // Rate limit exceeded
    }
    
    // Increment counter
    rateLimit.eventCounts.set(eventType, currentCount + 1);
    return true; // Within rate limit
  };

  // Clean up rate limiting data
  const cleanupRateLimit = (socketId) => {
    rateLimitMap.delete(socketId);
  };

  // Helper function to validate connection state
  const validateConnectionState = (socketId, expectedState) => {
    const currentState = connectionStates.get(socketId);
    return currentState === expectedState;
  };

  // Helper function to queue signals
  const queueSignal = (socketId, signal) => {
    if (!pendingSignals.has(socketId)) {
      pendingSignals.set(socketId, []);
    }
    pendingSignals.get(socketId).push(signal);
  };

  // Helper function to process queued signals
  const processQueuedSignals = (socketId) => {
    const signals = pendingSignals.get(socketId);
    if (signals && signals.length > 0) {
      signals.forEach(signal => {
        // Process signal based on type
        if (signal.type === 'offer') {
          io.to(signal.target).emit('offer', signal.data);
        } else if (signal.type === 'answer') {
          io.to(signal.target).emit('answer', signal.data);
        } else if (signal.type === 'ice-candidate') {
          io.to(signal.target).emit('ice-candidate', signal.data);
        }
      });
      pendingSignals.delete(socketId);
    }
  };

  io.on('connection', socket => {
    // Production-ready: Console logging removed
    
    // Add connection logging
    console.log('🔌 New socket connection:', socket.id);
    
    // Initialize connection state
    connectionStates.set(socket.id, 'connecting');
    
    // Add error handling
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      connectionStates.set(socket.id, 'error');
    });
    
    // Add disconnect logging
    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', socket.id, 'Reason:', reason);
      
      // Clean up connection state and pending signals
      connectionStates.delete(socket.id);
      pendingSignals.delete(socket.id);
      cleanupRateLimit(socket.id);
      
      // Clean up user data
      if (connectedUsers.has(socket.id)) {
        connectedUsers.delete(socket.id);
      }
      
      // NEW: Handle admin disconnection - stop all their streams
      if (adminStreams.has(socket.id)) {
        const adminRoomIds = Array.from(adminStreams.get(socket.id));
        adminRoomIds.forEach(roomId => {
          const streamInfo = getStreamInfo(roomId);
          if (streamInfo) {
            // Notify all viewers that stream has ended
            io.emit('stream-stopped', { roomId });
            console.log(`🛑 Stream stopped due to admin disconnect: ${roomId}`);
          }
          removeStream(roomId);
        });
      }
      
      // If viewer disconnects, remove from WebRTC rooms and notify admin
      webrtcRooms.forEach((room, roomId) => {
        if (room.viewers.has(socket.id)) {
          room.viewers.delete(socket.id);
          const viewerCount = room.viewers.size;
          
          // Update stream viewer count
          const streamInfo = getStreamInfo(roomId);
          if (streamInfo) {
            streamInfo.viewerCount = viewerCount;
            activeStreams.set(roomId, streamInfo);
          }
          
          // Notify admin about viewer disconnect
          io.to(room.adminSocketId).emit('disconnectPeer', {
            socketId: socket.id,
            viewerCount: viewerCount,
            roomId: roomId
          });
          
          console.log('👤 Viewer disconnected from room:', roomId, 'Remaining viewers:', viewerCount);
        }
      });
    });

    // Connection established event
    socket.on('connection-established', () => {
      connectionStates.set(socket.id, 'connected');
      processQueuedSignals(socket.id);
    });

    // NEW: Get all active streams
    socket.on('get-active-streams', () => {
      const streams = getAllActiveStreams();
      socket.emit('active-streams', streams);
    });

    // NEW: Get stream count
    socket.on('get-stream-count', () => {
      const count = getStreamCount();
      socket.emit('stream-count', count);
    });

    // Viewer joins and requests to watch
    socket.on('watcher', (userInfo) => {
      // Production-ready: Console logging removed
      
      // Validate connection state
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'watcher', data: userInfo });
        return;
      }
      
      // Store user info for this socket
      if (userInfo) {
        connectedUsers.set(socket.id, userInfo);
      }
      
      // NEW: Check if there are any active streams
      if (activeStreams.size > 0) {
        const streams = getAllActiveStreams();
        socket.emit('streams-available', streams);
      } else {
        socket.emit('no-streams-available');
      }
    });

    // NEW: Viewer joins specific stream
    socket.on('join-specific-stream', ({ roomId, userInfo }) => {
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'join-specific-stream', data: { roomId, userInfo } });
        return;
      }
      
      const streamInfo = getStreamInfo(roomId);
      if (!streamInfo || !streamInfo.isActive) {
        socket.emit('stream-not-found', { roomId });
        return;
      }
      
      // Add viewer to WebRTC room
      if (!webrtcRooms.has(roomId)) {
        webrtcRooms.set(roomId, {
          adminSocketId: streamInfo.adminSocketId,
          viewers: new Set()
        });
      }
      
      const room = webrtcRooms.get(roomId);
      room.viewers.add(socket.id);
      
      // Update viewer count
      streamInfo.viewerCount = room.viewers.size;
      activeStreams.set(roomId, streamInfo);
      
      // Store user info
      if (userInfo) {
        connectedUsers.set(socket.id, userInfo);
      }
      
      // Notify admin
      io.to(streamInfo.adminSocketId).emit('viewer-join', { 
        socketId: socket.id, 
        userInfo,
        viewerCount: streamInfo.viewerCount,
        roomId: roomId
      });
      
      // Notify viewer
      socket.emit('stream-joined', { roomId, streamInfo });
      console.log(`👤 Viewer joined stream: ${roomId}, Total viewers: ${streamInfo.viewerCount}`);
    });

    // Admin starts streaming
    socket.on('admin-start', ({ roomId, streamInfo = {} }) => {
      // Production-ready: Console logging removed
      
      // Validate connection state
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'admin-start', data: { roomId, streamInfo } });
        return;
      }
      
      // Generate room ID if not provided
      const finalRoomId = roomId || `livestream-${Date.now()}-${socket.id.slice(-6)}`;
      
      // Add stream
      const newStream = addStream(finalRoomId, socket.id, streamInfo);
      
      // Create WebRTC room
      webrtcRooms.set(finalRoomId, {
        adminSocketId: socket.id,
        viewers: new Set()
      });
      
      console.log('🚀 Stream started with WebRTC room:', finalRoomId);
      
      // Emit stream started with room ID
      io.emit('stream-started', { roomId: finalRoomId, streamInfo: newStream });
      
      // Notify admin
      socket.emit('stream-created', { roomId: finalRoomId, success: true });
    });

    // Admin starts recording
    socket.on('admin-start-recording', ({ roomId, lectureId }) => {
      // Production-ready: Console logging removed
      
      // Validate connection state and admin permissions
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'admin-start-recording', data: { roomId, lectureId } });
        return;
      }
      
      // Check if admin owns this stream
      const streamInfo = getStreamInfo(roomId);
      if (!streamInfo || streamInfo.adminSocketId !== socket.id) {
        socket.emit('recording-error', { message: 'Stream not found or access denied' });
        return;
      }
      
      isRecording = true;
      recordingStartTime = Date.now();
      currentLectureId = lectureId;
      
      // Update stream info
      streamInfo.isRecording = true;
      streamInfo.recordingStartTime = recordingStartTime;
      activeStreams.set(roomId, streamInfo);
      
      io.emit('recording-started', { roomId, lectureId, startTime: recordingStartTime });
    });

    // Admin stops recording
    socket.on('admin-stop-recording', ({ roomId }) => {
      // Production-ready: Console logging removed
      
      // Validate connection state and admin permissions
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'admin-stop-recording', data: { roomId } });
        return;
      }
      
      // Check if admin owns this stream
      const streamInfo = getStreamInfo(roomId);
      if (!streamInfo || streamInfo.adminSocketId !== socket.id || !isRecording) {
        socket.emit('recording-error', { message: 'Stream not found or recording not active' });
        return;
      }
      
      isRecording = false;
      const recordingDuration = Math.floor((Date.now() - recordingStartTime) / 1000);
      
      // Update stream info
      streamInfo.isRecording = false;
      streamInfo.recordingDuration = recordingDuration;
      activeStreams.set(roomId, streamInfo);
      
      io.emit('recording-stopped', { 
        roomId,
        lectureId: currentLectureId, 
        duration: recordingDuration,
        startTime: recordingStartTime 
      });
      
      // Reset recording state
      recordingStartTime = null;
      currentLectureId = null;
    });

    // Admin creates WebRTC room
    socket.on('createRoom', ({ roomId }) => {
      // Validate connection state
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'createRoom', data: { roomId } });
        return;
      }
      
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
      // Validate connection state
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'joinRoom', data: { roomId, viewerId } });
        return;
      }
      
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
      // Validate connection state
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'leaveRoom', data: { roomId, viewerId } });
        return;
      }
      
      const room = webrtcRooms.get(roomId);
      if (room && room.viewers.has(viewerId)) {
        room.viewers.delete(viewerId);
        console.log('👤 Viewer left Custom WebRTC room:', roomId, 'Viewer:', viewerId);
        
        // Update stream viewer count
        const streamInfo = getStreamInfo(roomId);
        if (streamInfo) {
          streamInfo.viewerCount = room.viewers.size;
          activeStreams.set(roomId, streamInfo);
        }
        
        // Notify admin
        io.to(room.adminSocketId).emit('viewerLeft', viewerId);
      }
    });

    // ICE candidate exchange
    socket.on('iceCandidate', ({ viewerId, candidate }) => {
      // Validate connection state
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'iceCandidate', data: { viewerId, candidate } });
        return;
      }
      
      // Forward ICE candidate to the appropriate peer
      socket.broadcast.emit('iceCandidate', { viewerId, candidate });
    });

    // WebRTC offer/answer exchange
    socket.on('offer', ({ viewerId, offer }) => {
      // Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'offer', data: { viewerId, offer } });
        return;
      }
      
      // Check rate limit
      if (!checkRateLimit(socket.id, 'offer')) {
        socket.emit('rate-limit-exceeded', { eventType: 'offer', message: 'Too many offers sent' });
        return;
      }
      
      // Forward offer to admin
      socket.broadcast.emit('offer', { viewerId, offer });
    });

    socket.on('answer', ({ viewerId, answer }) => {
      // Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'answer', data: { viewerId, answer } });
        return;
      }
      
      // Check rate limit
      if (!checkRateLimit(socket.id, 'answer')) {
        socket.emit('rate-limit-exceeded', { eventType: 'answer', message: 'Too many answers sent' });
        return;
      }
      
      // Forward answer to viewer
      socket.broadcast.emit('answer', { viewerId, answer });
    });

    // Admin leaves WebRTC room
    socket.on('leaveRoom', ({ roomId }) => {
      // Validate connection state
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'leaveRoom', data: { roomId } });
        return;
      }
      
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
    socket.on('admin-end', ({ roomId }) => {
      // Production-ready: Console logging removed
      
      // Validate connection state and admin permissions
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'admin-end', data: { roomId } });
        return;
      }
      
      // Check if admin owns this stream
      const streamInfo = getStreamInfo(roomId);
      if (!streamInfo || streamInfo.adminSocketId !== socket.id) {
        socket.emit('stream-error', { message: 'Stream not found or access denied' });
        return;
      }
      
      // Remove stream
      removeStream(roomId);
      
      // Notify all viewers
      io.emit('stream-stopped', { roomId });
      
      console.log(`🛑 Stream stopped: ${roomId}`);
    });

    // WebRTC offer from admin to specific viewer
    socket.on('webrtc-offer', ({ roomId, offer, targetViewerId }) => {
      // Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'webrtc-offer', data: { roomId, offer, targetViewerId } });
        return;
      }
      
      // Check rate limit
      if (!checkRateLimit(socket.id, 'offer')) {
        socket.emit('rate-limit-exceeded', { eventType: 'offer', message: 'Too many offers sent' });
        return;
      }
      
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
      // Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'webrtc-answer', data: { roomId, answer } });
        return;
      }
      
      // Check rate limit
      if (!checkRateLimit(socket.id, 'answer')) {
        socket.emit('rate-limit-exceeded', { eventType: 'answer', message: 'Too many answers sent' });
        return;
      }
      
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
      // Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'ice-candidate', data: { roomId, candidate, targetViewerId } });
        return;
      }
      
      // Check rate limit
      if (!checkRateLimit(socket.id, 'ice-candidate')) {
        socket.emit('rate-limit-exceeded', { eventType: 'ice-candidate', message: 'Too many ICE candidates sent' });
        return;
      }
      
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
      // Validate connection state
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'join-stream', data: { roomId, userInfo } });
        return;
      }
      
      const room = webrtcRooms.get(roomId);
      if (room) {
        room.viewers.add(socket.id);
        
        // Store user info for this socket
        if (userInfo) {
          connectedUsers.set(socket.id, userInfo);
        }
        
        // Update stream viewer count
        const streamInfo = getStreamInfo(roomId);
        if (streamInfo) {
          streamInfo.viewerCount = room.viewers.size;
          activeStreams.set(roomId, streamInfo);
        }
        
        console.log('👤 Viewer joined stream in room:', roomId, 'User:', userInfo?.name || 'Anonymous');
        
        // Notify admin with user info
        io.to(room.adminSocketId).emit('viewer-join', { 
          socketId: socket.id, 
          userInfo: userInfo || connectedUsers.get(socket.id),
          viewerCount: room.viewers.size,
          roomId: roomId
        });
      }
    });

    // Legacy WebRTC signaling (for backward compatibility)
    socket.on('offer', ({ target, offer }) => {
      // Production-ready: Console logging removed
      
      // Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'offer', data: { target, offer } });
        return;
      }
      
      // Check rate limit
      if (!checkRateLimit(socket.id, 'offer')) {
        socket.emit('rate-limit-exceeded', { eventType: 'offer', message: 'Too many offers sent' });
        return;
      }
      
      // Handle special case where target is 'admin'
      if (target === 'admin') {
        // Find admin's streams
        const adminStreams = getAdminStreams(socket.id);
        if (adminStreams.size > 0) {
          // Send to first available stream (or implement round-robin)
          const firstRoomId = Array.from(adminStreams)[0];
          const streamInfo = getStreamInfo(firstRoomId);
          if (streamInfo) {
            io.to(streamInfo.adminSocketId).emit('offer', { socketId: socket.id, offer });
            console.log('📥 WebRTC offer from viewer to admin:', socket.id);
          }
        }
      } else if (target && target !== 'admin') {
        // Regular socket-to-socket routing
        io.to(target).emit('offer', { socketId: socket.id, offer });
      } else {
        console.log('⚠️ Invalid offer target or admin not connected:', { target });
      }
    });

    socket.on('answer', ({ target, answer }) => {
      // Production-ready: Console logging removed
      
      // Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'answer', data: { target, answer } });
        return;
      }
      
      // Check rate limit
      if (!checkRateLimit(socket.id, 'answer')) {
        socket.emit('rate-limit-exceeded', { eventType: 'answer', message: 'Too many answers sent' });
        return;
      }
      
      // Handle special case where target is 'admin'
      if (target === 'admin') {
        // Find admin's streams
        const adminStreams = getAdminStreams(socket.id);
        if (adminStreams.size > 0) {
          // Send to first available stream (or implement round-robin)
          const firstRoomId = Array.from(adminStreams)[0];
          const streamInfo = getStreamInfo(firstRoomId);
          if (streamInfo) {
            io.to(streamInfo.adminSocketId).emit('answer', { socketId: socket.id, answer });
            console.log('📥 WebRTC answer from viewer to admin:', socket.id);
          }
        }
      } else if (target && target !== 'admin') {
        // Regular socket-to-socket routing
        io.to(target).emit('answer', { socketId: socket.id, answer });
      } else {
        console.log('⚠️ Invalid answer target or admin not connected:', { target });
      }
    });

    // Chat functionality
    socket.on('chat-message', ({ roomId, message, userInfo }) => {
      // Production-ready: Console logging removed
      
      // Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'chat-message', data: { roomId, message, userInfo } });
        return;
      }
      
      // Check rate limit
      if (!checkRateLimit(socket.id, 'chat-message')) {
        socket.emit('rate-limit-exceeded', { eventType: 'chat-message', message: 'Too many chat messages sent' });
        return;
      }
      
      // Validate room access
      const streamInfo = getStreamInfo(roomId);
      if (!streamInfo) {
        socket.emit('chat-error', { message: 'Stream not found' });
        return;
      }
      
      // Send chat message to all participants in the room
      io.emit('chat-message', { 
        roomId, 
        message, 
        userInfo: userInfo || connectedUsers.get(socket.id),
        timestamp: Date.now()
      });
    });

    socket.on('admin-chat', ({ roomId, message }) => {
      // Production-ready: Console logging removed
      
      // Validate connection state and admin permissions
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'admin-chat', data: { roomId, message } });
        return;
      }
      
      // Check rate limit
      if (!checkRateLimit(socket.id, 'chat-message')) {
        socket.emit('rate-limit-exceeded', { eventType: 'chat-message', message: 'Too many chat messages sent' });
        return;
      }
      
      // Check if admin owns this stream
      const streamInfo = getStreamInfo(roomId);
      if (!streamInfo || streamInfo.adminSocketId !== socket.id) {
        socket.emit('chat-error', { message: 'Stream not found or access denied' });
        return;
      }
      
      // Send admin chat message to all participants in the room
      io.emit('chat-message', { 
        roomId,
        sender: 'Admin', 
        message,
        timestamp: Date.now()
      });
    });
    
    // Admin chat received notification
    socket.on('admin-chat-received', data => {
      // Log admin chat received (for monitoring purposes)
      console.log('📨 Admin chat received from viewer:', data);
    });

    // Mic request functionality
    socket.on('mic-request', ({ roomId, data }) => {
      // Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'mic-request', data: { roomId, data } });
        return;
      }
      
      // Check rate limit
      if (!checkRateLimit(socket.id, 'mic-request')) {
        socket.emit('rate-limit-exceeded', { eventType: 'mic-request', message: 'Too many mic requests sent' });
        return;
      }
      
      // Validate room access
      const streamInfo = getStreamInfo(roomId);
      if (!streamInfo) {
        socket.emit('mic-request-error', { message: 'Stream not found' });
        return;
      }
      
      const userInfo = connectedUsers.get(socket.id);
      const requestData = {
        ...data,
        socketId: socket.id,
        user: userInfo?.name || 'Anonymous',
        userInfo: userInfo,
        roomId: roomId
      };
      console.log('🎤 mic request:', requestData);
      io.to(streamInfo.adminSocketId).emit('mic-request', requestData);
    });

    // Unmute request functionality
    socket.on('unmute-request', ({ roomId, data }) => {
      // Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'unmute-request', data: { roomId, data } });
        return;
      }
      
      // Check rate limit
      if (!checkRateLimit(socket.id, 'mic-request')) {
        socket.emit('rate-limit-exceeded', { eventType: 'mic-request', message: 'Too many mic requests sent' });
        return;
      }
      
      // Validate room access
      const streamInfo = getStreamInfo(roomId);
      if (!streamInfo) {
        socket.emit('mic-request-error', { message: 'Stream not found' });
        return;
      }
      
      const userInfo = connectedUsers.get(socket.id);
      const requestData = {
        ...data,
        socketId: socket.id,
        user: userInfo?.name || 'Anonymous',
        userInfo: userInfo,
        roomId: roomId
      };
      console.log('🔊 unmute request:', requestData);
      io.to(streamInfo.adminSocketId).emit('unmute-request', requestData);
    });

    // Mic approval system
    socket.on('approve-mic', ({ roomId, targetSocketId }) => {
      // Validate connection state and admin permissions
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'approve-mic', data: { roomId, targetSocketId } });
        return;
      }
      
      // Check if admin owns this stream
      const streamInfo = getStreamInfo(roomId);
      if (!streamInfo || streamInfo.adminSocketId !== socket.id) {
        socket.emit('mic-approval-error', { message: 'Stream not found or access denied' });
        return;
      }
      
      console.log('✅ Admin approved mic for viewer:', targetSocketId);
      io.to(targetSocketId).emit('mic-approved', { roomId });
    });

    socket.on('reject-mic', ({ roomId, targetSocketId }) => {
      // Validate connection state and admin permissions
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'reject-mic', data: { roomId, targetSocketId } });
        return;
      }
      
      // Check if admin owns this stream
      const streamInfo = getStreamInfo(roomId);
      if (!streamInfo || streamInfo.adminSocketId !== socket.id) {
        socket.emit('mic-approval-error', { message: 'Stream not found or access denied' });
        return;
      }
      
      console.log('❌ Admin rejected mic for viewer:', targetSocketId);
      io.to(targetSocketId).emit('mic-rejected', { roomId });
    });

    socket.on('mute-user-mic', ({ roomId, targetSocketId }) => {
      // Validate connection state and admin permissions
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'mute-user-mic', data: { roomId, targetSocketId } });
        return;
      }
      
      // Check if admin owns this stream
      const streamInfo = getStreamInfo(roomId);
      if (!streamInfo || streamInfo.adminSocketId !== socket.id) {
        socket.emit('mic-approval-error', { message: 'Stream not found or access denied' });
        return;
      }
      
      console.log('🔇 Admin muted mic for viewer:', targetSocketId);
      io.to(targetSocketId).emit('mic-muted', { roomId });
    });

    // Custom WebRTC mic request response
    socket.on('mic-request-response', ({ roomId, targetSocketId, approved }) => {
      // Validate connection state
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'mic-request-response', data: { roomId, targetSocketId, approved } });
        return;
      }
      
      console.log('🎤 Mic request response:', { roomId, targetSocketId, approved });
      io.to(targetSocketId).emit('mic-request-response', { roomId, approved });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ disconnected:', socket.id);
      
      // Clean up connection state and pending signals
      connectionStates.delete(socket.id);
      pendingSignals.delete(socket.id);
      cleanupRateLimit(socket.id);
      
      // Handle admin disconnection - stop all their streams
      if (adminStreams.has(socket.id)) {
        const adminRoomIds = Array.from(adminStreams.get(socket.id));
        adminRoomIds.forEach(roomId => {
          const streamInfo = getStreamInfo(roomId);
          if (streamInfo) {
            // Notify all viewers that stream has ended
            io.emit('stream-stopped', { roomId });
            console.log(`🛑 Stream stopped due to admin disconnect: ${roomId}`);
          }
          removeStream(roomId);
        });
      }
      
      // If viewer disconnects, remove from WebRTC rooms and notify admin
      webrtcRooms.forEach((room, roomId) => {
        if (room.viewers.has(socket.id)) {
          room.viewers.delete(socket.id);
          const viewerCount = room.viewers.size;
          
          // Update stream viewer count
          const streamInfo = getStreamInfo(roomId);
          if (streamInfo) {
            streamInfo.viewerCount = viewerCount;
            activeStreams.set(roomId, streamInfo);
          }
          
          // Notify admin about viewer disconnect
          io.to(room.adminSocketId).emit('disconnectPeer', { 
            socketId: socket.id, 
            viewerCount: viewerCount,
            roomId: roomId
          });
          
          console.log('👤 Viewer', socket.id, 'disconnected. New count:', viewerCount);
        }
      });
      
      // Remove from connected users
      connectedUsers.delete(socket.id);
    });
  });
};