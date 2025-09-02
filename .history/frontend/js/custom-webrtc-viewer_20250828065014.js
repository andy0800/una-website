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
            
            // Check for active streams when connected
            this.checkForActiveStreams();
        });
        
        // Handle disconnection
        this.socket.on('disconnect', () => {
            
            this.updateStatus('Disconnected from server');
            this.isConnected = false;
        });
        
        // Handle stream start from admin
        this.socket.on('stream-started', (data) => {
            console.log('🎯 Stream started event received:', data);
            this.updateStatus('Stream started - connecting...');
            
            if (data.roomId) {
                this.joinStream(data.roomId);
            } else {
                console.error('❌ No room ID in stream-started event');
                this.updateStatus('Stream started but no room ID received');
            }
        });
        
        // Handle admin stream started (for late joiners)
        this.socket.on('admin-stream-started', (data) => {
            console.log('🎯 Admin stream started event received:', data);
            this.updateStatus('Admin stream detected - connecting...');
            
            if (data.roomId) {
                this.joinStream(data.roomId);
            }
        });
        
        // Handle room creation confirmation
        this.socket.on('roomCreated', (data) => {
            console.log('🎯 Room created confirmation received:', data);
            this.updateStatus('Room created - joining stream...');
            
            if (data.roomId) {
                this.joinStream(data.roomId);
            }
        });
        
        // Handle room joined confirmation
        this.socket.on('roomJoined', (data) => {
            console.log('🎯 Room joined confirmation received:', data);
            this.updateStatus('Successfully joined room - waiting for stream...');
            
            if (data.roomId) {
                this.roomId = data.roomId;
            }
        });
        
        // Handle room not found
        this.socket.on('roomNotFound', (data) => {
            console.log('❌ Room not found:', data);
            this.updateStatus('Room not found - please check the Room ID');
        });
        
        // Handle stream end
        this.socket.on('stream-stopped', () => {
            
            this.updateStatus('Stream ended');
            this.cleanup();
        });
        
        // Handle WebRTC offer from admin
        this.socket.on('webrtc-offer', async (data) => {
            console.log('📥 WebRTC offer received from admin:', data);
            
            if (data.offer) {
                await this.handleOffer(data.offer);
            } else {
                console.error('❌ No offer data in webrtc-offer event');
                this.updateStatus('Invalid offer received from admin');
            }
        });
        
        // Handle ICE candidates from admin
        this.socket.on('ice-candidate', async (data) => {
            
            await this.handleIceCandidate(data.candidate);
        });
        
        // Handle WebRTC answer from admin (legacy compatibility)
        this.socket.on('answer', async (data) => {
            await this.handleAnswer(data.answer);
        });
        
        // Handle chat messages
        this.socket.on('chat-message', (data) => {
            this.addChatMessage(data.user || data.sender || 'Anonymous', data.message);
        });
        
        // Handle admin chat messages
        this.socket.on('admin-chat', (data) => {
            this.addChatMessage(data.sender || 'Admin', data.message);
        });
        
        // Handle mic request response
        this.socket.on('mic-request-response', (data) => {
            this.handleMicRequestResponse(data);
        });
    }
    
    // 🚀 ENHANCED: WebRTC event listeners with cross-platform compatibility
    setupWebRTCEventListeners() {
        // 🚀 NEW: Comprehensive browser compatibility check
        if (!this.checkBrowserCompatibility()) {
            this.showBrowserCompatibilityError();
            return;
        }
        
        // Set up WebRTC event handlers
        if (window.RTCPeerConnection) {
            // 🚀 NEW: Enhanced peer connection event handling
            if (this.peerConnection) {
                this.peerConnection.onconnectionstatechange = () => {
                    console.log('🔗 Connection state changed:', this.peerConnection.connectionState);
                    this.updateConnectionState();
                };
                
                this.peerConnection.oniceconnectionstatechange = () => {
                    console.log('🧊 ICE connection state changed:', this.peerConnection.iceConnectionState);
                    this.updateConnectionState();
                };
                
                this.peerConnection.onicegatheringstatechange = () => {
                    console.log('🧊 ICE gathering state changed:', this.peerConnection.iceGatheringState);
                };
                
                this.peerConnection.onsignalingstatechange = () => {
                    console.log('📡 Signaling state changed:', this.peerConnection.signalingState);
                };
                
                // 🚀 NEW: Enhanced track handling for bidirectional audio
                this.peerConnection.ontrack = (event) => {
                    console.log('📹 Remote track received:', event.track.kind);
                    this.handleRemoteTrack(event);
                };
                
                this.peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log('🧊 ICE candidate generated');
                        this.sendIceCandidate(event.candidate);
                    }
                };
            }
            
            // 🚀 NEW: Enhanced error handling with cross-platform support
            window.addEventListener('error', (event) => {
                if (event.error && event.error.name === 'NotAllowedError') {
                    this.updateStatus('Camera/microphone access denied');
                } else if (event.error && event.error.name === 'NotFoundError') {
                    this.updateStatus('Camera/microphone not found');
                }
            });
            
        } else {
            console.error('❌ WebRTC not supported');
            this.updateStatus('WebRTC not supported in this browser');
        }
    }
    
    // 🚀 NEW: Comprehensive browser compatibility check
    checkBrowserCompatibility() {
        const compatibility = {
            webrtc: !!window.RTCPeerConnection,
            getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            webSocket: !!window.WebSocket,
            es6: !!window.Promise && !!window.Array.from,
            audioContext: !!window.AudioContext || !!window.webkitAudioContext,
            videoElement: !!document.createElement('video').canPlayType
        };
        
        // Log compatibility status
        console.log('🔍 Browser compatibility check:', compatibility);
        
        // Check minimum requirements
        const hasMinimumRequirements = compatibility.webrtc && 
                                    compatibility.getUserMedia && 
                                    compatibility.webSocket && 
                                    compatibility.es6;
        
        if (!hasMinimumRequirements) {
            console.error('❌ Browser does not meet minimum requirements:', compatibility);
            return false;
        }
        
        return true;
    }
    
    // 🚀 NEW: Show browser compatibility error with solutions
    showBrowserCompatibilityError() {
        const errorMessage = `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 20px; text-align: center;">
                <h3 style="color: #721c24; margin-bottom: 15px;">🚫 Browser Compatibility Issue</h3>
                <p style="color: #721c24; margin-bottom: 15px;">
                    Your browser does not support the required features for livestreaming.
                </p>
                <div style="background: #fff; border-radius: 6px; padding: 15px; margin: 15px 0;">
                    <h4 style="color: #495057; margin-bottom: 10px;">✅ Recommended Browsers:</h4>
                    <ul style="text-align: left; color: #495057;">
                        <li>Chrome 67+ (Recommended)</li>
                        <li>Firefox 55+</li>
                        <li>Safari 11+</li>
                        <li>Edge 79+</li>
                    </ul>
                </div>
                <p style="color: #721c24; font-size: 14px;">
                    Please update your browser or try a different one to access the livestream.
                </p>
            </div>
        `;
        
        // Show error in status area
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.innerHTML = errorMessage;
        }
        
        // Update status dot
        const statusDot = document.getElementById('statusDot');
        if (statusDot) {
            statusDot.className = 'status-dot error';
        }
    }
    
    // 🚀 NEW: Enhanced connection state management
    updateConnectionState() {
        if (!this.peerConnection) return;
        
        const connectionState = this.peerConnection.connectionState;
        const iceConnectionState = this.peerConnection.iceConnectionState;
        
        console.log('🔗 Connection state update:', { connectionState, iceConnectionState });
        
        switch (connectionState) {
            case 'connected':
                this.updateStatus('Connected to stream');
                this.isConnected = true;
                this.enableBidirectionalAudio();
                break;
            case 'disconnected':
                this.updateStatus('Disconnected from stream');
                this.isConnected = false;
                break;
            case 'failed':
                this.updateStatus('Connection failed');
                this.isConnected = false;
                this.handleConnectionFailure();
                break;
            case 'closed':
                this.updateStatus('Connection closed');
                this.isConnected = false;
                break;
        }
    }
    
    // 🚀 NEW: Enable bidirectional audio communication
    enableBidirectionalAudio() {
        if (!this.localStream || !this.peerConnection) return;
        
        try {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack && !this.peerConnection.getSenders().some(sender => 
                sender.track === audioTrack)) {
                
                // Add local audio track to peer connection
                this.peerConnection.addTrack(audioTrack, this.localStream);
                console.log('🎤 Bidirectional audio enabled - local audio track added');
                
                // Update UI to show bidirectional audio is active
                this.updateBidirectionalAudioUI(true);
            }
        } catch (error) {
            console.warn('Failed to enable bidirectional audio:', error);
        }
    }
    
    // 🚀 NEW: Update bidirectional audio UI
    updateBidirectionalAudioUI(isEnabled) {
        const micStatus = document.getElementById('micStatus');
        if (micStatus) {
            micStatus.textContent = isEnabled ? '🎤 Bidirectional Audio Active' : '🎤 Audio Only';
            micStatus.className = isEnabled ? 'mic-status active' : 'mic-status';
        }
    }
    
    // 🚀 NEW: Handle connection failure with recovery
    handleConnectionFailure() {
        console.warn('🔄 Connection failed, attempting recovery...');
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
            if (this.roomId && !this.isConnected) {
                console.log('🔄 Attempting to rejoin stream...');
                this.joinStream(this.roomId);
            }
        }, 3000);
    }
    
    async joinStream(roomId) {
        try {
            console.log('🎯 Joining stream with room ID:', roomId);
            
            this.roomId = roomId;
            
            // Emit join stream event to server
            if (this.socket) {
                this.socket.emit('joinRoom', { 
                    roomId: roomId,
                    viewerId: this.socket.id
                });
                console.log('📤 Emitted joinRoom event');
            }
            
            // Create peer connection
            this.createPeerConnection();
            
            // Get user media for mic requests
            await this.getUserMedia();
            
            // Get user authentication info
            const userToken = localStorage.getItem('userToken');
            const adminToken = localStorage.getItem('adminToken');
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
                    console.error('Failed to decode user token:', error);
                }
            } else if (adminToken) {
                try {
                    // Decode admin token to get user info
                    const payload = JSON.parse(atob(adminToken.split('.')[1]));
                    userInfo = {
                        id: payload.id,
                        name: payload.name || payload.email || 'Admin',
                        email: payload.email
                    };
                } catch (error) {
                    console.error('Failed to decode admin token:', error);
                }
            }
            
            // Join the room with user info
            this.socket.emit('watcher', userInfo);
            
            this.updateStatus('Joining stream...');
            
            // Wait for room join confirmation
            setTimeout(() => {
                if (!this.isConnected) {
                    this.updateStatus('Waiting for stream connection...');
                }
            }, 2000);
            
        } catch (error) {
            console.error('❌ Failed to join stream:', error);
            this.updateStatus('Failed to join stream: ' + error.message);
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
            
            
            
        } catch (error) {
            console.error('❌ Failed to create peer connection:', error);
        }
    }
    
    // 🚀 FIXED: Get user media with bidirectional audio support
    async getUserMedia() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
            
            // Add local audio track to peer connection for bidirectional audio
            if (this.peerConnection && this.localStream) {
                const audioTrack = this.localStream.getAudioTracks()[0];
                if (audioTrack) {
                    this.peerConnection.addTrack(audioTrack, this.localStream);
                    console.log('🎤 Added local audio track for bidirectional communication');
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to get user media:', error);
            this.updateStatus('Microphone access denied');
        }
    }
    
    async handleOffer(offer) {
        try {
            if (!this.peerConnection) {
                console.error('❌ No peer connection available');
                return;
            }
            
            console.log('🎯 Processing WebRTC offer from admin...');
            
            // Set remote description (admin's offer)
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('✅ Remote description set');
            
            // Create answer
            console.log('📤 Creating WebRTC answer...');
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            console.log('✅ Local description set');
            
            // Send answer to admin
            this.socket.emit('webrtc-answer', {
                roomId: this.roomId,
                socketId: this.socket.id,
                answer: answer
            });
            console.log('📤 Answer sent to admin');
            
            this.updateStatus('WebRTC connection established...');
            
        } catch (error) {
            console.error('❌ Failed to handle offer:', error);
            this.updateStatus('Failed to establish WebRTC connection: ' + error.message);
        }
    }
    
    async handleAnswer(answer) {
        try {
            if (!this.peerConnection) {
                console.error('❌ No peer connection available');
                return;
            }
            
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            
        } catch (error) {
            console.error('❌ Failed to handle answer:', error);
        }
    }
    
    async handleIceCandidate(candidate) {
        try {
            if (!this.peerConnection) return;
            
            console.log('🧊 Adding ICE candidate from admin...');
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('✅ ICE candidate added');
            
        } catch (error) {
            console.error('❌ Failed to add ICE candidate:', error);
            this.updateStatus('Failed to add ICE candidate: ' + error.message);
        }
    }
    
    handleRemoteTrack(event) {
        console.log('📹 Remote track received:', event);
        
        const videoElement = document.getElementById('viewerVideo');
        if (videoElement && event.streams && event.streams[0]) {
            this.remoteStream = event.streams[0];
            videoElement.srcObject = this.remoteStream;
            
            console.log('✅ Video stream connected to viewer');
            this.updateStatus('Stream connected - video received');
            this.isConnected = true;
            
            // Update stream status
            const streamStatus = document.getElementById('streamStatus');
            if (streamStatus) {
                streamStatus.textContent = '🟢 LIVE';
                streamStatus.className = 'status-live';
            }
            
            // Update status dot
            const statusDot = document.getElementById('statusDot');
            if (statusDot) {
                statusDot.className = 'status-dot connected';
            }
            
        } else {
            console.warn('⚠️ No valid stream in remote track event');
            this.updateStatus('Invalid stream data received');
        }
    }
    
    updateConnectionState() {
        if (!this.peerConnection) return;
        
        const state = this.peerConnection.connectionState;
        
        
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
            
            this.updateStatus('Microphone access approved');
            this.showMicControls();
        } else {
            
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
            
            this.updateStatus('Microphone muted');
        }
    }
    
    unmuteMic() {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = true;
            });
            
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
    
    // Check for active streams
    checkForActiveStreams() {
        try {
            // Get user authentication info
            const userToken = localStorage.getItem('userToken');
            const adminToken = localStorage.getItem('adminToken');
            let userInfo = { name: 'Anonymous' };
            
            if (userToken) {
                try {
                    const payload = JSON.parse(atob(userToken.split('.')[1]));
                    userInfo = {
                        id: payload.id,
                        name: payload.name || payload.email || 'User',
                        email: payload.email
                    };
                } catch (error) {
                    console.error('Failed to decode user token:', error);
                }
            } else if (adminToken) {
                try {
                    const payload = JSON.parse(atob(adminToken.split('.')[1]));
                    userInfo = {
                        id: payload.id,
                        name: payload.name || payload.email || 'Admin',
                        email: payload.email
                    };
                } catch (error) {
                    console.error('Failed to decode admin token:', error);
                }
            }
            
            // Emit watcher event to check for active streams
            this.socket.emit('watcher', userInfo);
            
        } catch (error) {
            console.error('Failed to check for active streams:', error);
        }
    }
    
    // Utility functions
    getUserName() {
        // Try to get user name from localStorage or other sources
        return localStorage.getItem('userName') || 'Anonymous';
    }
    
    updateStatus(message) {
        try {
            console.log('📊 Status Update:', message);
            
            // Update status text element
            const statusText = document.getElementById('statusText');
            if (statusText) {
                statusText.textContent = message;
            }
            
            // Update status dot color based on message
            const statusDot = document.getElementById('statusDot');
            if (statusDot) {
                if (message.includes('connected') || message.includes('live')) {
                    statusDot.className = 'status-dot connected';
                } else if (message.includes('connecting') || message.includes('waiting')) {
                    statusDot.className = 'status-dot connecting';
                } else if (message.includes('error') || message.includes('failed')) {
                    statusDot.className = 'status-dot error';
                } else {
                    statusDot.className = 'status-dot';
                }
            }
            
            // Update video overlay message
            const videoOverlay = document.getElementById('videoOverlay');
            if (videoOverlay) {
                const overlayText = videoOverlay.querySelector('p');
                if (overlayText) {
                    overlayText.textContent = message;
                }
            }
            
        } catch (error) {
            console.error('Failed to update status:', error);
        }
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
        
        // Notify server that viewer is leaving
        if (this.socket && this.roomId) {
            this.socket.emit('leaveRoom', { roomId: this.roomId, viewerId: this.socket.id });
        }
        
        this.isConnected = false;
        this.roomId = null;
        
        
    }
}

// Initialize the viewer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    
    
    // Create viewer instance
    window.webrtcViewer = new CustomWebRTCViewer();
    
    // Set up UI event listeners
    setupUIEventListeners();
    
    
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
