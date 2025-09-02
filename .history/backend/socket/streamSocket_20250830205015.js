module.exports = io => {
  let isStreamActive = false;
  let adminSocketId = null;
  let connectedUsers = new Map();
  let viewerCount = 0;
  
  // Recording functionality
  let isRecording = false;
  let recordingStartTime = null;
  let currentLectureId = null;

  // Event sequencing and state validation
  let pendingSignals = new Map();
  let connectionStates = new Map();
  
  // Rate limiting for events
  let rateLimitMap = new Map();
  const RATE_LIMIT_WINDOW = 60000;
  const RATE_LIMITS = {
    'chat-message': 20,
    'mic-request': 5,
    'default': 30
  };

  // Rate limiting helper function
  const checkRateLimit = (socketId, eventType) => {
    const now = Date.now();
    
    if (!rateLimitMap.has(socketId)) {
      rateLimitMap.set(socketId, {
        eventCounts: new Map(),
        lastReset: now,
        totalEvents: 0,
        blockedEvents: 0
      });
    }
    
    const rateLimit = rateLimitMap.get(socketId);
    
    if (now - rateLimit.lastReset > RATE_LIMIT_WINDOW) {
      rateLimit.eventCounts.clear();
      rateLimit.lastReset = now;
    }
    
    const currentCount = rateLimit.eventCounts.get(eventType) || 0;
    const limit = RATE_LIMITS[eventType] || RATE_LIMITS.default;
    
    rateLimit.totalEvents++;
    
    if (currentCount >= limit) {
      rateLimit.blockedEvents++;
      console.warn(`🚨 Rate limit exceeded for socket ${socketId}: ${eventType} (${currentCount}/${limit})`);
      return false;
    }
    
    rateLimit.eventCounts.set(eventType, currentCount + 1);
    return true;
  };

  // Clean up rate limiting data
  const cleanupRateLimit = (socketId) => {
    rateLimitMap.delete(socketId);
    pendingSignals.delete(socketId);
    connectionStates.delete(socketId);
  };

  // Periodic cleanup of inactive resources
  const startPeriodicCleanup = () => {
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      rateLimitMap.forEach((data, socketId) => {
        if (now - data.lastReset > 300000) {
          rateLimitMap.delete(socketId);
          cleanedCount++;
        }
      });
      
      pendingSignals.forEach((signals, socketId) => {
        const oldSignals = signals.filter(signal => now - signal.timestamp < 60000);
        if (oldSignals.length === 0) {
          pendingSignals.delete(socketId);
          cleanedCount++;
      } else {
          pendingSignals.set(socketId, oldSignals);
        }
      });
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} inactive resources`);
      }
    }, 300000); // Clean up every 5 minutes
  };

  // Start periodic cleanup
  startPeriodicCleanup();

  // Connection state validation
  const validateConnectionState = (socketId, expectedState) => {
    const currentState = connectionStates.get(socketId);
    if (currentState !== expectedState) {
      console.warn(`⚠️ Connection state mismatch for ${socketId}: expected ${expectedState}, got ${currentState}`);
      return false;
    }
    return true;
  };

  // Queue signal for later processing
  const queueSignal = (socketId, signal) => {
    if (!pendingSignals.has(socketId)) {
      pendingSignals.set(socketId, []);
    }
    
    const signals = pendingSignals.get(socketId);
    signals.push({
      ...signal,
      timestamp: Date.now()
    });
    
    console.log(`📋 Signal queued for ${socketId}: ${signal.type}`);
  };

  // Process queued signals when connection state changes
  const processQueuedSignals = (socketId) => {
    const signals = pendingSignals.get(socketId);
    if (!signals || signals.length === 0) return;
    
    console.log(`📋 Processing ${signals.length} queued signals for ${socketId}`);
    
    signals.forEach(signal => {
      try {
        // Re-emit the signal to the socket
        io.to(socketId).emit(signal.type, signal.data);
      } catch (error) {
        console.error(`❌ Failed to process queued signal ${signal.type}:`, error);
      }
    });
    
    pendingSignals.delete(socketId);
  };

  // 🚀 SOCKET CONNECTION EVENTS
  io.on('connection', socket => {
    console.log(`🔌 New socket connection: ${socket.id}`);
    
    // Set initial connection state
    connectionStates.set(socket.id, 'connecting');
    
    // Update connection state
    connectionStates.set(socket.id, 'connected');
    
    // Process any queued signals
    processQueuedSignals(socket.id);
    
    // 🚀 STREAM MANAGEMENT EVENTS
    
    // Admin starts stream
    socket.on('start-stream', (data) => {
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'start-stream', data });
        return;
      }
      
      try {
        isStreamActive = true;
        adminSocketId = socket.id;
        viewerCount = 0;
        
        console.log('🚀 Stream started by admin:', socket.id);
        socket.emit('stream-started', { success: true });
        
        // Notify all connected users
        io.emit('stream-status-changed', { 
          isActive: true, 
          adminSocketId: socket.id 
        });
        
      } catch (error) {
        console.error('❌ Failed to start stream:', error);
        socket.emit('stream-error', { error: error.message });
      }
    });

    // Admin stops stream
    socket.on('stop-stream', (data) => {
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'stop-stream', data });
        return;
      }
      
      try {
      isStreamActive = false;
      adminSocketId = null;
        viewerCount = 0;
        
        console.log('🛑 Stream stopped by admin:', socket.id);
        socket.emit('stream-stopped', { success: true });
        
        // Notify all connected users
        io.emit('stream-status-changed', { 
          isActive: false, 
          adminSocketId: null 
        });
        
      } catch (error) {
        console.error('❌ Failed to stop stream:', error);
        socket.emit('stream-error', { error: error.message });
      }
    });

    // User joins stream
    socket.on('join-stream', (data) => {
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'join-stream', data });
        return;
      }
      
      try {
        if (!isStreamActive) {
          socket.emit('stream-error', { error: 'No active stream to join' });
          return;
        }
        
        viewerCount++;
        connectedUsers.set(socket.id, {
          socketId: socket.id,
          joinedAt: Date.now(),
          userInfo: data.userInfo || {}
        });
        
        console.log(`👤 User joined stream: ${socket.id}, Total viewers: ${viewerCount}`);
        socket.emit('stream-joined', { success: true, viewerCount });
        
        // Notify admin
        if (adminSocketId) {
          io.to(adminSocketId).emit('viewer-joined', { 
            socketId: socket.id, 
            viewerCount,
            userInfo: data.userInfo 
          });
        }
        
        // Update all users with new viewer count
        io.emit('viewer-count-updated', { viewerCount });
        
      } catch (error) {
        console.error('❌ Failed to join stream:', error);
        socket.emit('stream-error', { error: error.message });
      }
    });

    // User leaves stream
    socket.on('leave-stream', (data) => {
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'leave-stream', data });
        return;
      }
      
      try {
        if (connectedUsers.has(socket.id)) {
          connectedUsers.delete(socket.id);
          viewerCount = Math.max(0, viewerCount - 1);
          
          console.log(`👤 User left stream: ${socket.id}, Total viewers: ${viewerCount}`);
          socket.emit('stream-left', { success: true });
          
          // Notify admin
          if (adminSocketId) {
            io.to(adminSocketId).emit('viewer-left', { 
              socketId: socket.id, 
              viewerCount 
            });
          }
          
          // Update all users with new viewer count
          io.emit('viewer-count-updated', { viewerCount });
        }
        
      } catch (error) {
        console.error('❌ Failed to leave stream:', error);
        socket.emit('stream-error', { error: error.message });
      }
    });

    // 🚀 CHAT EVENTS
    
    // Send chat message
    socket.on('chat-message', (data) => {
      if (!validateConnectionState(socket.id, 'connected') || !checkRateLimit(socket.id, 'chat-message')) {
        queueSignal(socket.id, { type: 'chat-message', data });
        return;
      }
      
      try {
        if (!isStreamActive) {
          socket.emit('chat-error', { error: 'No active stream for chat' });
          return;
        }
        
        const message = {
          id: Date.now().toString(),
        socketId: socket.id,
          message: data.message,
          timestamp: Date.now(),
          userInfo: data.userInfo || {}
        };
        
        console.log(`💬 Chat message from ${socket.id}: ${data.message}`);
        
        // Broadcast to all connected users
        io.emit('chat-message', message);
        
      } catch (error) {
        console.error('❌ Failed to send chat message:', error);
        socket.emit('chat-error', { error: error.message });
      }
    });

    // 🚀 RECORDING EVENTS
    
    // Start recording
    socket.on('start-recording', (data) => {
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'start-recording', data });
        return;
      }
      
      try {
        if (!isStreamActive) {
          socket.emit('recording-error', { error: 'No active stream to record' });
          return;
        }
        
        if (isRecording) {
          socket.emit('recording-error', { error: 'Recording already in progress' });
          return;
        }
        
        isRecording = true;
        recordingStartTime = Date.now();
        currentLectureId = data.lectureId || `lecture_${Date.now()}`;
        
        console.log(`🎥 Recording started: ${currentLectureId}`);
        socket.emit('recording-started', { 
          success: true, 
          lectureId: currentLectureId 
        });
        
        // Notify all users
        io.emit('recording-status-changed', { 
          isRecording: true, 
          lectureId: currentLectureId 
        });
        
      } catch (error) {
        console.error('❌ Failed to start recording:', error);
        socket.emit('recording-error', { error: error.message });
      }
    });

    // Stop recording
    socket.on('stop-recording', (data) => {
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'stop-recording', data });
        return;
      }
      
      try {
        if (!isRecording) {
          socket.emit('recording-error', { error: 'No recording in progress' });
          return;
        }
        
        const recordingDuration = Date.now() - recordingStartTime;
        isRecording = false;
        recordingStartTime = null;
        
        console.log(`🛑 Recording stopped: ${currentLectureId}, Duration: ${recordingDuration}ms`);
        socket.emit('recording-stopped', { 
          success: true, 
          lectureId: currentLectureId,
          duration: recordingDuration
        });
        
        // Notify all users
        io.emit('recording-status-changed', { 
          isRecording: false, 
          lectureId: currentLectureId 
        });
        
        currentLectureId = null;
        
      } catch (error) {
        console.error('❌ Failed to stop recording:', error);
        socket.emit('recording-error', { error: error.message });
      }
    });

    // 🚀 UTILITY EVENTS
    
    // Get stream status
    socket.on('get-stream-status', () => {
      socket.emit('stream-status', {
        isActive: isStreamActive,
        adminSocketId: adminSocketId,
        viewerCount: viewerCount,
        isRecording: isRecording,
        recordingLectureId: currentLectureId
      });
    });

    // Get viewer count
    socket.on('get-viewer-count', () => {
      socket.emit('viewer-count', { viewerCount });
    });

    // Ping/Pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // 🚀 DISCONNECTION HANDLING
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      
      // Remove from connected users
      if (connectedUsers.has(socket.id)) {
        connectedUsers.delete(socket.id);
        viewerCount = Math.max(0, viewerCount - 1);
        
        // Notify admin if stream is active
        if (adminSocketId && isStreamActive) {
          io.to(adminSocketId).emit('viewer-left', { 
          socketId: socket.id, 
          viewerCount 
        });
        }
        
        // Update all users with new viewer count
        io.emit('viewer-count-updated', { viewerCount });
      }
      
      // If admin disconnects, stop stream
      if (socket.id === adminSocketId && isStreamActive) {
        isStreamActive = false;
        adminSocketId = null;
        viewerCount = 0;
        
        console.log('🛑 Stream stopped due to admin disconnection');
        
        // Notify all users
        io.emit('stream-status-changed', { 
          isActive: false, 
          adminSocketId: null 
        });
      }
      
      // Cleanup
      cleanupRateLimit(socket.id);
      connectionStates.delete(socket.id);
    });
  });

  // 🚀 EXPORT UTILITY FUNCTIONS
  return {
    getStreamStatus: () => ({
      isActive: isStreamActive,
      adminSocketId: adminSocketId,
      viewerCount: viewerCount,
      isRecording: isRecording,
      recordingLectureId: currentLectureId
    }),
    
    getConnectedUsers: () => Array.from(connectedUsers.values()),
    
    forceStopStream: () => {
      isStreamActive = false;
      adminSocketId = null;
      viewerCount = 0;
      isRecording = false;
      recordingStartTime = null;
      currentLectureId = null;
      
      console.log('🛑 Stream force stopped by system');
      
      // Notify all users
      io.emit('stream-status-changed', { 
        isActive: false, 
        adminSocketId: null 
      });
    }
  };
};
