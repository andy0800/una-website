module.exports = io => {
  let isStreamActive = false;
  let adminSocketId = null;
  let connectedUsers = new Map();
  let viewerCount = 0;
  
  // Recording functionality
  let isRecording = false;
  let recordingStartTime = null;
  let currentLectureId = null;
  
  // WebRTC room management
  let webrtcRooms = new Map();
  
  // Event sequencing and state validation
  let pendingSignals = new Map();
  let connectionStates = new Map();
  
  // Rate limiting for WebRTC events
  let rateLimitMap = new Map();
  const RATE_LIMIT_WINDOW = 60000;
  const RATE_LIMITS = {
    'offer': 10,
    'answer': 10,
    'ice-candidate': 50,
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
      
      webrtcRooms.forEach((room, roomId) => {
        if (room.viewers.size === 0 && !room.adminSocketId) {
          webrtcRooms.delete(roomId);
          cleanedCount++;
        }
      });
      
      if (cleanedCount > 0) {
        console.log(`🧹 Periodic cleanup: ${cleanedCount} inactive resources removed`);
      }
    }, 60000);
  };

  startPeriodicCleanup();

  // Comprehensive cleanup for disconnected sockets
  const cleanupSocketData = (socketId) => {
    cleanupRateLimit(socketId);
    
    if (connectedUsers.has(socketId)) {
      const userInfo = connectedUsers.get(socketId);
      if (userInfo.isAdmin) {
        isStreamActive = false;
        adminSocketId = null;
        viewerCount = 0;
        io.emit('stream-stopped', { reason: 'Admin disconnected' });
      } else {
        viewerCount = Math.max(0, viewerCount - 1);
      }
      connectedUsers.delete(socketId);
    }
    
    webrtcRooms.forEach((room, roomId) => {
      if (room.adminSocketId === socketId) {
        webrtcRooms.delete(roomId);
        io.emit('stream-stopped', { reason: 'Admin left room' });
      } else if (room.viewers.has(socketId)) {
        room.viewers.delete(socketId);
        if (room.viewers.size === 0 && !room.adminSocketId) {
          webrtcRooms.delete(roomId);
        }
      }
    });
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

  // Resource Manager Class
  class ResourceManager {
    constructor() {
      this.activeConnections = new Map();
      this.streamResources = new Map();
      this.cleanupInterval = null;
      this.startCleanupMonitoring();
    }

    startCleanupMonitoring() {
      this.cleanupInterval = setInterval(() => {
        this.performCleanup();
      }, 30000);
    }

    stopCleanupMonitoring() {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
    }

    performCleanup() {
      try {
        this.cleanupInactiveConnections();
        this.cleanupInactiveStreams();
        console.log('Resource cleanup completed');
      } catch (error) {
        console.error('Resource cleanup failed:', error);
      }
    }

    cleanupInactiveConnections() {
      const now = Date.now();
      const inactiveTimeout = 5 * 60 * 1000;
      
      for (const [socketId, connection] of this.activeConnections) {
        if (now - connection.lastActivity > inactiveTimeout) {
          this.activeConnections.delete(socketId);
        }
      }
    }

    cleanupInactiveStreams() {
      const now = Date.now();
      const inactiveTimeout = 10 * 60 * 1000;
      
      for (const [roomId, stream] of this.streamResources) {
        if (now - stream.lastActivity > inactiveTimeout) {
          this.streamResources.delete(roomId);
        }
      }
    }

    cleanupAll() {
      this.activeConnections.clear();
      this.streamResources.clear();
      console.log('All resources cleaned up');
    }
  }

  const resourceManager = new ResourceManager();

  io.on('connection', socket => {
    console.log('🔌 New socket connection:', socket.id);
    
    connectionStates.set(socket.id, 'connecting');
    
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      connectionStates.set(socket.id, 'error');
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', socket.id, 'Reason:', reason);
      cleanupSocketData(socket.id);
      console.log(`📊 Cleanup completed for socket ${socket.id}. Active viewers: ${viewerCount}`);
    });

    socket.on('connection-established', () => {
      connectionStates.set(socket.id, 'connected');
      processQueuedSignals(socket.id);
    });

    socket.on('watcher', (userInfo) => {
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'watcher', data: userInfo });
        return;
      }
      
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

    socket.on('admin-start', () => {
      try {
        if (!validateConnectionState(socket.id, 'connected')) {
          queueSignal(socket.id, { type: 'admin-start', data: null });
          return;
        }
        
        if (isStreamActive && adminSocketId) {
          socket.emit('stream-error', {
            type: 'already-active',
            message: 'Stream is already active',
            timestamp: Date.now()
          });
          return;
        }
        
        const userInfo = connectedUsers.get(socket.id);
        if (!userInfo || !userInfo.isAdmin) {
          socket.emit('stream-error', {
            type: 'unauthorized',
            message: 'Admin privileges required',
            timestamp: Date.now()
          });
          return;
        }
        
        const defaultRoomId = `livestream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        if (webrtcRooms.has(defaultRoomId)) {
          socket.emit('stream-error', {
            type: 'room-creation-failed',
            message: 'Room ID collision detected',
            timestamp: Date.now()
          });
          return;
        }
        
        isStreamActive = true;
        adminSocketId = socket.id;
        viewerCount = 0;
        
        webrtcRooms.set(defaultRoomId, {
          adminSocketId: socket.id,
          adminInfo: userInfo,
          viewers: new Set(),
          createdAt: Date.now(),
          lastActivity: Date.now(),
          streamMetadata: {
            title: userInfo.name || 'Admin Stream',
            startedAt: Date.now(),
            status: 'active'
          }
        });
        
        resourceManager.trackStream(defaultRoomId, {
          adminSocketId: socket.id,
          adminInfo: userInfo,
          startedAt: Date.now()
        });
        
        console.log('🚀 Stream started with WebRTC room:', defaultRoomId);
        
        io.emit('stream-started', { 
          roomId: defaultRoomId,
          adminInfo: userInfo,
          timestamp: Date.now(),
          streamId: `stream_${defaultRoomId}`
        });
        
        socket.emit('stream-started-confirmation', {
          roomId: defaultRoomId,
          timestamp: Date.now(),
          success: true
        });
        
      } catch (error) {
        console.error('❌ Admin start stream failed:', error);
        socket.emit('stream-error', {
          type: 'start-failed',
          error: error.message,
          timestamp: Date.now()
        });
      }
    });

    socket.on('admin-start-recording', (lectureId) => {
      if (!validateConnectionState(socket.id, 'connected') || socket.id !== adminSocketId) {
        queueSignal(socket.id, { type: 'admin-start-recording', data: lectureId });
        return;
      }
      
      isRecording = true;
      recordingStartTime = Date.now();
      currentLectureId = lectureId;
      io.emit('recording-started', { lectureId, startTime: recordingStartTime });
    });

    socket.on('admin-stop-recording', () => {
      if (!validateConnectionState(socket.id, 'connected') || socket.id !== adminSocketId || !isRecording) {
        queueSignal(socket.id, { type: 'admin-stop-recording', data: null });
        return;
      }
      
      isRecording = false;
      const recordingDuration = Math.floor((Date.now() - recordingStartTime) / 1000);
      io.emit('recording-stopped', { 
        lectureId: currentLectureId, 
        duration: recordingDuration,
        startTime: recordingStartTime 
      });
      
      recordingStartTime = null;
      currentLectureId = null;
    });

    socket.on('createRoom', ({ roomId }) => {
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

    socket.on('joinRoom', ({ roomId, viewerId }) => {
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'joinRoom', data: { roomId, viewerId } });
        return;
      }
      
      const room = webrtcRooms.get(roomId);
      if (room) {
        room.viewers.add(viewerId);
        console.log('👤 Viewer joined Custom WebRTC room:', roomId, 'Viewer:', viewerId);
        
        io.to(room.adminSocketId).emit('viewerJoined', viewerId);
        socket.emit('roomJoined', { roomId, success: true });
      } else {
        socket.emit('roomNotFound', { roomId });
      }
    });

    socket.on('webrtc-offer', ({ roomId, offer, targetViewerId }) => {
      if (!validateConnectionState(socket.id, 'connected') || !checkRateLimit(socket.id, 'offer')) {
        queueSignal(socket.id, { type: 'webrtc-offer', data: { roomId, offer, targetViewerId } });
        return;
      }
      
      const room = webrtcRooms.get(roomId);
      if (room && targetViewerId) {
        if (room.viewers.has(targetViewerId)) {
          io.to(targetViewerId).emit('webrtc-offer', { offer });
          console.log('📤 WebRTC offer forwarded to specific viewer:', targetViewerId);
        } else {
          console.log('⚠️ Target viewer not found in room:', targetViewerId);
          io.to(targetViewerId).emit('webrtc-offer', { offer });
        }
      } else {
        console.log('⚠️ Invalid offer data:', { roomId, targetViewerId });
      }
    });

    socket.on('webrtc-answer', ({ roomId, answer }) => {
      if (!validateConnectionState(socket.id, 'connected') || !checkRateLimit(socket.id, 'answer')) {
        queueSignal(socket.id, { type: 'webrtc-answer', data: { roomId, answer } });
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

    socket.on('ice-candidate', ({ roomId, candidate, targetViewerId }) => {
      if (!validateConnectionState(socket.id, 'connected') || !checkRateLimit(socket.id, 'ice-candidate')) {
        queueSignal(socket.id, { type: 'ice-candidate', data: { roomId, candidate, targetViewerId } });
        return;
      }
      
      const room = webrtcRooms.get(roomId);
      if (room) {
        if (socket.id === room.adminSocketId) {
          if (targetViewerId && room.viewers.has(targetViewerId)) {
            io.to(targetViewerId).emit('ice-candidate', { candidate });
            console.log('🧊 Admin ICE candidate forwarded to viewer:', targetViewerId);
          } else {
            console.log('⚠️ Target viewer not found for admin ICE candidate:', targetViewerId);
            if (targetViewerId) {
              io.to(targetViewerId).emit('ice-candidate', { candidate });
            }
          }
        } else {
          io.to(room.adminSocketId).emit('ice-candidate', { 
            socketId: socket.id, 
            candidate 
          });
          console.log('🧊 Viewer ICE candidate forwarded to admin');
        }
      }
    });

    socket.on('join-stream', ({ roomId, userInfo }) => {
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'join-stream', data: { roomId, userInfo } });
        return;
      }
      
      const room = webrtcRooms.get(roomId);
      if (room) {
        room.viewers.add(socket.id);
        
        if (userInfo) {
          connectedUsers.set(socket.id, userInfo);
        }
        
        console.log('👤 Viewer joined stream in room:', roomId, 'User:', userInfo?.name || 'Anonymous');
        
        io.to(room.adminSocketId).emit('viewer-join', { 
          socketId: socket.id, 
          userInfo: userInfo || connectedUsers.get(socket.id),
          viewerCount: room.viewers.size 
        });
      }
    });

    socket.on('chat-message', data => {
      if (!validateConnectionState(socket.id, 'connected') || !checkRateLimit(socket.id, 'chat-message')) {
        queueSignal(socket.id, { type: 'chat-message', data });
        return;
      }
      
      io.emit('chat-message', data);
    });

    socket.on('admin-chat', message => {
      if (!validateConnectionState(socket.id, 'connected') || socket.id !== adminSocketId || !checkRateLimit(socket.id, 'chat-message')) {
        queueSignal(socket.id, { type: 'admin-chat', data: message });
        return;
      }
      
      io.emit('chat-message', { sender: 'Admin', message });
    });

    socket.on('mic-request', data => {
      if (!validateConnectionState(socket.id, 'connected') || !checkRateLimit(socket.id, 'mic-request')) {
        queueSignal(socket.id, { type: 'mic-request', data });
        return;
      }
      
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

    socket.on('admin-end', () => {
      if (!validateConnectionState(socket.id, 'connected') || socket.id !== adminSocketId) {
        queueSignal(socket.id, { type: 'admin-end', data: null });
        return;
      }
      
      isStreamActive = false;
      adminSocketId = null;
      viewerCount = 0;
      io.emit('stream-stopped');
    });
  });

  // Graceful shutdown with resource cleanup
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, cleaning up resources...');
    resourceManager.stopCleanupMonitoring();
    resourceManager.cleanupAll();
    io.close(() => {
      console.log('Socket.IO server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, cleaning up resources...');
    resourceManager.stopCleanupMonitoring();
    resourceManager.cleanupAll();
    io.close(() => {
      console.log('Socket.IO server closed');
      process.exit(0);
    });
  });
};
