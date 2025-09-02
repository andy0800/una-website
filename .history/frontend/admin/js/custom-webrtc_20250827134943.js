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
    }

    async init() {
        try {
            console.log('🚀 Initializing Custom WebRTC Manager...');
            
            // Initialize Socket.IO connection
            this.socket = io();
            this.setupSocketListeners();
            
            console.log('✅ Custom WebRTC Manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Custom WebRTC Manager:', error);
            return false;
        }
    }

    setupSocketListeners() {
        if (!this.socket) return;

        // Viewer joined
        this.socket.on('viewerJoined', (viewerId) => {
            console.log('👤 Viewer joined:', viewerId);
            this.viewers.add(viewerId);
            this.createPeerConnection(viewerId);
        });

        // Viewer left
        this.socket.on('viewerLeft', (viewerId) => {
            console.log('👤 Viewer left:', viewerId);
            this.viewers.delete(viewerId);
            this.removePeerConnection(viewerId);
        });

        // WebRTC answer from viewer
        this.socket.on('webrtc-answer', async ({ socketId, answer }) => {
            console.log('📥 Received WebRTC answer from viewer:', socketId);
            const pc = this.peerConnections.get(socketId);
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log('✅ Remote description set from viewer answer');
                } catch (error) {
                    console.error('❌ Error setting remote description:', error);
                }
            }
        });

        // ICE candidate from viewer
        this.socket.on('ice-candidate', async ({ socketId, candidate }) => {
            console.log('🧊 Received ICE candidate from viewer:', socketId);
            const pc = this.peerConnections.get(socketId);
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log('✅ ICE candidate added from viewer');
                } catch (error) {
                    console.error('❌ Error adding ICE candidate:', error);
                }
            }
        });

        // Viewer join stream
        this.socket.on('viewer-join', ({ socketId, userInfo, viewerCount }) => {
            console.log('👤 Viewer joined stream:', { socketId, userInfo, viewerCount });
            this.viewers.add(socketId);
            this.createPeerConnection(socketId);
        });

        // Chat message from viewer
        this.socket.on('chat-message', (data) => {
            console.log('💬 Chat message from viewer:', data);
            // Emit to admin dashboard for display
            this.socket.emit('admin-chat-received', data);
        });

        // Mic request from viewer
        this.socket.on('mic-request', (data) => {
            console.log('🎤 Mic request from viewer:', data);
            // Emit to admin dashboard for handling
            this.socket.emit('admin-mic-request', data);
        });
    }

    async startLivestream(roomName = 'custom-livestream') {
        try {
            console.log('🚀 Starting custom WebRTC livestream...');
            
            // Get user media first
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            // Display local stream
            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.srcObject = this.localStream;
                localVideo.play();
            }

            // The room will be created automatically when admin-start is emitted
            // We'll get the roomId from the stream-started event
            
            this.isLive = true;
            console.log('✅ Custom livestream started - waiting for room creation');
            
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to start custom livestream:', error);
            throw error;
        }
    }

    async stopLivestream() {
        try {
            console.log('🛑 Stopping custom WebRTC livestream...');
            
            // Stop local stream
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }

            // Close all peer connections
            this.peerConnections.forEach(pc => pc.close());
            this.peerConnections.clear();

            // Leave room
            if (this.socket && this.roomId) {
                this.socket.emit('leaveRoom', { roomId: this.roomId });
            }

            this.isLive = false;
            this.roomId = null;
            this.viewers.clear();

            console.log('✅ Custom livestream stopped');
            return true;
        } catch (error) {
            console.error('❌ Error stopping custom livestream:', error);
            return false;
        }
    }

    createPeerConnection(viewerId) {
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
                    console.log('🧊 Sending ICE candidate to viewer:', viewerId);
                    this.socket.emit('ice-candidate', {
                        roomId: this.roomId,
                        candidate: event.candidate
                    });
                }
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log(`🔗 Peer connection state for ${viewerId}:`, pc.connectionState);
            };

            this.peerConnections.set(viewerId, pc);
            console.log('✅ Peer connection created for viewer:', viewerId);
            
            // Create and send offer to viewer
            this.sendOfferToViewer(viewerId, pc);
            
        } catch (error) {
            console.error('❌ Error creating peer connection:', error);
        }
    }

    async sendOfferToViewer(viewerId, pc) {
        try {
            console.log('📤 Creating and sending offer to viewer:', viewerId);
            
            // Create offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            // Send offer to viewer via Socket.IO
            this.socket.emit('webrtc-offer', {
                roomId: this.roomId,
                offer: offer
            });
            
            console.log('✅ Offer sent to viewer:', viewerId);
            
        } catch (error) {
            console.error('❌ Error sending offer to viewer:', error);
        }
    }

    removePeerConnection(viewerId) {
        const pc = this.peerConnections.get(viewerId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(viewerId);
            console.log('✅ Peer connection removed for viewer:', viewerId);
        }
    }

    // Audio/Video controls
    toggleAudio() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                console.log('🎤 Audio:', audioTrack.enabled ? 'ON' : 'OFF');
                return audioTrack.enabled;
            }
        }
        return false;
    }

    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                console.log('📹 Video:', videoTrack.enabled ? 'ON' : 'OFF');
                return videoTrack.enabled;
            }
        }
        return false;
    }

    // Get viewer count
    getViewerCount() {
        return this.viewers.size;
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isLive: this.isLive,
            roomId: this.roomId,
            viewerCount: this.getViewerCount(),
            peerConnections: this.peerConnections.size
        };
    }

    // Send chat message to all viewers
    sendChatMessage(message) {
        if (this.socket && this.roomId) {
            this.socket.emit('admin-chat', {
                roomId: this.roomId,
                message: message
            });
        }
    }

    // Respond to mic request
    respondToMicRequest(viewerSocketId, approved) {
        if (this.socket) {
            this.socket.emit('mic-request-response', {
                targetSocketId: viewerSocketId,
                approved: approved
            });
        }
    }
}

// Export for use in other files
window.CustomWebRTCManager = CustomWebRTCManager;
