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

  // NEW: Rate limiting helper function
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

  // NEW: Clean up rate limiting data
  const cleanupRateLimit = (socketId) => {
    rateLimitMap.delete(socketId);
    pendingSignals.delete(socketId);
    connectionStates.delete(socketId);
  };

  // NEW: Comprehensive cleanup for disconnected sockets
  const cleanupSocketData = (socketId) => {
    cleanupRateLimit(socketId);
    
    // Remove from connected users
    if (connectedUsers.has(socketId)) {
      const userInfo = connectedUsers.get(socketId);
      if (userInfo.isAdmin) {
        // Admin disconnected - end stream
        isStreamActive = false;
        adminSocketId = null;
        viewerCount = 0;
        
        // Notify all viewers
        io.emit('stream-stopped', { reason: 'Admin disconnected' });
      } else {
        // Viewer disconnected - update count
        viewerCount = Math.max(0, viewerCount - 1);
      }
      connectedUsers.delete(socketId);
    }
    
    // Clean up WebRTC rooms
    webrtcRooms.forEach((room, roomId) => {
      if (room.adminSocketId === socketId) {
        // Admin left room - close room
        webrtcRooms.delete(roomId);
        io.emit('stream-stopped', { reason: 'Admin left room' });
      } else if (room.viewers.has(socketId)) {
        // Viewer left room
        room.viewers.delete(socketId);
        if (room.viewers.size === 0 && !room.adminSocketId) {
          // Empty room - clean up
          webrtcRooms.delete(roomId);
        }
      }
    });
  };

  // NEW: Helper function to validate connection state
  const validateConnectionState = (socketId, expectedState) => {
    const currentState = connectionStates.get(socketId);
    return currentState === expectedState;
  };

  // NEW: Helper function to queue signals
  const queueSignal = (socketId, signal) => {
    if (!pendingSignals.has(socketId)) {
      pendingSignals.set(socketId, []);
    }
    pendingSignals.get(socketId).push(signal);
  };

  // NEW: Helper function to process queued signals
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

  // NEW: Resource cleanup and memory management
  class ResourceManager {
    constructor() {
      this.activeConnections = new Map();
      this.streamResources = new Map();
      this.memoryUsage = new Map();
      this.cleanupInterval = null;
      this.maxMemoryUsage = 500 * 1024 * 1024; // 500MB
      this.maxConnections = 1000;
      
      this.startCleanupMonitoring();
    }

    // Start cleanup monitoring
    startCleanupMonitoring() {
      this.cleanupInterval = setInterval(() => {
        this.performCleanup();
      }, 30000); // Cleanup every 30 seconds
    }

    // Stop cleanup monitoring
    stopCleanupMonitoring() {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
    }

    // Track connection resources
    trackConnection(socketId, connectionInfo) {
      this.activeConnections.set(socketId, {
        ...connectionInfo,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        memoryUsage: 0
      });
    }

    // Track stream resources
    trackStream(roomId, streamInfo) {
      this.streamResources.set(roomId, {
        ...streamInfo,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        memoryUsage: 0,
        connections: new Set()
      });
    }

    // Update connection activity
    updateConnectionActivity(socketId) {
      const connection = this.activeConnections.get(socketId);
      if (connection) {
        connection.lastActivity = Date.now();
      }
    }

    // Update stream activity
    updateStreamActivity(roomId) {
      const stream = this.streamResources.get(roomId);
      if (stream) {
        stream.lastActivity = Date.now();
      }
    }

    // Perform cleanup operations
    performCleanup() {
      try {
        // Cleanup inactive connections
        this.cleanupInactiveConnections();
        
        // Cleanup inactive streams
        this.cleanupInactiveStreams();
        
        // Memory cleanup
        this.performMemoryCleanup();
        
        // Log cleanup stats
        this.logCleanupStats();
        
      } catch (error) {
        console.error('Resource cleanup failed:', error);
      }
    }

    // Cleanup inactive connections
    cleanupInactiveConnections() {
      const now = Date.now();
      const inactiveTimeout = 5 * 60 * 1000; // 5 minutes
      
      for (const [socketId, connection] of this.activeConnections) {
        if (now - connection.lastActivity > inactiveTimeout) {
          console.log(`Cleaning up inactive connection: ${socketId}`);
          this.activeConnections.delete(socketId);
          
          // Notify socket to disconnect
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect(true);
          }
        }
      }
    }

    // Cleanup inactive streams
    cleanupInactiveStreams() {
      const now = Date.now();
      const inactiveTimeout = 10 * 60 * 1000; // 10 minutes
      
      for (const [roomId, stream] of this.streamResources) {
        if (now - stream.lastActivity > inactiveTimeout) {
          console.log(`Cleaning up inactive stream: ${roomId}`);
          this.streamResources.delete(roomId);
          
          // Remove from active streams
          // This part needs to be implemented if activeStreams is defined elsewhere
          // For now, assuming activeStreams is a global or passed variable
          // if (activeStreams.has(roomId)) {
          //   removeStream(roomId);
          // }
        }
      }
    }

    // Perform memory cleanup
    performMemoryCleanup() {
      const currentMemory = process.memoryUsage();
      const totalMemory = currentMemory.heapUsed + currentMemory.external;
      
      if (totalMemory > this.maxMemoryUsage) {
        console.warn(`Memory usage high: ${Math.round(totalMemory / 1024 / 1024)}MB, performing cleanup`);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        // Clear old connection data
        this.clearOldConnectionData();
        
        // Clear old stream data
        this.clearOldStreamData();
      }
    }

    // Clear old connection data
    clearOldConnectionData() {
      const now = Date.now();
      const oldDataTimeout = 30 * 60 * 1000; // 30 minutes
      
      for (const [socketId, connection] of this.activeConnections) {
        if (now - connection.createdAt > oldDataTimeout) {
          // Keep connection but clear old data
          connection.memoryUsage = 0;
          delete connection.oldData;
        }
      }
    }

    // Clear old stream data
    clearOldStreamData() {
      const now = Date.now();
      const oldDataTimeout = 60 * 60 * 1000; // 1 hour
      
      for (const [roomId, stream] of this.streamResources) {
        if (now - stream.createdAt > oldDataTimeout) {
          // Keep stream but clear old data
          stream.memoryUsage = 0;
          delete stream.oldData;
        }
      }
    }

    // Log cleanup stats
    logCleanupStats() {
      const stats = {
        activeConnections: this.activeConnections.size,
        activeStreams: this.streamResources.size,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
      
      console.log('Resource cleanup stats:', stats);
    }

    // Get resource usage statistics
    getResourceStats() {
      return {
        connections: this.activeConnections.size,
        streams: this.streamResources.size,
        memory: process.memoryUsage(),
        limits: {
          maxConnections: this.maxMemoryUsage,
          maxMemory: this.maxMemoryUsage
        }
      };
    }

    // Force cleanup of specific resources
    forceCleanup(type, identifier) {
      switch (type) {
        case 'connection':
          this.activeConnections.delete(identifier);
          break;
        case 'stream':
          this.streamResources.delete(identifier);
          break;
        default:
          console.warn(`Unknown cleanup type: ${type}`);
      }
    }

    // Cleanup all resources
    cleanupAll() {
      this.activeConnections.clear();
      this.streamResources.clear();
      
      if (global.gc) {
        global.gc();
      }
      
      console.log('All resources cleaned up');
    }
  }

  // Initialize resource manager
  const resourceManager = new ResourceManager();

  io.on('connection', socket => {
    // Production-ready: Console logging removed
    
    // Add connection logging
    console.log('🔌 New socket connection:', socket.id);
    
    // NEW: Initialize connection state
    connectionStates.set(socket.id, 'connecting');
    
    // Add error handling
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      connectionStates.set(socket.id, 'error');
    });
    
    // Add disconnect logging
    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', socket.id, 'Reason:', reason);
      
      // Use comprehensive cleanup function
      cleanupSocketData(socket.id);
      
      // Log cleanup results
      console.log(`📊 Cleanup completed for socket ${socket.id}. Active viewers: ${viewerCount}`);
    });

    // NEW: Connection established event
    socket.on('connection-established', () => {
      connectionStates.set(socket.id, 'connected');
      processQueuedSignals(socket.id);
    });

    // Viewer joins and requests to watch
    socket.on('watcher', (userInfo) => {
      // Production-ready: Console logging removed
      
      // NEW: Validate connection state
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'watcher', data: userInfo });
        return;
      }
      
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
      
      // NEW: Validate connection state
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'admin-start', data: null });
        return;
      }
      
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
      
      // NEW: Validate connection state and admin permissions
      if (!validateConnectionState(socket.id, 'connected') || socket.id !== adminSocketId) {
        queueSignal(socket.id, { type: 'admin-start-recording', data: lectureId });
        return;
      }
      
      isRecording = true;
      recordingStartTime = Date.now();
      currentLectureId = lectureId;
      io.emit('recording-started', { lectureId, startTime: recordingStartTime });
    });

    // NEW: Admin stops recording
    socket.on('admin-stop-recording', () => {
      // Production-ready: Console logging removed
      
      // NEW: Validate connection state and admin permissions
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
      
      // Reset recording state
      recordingStartTime = null;
      currentLectureId = null;
    });

    // 🚀 CUSTOM WEBRTC LIVESTREAMING EVENTS
    
    // Admin creates WebRTC room
    socket.on('createRoom', ({ roomId }) => {
      // NEW: Validate connection state
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
      // NEW: Validate connection state
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
      // NEW: Validate connection state
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'leaveRoom', data: { roomId, viewerId } });
        return;
      }
      
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
      // NEW: Validate connection state
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'iceCandidate', data: { viewerId, candidate } });
        return;
      }
      
      // Forward ICE candidate to the appropriate peer
      socket.broadcast.emit('iceCandidate', { viewerId, candidate });
    });

    // WebRTC offer/answer exchange
    socket.on('offer', ({ viewerId, offer }) => {
      // NEW: Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'offer', data: { viewerId, offer } });
        return;
      }
      
      // NEW: Check rate limit
      if (!checkRateLimit(socket.id, 'offer')) {
        socket.emit('rate-limit-exceeded', { eventType: 'offer', message: 'Too many offers sent' });
        return;
      }
      
      // Forward offer to admin
      socket.broadcast.emit('offer', { viewerId, offer });
    });

    socket.on('answer', ({ viewerId, answer }) => {
      // NEW: Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'answer', data: { viewerId, answer } });
        return;
      }
      
      // NEW: Check rate limit
      if (!checkRateLimit(socket.id, 'answer')) {
        socket.emit('rate-limit-exceeded', { eventType: 'answer', message: 'Too many answers sent' });
        return;
      }
      
      // Forward answer to viewer
      socket.broadcast.emit('answer', { viewerId, answer });
    });

    // Admin leaves WebRTC room
    socket.on('leaveRoom', ({ roomId }) => {
      // NEW: Validate connection state
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
    socket.on('admin-end', () => {
      // Production-ready: Console logging removed
      
      // NEW: Validate connection state and admin permissions
      if (!validateConnectionState(socket.id, 'connected') || socket.id !== adminSocketId) {
        queueSignal(socket.id, { type: 'admin-end', data: null });
        return;
      }
      
      isStreamActive = false;
      adminSocketId = null;
      viewerCount = 0; // Reset viewer count
      io.emit('stream-stopped');
    });

    // 🚀 CUSTOM WEBRTC SIGNALING EVENTS
    
    // WebRTC offer from admin to specific viewer
    socket.on('webrtc-offer', ({ roomId, offer, targetViewerId }) => {
      // NEW: Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'webrtc-offer', data: { roomId, offer, targetViewerId } });
        return;
      }
      
      // NEW: Check rate limit
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
      // NEW: Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'webrtc-answer', data: { roomId, answer } });
        return;
      }
      
      // NEW: Check rate limit
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
      // NEW: Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'ice-candidate', data: { roomId, candidate, targetViewerId } });
        return;
      }
      
      // NEW: Check rate limit
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
      // NEW: Validate connection state
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
      
      // NEW: Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'offer', data: { target, offer } });
        return;
      }
      
      // NEW: Check rate limit
      if (!checkRateLimit(socket.id, 'offer')) {
        socket.emit('rate-limit-exceeded', { eventType: 'offer', message: 'Too many offers sent' });
        return;
      }
      
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
      
      // NEW: Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'answer', data: { target, answer } });
        return;
      }
      
      // NEW: Check rate limit
      if (!checkRateLimit(socket.id, 'answer')) {
        socket.emit('rate-limit-exceeded', { eventType: 'answer', message: 'Too many answers sent' });
        return;
      }
      
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
      
      // NEW: Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'chat-message', data });
        return;
      }
      
      // NEW: Check rate limit
      if (!checkRateLimit(socket.id, 'chat-message')) {
        socket.emit('rate-limit-exceeded', { eventType: 'chat-message', message: 'Too many chat messages sent' });
        return;
      }
      
      io.emit('chat-message', data);
    });

    socket.on('admin-chat', message => {
      // Production-ready: Console logging removed
      
      // NEW: Validate connection state and admin permissions
      if (!validateConnectionState(socket.id, 'connected') || socket.id !== adminSocketId) {
        queueSignal(socket.id, { type: 'admin-chat', data: message });
        return;
      }
      
      // NEW: Check rate limit
      if (!checkRateLimit(socket.id, 'chat-message')) {
        socket.emit('rate-limit-exceeded', { eventType: 'chat-message', message: 'Too many chat messages sent' });
        return;
      }
      
      io.emit('chat-message', { sender: 'Admin', message });
    });
    
    // Admin chat received notification
    socket.on('admin-chat-received', data => {
      // Log admin chat received (for monitoring purposes)
      console.log('📨 Admin chat received from viewer:', data);
    });

    // Mic request functionality
    socket.on('mic-request', data => {
      // NEW: Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'mic-request', data });
        return;
      }
      
      // NEW: Check rate limit
      if (!checkRateLimit(socket.id, 'mic-request')) {
        socket.emit('rate-limit-exceeded', { eventType: 'mic-request', message: 'Too many mic requests sent' });
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

    // Unmute request functionality
    socket.on('unmute-request', data => {
      // NEW: Validate connection state and rate limit
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'unmute-request', data });
        return;
      }
      
      // NEW: Check rate limit
      if (!checkRateLimit(socket.id, 'mic-request')) {
        socket.emit('rate-limit-exceeded', { eventType: 'mic-request', message: 'Too many mic requests sent' });
        return;
      }
      
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
      // NEW: Validate connection state and admin permissions
      if (!validateConnectionState(socket.id, 'connected') || socket.id !== adminSocketId) {
        queueSignal(socket.id, { type: 'approve-mic', data: targetSocketId });
        return;
      }
      
      console.log('✅ Admin approved mic for viewer:', targetSocketId);
      io.to(targetSocketId).emit('mic-approved');
    });

    socket.on('reject-mic', (targetSocketId) => {
      // NEW: Validate connection state and admin permissions
      if (!validateConnectionState(socket.id, 'connected') || socket.id !== adminSocketId) {
        queueSignal(socket.id, { type: 'reject-mic', data: targetSocketId });
        return;
      }
      
      console.log('❌ Admin rejected mic for viewer:', targetSocketId);
      io.to(targetSocketId).emit('mic-rejected');
    });

    socket.on('mute-user-mic', (targetSocketId) => {
      // NEW: Validate connection state and admin permissions
      if (!validateConnectionState(socket.id, 'connected') || socket.id !== adminSocketId) {
        queueSignal(socket.id, { type: 'mute-user-mic', data: targetSocketId });
        return;
      }
      
      console.log('🔇 Admin muted mic for viewer:', targetSocketId);
      io.to(targetSocketId).emit('mic-muted');
    });

    // 🚀 CUSTOM WEBRTC MIC REQUEST RESPONSE
    socket.on('mic-request-response', ({ targetSocketId, approved }) => {
      // NEW: Validate connection state
      if (!validateConnectionState(socket.id, 'connected')) {
        queueSignal(socket.id, { type: 'mic-request-response', data: { targetSocketId, approved } });
        return;
      }
      
      console.log('🎤 Mic request response:', { targetSocketId, approved });
      io.to(targetSocketId).emit('mic-request-response', { approved });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ disconnected:', socket.id);
      
      // NEW: Clean up connection state and pending signals
      connectionStates.delete(socket.id);
      pendingSignals.delete(socket.id);
      cleanupRateLimit(socket.id);
      
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
  
  // Graceful shutdown with resource cleanup
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, cleaning up resources...');
    
    // Stop cleanup monitoring
    resourceManager.stopCleanupMonitoring();
    
    // Cleanup all resources
    resourceManager.cleanupAll();
    
    // Close all socket connections
    io.close(() => {
      console.log('Socket.IO server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, cleaning up resources...');
    
    // Stop cleanup monitoring
    resourceManager.stopCleanupMonitoring();
    
    // Cleanup all resources
    resourceManager.cleanupAll();
    
    // Close all socket connections
    io.close(() => {
      console.log('Socket.IO server closed');
      process.exit(0);
    });
  });
};