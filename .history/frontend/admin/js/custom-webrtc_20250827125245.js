// 🚀 CUSTOM WEBRTC LIVESTREAMING SYSTEM
// This replaces Jitsi Meet with a custom WebRTC implementation

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

        // ICE candidate from viewer
        this.socket.on('iceCandidate', ({ viewerId, candidate }) => {
            const pc = this.peerConnections.get(viewerId);
            if (pc) {
                pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        // Offer from viewer
        this.socket.on('offer', async ({ viewerId, offer }) => {
            const pc = this.peerConnections.get(viewerId);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                this.socket.emit('answer', { viewerId, answer });
            }
        });
    }

    async startLivestream(roomName = 'custom-livestream') {
        try {
            console.log('🚀 Starting custom WebRTC livestream...');
            
            // Generate room ID
            this.roomId = `custom-${roomName}-${Date.now()}`;
            
            // Get user media
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

            // Create room
            this.socket.emit('createRoom', { roomId: this.roomId });
            
            this.isLive = true;
            console.log('✅ Custom livestream started:', this.roomId);
            
            return { roomId: this.roomId, success: true };
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
                    this.socket.emit('iceCandidate', {
                        viewerId,
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
            
        } catch (error) {
            console.error('❌ Error creating peer connection:', error);
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
}

// Export for use in other files
window.CustomWebRTCManager = CustomWebRTCManager;
