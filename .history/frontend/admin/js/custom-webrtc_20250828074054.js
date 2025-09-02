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

    // Update connection statistics
    updateConnectionStats(stats) {
        try {
            stats.forEach(report => {
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    this.connectionHealth.connectionStats.rtt = report.currentRoundTripTime * 1000;
                }
                if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                    this.connectionHealth.connectionStats.bitrate = report.bytesReceived * 8 / 1000;
                }
            });
        } catch (error) {
            console.warn('Failed to update connection stats:', error);
        }
    }

    // Handle connection failure
    handleConnectionFailure(reason) {
        console.warn('Connection failure detected:', reason);
        
        if (this.connectionHealth.reconnectAttempts < this.connectionHealth.maxReconnectAttempts) {
            this.connectionHealth.reconnectAttempts++;
            setTimeout(() => {
                this.attemptReconnection();
            }, this.connectionHealth.reconnectDelay * this.connectionHealth.reconnectAttempts);
        } else {
            console.error('Max reconnection attempts reached');
            this.emit('connection-failed', { reason, attempts: this.connectionHealth.reconnectAttempts });
        }
    }

    // Attempt reconnection
    async attemptReconnection() {
        try {
            console.log('🔄 Attempting reconnection...');
            
            if (this.socket && !this.socket.connected) {
                this.socket.connect();
            }
            
            if (this.isLive && this.localStream) {
                await this.restartStream();
            }
            
            this.connectionHealth.reconnectAttempts = 0;
            console.log('✅ Reconnection successful');
            
        } catch (error) {
            console.error('❌ Reconnection failed:', error);
        }
    }

    // Restart stream after reconnection
    async restartStream() {
        try {
            console.log('🔄 Restarting stream after reconnection...');
            
            // Recreate peer connections for existing viewers
            for (const viewerId of this.viewers) {
                await this.createPeerConnection(viewerId);
            }
            
            console.log('✅ Stream restarted successfully');
            
        } catch (error) {
            console.error('❌ Failed to restart stream:', error);
        }
    }

    // Get connection health
    getConnectionHealth() {
        return {
            ...this.connectionHealth,
            timestamp: Date.now()
        };
    }

    // Setup socket listeners
    setupSocketListeners() {
        if (!this.socket) return;

        // Viewer joined
        this.socket.on('viewerJoined', (viewerId) => {
            console.log('👤 Viewer joined:', viewerId);
            this.viewers.add(viewerId);
            
            if (this.isLive && this.localStream) {
                this.createPeerConnection(viewerId).catch(error => {
                    console.error('❌ Failed to create peer connection for viewer:', viewerId, error);
                });
            }
        });

        // Viewer left
        this.socket.on('viewerLeft', (viewerId) => {
            this.viewers.delete(viewerId);
            this.removePeerConnection(viewerId);
        });

        // WebRTC answer from viewer
        this.socket.on('webrtc-answer', async ({ socketId, answer }) => {
            console.log('📥 WebRTC answer received from viewer:', socketId);
            
            const pc = this.peerConnections.get(socketId);
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log('✅ Remote description set for viewer:', socketId);
                } catch (error) {
                    console.error('❌ Error setting remote description:', error);
                }
            } else {
                console.warn('⚠️ No peer connection found for viewer:', socketId);
            }
        });

        // ICE candidate from viewer
        this.socket.on('ice-candidate', async ({ socketId, candidate }) => {
            console.log('🧊 ICE candidate received from viewer:', socketId);
            
            const pc = this.peerConnections.get(socketId);
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log('✅ ICE candidate added for viewer:', socketId);
                } catch (error) {
                    console.error('❌ Error adding ICE candidate:', error);
                }
            } else {
                console.warn('⚠️ No peer connection found for viewer:', socketId);
            }
        });

        // Stream started event
        this.socket.on('stream-started', (data) => {
            if (data.roomId && !this.roomId) {
                this.roomId = data.roomId;
                console.log('✅ Stream started with room ID:', this.roomId);
            }
        });

        // Stream stopped event
        this.socket.on('stream-stopped', () => {
            this.isLive = false;
            this.roomId = null;
            this.viewers.clear();
            this.pendingViewers.clear();
            
            this.peerConnections.forEach(pc => pc.close());
            this.peerConnections.clear();
        });
    }

    // Start livestream
    async startLivestream() {
        try {
            console.log('🚀 Starting livestream...');
            
            // Get user media
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1920, min: 1280 },
                    height: { ideal: 1080, min: 720 },
                    frameRate: { ideal: 30, min: 15 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                }
            });
            
            // Create room
            const roomId = `livestream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            this.roomId = roomId;
            this.isLive = true;
            
            // Emit stream started event
            this.emitStreamStarted();
            
            console.log('✅ Livestream started successfully');
            return { success: true, roomId };
            
        } catch (error) {
            console.error('❌ Failed to start livestream:', error);
            this.emit('stream-error', { error: error.message, timestamp: Date.now() });
            throw error;
        }
    }

    // Stop livestream
    async stopLivestream() {
        try {
            console.log('🛑 Stopping livestream...');
            
            this.isLive = false;
            
            // Stop local stream
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }
            
            // Close peer connections
            this.peerConnections.forEach(pc => pc.close());
            this.peerConnections.clear();
            
            // Clear viewers
            this.viewers.clear();
            this.pendingViewers.clear();
            
            // Emit stream stopped event
            this.emit('stream-stopped', { timestamp: Date.now() });
            
            console.log('✅ Livestream stopped successfully');
            
        } catch (error) {
            console.error('❌ Failed to stop livestream:', error);
            throw error;
        }
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
                        roomId: this.roomId,
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
                roomId: this.roomId,
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

    // Emit stream started event
    emitStreamStarted() {
        try {
            if (!this.socket || !this.roomId) {
                throw new Error('Socket or room ID not available for stream start');
            }
            
            console.log('📤 Emitting stream-started event to all viewers');
            
            this.socket.emit('stream-started', { 
                roomId: this.roomId,
                adminId: this.socket.id,
                timestamp: Date.now(),
                streamMetadata: {
                    title: this.getStreamTitle(),
                    quality: this.getStreamQuality(),
                    capabilities: this.getStreamCapabilities(),
                    adminInfo: this.getAdminInfo()
                },
                viewerInfo: {
                    currentCount: this.viewers.size,
                    maxCapacity: this.getMaxViewerCapacity(),
                    joinPolicy: 'open'
                }
            });
            
            this.socket.emit('admin-stream-started', { 
                roomId: this.roomId,
                adminId: this.socket.id,
                timestamp: Date.now(),
                streamStatus: 'active',
                streamHealth: this.getStreamHealth(),
                availableFeatures: this.getAvailableFeatures()
            });
            
            console.log('✅ Stream-started events emitted successfully');
            
        } catch (error) {
            console.error('❌ Failed to emit stream started event:', error);
            this.handleStreamError('emission-failed', error);
        }
    }

    // Get stream title
    getStreamTitle() {
        try {
            const titleElement = document.getElementById('streamTitle');
            if (titleElement && titleElement.value) {
                return titleElement.value;
            }
            
            const now = new Date();
            return `Live Stream - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
            
        } catch (error) {
            console.warn('Failed to get stream title:', error);
            return 'Live Stream';
        }
    }

    // Get stream quality information
    getStreamQuality() {
        try {
            if (!this.localStream) return 'unknown';
            
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack && videoTrack.getSettings) {
                const settings = videoTrack.getSettings();
                return {
                    width: settings.width || 'unknown',
                    height: settings.height || 'unknown',
                    frameRate: settings.frameRate || 'unknown',
                    bitrate: 'adaptive'
                };
            }
            
            return 'standard';
            
        } catch (error) {
            console.warn('Failed to get stream quality:', error);
            return 'standard';
        }
    }

    // Get stream capabilities
    getStreamCapabilities() {
        try {
            if (!this.localStream) return {};
            
            const capabilities = {};
            this.localStream.getTracks().forEach(track => {
                if (track.getCapabilities) {
                    capabilities[track.kind] = track.getCapabilities();
                }
            });
            
            return capabilities;
            
        } catch (error) {
            console.warn('Failed to get stream capabilities:', error);
            return {};
        }
    }

    // Get admin information
    getAdminInfo() {
        try {
            const adminName = localStorage.getItem('adminName') || 'Admin';
            const adminEmail = localStorage.getItem('adminEmail') || '';
            
            return {
                name: adminName,
                email: adminEmail,
                id: this.socket?.id || 'unknown',
                role: 'streamer'
            };
            
        } catch (error) {
            console.warn('Failed to get admin info:', error);
            return {
                name: 'Admin',
                email: '',
                id: 'unknown',
                role: 'streamer'
            };
        }
    }

    // Get stream health status
    getStreamHealth() {
        try {
            return {
                connectionQuality: this.connectionHealth.connectionQuality,
                rtt: this.connectionHealth.connectionStats.rtt,
                bitrate: this.connectionHealth.connectionStats.bitrate,
                viewerCount: this.viewers.size,
                uptime: this.isLive ? Date.now() - this.connectionHealth.lastHeartbeat : 0
            };
        } catch (error) {
            console.warn('Failed to get stream health:', error);
            return { connectionQuality: 'unknown' };
        }
    }

    // Get available features
    getAvailableFeatures() {
        return {
            screenSharing: this.supportsScreenSharing(),
            recording: this.supportsRecording(),
            bidirectionalAudio: this.supportsBidirectionalAudio(),
            videoQualityAdjustment: this.supportsVideoQualityAdjustment()
        };
    }

    // Get max viewer capacity
    getMaxViewerCapacity() {
        return 100; // Configurable max capacity
    }

    // Check if screen sharing is supported
    supportsScreenSharing() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
    }

    // Check if recording is supported
    supportsRecording() {
        return !!window.MediaRecorder;
    }

    // Check if bidirectional audio is supported
    supportsBidirectionalAudio() {
        return !!(this.localStream && this.localStream.getAudioTracks().length > 0);
    }

    // Check if video quality adjustment is supported
    supportsVideoQualityAdjustment() {
        return !!(this.localStream && this.localStream.getVideoTracks()[0] && this.localStream.getVideoTracks()[0].getCapabilities);
    }

    // Handle stream error
    handleStreamError(errorType, error) {
        console.error(`Stream error (${errorType}):`, error);
        
        this.emit('stream-error', {
            type: errorType,
            error: error.message,
            timestamp: Date.now()
        });
        
        this.updateStreamErrorUI(errorType, error.message);
    }

    // Update stream error UI
    updateStreamErrorUI(errorType, errorMessage) {
        const errorElement = document.getElementById('streamError');
        if (errorElement) {
            errorElement.textContent = `Error: ${errorMessage}`;
            errorElement.style.display = 'block';
        }
    }

    // Attempt stream recovery
    async attemptStreamRecovery(errorType) {
        try {
            console.log(`🔄 Attempting stream recovery for error: ${errorType}`);
            
            switch (errorType) {
                case 'media-access-denied':
                    // Request media permissions again
                    await this.requestMediaPermissions();
                    break;
                case 'network-error':
                    // Attempt reconnection
                    await this.attemptReconnection();
                    break;
                case 'peer-connection-failed':
                    // Recreate peer connections
                    await this.recreatePeerConnections();
                    break;
                default:
                    console.warn('No recovery strategy for error type:', errorType);
            }
            
        } catch (error) {
            console.error('Stream recovery failed:', error);
        }
    }

    // Request media permissions
    async requestMediaPermissions() {
        try {
            console.log('🔐 Requesting media permissions...');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            stream.getTracks().forEach(track => track.stop());
            console.log('✅ Media permissions granted');
            
        } catch (error) {
            console.error('❌ Media permissions denied:', error);
        }
    }

    // Recreate peer connections
    async recreatePeerConnections() {
        try {
            console.log('🔄 Recreating peer connections...');
            
            // Close existing connections
            this.peerConnections.forEach(pc => pc.close());
            this.peerConnections.clear();
            
            // Recreate for existing viewers
            for (const viewerId of this.viewers) {
                await this.createPeerConnection(viewerId);
            }
            
            console.log('✅ Peer connections recreated successfully');
            
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

    // Cleanup method
    cleanup() {
        console.log('🧹 Cleaning up WebRTC manager...');
        
        this.stopHealthMonitoring();
        
        this.peerConnections.forEach((connection, viewerId) => {
            try {
                if (connection.connectionState !== 'closed') {
                    connection.close();
                }
            } catch (error) {
                console.warn(`Error closing connection for viewer ${viewerId}:`, error);
            }
        });
        this.peerConnections.clear();
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
            });
            this.localStream = null;
        }
        
        this.emit('cleanup-completed');
        
        this.isLive = false;
        this.viewers.clear();
        this.roomId = null;
        
        console.log('✅ WebRTC manager cleanup completed');
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

// Export for use in other files
window.CustomWebRTCManager = CustomWebRTCManager;
