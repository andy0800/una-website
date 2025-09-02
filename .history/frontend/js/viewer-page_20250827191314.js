// 🚀 VIEWER PAGE JAVASCRIPT - UNA Institute Livestreaming
// This script handles the viewer page UI, user authentication, and WebRTC integration

class ViewerPageManager {
    constructor() {
        this.webrtcViewer = null;
        this.currentUser = null;
        this.isConnected = false;
        this.isMicActive = false;
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Load user authentication
            await this.loadUserAuthentication();
            
            // Initialize WebRTC viewer
            this.initializeWebRTCViewer();
            
            // Set up UI event listeners
            this.setupUIEventListeners();
            
            // Check for active streams
            this.checkForActiveStreams();
            
        } catch (error) {
            this.showErrorMessage('Failed to initialize viewer page: ' + error.message);
        }
    }
    
    async loadUserAuthentication() {
        try {
            // NEW: Secure token storage using sessionStorage instead of localStorage
            const userToken = sessionStorage.getItem('userToken');
            const adminToken = sessionStorage.getItem('adminToken');
            
            if (userToken) {
                // Validate token before use
                if (this.isTokenValid(userToken)) {
                    const payload = this.decodeToken(userToken);
                    this.currentUser = {
                        id: payload.id,
                        name: payload.name || payload.email || 'User',
                        email: payload.email,
                        type: 'user'
                    };
                } else {
                    // Token expired or invalid
                    this.clearInvalidToken('userToken');
                    throw new Error('Token expired or invalid');
                }
            } else if (adminToken) {
                if (this.isTokenValid(adminToken)) {
                    const payload = this.decodeToken(adminToken);
                    this.currentUser = {
                        id: payload.id,
                        name: payload.name || payload.email || 'Admin',
                        email: payload.email,
                        type: 'admin'
                    };
                } else {
                    this.clearInvalidToken('adminToken');
                    throw new Error('Admin token expired or invalid');
                }
            } else {
                // No token - create anonymous user
                this.currentUser = {
                    id: 'anonymous-' + Date.now(),
                    name: 'Anonymous User',
                    email: 'anonymous@una.institute',
                    type: 'anonymous'
                };
            }
            
            // Update UI with user info
            this.updateUserInfo();
            
        } catch (error) {
            console.error('Failed to load user authentication:', error);
            // Create anonymous user as fallback
            this.currentUser = {
                id: 'anonymous-' + Date.now(),
                name: 'Anonymous User',
                email: 'anonymous@una.institute',
                type: 'anonymous'
            };
            this.updateUserInfo();
        }
    }

    // NEW: Secure token management methods
    isTokenValid(token) {
        try {
            const payload = this.decodeToken(token);
            const now = Date.now() / 1000;
            return payload.exp > now;
        } catch (error) {
            return false;
        }
    }

    decodeToken(token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (error) {
            throw new Error('Invalid token format');
        }
    }

    clearInvalidToken(tokenName) {
        try {
            sessionStorage.removeItem(tokenName);
            localStorage.removeItem(tokenName);
        } catch (error) {
            console.warn('Failed to clear token:', error);
        }
    }
    
    updateUserInfo() {
        if (!this.currentUser) return;
        
        // Update user avatar
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.textContent = this.currentUser.name.charAt(0).toUpperCase();
        }
        
        // Update user name
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = this.currentUser.name;
        }
        
        // Update user email
        const userEmail = document.getElementById('userEmail');
        if (userEmail) {
            userEmail.textContent = this.currentUser.email;
        }
    }
    
    initializeWebRTCViewer() {
        try {
            // Create WebRTC viewer instance
            this.webrtcViewer = new CustomWebRTCViewer();
            
            // Set up custom event handlers
            this.setupWebRTCEventHandlers();
            
        } catch (error) {
            this.showErrorMessage('Failed to initialize WebRTC viewer: ' + error.message);
        }
    }
    
    setupWebRTCEventHandlers() {
        if (!this.webrtcViewer) return;
        
        // Override status update method to update UI
        const originalUpdateStatus = this.webrtcViewer.updateStatus.bind(this.webrtcViewer);
        this.webrtcViewer.updateStatus = (message) => {
            originalUpdateStatus(message);
            this.updateStreamStatus(message);
        };
        
        // Override remote track handler to show video
        const originalHandleRemoteTrack = this.webrtcViewer.handleRemoteTrack.bind(this.webrtcViewer);
        this.webrtcViewer.handleRemoteTrack = (event) => {
            originalHandleRemoteTrack(event);
            this.showVideoStream();
        };
        
        // Override connection state handler
        const originalUpdateConnectionState = this.webrtcViewer.updateConnectionState.bind(this.webrtcViewer);
        this.webrtcViewer.updateConnectionState = () => {
            originalUpdateConnectionState();
            this.updateConnectionUI();
        };
    }
    
    setupUIEventListeners() {
        // Request microphone button
        const requestMicBtn = document.getElementById('requestMicBtn');
        if (requestMicBtn) {
            requestMicBtn.addEventListener('click', () => {
                this.requestMicrophone();
            });
        }
        
        // Mute button
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                this.muteMicrophone();
            });
        }
        
        // Unmute button
        const unmuteBtn = document.getElementById('unmuteBtn');
        if (unmuteBtn) {
            unmuteBtn.addEventListener('click', () => {
                this.unmuteMicrophone();
            });
        }
        
        // Leave stream button
        const leaveStreamBtn = document.getElementById('leaveStreamBtn');
        if (leaveStreamBtn) {
            leaveStreamBtn.addEventListener('click', () => {
                this.leaveStream();
            });
        }
        
        // Chat send button
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.sendChatMessage();
            });
        }
        
        // Chat input enter key
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }
    }
    
    async requestMicrophone() {
        try {
            if (!this.webrtcViewer) {
                this.showErrorMessage('WebRTC viewer not initialized');
                return;
            }
            
            // Request microphone access
            await this.webrtcViewer.requestMic();
            
            // Update UI
            this.updateMicrophoneUI(true);
            
            this.showSuccessMessage('Microphone access granted');
            
        } catch (error) {
            this.showErrorMessage('Failed to request microphone: ' + error.message);
        }
    }
    
    muteMicrophone() {
        try {
            if (this.webrtcViewer && this.webrtcViewer.muteMic) {
                this.webrtcViewer.muteMic();
                this.updateMicrophoneUI(false);
                this.showSuccessMessage('Microphone muted');
            }
        } catch (error) {
            this.showErrorMessage('Failed to mute microphone: ' + error.message);
        }
    }
    
    unmuteMicrophone() {
        try {
            if (this.webrtcViewer && this.webrtcViewer.unmuteMic) {
                this.webrtcViewer.unmuteMic();
                this.updateMicrophoneUI(true);
                this.showSuccessMessage('Microphone unmuted');
            }
        } catch (error) {
            this.showErrorMessage('Failed to unmute microphone: ' + error.message);
        }
    }
    
    updateMicrophoneUI(isActive) {
        this.isMicActive = isActive;
        
        const requestMicBtn = document.getElementById('requestMicBtn');
        const muteBtn = document.getElementById('muteBtn');
        const unmuteBtn = document.getElementById('unmuteBtn');
        
        if (isActive) {
            if (requestMicBtn) requestMicBtn.style.display = 'none';
            if (muteBtn) muteBtn.style.display = 'block';
            if (unmuteBtn) unmuteBtn.style.display = 'none';
        } else {
            if (requestMicBtn) requestMicBtn.style.display = 'block';
            if (muteBtn) muteBtn.style.display = 'none';
            if (unmuteBtn) unmuteBtn.style.display = 'none';
        }
    }
    
    leaveStream() {
        try {
            if (this.webrtcViewer) {
                this.webrtcViewer.cleanup();
            }
            
            // Reset UI
            this.resetStreamUI();
            
            // Redirect to home page
            window.location.href = '/en/index.html';
            
        } catch (error) {
            this.showErrorMessage('Failed to leave stream: ' + error.message);
        }
    }
    
    sendChatMessage() {
        try {
            const chatInput = document.getElementById('chatInput');
            if (!chatInput || !chatInput.value.trim()) return;
            
            const message = chatInput.value.trim();
            
            if (this.webrtcViewer && this.webrtcViewer.sendChatMessage) {
                this.webrtcViewer.sendChatMessage(message);
            }
            
            // Add message to local chat
            this.addChatMessage(this.currentUser.name, message);
            
            // Clear input
            chatInput.value = '';
            
        } catch (error) {
            this.showErrorMessage('Failed to send chat message: ' + error.message);
        }
    }
    
    addChatMessage(author, message) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-author">${author}</span>
                <span class="message-time">${timeString}</span>
            </div>
            <div class="message-content">${message}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    updateStreamStatus(message) {
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = message;
        }
    }
    
    showVideoStream() {
        const videoOverlay = document.getElementById('videoOverlay');
        if (videoOverlay) {
            videoOverlay.classList.add('hidden');
        }
        
        const statusDot = document.getElementById('statusDot');
        if (statusDot) {
            statusDot.classList.add('live');
        }
        
        this.isConnected = true;
        this.enableChat();
    }
    
    updateConnectionUI() {
        if (!this.webrtcViewer || !this.webrtcViewer.peerConnection) return;
        
        const state = this.webrtcViewer.peerConnection.connectionState;
        
        switch (state) {
            case 'connected':
                this.updateStreamStatus('Stream connected');
                this.isConnected = true;
                break;
            case 'disconnected':
                this.updateStreamStatus('Stream disconnected');
                this.isConnected = false;
                break;
            case 'failed':
                this.updateStreamStatus('Connection failed');
                this.isConnected = false;
                break;
            case 'closed':
                this.updateStreamStatus('Connection closed');
                this.isConnected = false;
                break;
        }
    }
    
    enableChat() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        if (chatInput) chatInput.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
    }
    
    resetStreamUI() {
        const videoOverlay = document.getElementById('videoOverlay');
        if (videoOverlay) {
            videoOverlay.classList.remove('hidden');
        }
        
        const statusDot = document.getElementById('statusDot');
        if (statusDot) {
            statusDot.classList.remove('live');
        }
        
        this.updateStreamStatus('Disconnected');
        this.isConnected = false;
    }
    
    async checkForActiveStreams() {
        try {
            // Check if there's an active stream
            if (this.webrtcViewer && this.webrtcViewer.socket) {
                // Emit watcher event to check for active streams
                this.webrtcViewer.socket.emit('watcher', this.currentUser);
            }
        } catch (error) {
            console.error('Failed to check for active streams:', error);
        }
    }
    
    showErrorMessage(message) {
        this.showStatusMessage(message, 'error');
    }
    
    showSuccessMessage(message) {
        this.showStatusMessage(message, 'success');
    }
    
    showStatusMessage(message, type) {
        const statusMessages = document.getElementById('statusMessages');
        if (!statusMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `status-message ${type === 'error' ? 'error-message' : 'success-message'}`;
        messageDiv.textContent = message;
        
        statusMessages.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
}

// Initialize viewer page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create viewer page manager
        window.viewerPageManager = new ViewerPageManager();
        
    } catch (error) {
        console.error('Failed to initialize viewer page:', error);
        
        // Show error message
        const statusMessages = document.getElementById('statusMessages');
        if (statusMessages) {
            statusMessages.innerHTML = `
                <div class="error-message">
                    Failed to initialize viewer page: ${error.message}
                </div>
            `;
        }
    }
});
