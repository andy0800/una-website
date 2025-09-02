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
    }

    async init() {
        try {
            
            
            // Initialize Socket.IO connection
            this.socket = io();
            this.setupSocketListeners();
            
            
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
            
            this.viewers.add(viewerId);
            this.createPeerConnection(viewerId);
        });

        // Viewer left
        this.socket.on('viewerLeft', (viewerId) => {
            
            this.viewers.delete(viewerId);
            this.removePeerConnection(viewerId);
        });

        // WebRTC answer from viewer
        this.socket.on('webrtc-answer', async ({ socketId, answer }) => {
            
            const pc = this.peerConnections.get(socketId);
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    
                } catch (error) {
                    console.error('❌ Error setting remote description:', error);
                }
            }
        });

        // ICE candidate from viewer
        this.socket.on('ice-candidate', async ({ socketId, candidate }) => {
            
            const pc = this.peerConnections.get(socketId);
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    
                } catch (error) {
                    console.error('❌ Error adding ICE candidate:', error);
                }
            }
        });

        // Viewer join stream
        this.socket.on('viewer-join', ({ socketId, userInfo, viewerCount }) => {
            
            this.viewers.add(socketId);
            
            // Only create peer connection if we have a room ID
            if (this.roomId) {
                this.createPeerConnection(socketId);
            } else {
                
                // Store viewer info to create connection later when room ID is available
                this.pendingViewers = this.pendingViewers || new Set();
                this.pendingViewers.add(socketId);
            }
        });

        // Chat message from viewer
        this.socket.on('chat-message', (data) => {
            
            // Emit to admin dashboard for display
            this.socket.emit('admin-chat-received', data);
        });

        // Mic request from viewer
        this.socket.on('mic-request', (data) => {
            
            // Emit to admin dashboard for handling
            this.socket.emit('admin-mic-request', data);
        });

        // Handle stream started event to get room ID
        this.socket.on('stream-started', (data) => {
            
            if (data.roomId) {
                this.roomId = data.roomId;
                
                
                // Now create peer connections for any pending viewers
                if (this.pendingViewers && this.pendingViewers.size > 0) {
                    
                    this.pendingViewers.forEach(viewerId => {
                        this.createPeerConnection(viewerId);
                    });
                    this.pendingViewers.clear();
                }
            }
        });

        // Handle stream stopped event
        this.socket.on('stream-stopped', () => {
            
            this.isLive = false;
            this.roomId = null;
            this.viewers.clear();
            this.pendingViewers.clear();
            
            // Close all peer connections
            this.peerConnections.forEach(pc => pc.close());
            this.peerConnections.clear();
        });
    }

    async startLivestream(roomName = 'custom-livestream') {
        try {
            
            
            // Get user media first
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            // Display local stream
            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.srcObject = this.localStream;
                localVideo.play().catch(error => {
                    
                });
                console.log('✅ Local video stream displayed');
            } else {
                console.error('❌ Local video element not found');
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
                        candidate: event.candidate,
                        targetViewerId: viewerId
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
            
            // Send offer to specific viewer via Socket.IO
            this.socket.emit('webrtc-offer', {
                roomId: this.roomId,
                offer: offer,
                targetViewerId: viewerId
            });
            
            console.log('✅ Offer sent to specific viewer:', viewerId);
            
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
            peerConnections: this.peerConnections.size,
            localStream: !!this.localStream,
            socket: !!this.socket
        };
    }

    // Test system functionality
    async testSystem() {
        try {
            console.log('🧪 Testing Custom WebRTC system...');
            
            const status = this.getConnectionStatus();
            console.log('📊 System status:', status);
            
            // Test local stream
            if (this.localStream) {
                const tracks = this.localStream.getTracks();
                console.log('✅ Local stream tracks:', tracks.length);
                tracks.forEach(track => {
                    console.log(`  - ${track.kind}: ${track.enabled ? 'enabled' : 'disabled'}`);
                });
            } else {
                console.log('❌ No local stream available');
            }
            
            // Test socket connection
            if (this.socket && this.socket.connected) {
                console.log('✅ Socket.IO connected');
            } else {
                console.log('❌ Socket.IO not connected');
            }
            
            // Test peer connections
            console.log(`📡 Active peer connections: ${this.peerConnections.size}`);
            
            return status;
        } catch (error) {
            console.error('❌ System test failed:', error);
            return null;
        }
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

    // Handle WebRTC answer from viewer
    async handleViewerAnswer(socketId, answer) {
        try {
            console.log('📥 Handling WebRTC answer from viewer:', socketId);
            const pc = this.peerConnections.get(socketId);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                console.log('✅ Remote description set from viewer answer');
            } else {
                console.error('❌ Peer connection not found for viewer:', socketId);
            }
        } catch (error) {
            console.error('❌ Error handling viewer answer:', error);
        }
    }

    // Handle ICE candidate from viewer
    async handleViewerIceCandidate(socketId, candidate) {
        try {
            console.log('🧊 Handling ICE candidate from viewer:', socketId);
            const pc = this.peerConnections.get(socketId);
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('✅ ICE candidate added from viewer');
            } else {
                console.error('❌ Peer connection not found for viewer:', socketId);
            }
        } catch (error) {
            console.error('❌ Error handling viewer ICE candidate:', error);
        }
    }
}

// Export for use in other files
window.CustomWebRTCManager = CustomWebRTCManager;
