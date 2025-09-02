// Global variables - ALL CONSOLIDATED TO WINDOW SCOPE
window.socket = null;
window.localStream = null;
window.screenStream = null;
window.isScreenSharing = false;
window.connectedViewers = new Map();
window.currentEditId = null;
window.quillEditor = null;
window.peerConnections = {}; // Store peer connections for each viewer
window.userAudioStreams = new Map(); // Initialize user audio streams Map
window.mediaRecorder = null;
window.recordedChunks = [];
window.currentRecordingLectureId = null;
window.audioMonitor = null;

// 🚀 LIVESTREAMING SYSTEM
// Configuration will be added here

// PHASE 2: Stream State Machine
window.streamState = {
    // Current state
    current: 'idle', // idle, starting, live, screenSharing, recording, stopping, error
    
    // State transitions
    transitions: {
        'idle': ['starting'],
        'starting': ['live', 'error'],
        'live': ['screenSharing', 'recording', 'stopping', 'error'],
        'screenSharing': ['live', 'recording', 'stopping', 'error'],
        'recording': ['live', 'screenSharing', 'stopping', 'error'],
        'stopping': ['idle', 'error'],
        'error': ['idle']
    },
    
    // State validation
    canTransition: function(toState) {
        return this.transitions[this.current] && this.transitions[this.current].includes(toState);
    },
    
    // State change with validation
    changeTo: function(newState) {
        if (this.canTransition(newState)) {
            const oldState = this.current;
            this.current = newState;
            
            // Update UI based on state
            this.updateUI();
            
            // Emit state change event
            this.emitStateChange(oldState, newState);
            
            return true;
        } else {
            return false;
        }
    },
    
    // Update UI based on current state
    updateUI: function() {
        const startLiveBtn = document.getElementById('startLiveBtn');
        const endLiveBtn = document.getElementById('endLiveBtn');
        const shareScreenBtn = document.getElementById('shareScreenBtn');
        const startRecordingBtn = document.getElementById('startRecordingBtn');
        const stopRecordingBtn = document.getElementById('stopRecordingBtn');
        const streamStatus = document.getElementById('streamStatus');
        
        if (startLiveBtn) startLiveBtn.disabled = this.current !== 'idle';
        if (endLiveBtn) endLiveBtn.disabled = !['live', 'screenSharing', 'recording'].includes(this.current);
        if (shareScreenBtn) shareScreenBtn.disabled = !['live', 'recording'].includes(this.current);
        if (startRecordingBtn) startRecordingBtn.disabled = !['live', 'screenSharing'].includes(this.current);
        if (stopRecordingBtn) stopRecordingBtn.disabled = this.current !== 'recording';
        
        // Update status display
        if (streamStatus) {
            const statusMap = {
                'idle': { text: '⏹️ Stream Stopped', class: 'status-stopped' },
                'starting': { text: '🔄 Starting Stream...', class: 'status-loading' },
                'live': { text: '🟢 LIVE - Stream Active', class: 'status-live' },
                'screenSharing': { text: '🖥️ LIVE - Screen Sharing', class: 'status-live' },
                'recording': { text: '🔴 RECORDING', class: 'status-recording' },
                'stopping': { text: '🔄 Stopping Stream...', class: 'status-loading' },
                'error': { text: '❌ Stream Error', class: 'status-error' }
            };
            
            const status = statusMap[this.current];
            if (status) {
                streamStatus.textContent = status.text;
                streamStatus.className = status.class;
            }
        }
        
        // Update share screen button text
        if (shareScreenBtn) {
            shareScreenBtn.textContent = this.current === 'screenSharing' ? 'Stop Sharing' : 'Share Screen';
        }
    },
    
    // Emit state change event for debugging
    emitStateChange: function(oldState, newState) {
        // State change event emitted
    }
};

// Production-ready: Test function removed for security

// 🚀 JITSI MEET LIVESTREAMING SYSTEM
// Complete Jitsi Meet integration for professional livestreaming

// Jitsi Meet Manager Class
class JitsiMeetManager {
    constructor() {
        this.api = null;
        this.currentRoom = null;
        this.isInitialized = false;
    }
    
    async init() {
        try {
            // Check if Jitsi Meet API is available
            if (typeof JitsiMeetExternalAPI === 'undefined') {
                throw new Error('Jitsi Meet API not loaded');
            }
            
            this.isInitialized = true;
            console.log('✅ Jitsi Meet Manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Jitsi Meet Manager:', error);
            return false;
        }
    }
    
    async createRoom(roomType, roomName) {
        try {
            const response = await fetch('/api/jitsi/create-room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ 
                    roomName: roomName || `${roomType}-${Date.now()}`,
                    isPrivate: false,
                    maxParticipants: 100
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create room');
            }
            
            const data = await response.json();
            return data.room;
        } catch (error) {
            console.error('❌ Error creating room:', error);
            throw error;
        }
    }
    
    async joinRoom(roomId, options = {}) {
        try {
            const config = {
                roomName: roomId,
                width: 700,
                height: 700,
                parentNode: document.getElementById('jitsi-container') || document.body,
                configOverwrite: {
                    startWithAudioMuted: options.audio === false,
                    startWithVideoMuted: options.video === false,
                    prejoinPageEnabled: false,
                    disableDeepLinking: true,
                    enableClosePage: false,
                    enableWelcomePage: false,
                    enableLobbyChat: false,
                    enableKnocking: false,
                    enableInsecureRoomNameWarning: false,
                    enableAudioLevels: true,
                    enableNoAudioDetection: true,
                    enableNoisyMicDetection: true,
                    enableRemb: true,
                    enableTcc: true,
                    openBridgeChannel: 'websocket'
                },
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'chat', 'recording',
                        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                        'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
                        'tileview', 'select-background', 'download', 'help', 'mute-everyone', 'security'
                    ],
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    SHOW_POWERED_BY: false,
                    SHOW_BRAND_WATERMARK: false,
                    SHOW_PROMOTIONAL_SPACE: false,
                    GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
                    AUTHENTICATION_ENABLE: false,
                    LANG_DETECTION: false,
                    INVITATION_POWERED_BY: false,
                    VIDEO_LAYOUT_FIT: 'height',
                    TOOLBAR_ALWAYS_VISIBLE: true,
                    TOOLBAR_BUTTONS_ALWAYS_VISIBLE: true,
                    HIDE_JITSI_WATERMARK: true,
                    HIDE_WATERMARK_FOR_GUESTS: true,
                    HIDE_POWERED_BY: true,
                    HIDE_BRAND_WATERMARK: true,
                    HIDE_PROMOTIONAL_SPACE: true
                },
                userInfo: {
                    displayName: options.username || 'Anonymous User'
                }
            };
            
            // Create Jitsi Meet API instance
            this.api = new JitsiMeetExternalAPI('meet.jit.si', config);
            
            // Set up event listeners
            this.setupEventListeners();
            
            this.currentRoom = { roomId, config };
            console.log('✅ Joined Jitsi room:', roomId);
            return this.currentRoom;
        } catch (error) {
            console.error('❌ Error joining room:', error);
            throw error;
        }
    }
    
    setupEventListeners() {
        if (!this.api) return;
        
        this.api.addEventListeners({
            'participantJoined': this.onParticipantJoined.bind(this),
            'participantLeft': this.onParticipantLeft.bind(this),
            'audioMuteStatusChanged': this.onAudioMuteStatusChanged.bind(this),
            'videoMuteStatusChanged': this.onVideoMuteStatusChanged.bind(this),
            'screenSharingStatusChanged': this.onScreenSharingStatusChanged.bind(this),
            'meetingJoined': this.onMeetingJoined.bind(this),
            'meetingLeft': this.onMeetingLeft.bind(this)
        });
    }
    
    onParticipantJoined(participant) {
        console.log('👤 Participant joined:', participant);
        if (window.audioPipeline) {
            window.audioPipeline.addUserAudio(participant.id, { name: participant.displayName || 'Anonymous' });
        }
    }
    
    onParticipantLeft(participant) {
        console.log('👤 Participant left:', participant);
        if (window.audioPipeline) {
            window.audioPipeline.removeUserAudio(participant.id);
        }
    }
    
    onAudioMuteStatusChanged(participant) {
        console.log('🎤 Audio mute status changed:', participant);
        if (window.audioPipeline) {
            window.audioPipeline.updateUserAudioStatus(participant.id, !participant.muted);
        }
    }
    
    onVideoMuteStatusChanged(participant) {
        console.log('📹 Video mute status changed:', participant);
    }
    
    onScreenSharingStatusChanged(participant) {
        console.log('🖥️ Screen sharing status changed:', participant);
    }
    
    onMeetingJoined() {
        console.log('✅ Successfully joined Jitsi meeting');
        if (window.audioPipeline) {
            window.audioPipeline.updateAudioStatusIndicator();
        }
    }
    
    onMeetingLeft() {
        console.log('👋 Left Jitsi meeting');
        if (window.audioPipeline) {
            window.audioPipeline.clear();
        }
    }
    
    async leaveRoom() {
        try {
            if (this.api) {
                this.api.executeCommand('hangup');
                this.api.dispose();
                this.api = null;
            }
            this.currentRoom = null;
            console.log('✅ Left Jitsi room');
            return true;
        } catch (error) {
            console.error('❌ Error leaving room:', error);
            return false;
        }
    }
    
    executeCommand(command, ...args) {
        if (this.api) {
            this.api.executeCommand(command, ...args);
        }
    }
}

// Initialize Jitsi Meet Manager
window.jitsiManager = new JitsiMeetManager();

// Audio Pipeline for managing user audio streams
window.audioPipeline = {
    isInitialized: false,
    userAudioTracks: new Map(),
    currentRoom: null,
    
    // Initialize Jitsi Meet system
    init: async function() {
        try {
            console.log('🚀 Initializing Jitsi Meet livestreaming system...');
            
            // Initialize Jitsi Meet manager
            const success = await window.jitsiManager.init();
            if (success) {
                this.isInitialized = true;
                console.log('✅ Jitsi Meet system initialized successfully');
                return true;
            } else {
                throw new Error('Failed to initialize Jitsi Meet');
            }
        } catch (error) {
            console.error('❌ Failed to initialize Jitsi Meet:', error);
            this.isInitialized = false;
            return false;
        }
    },
    
    // Create and start a new livestream
    startLivestream: async function(roomType = 'livestream', roomName = null) {
        try {
            if (!this.isInitialized) {
                await this.init();
            }
            
            console.log('🎥 Creating new livestream room...');
            const roomData = await window.jitsiManager.createRoom(roomType, roomName);
            
            // Join the room as admin
            this.currentRoom = await window.jitsiManager.joinRoom(roomData.roomId, {
                username: 'UNA Institute Admin',
                role: 'moderator',
                audio: true,
                video: true
            });
            
            console.log('✅ Livestream started successfully:', roomData.roomUrl);
            return roomData;
            
        } catch (error) {
            console.error('❌ Failed to start livestream:', error);
            throw error;
        }
    },
    
    // Stop current livestream
    stopLivestream: async function() {
        try {
            if (this.currentRoom) {
                await window.jitsiManager.leaveRoom();
                this.currentRoom = null;
                console.log('✅ Livestream stopped successfully');
            }
        } catch (error) {
            console.error('❌ Error stopping livestream:', error);
        }
    },
    
    // Join existing livestream as viewer
    joinLivestream: async function(roomId, username = 'Anonymous User') {
        try {
            if (!this.isInitialized) {
                await this.init();
            }
            
            console.log('👥 Joining livestream as viewer...');
            this.currentRoom = await window.jitsiManager.joinRoom(roomId, {
                username: username,
                role: 'participant',
                audio: false,
                video: false
            });
            
            console.log('✅ Joined livestream successfully');
            return this.currentRoom;
            
        } catch (error) {
            console.error('❌ Failed to join livestream:', error);
            throw error;
        }
    },
    
    // Screen sharing functionality
    startScreenShare: async function() {
        try {
            if (window.jitsiManager && window.jitsiManager.api) {
                window.jitsiManager.executeCommand('toggleShareScreen');
                console.log('🖥️ Screen sharing toggled');
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Failed to start screen sharing:', error);
            return false;
        }
    },
    
    stopScreenShare: function() {
        try {
            if (window.jitsiManager && window.jitsiManager.api) {
                window.jitsiManager.executeCommand('toggleShareScreen');
                console.log('🖥️ Screen sharing stopped');
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Failed to stop screen sharing:', error);
            return false;
        }
    },
    
    // Set admin audio stream
    setAdminAudio: function(stream) {
        if (stream && stream.getAudioTracks) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                this.adminAudioTrack = audioTrack;
                console.log('🎤 Admin audio track set');
            }
        }
    },
    
    // Add user audio stream
    addUserAudio: function(uid, user) {
        if (uid && user) {
            this.userAudioTracks.set(uid, user);
            console.log('👤 User audio added:', uid);
            this.updateAudioStatusIndicator();
        }
    },
    
    // Remove user audio stream
    removeUserAudio: function(uid) {
        if (uid) {
            this.userAudioTracks.delete(uid);
            console.log('👤 User audio removed:', uid);
            console.log('🎤 User audio removed:', uid);
            this.updateAudioStatusIndicator();
        }
    },
    
    // Update audio status indicator
    updateAudioStatusIndicator: function() {
        const activeUsers = this.userAudioTracks.size;
        console.log('🎤 Active audio users:', activeUsers);
    },
    
    // Update user audio status
    updateUserAudioStatus: function(socketId, isActive) {
        const user = this.userAudioTracks.get(socketId);
        if (user) {
            user.isActive = isActive;
            console.log('🎤 User audio status updated:', socketId, isActive);
        }
    },
    
    // Update admin volume
    updateAdminVolume: function(volume) {
        if (this.adminAudioTrack) {
            // Volume control would be implemented here
            console.log('🔊 Admin volume updated:', volume);
        }
    },
    
    // Get all audio tracks
    getAllAudioTracks: function() {
        return Array.from(this.userAudioTracks.values());
    },
    
    // Clear all audio tracks
    clear: function() {
        this.userAudioTracks.clear();
        this.adminAudioTrack = null;
        console.log('🧹 Audio tracks cleared');
    }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin dashboard initializing...');
    
    // Initialize Jitsi Meet system
    window.audioPipeline.init().then(() => {
        console.log('✅ Jitsi Meet system ready');
    }).catch(error => {
        console.error('❌ Failed to initialize Jitsi Meet system:', error);
    });
    
    // Set up event listeners for livestream controls
    setupLivestreamControls();
    
    console.log('✅ Admin dashboard initialized');
});

// Set up livestream control event listeners
function setupLivestreamControls() {
    // Start livestream button
    const startLiveBtn = document.getElementById('startLiveBtn');
    if (startLiveBtn) {
        startLiveBtn.addEventListener('click', async () => {
            try {
                await window.audioPipeline.startLivestream();
                console.log('🎥 Livestream started');
            } catch (error) {
                console.error('❌ Failed to start livestream:', error);
            }
        });
    }
    
    // Stop livestream button
    const endLiveBtn = document.getElementById('endLiveBtn');
    if (endLiveBtn) {
        endLiveBtn.addEventListener('click', async () => {
            try {
                await window.audioPipeline.stopLivestream();
                console.log('⏹️ Livestream stopped');
            } catch (error) {
                console.error('❌ Failed to stop livestream:', error);
            }
        });
    }
    
    // Screen share button
    const shareScreenBtn = document.getElementById('shareScreenBtn');
    if (shareScreenBtn) {
        shareScreenBtn.addEventListener('click', async () => {
            try {
                await window.audioPipeline.startScreenShare();
                console.log('🖥️ Screen sharing toggled');
            } catch (error) {
                console.error('❌ Failed to toggle screen sharing:', error);
            }
        });
    }
    
    // Join livestream button
    const joinLiveBtn = document.getElementById('joinLiveBtn');
    if (joinLiveBtn) {
        joinLiveBtn.addEventListener('click', async () => {
            const roomId = prompt('Enter room ID to join:');
            if (roomId) {
                try {
                    await window.audioPipeline.joinLivestream(roomId, 'Admin User');
                    console.log('👥 Joined livestream:', roomId);
                } catch (error) {
                    console.error('❌ Failed to join livestream:', error);
                }
            }
        });
    }
}

// Export for global access
window.setupLivestreamControls = setupLivestreamControls;
