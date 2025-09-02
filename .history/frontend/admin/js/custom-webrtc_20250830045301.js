// 🚀 CUSTOM WEBRTC LIVESTREAMING SYSTEM
// This replaces the previous livestreaming systems with a custom WebRTC implementation

class CustomWebRTCManager {
    constructor() {
        this.localStream = null;
        this.peerConnections = new Map();
        this.socket = null;
        this.roomId = null;
        this.isLive = false;
        this.viewers = new Set();
        this.pendingViewers = new Set();
        this.isRecording = false;
        
        // Connection health monitoring
        this.connectionHealth = {
            lastHeartbeat: Date.now(),
            connectionQuality: 'unknown',
            reconnectAttempts: 0,
            maxReconnectAttempts: 5,
            reconnectDelay: 1000,
            healthCheckInterval: null,
            connectionStats: {
                rtt: 0,
                packetLoss: 0,
                bitrate: 0
            }
        };
        
        this.eventListeners = {};
        this.initializeSocket();
    }
    
    // Initialize socket connection
    initializeSocket() {
        try {
            if (typeof io !== 'undefined') {
                this.socket = io();
                console.log('✅ Socket.IO connection established');
                this.setupSocketListeners();
            } else {
                console.warn('⚠️ Socket.IO not available, using fallback');
                this.socket = this.createFallbackSocket();
            }
        } catch (error) {
            console.error('❌ Failed to initialize socket:', error);
        }
    }
    
    // Create fallback socket if Socket.IO is not available
    createFallbackSocket() {
        return {
            connected: false,
            emit: (event, data) => console.log(`Fallback emit: ${event}`, data),
            on: (event, callback) => console.log(`Fallback listener: ${event}`),
            connect: () => { this.socket.connected = true; }
        };
    }

    // Start health monitoring
    startHealthMonitoring() {
        this.connectionHealth.healthCheckInterval = setInterval(() => {
            this.checkConnectionHealth();
        }, 10000);
    }

    // Stop health monitoring
    stopHealthMonitoring() {
        if (this.connectionHealth.healthCheckInterval) {
            clearInterval(this.connectionHealth.healthCheckInterval);
            this.connectionHealth.healthCheckInterval = null;
        }
    }

    // Check connection health
    async checkConnectionHealth() {
        try {
            if (!this.socket.connected) {
                this.handleConnectionFailure('Socket disconnected');
                return;
            }

            for (const [viewerId, connection] of this.peerConnections) {
                if (connection.connectionState === 'failed' || connection.connectionState === 'disconnected') {
                    this.handleConnectionFailure(`WebRTC connection failed for viewer: ${viewerId}`);
                    continue;
                }

                if (connection.connectionState === 'connected') {
                    try {
                        const stats = await connection.getStats();
                        this.updateConnectionStats(stats);
                    } catch (error) {
                        console.warn('Failed to get connection stats:', error);
                    }
                }
            }

            this.connectionHealth.lastHeartbeat = Date.now();
        } catch (error) {
            console.error('Health check failed:', error);
        }
    }

    // Update connection stats
    updateConnectionStats(stats) {
        try {
            stats.forEach(report => {
                if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                    this.connectionHealth.connectionStats.bitrate = report.bytesReceived * 8 / 1000; // kbps
                }
            });
        } catch (error) {
            console.warn('Failed to update connection stats:', error);
        }
    }

    // Handle connection failure
    handleConnectionFailure(reason) {
        console.warn('Connection failure:', reason);
        this.connectionHealth.reconnectAttempts++;
        
        if (this.connectionHealth.reconnectAttempts <= this.connectionHealth.maxReconnectAttempts) {
            setTimeout(() => {
                this.attemptReconnection();
            }, this.connectionHealth.reconnectDelay);
        } else {
            console.error('Max reconnection attempts reached');
            this.connectionHealth.connectionQuality = 'failed';
        }
    }

    // Attempt reconnection
    async attemptReconnection() {
        try {
            console.log('Attempting reconnection...');
            if (this.socket) {
                this.socket.connect();
            }
            
            // Recreate peer connections for existing viewers
            for (const viewerId of this.viewers) {
                await this.createPeerConnection(viewerId);
            }
            
            this.connectionHealth.reconnectAttempts = 0;
            this.connectionHealth.connectionQuality = 'reconnecting';
            
        } catch (error) {
            console.error('Reconnection failed:', error);
        }
    }

    // Setup socket listeners
    setupSocketListeners() {
        if (!this.socket) return;

        // Viewer joined
        this.socket.on('viewerJoined', (viewerId) => {
            console.log('👤 Viewer joined:', viewerId);
            this.viewers.add(viewerId);
            
            // Create peer connection for new viewer
            this.createPeerConnection(viewerId).catch(error => {
                console.error('❌ Failed to create peer connection for viewer:', viewerId, error);
            });
        });

        // Viewer left
        this.socket.on('viewerLeft', (viewerId) => {
            console.log('👤 Viewer left:', viewerId);
            this.viewers.delete(viewerId);
            this.removePeerConnection(viewerId);
        });

        // WebRTC answer from viewer
        this.socket.on('webrtc-answer', (data) => {
            const { socketId, answer } = data;
            console.log('📥 WebRTC answer received from viewer:', socketId);
            
            const pc = this.peerConnections.get(socketId);
            if (pc) {
                pc.setRemoteDescription(new RTCSessionDescription(answer))
                    .then(() => console.log('✅ Remote description set for viewer:', socketId))
                    .catch(error => console.error('❌ Failed to set remote description:', error));
            } else {
                console.warn('⚠️ No peer connection found for viewer:', socketId);
            }
        });

        // ICE candidate from viewer
        this.socket.on('ice-candidate', (data) => {
            const { socketId, candidate } = data;
            console.log('🧊 ICE candidate received from viewer:', socketId);
            
            const pc = this.peerConnections.get(socketId);
            if (pc) {
                pc.addIceCandidate(new RTCIceCandidate(candidate))
                    .then(() => console.log('✅ ICE candidate added for viewer:', socketId))
                    .catch(error => console.error('❌ Failed to add ICE candidate:', error));
            } else {
                console.warn('⚠️ No peer connection found for viewer:', socketId);
            }
        });

        // Room created
        this.socket.on('room-created', (data) => {
            console.log('🏠 Room created:', data);
            this.roomId = data.roomId;
        });

        // Admin joined
        this.socket.on('admin-joined', (data) => {
            console.log('👨‍💼 Admin joined room:', data);
        });
    }

    // Start livestream
    async startLivestream() {
        try {
            console.log('🚀 Starting livestream...');
            
            // Get user media
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                }
            });

            // Create room
            this.socket.emit('create-room', {
                adminId: this.socket.id,
                streamTitle: 'Live Stream',
                streamDescription: 'Live streaming session'
            });

            this.isLive = true;
            this.startHealthMonitoring();
            
            console.log('✅ Livestream started successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to start livestream:', error);
            throw error;
        }
    }

    // Stop livestream
    async stopLivestream() {
        try {
            console.log('🛑 Stopping livestream...');
            
            // Stop all tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }
            
            // Close all peer connections
            this.peerConnections.forEach((connection, viewerId) => {
                try {
                    connection.close();
                } catch (error) {
                    console.warn(`Error closing connection for viewer ${viewerId}:`, error);
                }
            });
            
            // Clear connections
            this.peerConnections.clear();
            this.viewers.clear();
            this.pendingViewers.clear();
            
            // Stop health monitoring
            this.stopHealthMonitoring();
            
            // Emit stream stopped
            if (this.socket) {
                this.socket.emit('admin-stream-stopped', {
                    roomId: this.roomId,
                    adminId: this.socket.id
                });
            }
            
            this.isLive = false;
            this.roomId = null;
            
            console.log('✅ Livestream stopped successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to stop livestream:', error);
            throw error;
        }
    }

    // Toggle screen share
    async toggleScreenShare() {
        try {
            if (this.screenShareStream) {
                // Stop screen share
                this.screenShareStream.getTracks().forEach(track => track.stop());
                this.screenShareStream = null;
                
                // Resume camera
                if (this.localStream) {
                    const videoTrack = this.localStream.getVideoTracks()[0];
                    if (videoTrack) {
                        videoTrack.enabled = true;
                    }
                }
                
                console.log('✅ Screen share stopped');
            } else {
                // Start screen share
                this.screenShareStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        frameRate: { ideal: 30 }
                    },
                    audio: false
                });
                
                // Replace video track
                if (this.localStream && this.screenShareStream) {
                    const videoTrack = this.screenShareStream.getVideoTracks()[0];
                    if (videoTrack) {
                        const sender = this.peerConnections.values().next().value?.getSenders().find(s => s.track?.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(videoTrack);
                        }
                    }
                }
                
                console.log('✅ Screen share started');
            }
            
        } catch (error) {
            console.error('❌ Failed to toggle screen share:', error);
            throw error;
        }
    }

    // Get connection health
    getConnectionHealth() {
        return {
            connectionQuality: this.connectionHealth.connectionQuality,
            lastHeartbeat: this.connectionHealth.lastHeartbeat,
            reconnectAttempts: this.connectionHealth.reconnectAttempts,
            connectionStats: this.connectionHealth.connectionStats,
            isConnected: this.socket?.connected || false,
            viewerCount: this.viewers.size,
            peerConnectionCount: this.peerConnections.size
        };
    }

    // Get viewer count
    getViewerCount() {
        return this.viewers.size;
    }

    // Create peer connection for viewer
    async createPeerConnection(viewerId) {
        try {
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });

            // Add local stream tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    pc.addTrack(track, this.localStream);
                });
            }

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    this.socket.emit('ice-candidate', {
                        targetViewerId: viewerId,
                        candidate: event.candidate
                    });
                }
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                this.handlePeerConnectionStateChange(viewerId, pc.connectionState);
            };

            // Store peer connection
            this.peerConnections.set(viewerId, pc);

            // Create and send offer
            await this.createAndSendOffer(viewerId, pc);

            console.log('✅ Peer connection created for viewer:', viewerId);
            return pc;

        } catch (error) {
            console.error('❌ Failed to create peer connection for viewer:', viewerId, error);
            throw error;
        }
    }

    // Create and send offer
    async createAndSendOffer(viewerId, pc) {
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            this.socket.emit('webrtc-offer', {
                targetViewerId: viewerId,
                offer: offer
            });

            console.log('📤 WebRTC offer sent to viewer:', viewerId);

        } catch (error) {
            console.error('❌ Failed to create/send offer:', error);
            throw error;
        }
    }

    // Handle peer connection state change
    handlePeerConnectionStateChange(viewerId, state) {
        console.log(`🔗 Peer connection state changed for viewer ${viewerId}:`, state);
        
        if (state === 'connected') {
            console.log('✅ Peer connection established with viewer:', viewerId);
        } else if (state === 'failed' || state === 'disconnected') {
            console.warn('⚠️ Peer connection failed/disconnected with viewer:', viewerId);
            this.removePeerConnection(viewerId);
        }
    }

    // Remove peer connection
    removePeerConnection(viewerId) {
        const pc = this.peerConnections.get(viewerId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(viewerId);
            console.log('🗑️ Peer connection removed for viewer:', viewerId);
        }
    }

    // Emit stream started
    emitStreamStarted() {
        if (this.socket) {
            console.log('📤 Emitting stream-started event to all viewers');
            this.socket.emit('admin-stream-started', {
                roomId: this.roomId,
                adminId: this.socket.id,
                streamInfo: {
                    title: 'Live Stream',
                    description: 'Live streaming session',
                    startTime: new Date().toISOString(),
                    viewerInfo: {
                        currentCount: this.viewers.size,
                        maxCapacity: this.getMaxViewerCapacity()
                    }
                }
            });
        }
    }

    // Update stream UI
    updateStreamUI() {
        // This will be called by the dashboard to update UI elements
        const event = new CustomEvent('streamUIUpdate', {
            detail: {
                isLive: this.isLive,
                viewerCount: this.viewers.size,
                roomId: this.roomId,
                connectionHealth: this.getConnectionHealth()
            }
        });
        window.dispatchEvent(event);
    }

    // Update viewer count
    updateViewerCount() {
        const event = new CustomEvent('viewerCountUpdate', {
            detail: { count: this.viewers.size }
        });
        window.dispatchEvent(event);
    }

    // Update status
    updateStatus(status) {
        const event = new CustomEvent('statusUpdate', {
            detail: { status }
        });
        window.dispatchEvent(event);
    }

    // Get max viewer capacity
    getMaxViewerCapacity() {
        return 100; // Default capacity
    }

    // Notify all viewers
    notifyAllViewers(message) {
        if (this.socket) {
            this.socket.emit('admin-notification', {
                roomId: this.roomId,
                message: message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Start stream monitoring
    startStreamMonitoring() {
        setInterval(() => {
            this.monitorStreamHealth();
        }, 5000);
    }

    // Monitor stream health
    monitorStreamHealth() {
        const health = this.getConnectionHealth();
        
        if (health.connectionQuality === 'poor') {
            this.handleStreamDegradation();
        }
        
        this.updateStreamHealthUI(health);
    }

    // Handle stream degradation
    handleStreamDegradation() {
        console.warn('⚠️ Stream quality degraded, attempting optimization...');
        this.optimizeStreamQuality();
    }

    // Optimize stream quality
    optimizeStreamQuality() {
        // Reduce video quality if needed
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                const capabilities = videoTrack.getCapabilities();
                if (capabilities.width && capabilities.height) {
                    const constraints = {
                        width: { ideal: Math.min(1280, capabilities.width.max) },
                        height: { ideal: Math.min(720, capabilities.height.max) }
                    };
                    videoTrack.applyConstraints(constraints);
                }
            }
        }
    }

    // Update stream health UI
    updateStreamHealthUI(health) {
        const event = new CustomEvent('streamHealthUpdate', {
            detail: { health }
        });
        window.dispatchEvent(event);
    }

    // Get stream uptime
    getStreamUptime() {
        if (!this.isLive) return 0;
        return Date.now() - this.connectionHealth.lastHeartbeat;
    }

    // Supports screen sharing
    supportsScreenSharing() {
        return 'getDisplayMedia' in navigator.mediaDevices;
    }

    // Supports recording
    supportsRecording() {
        return 'MediaRecorder' in window;
    }

    // Supports bidirectional audio
    supportsBidirectionalAudio() {
        return true; // WebRTC supports this by default
    }

    // Supports video quality adjustment
    supportsVideoQualityAdjustment() {
        return true; // WebRTC supports this by default
    }

    // Handle stream error
    handleStreamError(error) {
        console.error('❌ Stream error:', error);
        
        // Attempt recovery
        this.attemptStreamRecovery(error);
        
        // Update error UI
        this.updateStreamErrorUI(error);
    }

    // Update stream error UI
    updateStreamErrorUI(error) {
        const event = new CustomEvent('streamErrorUpdate', {
            detail: { error: error.message }
        });
        window.dispatchEvent(event);
    }

    // Attempt stream recovery
    async attemptStreamRecovery(error) {
        try {
            console.log('🔄 Attempting stream recovery...');
            
            if (error.name === 'NotAllowedError') {
                console.log('Permission denied, requesting media access...');
                await this.requestMediaPermissions();
            } else if (error.name === 'NotFoundError') {
                console.log('Media device not found, checking available devices...');
                // Handle device not found
            } else {
                console.log('Attempting to recreate peer connections...');
                await this.recreatePeerConnections();
            }
            
        } catch (recoveryError) {
            console.error('❌ Stream recovery failed:', recoveryError);
        }
    }

    // Request media permissions
    async requestMediaPermissions() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            // Update local stream
            this.localStream = stream;
            
            // Update peer connections
            await this.recreatePeerConnections();
            
            console.log('✅ Media permissions granted and stream restored');
            
        } catch (error) {
            console.error('❌ Failed to get media permissions:', error);
        }
    }

    // Recreate peer connections
    async recreatePeerConnections() {
        try {
            // Close existing connections
            this.peerConnections.forEach((connection, viewerId) => {
                connection.close();
            });
            this.peerConnections.clear();
            
            // Recreate for existing viewers
            for (const viewerId of this.viewers) {
                await this.createPeerConnection(viewerId);
            }
            
            console.log('✅ Peer connections recreated');
            
        } catch (error) {
            console.error('❌ Failed to recreate peer connections:', error);
        }
    }

    // Event emission system
    emit(eventName, data = null) {
        try {
            if (this.socket && this.socket.connected) {
                this.socket.emit(eventName, data);
            }
            
            if (this.eventListeners && this.eventListeners[eventName]) {
                this.eventListeners[eventName].forEach(listener => {
                    try {
                        listener(data);
                    } catch (error) {
                        console.warn('Event listener error:', error);
                    }
                });
            }
            
            if (window.dispatchEvent) {
                const customEvent = new CustomEvent(`webrtc-${eventName}`, {
                    detail: { data, timestamp: Date.now() }
                });
                window.dispatchEvent(customEvent);
            }
            
        } catch (error) {
            console.warn('Failed to emit event:', eventName, error);
        }
    }

    // Event listener management
    on(eventName, listener) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(listener);
    }

    // Remove event listener
    off(eventName, listener) {
        if (this.eventListeners && this.eventListeners[eventName]) {
            const index = this.eventListeners[eventName].indexOf(listener);
            if (index > -1) {
                this.eventListeners[eventName].splice(index, 1);
            }
        }
    }

    // Cleanup resources
    cleanup() {
        try {
            console.log('🧹 Cleaning up WebRTC Manager...');
            
            // Stop livestream if active
            if (this.isLive) {
                this.stopLivestream();
            }
            
            // Stop health monitoring
            this.stopHealthMonitoring();
            
            // Close socket
            if (this.socket) {
                this.socket.disconnect();
            }
            
            // Clear all data
            this.localStream = null;
            this.peerConnections.clear();
            this.viewers.clear();
            this.pendingViewers.clear();
            this.roomId = null;
            this.isLive = false;
            
            console.log('✅ WebRTC Manager cleaned up');
            
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
        }
    }

    // Test system functionality
    async testSystem() {
        try {
            console.log('🧪 Testing WebRTC system...');
            
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            stream.getTracks().forEach(track => track.stop());
            
            const socketConnected = this.socket && this.socket.connected;
            
            return {
                success: true,
                mediaAccess: true,
                socketConnected: socketConnected,
                message: 'WebRTC system test passed'
            };
            
        } catch (error) {
            console.error('❌ WebRTC system test failed:', error);
            return {
                success: false,
                error: error.message,
                message: 'WebRTC system test failed'
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomWebRTCManager;
}
