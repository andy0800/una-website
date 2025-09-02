// 🚀 JITSI MEET UTILITIES
// Core utilities for Jitsi Meet integration

class JitsiMeetManager {
    constructor() {
        this.api = null;
        this.currentRoom = null;
        this.isInitialized = false;
        this.config = null;
    }

    // Initialize Jitsi Meet API
    async init() {
        try {
            // Load Jitsi Meet external API
            await this.loadJitsiAPI();
            
            // Get configuration from backend
            await this.loadConfig();
            
            this.isInitialized = true;
            console.log('✅ Jitsi Meet initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Jitsi Meet:', error);
            return false;
        }
    }

    // Load Jitsi Meet external API
    async loadJitsiAPI() {
        return new Promise((resolve, reject) => {
            if (window.JitsiMeetExternalAPI) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://meet.jit.si/external_api.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'));
            document.head.appendChild(script);
        });
    }

    // Load configuration from backend
    async loadConfig() {
        try {
            const response = await fetch('/api/jitsi/config');
            const result = await response.json();
            
            if (result.success) {
                this.config = result.data;
                console.log('✅ Jitsi config loaded:', this.config);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Failed to load Jitsi config:', error);
            // Use fallback config
            this.config = {
                server: { domain: 'meet.jit.si' },
                rooms: { types: { livestream: {} } }
            };
        }
    }

    // Create a new livestream room
    async createRoom(roomType = 'livestream', roomName = null) {
        try {
            const response = await fetch('/api/jitsi/room/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ roomType, roomName })
            });

            const result = await response.json();
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Failed to create room:', error);
            throw error;
        }
    }

    // Join a livestream room
    async joinRoom(roomId, options = {}) {
        try {
            const joinData = await this.getJoinData(roomId, options);
            
            // Create Jitsi Meet iframe
            const iframe = this.createJitsiIframe(roomId, joinData);
            
            // Store current room info
            this.currentRoom = {
                roomId,
                iframe,
                joinData,
                joinTime: new Date()
            };

            return this.currentRoom;
        } catch (error) {
            console.error('❌ Failed to join room:', error);
            throw error;
        }
    }

    // Get join data for a room
    async getJoinData(roomId, options = {}) {
        try {
            const response = await fetch(`/api/jitsi/room/${roomId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options)
            });

            const result = await response.json();
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Failed to get join data:', error);
            throw error;
        }
    }

    // Create Jitsi Meet iframe
    createJitsiIframe(roomId, joinData) {
        const container = document.getElementById('jitsi-container') || document.body;
        
        // Remove existing iframe
        const existingIframe = container.querySelector('.jitsi-iframe');
        if (existingIframe) {
            existingIframe.remove();
        }

        // Create new iframe
        const iframe = document.createElement('iframe');
        iframe.className = 'jitsi-iframe';
        iframe.src = joinData.roomUrl;
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        container.appendChild(iframe);
        return iframe;
    }

    // Leave current room
    async leaveRoom() {
        if (!this.currentRoom) return;

        try {
            await fetch(`/api/jitsi/room/${this.currentRoom.roomId}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: this.currentRoom.joinData.username
                })
            });

            // Remove iframe
            if (this.currentRoom.iframe) {
                this.currentRoom.iframe.remove();
            }

            this.currentRoom = null;
            console.log('✅ Left room successfully');
        } catch (error) {
            console.error('❌ Error leaving room:', error);
        }
    }

    // Get authentication token
    getAuthToken() {
        return localStorage.getItem('authToken') || 
               localStorage.getItem('adminToken') || 
               sessionStorage.getItem('authToken');
    }

    // Check if user is admin
    isAdmin() {
        const token = this.getAuthToken();
        if (!token) return false;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role === 'admin';
        } catch {
            return false;
        }
    }

    // Get room status
    getRoomStatus() {
        return this.currentRoom ? 'active' : 'inactive';
    }

    // Cleanup resources
    destroy() {
        if (this.currentRoom) {
            this.leaveRoom();
        }
        this.isInitialized = false;
        this.config = null;
    }
}

// Export for use in other files
window.JitsiMeetManager = JitsiMeetManager;
