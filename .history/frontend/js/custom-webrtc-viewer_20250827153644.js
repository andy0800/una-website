// 🚀 CUSTOM WEBRTC LIVESTREAMING SYSTEM - USER VIEWER SIDE
// This script handles user-side livestream viewing functionality

class CustomWebRTCViewer {
    constructor() {
        this.socket = null;
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.isConnected = false;
        this.roomId = null;
        
        this.initialize();
    }
    
    async initialize() {
        try {
            
            
            // Connect to Socket.IO
            this.socket = io();
            
            // Set up event listeners
            this.setupSocketListeners();
            
            // Set up WebRTC event listeners
            this.setupWebRTCEventListeners();
            
            
            
        } catch (error) {
            console.error('❌ Failed to initialize Custom WebRTC Viewer:', error);
        }
    }
    
    setupSocketListeners() {
        if (!this.socket) return;
        
        // Handle connection
        this.socket.on('connect', () => {
            
            this.updateStatus('Connected to server');
        });
        
        // Handle disconnection
        this.socket.on('disconnect', () => {
            
            this.updateStatus('Disconnected from server');
            this.isConnected = false;
        });
        
        // Handle stream start
        this.socket.on('stream-started', (data) => {
            
            this.updateStatus('Stream started - connecting...');
            
            if (data.roomId) {
                this.joinStream(data.roomId);
            } else {
                console.error('❌ No room ID in stream-started event');
                this.updateStatus('Stream started but no room ID received');
            }
        });
        
        // Handle stream end
        this.socket.on('stream-stopped', () => {
            
            this.updateStatus('Stream ended');
            this.cleanup();
        });
        
        // Handle WebRTC offer from admin
        this.socket.on('webrtc-offer', async (data) => {
            
            await this.handleOffer(data.offer);
        });
        
        // Handle ICE candidates from admin
        this.socket.on('ice-candidate', async (data) => {
            
            await this.handleIceCandidate(data.candidate);
        });
        
        // Handle chat messages
        this.socket.on('chat-message', (data) => {
            this.addChatMessage(data.user || data.sender || 'Anonymous', data.message);
        });
        
        // Handle mic request response
        this.socket.on('mic-request-response', (data) => {
            this.handleMicRequestResponse(data);
        });
    }
    
    setupWebRTCEventListeners() {
        // Set up WebRTC event handlers
        if (window.RTCPeerConnection) {
            
        } else {
            console.error('❌ WebRTC not supported');
            this.updateStatus('WebRTC not supported in this browser');
        }
    }
    
    async joinStream(roomId) {
        try {
            
            this.roomId = roomId;
            
            // Create peer connection
            this.createPeerConnection();
            
            // Get user media for mic requests
            await this.getUserMedia();
            
            // Get user authentication info
            const userToken = localStorage.getItem('userToken');
            let userInfo = { name: 'Anonymous' };
            
            if (userToken) {
                try {
                    // Decode JWT token to get user info
                    const payload = JSON.parse(atob(userToken.split('.')[1]));
                    userInfo = {
                        id: payload.id,
                        name: payload.name || payload.email || 'User',
                        email: payload.email
                    };
                    
                } catch (error) {
                    
                }
            }
            
            // Join the room with user info
            this.socket.emit('join-stream', { 
                roomId,
                userInfo: userInfo
            });
            
            this.updateStatus('Joining stream...');
            
        } catch (error) {
            console.error('❌ Failed to join stream:', error);
            this.updateStatus('Failed to join stream');
        }
    }
    
    createPeerConnection() {
        try {
            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            };
            
            this.peerConnection = new RTCPeerConnection(configuration);
            
            // Handle incoming tracks
            this.peerConnection.ontrack = (event) => {
                
                this.handleRemoteTrack(event);
            };
            
            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    
                    this.socket.emit('ice-candidate', {
                        roomId: this.roomId,
                        socketId: this.socket.id,
                        candidate: event.candidate
                    });
                }
            };
            
            // Handle connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                
                this.updateConnectionState();
            };
            
            console.log('✅ Peer connection created');
            
        } catch (error) {
            console.error('❌ Failed to create peer connection:', error);
        }
    }
    
    async getUserMedia() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
            console.log('✅ User media obtained');
        } catch (error) {
            console.log('⚠️ Could not get user media (mic access):', error.message);
        }
    }
    
    async handleOffer(offer) {
        try {
            if (!this.peerConnection) {
                console.error('❌ No peer connection available');
                return;
            }
            
            console.log('📥 Setting remote description from admin offer');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('✅ Remote description set');
            
            // Create answer
            console.log('📤 Creating answer for admin');
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            console.log('✅ Local description set');
            
            // Send answer to admin
            this.socket.emit('webrtc-answer', {
                roomId: this.roomId,
                socketId: this.socket.id,
                answer: answer
            });
            console.log('✅ Answer sent to admin');
            
        } catch (error) {
            console.error('❌ Failed to handle offer:', error);
        }
    }
    
    async handleIceCandidate(candidate) {
        try {
            if (!this.peerConnection) return;
            
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('✅ ICE candidate added');
            
        } catch (error) {
            console.error('❌ Failed to add ICE candidate:', error);
        }
    }
    
    handleRemoteTrack(event) {
        const videoElement = document.getElementById('viewerVideo');
        if (videoElement && event.streams && event.streams[0]) {
            this.remoteStream = event.streams[0];
            videoElement.srcObject = this.remoteStream;
            console.log('✅ Remote video stream connected');
            this.updateStatus('Stream connected');
            this.isConnected = true;
            
            // Update stream status
            const streamStatus = document.getElementById('streamStatus');
            if (streamStatus) {
                streamStatus.textContent = '🟢 LIVE';
                streamStatus.className = 'status-live';
            }
        }
    }
    
    updateConnectionState() {
        if (!this.peerConnection) return;
        
        const state = this.peerConnection.connectionState;
        console.log('🔗 WebRTC connection state:', state);
        
        switch (state) {
            case 'connected':
                this.updateStatus('Stream connected');
                this.isConnected = true;
                break;
            case 'disconnected':
                this.updateStatus('Stream disconnected');
                this.isConnected = false;
                break;
            case 'failed':
                this.updateStatus('Connection failed');
                this.isConnected = false;
                break;
            case 'closed':
                this.updateStatus('Connection closed');
                this.isConnected = false;
                break;
        }
    }
    
    // Mic request functionality
    requestMic() {
        if (!this.socket || !this.roomId) {
            alert('Not connected to stream');
            return;
        }
        
        if (!this.localStream) {
            alert('Microphone access required. Please allow microphone access and try again.');
            return;
        }
        
        console.log('🎤 Requesting microphone access');
        this.socket.emit('mic-request', {
            roomId: this.roomId,
            userInfo: {
                name: this.getUserName() || 'Anonymous'
            }
        });
        
        this.updateStatus('Microphone access requested...');
    }
    
    handleMicRequestResponse(data) {
        if (data.approved) {
            console.log('✅ Microphone access approved');
            this.updateStatus('Microphone access approved');
            this.showMicControls();
        } else {
            console.log('❌ Microphone access denied');
            this.updateStatus('Microphone access denied');
        }
    }
    
    showMicControls() {
        const requestBtn = document.getElementById('requestMicBtn');
        const muteBtn = document.getElementById('muteBtn');
        const unmuteBtn = document.getElementById('unmuteBtn');
        
        if (requestBtn) requestBtn.style.display = 'none';
        if (muteBtn) muteBtn.style.display = 'inline-block';
        if (unmuteBtn) unmuteBtn.style.display = 'inline-block';
    }
    
    muteMic() {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = false;
            });
            console.log('🔇 Microphone muted');
            this.updateStatus('Microphone muted');
        }
    }
    
    unmuteMic() {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = true;
            });
            console.log('🔊 Microphone unmuted');
            this.updateStatus('Microphone active');
        }
    }
    
    // Chat functionality
    sendChatMessage(message) {
        if (!this.socket || !this.roomId) {
            alert('Not connected to stream');
            return;
        }
        
        if (!message.trim()) return;
        
        this.socket.emit('chat-message', {
            roomId: this.roomId,
            message: message.trim(),
            user: this.getUserName() || 'Anonymous'
        });
        
        // Clear input
        const chatInput = document.getElementById('chatInput');
        if (chatInput) chatInput.value = '';
    }
    
    addChatMessage(user, message) {
        const chatBox = document.getElementById('chatBox');
        if (!chatBox) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.innerHTML = `<strong>${user}:</strong> ${message}`;
        
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    // Utility functions
    getUserName() {
        // Try to get user name from localStorage or other sources
        return localStorage.getItem('userName') || 'Anonymous';
    }
    
    updateStatus(message) {
        const statusElement = document.getElementById('webrtc-status-text');
        if (statusElement) {
            statusElement.textContent = message;
        }
        
        const liveMessage = document.getElementById('liveMessage');
        if (liveMessage) {
            liveMessage.textContent = message;
        }
        
        console.log('📊 Status:', message);
    }
    
    cleanup() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        this.isConnected = false;
        this.roomId = null;
        
        console.log('🧹 Cleanup completed');
    }
}

// Initialize the viewer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Custom WebRTC Viewer page...');
    
    // Create viewer instance
    window.webrtcViewer = new CustomWebRTCViewer();
    
    // Set up UI event listeners
    setupUIEventListeners();
    
    console.log('✅ Custom WebRTC Viewer page initialized');
});

function setupUIEventListeners() {
    // Mic request button
    const requestMicBtn = document.getElementById('requestMicBtn');
    if (requestMicBtn) {
        requestMicBtn.addEventListener('click', () => {
            if (window.webrtcViewer) {
                window.webrtcViewer.requestMic();
            }
        });
    }
    
    // Mute button
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            if (window.webrtcViewer) {
                window.webrtcViewer.muteMic();
            }
        });
    }
    
    // Unmute button
    const unmuteBtn = document.getElementById('unmuteBtn');
    if (unmuteBtn) {
        unmuteBtn.addEventListener('click', () => {
            if (window.webrtcViewer) {
                window.webrtcViewer.unmuteMic();
            }
        });
    }
    
    // Chat send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            const chatInput = document.getElementById('chatInput');
            if (chatInput && window.webrtcViewer) {
                window.webrtcViewer.sendChatMessage(chatInput.value);
            }
        });
    }
    
    // Chat input enter key
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && window.webrtcViewer) {
                window.webrtcViewer.sendChatMessage(chatInput.value);
            }
        });
    }
}
