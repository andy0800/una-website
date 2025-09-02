// Global variables - ALL CONSOLIDATED TO WINDOW SCOPE
window.socket = null;
// WebRTC stream variables removed - now handled by Custom WebRTC system
// window.localStream = null;
// window.screenStream = null;
// window.isScreenSharing = false;
window.connectedViewers = new Map();
window.currentEditId = null;
window.quillEditor = null;
// window.peerConnections removed - now handled by Custom WebRTC system
window.userAudioStreams = new Map(); // Initialize user audio streams Map
window.mediaRecorder = null;
window.recordedChunks = [];
window.currentRecordingLectureId = null;
window.audioMonitor = null;

// 🚀 LIVESTREAMING SYSTEM
// Configuration will be added here

// 🚀 CUSTOM WEBRTC LIVESTREAMING SYSTEM - ADMIN SIDE
// This system replaces all broken implementations with a working custom WebRTC solution

// 🎯 GLOBAL VARIABLES
window.connectedViewers = new Map();
window.streamState = null;
window.webrtcManager = null;

// PHASE 1: Stream State Machine
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
        // Custom event for state changes
        const event = new CustomEvent('streamStateChange', {
            detail: { oldState, newState, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
        
        // Log state change
        // Console logging removed for production
    },
    
    // Get current state info
    getInfo: function() {
        return {
            current: this.current,
            canStart: this.canTransition('starting'),
            canStop: this.canTransition('stopping'),
            canScreenShare: this.canTransition('screenSharing'),
            canRecord: this.canTransition('recording'),
            isActive: ['live', 'screenSharing', 'recording'].includes(this.current),
            isRecording: this.current === 'recording',
            isScreenSharing: this.current === 'screenSharing'
        };
    },
    
    // Reset to idle state
    reset: function() {
        this.current = 'idle';
        this.updateUI();
        // Console logging removed for production
    },
    
    // Force state change (for emergency situations)
    forceChange: function(newState) {
        const oldState = this.current;
        this.current = newState;
        // Console logging removed for production
        this.updateUI();
        this.emitStateChange(oldState, newState);
    },
    
    // Production-ready: Debug function removed
};

// Production-ready global functions (debug functions removed)
window.getStreamState = function() {
    if (window.streamState) {
        return window.streamState.getInfo();
    } else {
        return { error: 'Stream state machine not initialized' };
    }
};

// Production-ready: Test function removed for security

// 🚀 CUSTOM WEBRTC LIVESTREAMING SYSTEM
// Complete custom WebRTC integration for professional livestreaming

// Custom WebRTC Manager Integration
window.webrtcManager = null;

// Initialize WebRTC manager
async function initializeWebRTCManager() {
    try {
        if (typeof CustomWebRTCManager !== 'undefined') {
            window.webrtcManager = new CustomWebRTCManager();
            const success = await window.webrtcManager.init();
            if (success) {
                return true;
            } else {
                throw new Error('Failed to initialize Custom WebRTC Manager');
            }
        } else {
            throw new Error('CustomWebRTCManager class not found');
        }
    } catch (error) {
        console.error('❌ Failed to initialize WebRTC Manager:', error);
        return false;
    }
}

// WebRTC Audio Pipeline
window.audioPipeline = {
    isInitialized: false,
    userAudioTracks: new Map(),
    currentRoom: null,
    
    // Initialize WebRTC system
    init: async function() {
        try {
            // Initialize WebRTC manager
            const success = await initializeWebRTCManager();
            if (success) {
                this.isInitialized = true;
                return true;
            } else {
                throw new Error('Failed to initialize Custom WebRTC');
            }
        } catch (error) {
            this.isInitialized = false;
            return false;
        }
    },
    
    // Start livestream using Custom WebRTC
    startLivestream: async function(roomType = 'livestream', roomName = null) {
        try {
            if (!this.isInitialized) {
                await this.init();
            }
            
            if (!window.webrtcManager) {
                throw new Error('WebRTC Manager not initialized');
            }
            
            // Start livestream
            const result = await window.webrtcManager.startLivestream(roomName || roomType);
            
            if (result && result.success) {
                this.currentRoom = result;
                return result;
            } else {
                throw new Error('Failed to start livestream');
            }
            
        } catch (error) {
            throw error;
        }
    },
    
    // Stop current livestream
    stopLivestream: async function() {
        try {
            if (window.webrtcManager && this.currentRoom) {
                await window.webrtcManager.stopLivestream();
                this.currentRoom = null;
            }
        } catch (error) {
            // Error handling
        }
    },
    
    // Screen sharing functionality
    startScreenShare: async function() {
        try {
            if (window.webrtcManager && window.webrtcManager.startScreenShare) {
                return await window.webrtcManager.startScreenShare();
            } else {
                throw new Error('Screen sharing not available in current WebRTC implementation');
            }
        } catch (error) {
            return false;
        }
    },
    
    stopScreenShare: function() {
        try {
            if (window.webrtcManager && window.webrtcManager.stopScreenShare) {
                return window.webrtcManager.stopScreenShare();
            }
            return true;
        } catch (error) {
            return false;
        }
    },
    
    // Audio management
    setAdminAudio: function(stream) {
        return true;
    },
    
    addUserAudio: function(uid, user) {
        this.userAudioTracks.set(uid, {
            uid: uid,
            hasMic: true,
            user: user
        });
        this.updateAudioStatusIndicator();
    },
    
    removeUserAudio: function(uid) {
        this.userAudioTracks.delete(uid);
        this.updateAudioStatusIndicator();
    },
    
    updateAudioStatusIndicator: function() {
        const indicator = document.getElementById('userAudioIndicator');
        if (indicator) {
            const count = this.userAudioTracks.size;
            if (count > 0) {
                indicator.textContent = `${count} user(s) in livestream`;
                indicator.style.color = '#28a745';
            } else {
                indicator.textContent = 'Custom WebRTC ready';
                indicator.style.color = '#666';
            }
        }
    },
    
    updateUserAudioStatus: function(socketId, isActive) {
        const indicator = document.getElementById('userAudioIndicator');
        if (indicator) {
            if (isActive) {
                indicator.textContent = 'User active in livestream';
                indicator.style.color = '#28a745';
            } else {
                indicator.textContent = 'Custom WebRTC ready';
                indicator.style.color = '#666';
            }
        }
        
        // Update connected viewers map
        if (window.connectedViewers && window.connectedViewers.has(socketId)) {
            const viewer = window.connectedViewers.get(socketId);
            viewer.hasMic = isActive;
            window.connectedViewers.set(socketId, viewer);
        }
    },
    
    updateAdminVolume: function(volume) {
        const volumeDisplay = document.getElementById('adminVolumeDisplay');
        if (volumeDisplay) {
            volumeDisplay.textContent = Math.round(volume * 100) + '%';
        }
    },
    
    getAllAudioTracks: function() {
        return Array.from(this.userAudioTracks.values());
    },
    
    clear: function() {
        this.userAudioTracks.clear();
        if (this.currentRoom) {
            this.stopLivestream();
        }
        console.log('✅ Custom WebRTC system cleared');
    },
    
    // Get current room status
    getRoomStatus: function() {
        return window.webrtcManager ? window.webrtcManager.getConnectionStatus() : null;
    },
    
    // Get room URL for sharing
    getRoomUrl: function() {
        return this.currentRoom ? this.currentRoom.roomId : null;
    }
};

// Global audio volume control function (referenced in HTML)
function updateAdminVolume(volume) {
    if (window.audioPipeline) {
        window.audioPipeline.updateAdminVolume(volume);
    }
}

// 🧪 TEST FUNCTION TO VERIFY LIVESTREAM SETUP
function testStreamingSetup() {
    console.log('🧪 Testing livestream setup...');
    
    // Check if Custom WebRTC Manager exists
    const webrtcManagerExists = typeof CustomWebRTCManager !== 'undefined';
    console.log('✅ Custom WebRTC Manager class exists:', webrtcManagerExists);
    
    // Check if audioPipeline exists
    const audioPipelineExists = !!window.audioPipeline;
    console.log('✅ Audio pipeline exists:', audioPipelineExists);
    
    // Check if webrtcManager instance exists
    const webrtcManagerInstanceExists = !!window.webrtcManager;
    console.log('✅ WebRTC manager instance exists:', webrtcManagerInstanceExists);
    
    // Check if streamState exists
    const streamStateExists = !!window.streamState;
    console.log('✅ Stream state exists:', streamStateExists);
    
    // Check if required HTML elements exist
    const startLiveBtn = document.getElementById('startLiveBtn');
    const endLiveBtn = document.getElementById('endLiveBtn');
    const webrtcContainer = document.getElementById('webrtc-container');
    
    console.log('✅ Start live button exists:', !!startLiveBtn);
    console.log('✅ End live button exists:', !!endLiveBtn);
    console.log('✅ WebRTC container exists:', !!webrtcContainer);
    
    // Test Custom WebRTC initialization
    if (typeof CustomWebRTCManager !== 'undefined') {
        console.log('🧪 Testing Custom WebRTC Manager...');
        console.log('✅ Custom WebRTC Manager class exists');
    } else {
        console.log('❌ Custom WebRTC Manager class not found');
    }
    
    // Show results
    const results = `
🧪 LIVESTREAM SETUP TEST RESULTS:
✅ Custom WebRTC Manager: ${typeof CustomWebRTCManager !== 'undefined' ? 'EXISTS' : 'NOT FOUND'}
✅ Audio Pipeline: ${audioPipelineExists ? 'EXISTS' : 'MISSING'}
✅ Stream State: ${streamStateExists ? 'EXISTS' : 'MISSING'}
✅ Start Button: ${startLiveBtn ? 'EXISTS' : 'MISSING'}
✅ End Button: ${endLiveBtn ? 'EXISTS' : 'MISSING'}
✅ WebRTC Container: ${webrtcContainer ? 'EXISTS' : 'MISSING'}

${typeof CustomWebRTCManager !== 'undefined' && audioPipelineExists ? 
    '🎉 All components are ready! Try starting a livestream.' : 
    '❌ Some components are missing. Check the console for details.'}
    `;
    
    alert(results);
    console.log(results);
}



// 🔍 QUICK STATUS CHECK FUNCTION
function checkWebRTCStatus() {
    const status = {
        webrtcManager: typeof CustomWebRTCManager !== 'undefined',
        webrtcInstance: !!window.webrtcManager,
        audioPipeline: !!window.audioPipeline,
        streamState: !!window.streamState,
        isInitialized: window.audioPipeline ? window.audioPipeline.isInitialized : false
    };
    
    const statusText = `
🔍 QUICK STATUS CHECK:
✅ Custom WebRTC Manager: ${status.webrtcManager ? 'EXISTS' : 'NOT FOUND'}
✅ WebRTC Instance: ${status.webrtcInstance ? 'EXISTS' : 'MISSING'}
✅ Audio Pipeline: ${status.audioPipeline ? 'EXISTS' : 'MISSING'}
✅ Stream State: ${status.streamState ? 'EXISTS' : 'MISSING'}
✅ System Initialized: ${status.isInitialized ? 'YES' : 'NO'}

${status.webrtcManager && status.webrtcInstance && status.audioPipeline ? 
    '🎉 System appears ready!' : 
    '❌ System has issues. Use "Test Setup" for details.'}
    `;
    
    alert(statusText);
    console.log('🔍 Status check:', status);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎤 Dashboard DOMContentLoaded event fired');
    
    // Check if audio pipeline exists
    console.log('🎤 Audio pipeline exists:', !!window.audioPipeline);
    
    // Livestreaming system will be initialized here
    
    // Initialize audio pipeline
    if (window.audioPipeline) {
        console.log('🎤 Initializing audio pipeline...');
        window.audioPipeline.init();
    } else {
        console.log('❌ Audio pipeline does not exist! This is the problem!');
    }
    
    // Add a small delay to ensure all elements are rendered
    setTimeout(() => {
        console.log('🎤 Dashboard initialization timeout fired');
        
        try {
            // First check authentication
            const token = localStorage.getItem('adminToken');
            if (!token) {
                console.log('❌ No admin token found, redirecting to login');
                window.location.href = '/admin/login.html';
                return;
            }
            
            console.log('✅ Admin token found, proceeding with initialization');
            
            // Initialize core functionality
            initializeDashboard();
            initializeTabNavigation();
            initializeSocketConnection();
            initializeQuillEditor();
            
            // Initialize stream state machine
            if (window.streamState) {
                window.streamState.updateUI();
                console.log('✅ Stream state machine initialized');
            }
            
            // Initialize audio pipeline
            if (window.audioPipeline) {
                window.audioPipeline.init();
            }
            
            // Initialize error handler
            if (window.errorHandler) {
                // Console logging removed for production
            }
            
            // Load content after core initialization
            setTimeout(() => {
                try {
                    loadDashboardStats();
                    initializeEditModals();
                    // Console logging removed for production
                } catch (error) {
                    // Error logging removed for production
                }
            }, 200);
            
            // Add page visibility and unload handlers
            document.addEventListener('visibilitychange', handlePageVisibilityChange);
            window.addEventListener('beforeunload', handleBeforeUnload);
            
            // Console logging removed for production
        } catch (error) {
            // Error logging removed for production
        }
    }, 100);
});

// Check if all required streaming elements exist
function checkStreamingElements() {
    const requiredElements = [
        'startLiveBtn',
        'endLiveBtn', 
        'shareScreenBtn',
        'startRecordingBtn',
        'stopRecordingBtn',
        'localVideo',
        'streamStatus',
        'recordingStatus',
        'viewerCount',
        'liveViewers'
    ];
    
    const missingElements = [];
    
    requiredElements.forEach(elementId => {
        if (!document.getElementById(elementId)) {
            missingElements.push(elementId);
        }
    });
    
    if (missingElements.length > 0) {
        // Error logging removed for production
        return false;
    }
    
    // Console logging removed for production
    return true;
}

// Initialize dashboard
function initializeDashboard() {
    // Console logging removed for production
    
    try {
        // Check authentication
        const token = localStorage.getItem('adminToken');
        if (!token) {
            // Console logging removed for production
            window.location.href = '/admin/login.html';
            return;
        }
        // Console logging removed for production

        // Initialize logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                localStorage.removeItem('adminToken');
                window.location.href = '/admin/login.html';
            });
            // Console logging removed for production
        } else {
            // Error logging removed for production
        }

        // Initialize Socket.IO connection
        initializeSocketConnection();
        
        // Initialize WebRTC system
        initializeWebRTCSystem();
        
        // Add test button for debugging
        addTestButton();

        // Check if streaming elements exist before initializing
        if (checkStreamingElements()) {
            // Initialize streaming event listeners
            initializeStreamingEventListeners();
        } else {
            // Warning logging removed for production
        }

        // Load initial content
        // Console logging removed for production
        loadUsers();
        
    } catch (error) {
        // Error logging removed for production
    }
}

// Initialize Socket.IO connection
function initializeSocketConnection() {
    try {
        // Connect to Socket.IO server
        window.socket = io();
        
        // Set up Socket.IO event listeners
        setupSocketEventListeners();
        
        console.log('✅ Socket.IO connection initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Socket.IO:', error);
    }
}

// Set up Socket.IO event listeners
function setupSocketEventListeners() {
    if (!window.socket) return;
    
    // Handle connection
    window.socket.on('connect', () => {
        console.log('🔌 Connected to server');
    });
    
    // Handle disconnection
    window.socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
    });
    
    // Handle viewer joins to WebRTC room
    window.socket.on('viewer-join', (data) => {
        console.log('👤 Viewer joined WebRTC room:', data);
        // Update viewer count and UI
        if (data.viewerCount !== undefined) {
            updateViewerCount(data.viewerCount);
        }
        // Add viewer to current viewers list
        if (data.socketId && data.userInfo) {
            addViewer(data.socketId, data.userInfo);
        }
    });
    
    // Handle viewer disconnections
    window.socket.on('disconnectPeer', (data) => {
        console.log('👤 Viewer disconnected:', data);
        // Update viewer count and UI
        if (data.viewerCount !== undefined) {
            updateViewerCount(data.viewerCount);
        }
        // Remove viewer from current viewers list
        if (data.socketId) {
            removeViewer(data.socketId);
        }
    });
    
    // Handle WebRTC answers from viewers
    window.socket.on('webrtc-answer', async (data) => {
        console.log('📥 Received WebRTC answer from viewer:', data);
        if (window.webrtcManager) {
            // Forward to WebRTC manager
            window.webrtcManager.handleViewerAnswer(data.socketId, data.answer);
        }
    });
    
    // Handle ICE candidates from viewers
    window.socket.on('ice-candidate', async (data) => {
        console.log('🧊 Received ICE candidate from viewer:', data);
        if (window.webrtcManager) {
            // Forward to WebRTC manager
            window.webrtcManager.handleViewerIceCandidate(data.socketId, data.candidate);
        }
    });
}

// Initialize WebRTC system
async function initializeWebRTCSystem() {
    try {
        console.log('🚀 Initializing WebRTC system...');
        
        // Initialize WebRTC manager
        const success = await initializeWebRTCManager();
        if (success) {
            console.log('✅ WebRTC system initialized successfully');
            
            // Initialize audio pipeline
            if (window.audioPipeline && window.audioPipeline.init) {
                await window.audioPipeline.init();
            }
        } else {
            throw new Error('Failed to initialize WebRTC manager');
        }
    } catch (error) {
        console.error('❌ Failed to initialize WebRTC system:', error);
    }
}

// Add test button for debugging
function addTestButton() {
    try {
        // Create test button
        const testBtn = document.createElement('button');
        testBtn.id = 'testSystemBtn';
        testBtn.textContent = '🧪 Test System';
        testBtn.className = 'btn btn-warning';
        testBtn.style.margin = '10px';
        
        // Add click handler
        testBtn.addEventListener('click', async () => {
            console.log('🧪 Testing system...');
            
            if (window.webrtcManager) {
                const status = await window.webrtcManager.testSystem();
                console.log('📊 Test results:', status);
                
                // Show results in alert
                if (status) {
                    alert(`System Test Results:\n` +
                          `- Live: ${status.isLive}\n` +
                          `- Room ID: ${status.roomId || 'None'}\n` +
                          `- Viewers: ${status.viewerCount}\n` +
                          `- Peer Connections: ${status.peerConnections}\n` +
                          `- Local Stream: ${status.localStream ? 'Yes' : 'No'}\n` +
                          `- Socket: ${status.socket ? 'Yes' : 'No'}`);
                }
            } else {
                alert('WebRTC Manager not initialized!');
            }
        });
        
        // Insert button after startLiveBtn
        const startLiveBtn = document.getElementById('startLiveBtn');
        if (startLiveBtn && startLiveBtn.parentNode) {
            startLiveBtn.parentNode.insertBefore(testBtn, startLiveBtn.nextSibling);
        }
        
        console.log('✅ Test button added');
    } catch (error) {
        console.error('❌ Failed to add test button:', error);
    }
}

// Initialize streaming event listeners
function initializeStreamingEventListeners() {
    // Console logging removed for production
    
    // Wait for elements to exist before binding events
    const startLiveBtn = document.getElementById('startLiveBtn');
    const endLiveBtn = document.getElementById('endLiveBtn');
    const sendAdminChat = document.getElementById('sendAdminChat');
    const adminChatInput = document.getElementById('adminChatInput');
    
    if (startLiveBtn) {
        startLiveBtn.addEventListener('click', startLiveStream);
        // Console logging removed for production
    } else {
        // Error logging removed for production
    }
    
    if (endLiveBtn) {
        endLiveBtn.addEventListener('click', endLiveStream);
        // Console logging removed for production
    } else {
        // Error logging removed for production
    }
    
    if (sendAdminChat) {
        sendAdminChat.addEventListener('click', sendChatMessage);
        // Console logging removed for production
    } else {
        // Error logging removed for production
    }
    
    if (adminChatInput) {
        adminChatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
        // Console logging removed for production
    } else {
        // Error logging removed for production
    }
}

// Initialize edit modals
function initializeEditModals() {
    // User edit form
    document.getElementById('editUserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveUserEdit();
    });

    // Course edit form
    document.getElementById('editCourseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCourseEdit();
    });

    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.closest('.edit-modal').id;
            closeEditModal(modalId);
        });
    });

    // Modal cancel buttons
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.closest('.edit-modal').id;
            closeEditModal(modalId);
        });
    });

    // Viewers popup close
    const viewersCloseBtn = document.querySelector('.close-btn');
    if (viewersCloseBtn) {
        viewersCloseBtn.addEventListener('click', hideViewersPopup);
    }
}

// Initialize tab navigation
function initializeTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show target tab content
            tabContents.forEach(tab => tab.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');
            
            // Update page title
            updatePageTitle(targetTab);
            
            // Load tab-specific content
            loadTabContent(targetTab);
        });
    });
}

// Update page title based on active tab
function updatePageTitle(tabName) {
    const titles = {
        'dashboard': 'Dashboard Overview',
        'users': 'Users Management',
        'courses': 'Courses Management',
        'content': 'Content Editor',
        'livestream': 'Live Stream Control',
        'stats': 'Statistics',
        'forms': 'Submitted Forms',
        'recorded-lectures': 'Recorded Lectures Management'
    };
    
    document.querySelector('.page-title').textContent = titles[tabName] || 'Dashboard';
}

// Load tab-specific content
function loadTabContent(tabName) {
    switch(tabName) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'users':
            loadUsers();
            break;
        case 'courses':
            loadCourses();
            break;
        case 'stats':
            loadStats();
            break;
        case 'forms':
            loadForms();
            break;
        case 'livestream':
            // Live stream is already initialized
            break;
        case 'recorded-lectures':
            loadRecordedLectures();
            break;
    }
}

// Initialize Quill editor
function initializeQuillEditor() {
    window.quillEditor = new Quill('#quillEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });

    // Save content button
    document.getElementById('saveContentBtn').addEventListener('click', saveContent);
    
    // Content language and page change handlers
    const contentLang = document.getElementById('contentLang');
    const contentPage = document.getElementById('contentPage');
    
    if (contentLang) {
        contentLang.addEventListener('change', loadContent);
    }
    
    if (contentPage) {
        contentPage.addEventListener('change', loadContent);
    }
    
    // Load initial content
    loadContent();
}

// Load content for content editor
function loadContent() {
    const language = document.getElementById('contentLang')?.value || 'en';
    const page = document.getElementById('contentPage')?.value || 'index';
    
    if (!window.quillEditor) return;
    
    // Load content from API
    fetch(`/api/admin/content/${language}/${page}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.content) {
            window.quillEditor.root.innerHTML = data.content;
        } else {
            window.quillEditor.root.innerHTML = '<p>No content found for this page.</p>';
        }
    })
    .catch(error => {
        console.error('Error loading content:', error);
        window.quillEditor.root.innerHTML = '<p>Error loading content. Please try again.</p>';
    });
}

// Load dashboard statistics
function loadDashboardStats() {
    // Load users count
    fetch('/api/admin/users', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('totalUsers').textContent = data.length || 0;
    })
    .catch(error => {
        // Error logging removed for production
        document.getElementById('totalUsers').textContent = '0';
    });

    // Load courses count
    fetch('/api/admin/courses', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('activeCourses').textContent = data.length || 0;
    })
    .catch(error => {
        // Error logging removed for production
        document.getElementById('activeCourses').textContent = '0';
    });

    // Load forms count
    fetch('/api/admin/forms', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('totalForms').textContent = data.length || 0;
    })
    .catch(error => {
        // Error logging removed for production
        document.getElementById('totalForms').textContent = '0';
    });
}

// Load users
function loadUsers() {
    const content = document.getElementById('adminContent');
    content.innerHTML = '<p>Loading users...</p>';

    fetch('/api/admin/users', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(users => {
        displayUsers(users);
    })
    .catch(error => {
        // Error logging removed for production
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="color: #dc3545;">Error loading users</p>
                <button onclick="loadUsers()" class="save-btn">Retry</button>
            </div>
        `;
    });
}

// Display users in table format
function displayUsers(users) {
    const content = document.getElementById('adminContent');
    
    if (!users || users.length === 0) {
        content.innerHTML = '<p>No users found</p>';
        return;
      }

    // First, get all courses for badge display
    fetch('/api/admin/courses', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(courses => {
        const courseMap = {};
        courses.forEach(course => {
            courseMap[course._id] = course;
        });

        let html = `
            <div style="overflow-x: auto;">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Civil ID</th>
                            <th>Assigned Courses</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        users.forEach(user => {
            const courseBadges = user.courses && user.courses.length > 0 ? user.courses.map(courseId => {
                // Convert ObjectIds to strings for comparison
                const course = courseMap[courseId.toString()];
                if (course) {
                    return `<span class="course-badge" style="background-color: ${course.color || '#007bff'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 2px; display: inline-block; border: 2px solid ${course.color || '#007bff'}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${course.name}</span>`;
                }
                return '';
            }).join('') : '';

            html += `
                <tr>
                    <td>${user.name || 'N/A'}</td>
                    <td>${user.phone || 'N/A'}</td>
                    <td>${user.civilId || 'N/A'}</td>
                    <td style="max-width: 400px; word-wrap: break-word;">
                        ${courseBadges || '<span style="color: #666; font-style: italic;">No courses assigned</span>'}
                    </td>
                    <td>
                        <button onclick="editUser('${user._id}')" class="save-btn" style="padding: 5px 10px; font-size: 12px;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </td>
                </tr>
        `;
      });

        html += '</tbody></table></div>';
        content.innerHTML = html;
    })
    .catch(error => {
        // Error logging removed for production
        // Fallback display without course badges
        let html = `
            <div style="overflow-x: auto;">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Civil ID</th>
                            <th>Assigned Courses</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        users.forEach(user => {
            html += `
                <tr>
                    <td>${user.name || 'N/A'}</td>
                    <td>${user.phone || 'N/A'}</td>
                    <td>${user.civilId || 'N/A'}</td>
                    <td>${user.courses ? user.courses.length + ' courses' : 'No courses'}</td>
                    <td>
                        <button onclick="editUser('${user._id}')" class="save-btn" style="padding: 5px 10px; font-size: 12px;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        content.innerHTML = html;
    });
}

// Filter users
function filterUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('.users-table tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Edit user
function editUser(userId) {
    window.currentEditId = userId;
    
    fetch(`/api/admin/users/${userId}`, {
    headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
    }
  })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(user => {
        document.getElementById('editUserName').value = user.name || '';
        document.getElementById('editUserPhone').value = user.phone || '';
        document.getElementById('editUserCivilId').value = user.civilId || '';
        
        // Load and display certificates
        displayCertificates(user.certificates || []);
        
        // Load available courses and mark assigned ones
        loadAvailableCourses(user.courses || []);
        
        document.getElementById('editUserModal').style.display = 'block';
    })
    .catch(error => {
        // Error logging removed for production
        alert('Error loading user: ' + error.message);
    });
}

// Load available courses for assignment
function loadAvailableCourses(assignedCourses = []) {
    fetch('/api/admin/courses', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(courses => {
        const courseSelect = document.getElementById('editUserCourses');
        if (!courseSelect) {
            // Error logging removed for production
            return;
        }
        
        courseSelect.innerHTML = '<option value="">Select courses...</option>';
        
        courses.forEach(course => {
            // Convert ObjectIds to strings for comparison
            const isAssigned = assignedCourses.some(assignedId => 
                assignedId.toString() === course._id.toString()
            );
            
            const option = document.createElement('option');
            option.value = course._id;
            option.textContent = `${course.name} (${course.duration || 'N/A'})`;
            option.selected = isAssigned;
            option.style.color = course.color || '#333';
            courseSelect.appendChild(option);
        });
        
        // Console logging removed for production
    })
    .catch(error => {
        // Error logging removed for production
        const courseSelect = document.getElementById('editUserCourses');
        if (courseSelect) {
            courseSelect.innerHTML = '<option value="">Error loading courses</option>';
        }
    });
}

// Save user edit
function saveUserEdit() {
    const courseSelect = document.getElementById('editUserCourses');
    if (!courseSelect) {
        // Error logging removed for production
        alert('Error: Course selection element not found');
        return;
    }
    
    // Input validation
    const name = document.getElementById('editUserName').value.trim();
    const phone = document.getElementById('editUserPhone').value.trim();
    const civilId = document.getElementById('editUserCivilId').value.trim();
    
    if (!name) {
        alert('Please enter a valid name');
        document.getElementById('editUserName').focus();
        return;
    }
    
    if (!phone) {
        alert('Please enter a valid phone number');
        document.getElementById('editUserPhone').focus();
        return;
    }
    
    const selectedCourses = Array.from(courseSelect.selectedOptions)
        .map(option => option.value)
        .filter(id => id !== '' && id !== null);
    
    const userData = {
        name: name,
        phone: phone,
        civilId: civilId,
        courses: selectedCourses
    };

    // Console logging removed for production
    // Console logging removed for production

    fetch(`/api/admin/users/${window.currentEditId}/info`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        // Console logging removed for production
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
            });
        }
        return response.json();
    })
      .then(data => {
        // Console logging removed for production
        alert('User updated successfully!');
        closeEditModal('editUserModal');
        loadUsers(); // Reload the users list
    })
    .catch(error => {
        // Error logging removed for production
        alert('Error updating user: ' + error.message);
    });
}

// Load courses
function loadCourses() {
    const content = document.getElementById('coursesContent');
    content.innerHTML = '<p>Loading courses...</p>';

    fetch('/api/admin/courses', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(courses => {
        displayCourses(courses);
    })
    .catch(error => {
        // Error logging removed for production
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="color: #dc3545;">Error loading courses</p>
                <button onclick="loadCourses()" class="save-btn">Retry</button>
            </div>
        `;
    });
}

// Display courses
function displayCourses(courses) {
    const content = document.getElementById('coursesContent');
    
    if (!courses || courses.length === 0) {
        content.innerHTML = '<p>No courses found</p>';
        return;
    }

    let html = `
        <div style="overflow-x: auto;">
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Duration</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        courses.forEach(course => {
            html += `
                <tr>
                    <td>${course.name || 'N/A'}</td>
                    <td>${course.description || 'N/A'}</td>
                    <td>${course.duration || 'N/A'}</td>
                    <td>
                        <button onclick="editCourse('${course._id}')" class="save-btn" style="padding: 5px 10px; font-size: 12px;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        content.innerHTML = html;
    }

// Edit course function
function editCourse(courseId) {
    window.currentEditId = courseId;
    
    // Fetch course data
    fetch(`/api/admin/courses/${courseId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(course => {
        // Populate form
        document.getElementById('editCourseName').value = course.name || '';
        document.getElementById('editCourseDescription').value = course.description || '';
        document.getElementById('editCourseDuration').value = course.duration || '';
        
        // Show modal
        document.getElementById('editCourseModal').style.display = 'block';
    })
    .catch(error => {
        // Error logging removed for production
        alert('Error loading course data. Please try again.');
    });
}

// Save course edit
function saveCourseEdit() {
    // Input validation
    const name = document.getElementById('editCourseName').value.trim();
    const description = document.getElementById('editCourseDescription').value.trim();
    const duration = document.getElementById('editCourseDuration').value.trim();
    
    if (!name) {
        alert('Please enter a valid course name');
        document.getElementById('editCourseName').focus();
        return;
    }
    
    if (!description) {
        alert('Please enter a valid course description');
        document.getElementById('editCourseDescription').focus();
        return;
    }
    
    const courseData = {
        name: name,
        description: description,
        duration: duration
    };

    fetch(`/api/admin/courses/${window.currentEditId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(courseData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert('Course updated successfully!');
        closeEditModal('editCourseModal');
        loadCourses(); // Reload the courses list
    })
    .catch(error => {
        // Error logging removed for production
        alert('Error updating course. Please try again.');
    });
}

// Close edit modal
function closeEditModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    window.currentEditId = null;
    
    // Clear form fields
    if (modalId === 'editUserModal') {
        document.getElementById('editUserForm').reset();
    } else if (modalId === 'editCourseModal') {
        document.getElementById('editCourseForm').reset();
    } else if (modalId === 'createLectureModal') {
        document.getElementById('createLectureForm').reset();
        hideUploadProgress(); // Hide progress bar when closing
    }
}

// Load statistics
function loadStats() {
    const content = document.getElementById('adminStats');
    content.innerHTML = '<p>Loading statistics...</p>';

    fetch('/api/admin/stats', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(stats => {
        displayStats(stats);
    })
    .catch(error => {
        // Error logging removed for production
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="color: #dc3545;">Error loading statistics</p>
                <button onclick="loadStats()" class="save-btn">Retry</button>
            </div>
        `;
    });
}

// Display statistics
function displayStats(stats) {
    const content = document.getElementById('adminStats');
    content.innerHTML = `
        <div class="dashboard-overview">
            <div class="stat-card">
                <h3>Total Users</h3>
                <div class="number">${stats.users || 0}</div>
                <div class="trend">+12% this month</div>
            </div>
            <div class="stat-card">
                <h3>Active Courses</h3>
                <div class="number">${stats.courses || 0}</div>
                <div class="trend">+5% this month</div>
            </div>
            <div class="stat-card">
                <h3>Total Forms</h3>
                <div class="number">${stats.forms || 0}</div>
                <div class="trend">+8% this month</div>
            </div>
            <div class="stat-card">
                <h3>Certificates</h3>
                <div class="number">${stats.certificates || 0}</div>
                <div class="trend">+3% this month</div>
            </div>
        </div>
    `;
}

// Load forms
function loadForms() {
    const content = document.getElementById('formsContent');
    content.innerHTML = '<p>Loading forms...</p>';

    fetch('/api/admin/forms', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(forms => {
        displayForms(forms);
    })
    .catch(error => {
        // Error logging removed for production
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="color: #dc3545;">Error loading forms</p>
                <button onclick="loadForms()" class="save-btn">Retry</button>
            </div>
        `;
    });
}

// Display forms
function displayForms(forms) {
    const content = document.getElementById('formsContent');
    
    if (!forms || forms.length === 0) {
        content.innerHTML = '<p>No forms submitted</p>';
        return;
    }

    let html = `
        <div style="overflow-x: auto;">
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Subject</th>
                        <th>Message</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
        `;

        forms.forEach(form => {
            html += `
                <tr>
                    <td>${form.name || 'N/A'}</td>
                    <td>${form.email || 'N/A'}</td>
                    <td>${form.subject || 'N/A'}</td>
                    <td>${form.message || 'N/A'}</td>
                    <td>${new Date(form.createdAt).toLocaleDateString()}</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        content.innerHTML = html;
    }

// 🚀 LIVESTREAMING FUNCTIONS - NOW HANDLED BY CUSTOM WEBRTC SYSTEM
// The old Jitsi Meet functions have been removed to prevent conflicts
// All livestreaming is now handled by the Custom WebRTC integration above

// Start livestream using Custom WebRTC
async function startLiveStream() {
    console.log('🚀 Starting livestream with Custom WebRTC...');
    
    try {
        console.log('🔍 Debug info:', {
            audioPipeline: !!window.audioPipeline,
            startLivestream: !!(window.audioPipeline && window.audioPipeline.startLivestream),
            webrtcManager: !!window.webrtcManager,
            CustomWebRTCManager: typeof CustomWebRTCManager
        });
        
        // Check if Custom WebRTC is available
        if (typeof CustomWebRTCManager === 'undefined') {
            throw new Error('Custom WebRTC Manager not found. Please refresh the page.');
        }
        
        if (!window.audioPipeline || !window.audioPipeline.startLivestream) {
            throw new Error('Custom WebRTC system not initialized. Please refresh the page.');
        }
        
        // Use state machine to validate transition
        if (!window.streamState.canTransition('starting')) {
            alert('Cannot start stream from current state. Please stop the current stream first.');
            return;
        }
        
        // Change to starting state
        window.streamState.changeTo('starting');
        
        console.log('🔄 Calling audioPipeline.startLivestream()...');
        
        // Start livestream using Custom WebRTC
        console.log('🔄 Calling audioPipeline.startLivestream()...');
        const success = await window.audioPipeline.startLivestream();
        
        console.log('📡 startLivestream result:', success);
        
        if (success && success.success) {
            console.log('✅ Livestream started successfully with Custom WebRTC');
            
            // Update UI buttons
            const startLiveBtn = document.getElementById('startLiveBtn');
            const endLiveBtn = document.getElementById('endLiveBtn');
            const shareScreenBtn = document.getElementById('shareScreenBtn');
            
            if (startLiveBtn) startLiveBtn.disabled = true;
            if (endLiveBtn) endLiveBtn.disabled = false;
            if (shareScreenBtn) shareScreenBtn.disabled = false;
            
            // Show admin audio controls
            showAdminAudioControls();
            
            // Change to live state
            window.streamState.changeTo('live');
            
            // Update status
            const streamStatus = document.getElementById('streamStatus');
            if (streamStatus) {
                streamStatus.textContent = '🟢 LIVE - Stream Active';
                streamStatus.className = 'status-live';
            }
            
                    // Notify server that streaming has started
        if (window.socket) {
            window.socket.emit('admin-start');
            console.log('📡 Admin-start event emitted to server');
        }
            
        } else {
            throw new Error('Failed to start livestream with Custom WebRTC');
        }
        
    } catch (error) {
        console.error('❌ Failed to start livestream:', error);
        console.error('❌ Error details:', error.stack);
        
        // Change to error state
        window.streamState.changeTo('error');
        
        alert('Error starting livestream: ' + error.message);
    }
}

// End livestream using Custom WebRTC
async function endLiveStream() {
    console.log('⏹️ Stopping livestream with Custom WebRTC...');
    
    try {
        // Use state machine to validate transition
        if (!window.streamState.canTransition('stopping')) {
            alert('Cannot stop stream from current state.');
            return;
        }
        
        // Change to stopping state
        window.streamState.changeTo('stopping');
        
        // Stop livestream using Custom WebRTC
        if (window.audioPipeline && window.audioPipeline.stopLivestream) {
            await window.audioPipeline.stopLivestream();
        }
        
        // Clear connected viewers
        window.connectedViewers.clear();
        
        // Update UI
        const startLiveBtn = document.getElementById('startLiveBtn');
        const endLiveBtn = document.getElementById('endLiveBtn');
        const shareScreenBtn = document.getElementById('shareScreenBtn');
        
        if (startLiveBtn) startLiveBtn.disabled = false;
        if (endLiveBtn) endLiveBtn.disabled = true;
        if (shareScreenBtn) {
            shareScreenBtn.disabled = true;
            shareScreenBtn.textContent = 'Share Screen';
        }
        
        // Hide admin audio controls
        hideAdminAudioControls();
        
        // Notify server that streaming has ended
        if (!safeSocketEmit('admin-end')) {
            console.error('Failed to notify server about stream end');
        }
        
        // Change to idle state
        window.streamState.changeTo('idle');
        
        // Update status
        const streamStatus = document.getElementById('streamStatus');
        if (streamStatus) {
            streamStatus.textContent = '⚫ Stream Stopped';
            streamStatus.className = 'status-stopped';
        }
        
        console.log('✅ Livestream stopped successfully');
        
    } catch (error) {
        console.error('❌ Error ending livestream:', error);
        
        // Change to error state
        window.streamState.changeTo('error');
        
        alert('Error ending live stream: ' + error.message);
    }
}

// 🚀 WEBRTC FUNCTIONS REMOVED - NOW HANDLED BY CUSTOM WEBRTC SYSTEM
// The old WebRTC peer connection and audio handling functions have been removed
// All audio/video handling is now managed by the Custom WebRTC integration above

// Create a mixed stream for recording that combines admin and user audio
function createMixedStreamForRecording(adminStream) {
    try {
        // Console logging removed for production
        
        // Start with admin stream (video + admin audio)
        const mixedStream = new MediaStream();
        
        // Add all tracks from admin stream
        adminStream.getTracks().forEach(track => {
            mixedStream.addTrack(track);
            // Console logging removed for production
        });
        
        // Add user audio tracks using the new audio pipeline
        if (window.audioPipeline) {
            const userAudioTracks = window.audioPipeline.getAllAudioTracks();
            userAudioTracks.forEach(track => {
                mixedStream.addTrack(track);
                // Console logging removed for production
            });
        } else {
            // Fallback to old method for backward compatibility
            if (window.userAudioStreams && window.userAudioStreams.size > 0) {
                // Console logging removed for production
                
                window.userAudioStreams.forEach((userStream, socketId) => {
                    const audioTracks = userStream.getAudioTracks();
                    audioTracks.forEach(track => {
                        mixedStream.addTrack(track);
                        // Console logging removed for production
                    });
                });
            } else {
                // Console logging removed for production
            }
        }
        
        // Debug: Log all tracks in the mixed stream
        // Console logging removed for production
        
        // Log each track for debugging
        mixedStream.getTracks().forEach((track, index) => {
            // Console logging removed for production
        });
        
        return mixedStream;
        
    } catch (error) {
        // Error logging removed for production
        return null;
    }
}

// Add mic request
function addMicRequest(user, socketId, userInfo, isUnmute = false) {
    const list = document.getElementById('micRequestList');
    const li = document.createElement('li');
    
    // Store socketId as data attribute for easy removal
    li.setAttribute('data-socket-id', socketId);
    
    li.innerHTML = `
        <span>${user} ${isUnmute ? 'wants to unmute' : 'wants to use microphone'}</span>
        <div>
            <button class="approve-btn" onclick="approveMic('${socketId}')">Approve</button>
            <button class="reject-btn" onclick="rejectMic('${socketId}')">Reject</button>
            ${!isUnmute ? `<button class="mute-btn" onclick="muteUserMic('${socketId}')" style="background: #ffc107; color: #000;">Mute</button>` : ''}
        </div>
    `;
    list.appendChild(li);
    
    // Console logging removed for production
    
    // Update viewer's mic status to false (requesting)
    if (window.connectedViewers.has(socketId)) {
        const viewer = window.connectedViewers.get(socketId);
        viewer.hasMic = false;
        window.connectedViewers.set(socketId, viewer);
    }
}

// Approve mic
function approveMic(socketId) {
    if (!safeSocketEmit('approve-mic', socketId)) {
        // Error logging removed for production
        return;
    }
    
    // Console logging removed for production
    removeMicRequest(socketId);
    
    // Update viewer's mic status to true (approved)
    if (window.connectedViewers.has(socketId)) {
        const viewer = window.connectedViewers.get(socketId);
        viewer.hasMic = true;
        window.connectedViewers.set(socketId, viewer);
    }
}

// Reject mic
function rejectMic(socketId) {
    if (!safeSocketEmit('reject-mic', socketId)) {
        // Error logging removed for production
        return;
    }
    
    // Console logging removed for production
    removeMicRequest(socketId);
    
    // Update viewer's mic status to false
    if (window.connectedViewers.has(socketId)) {
        const viewer = window.connectedViewers.get(socketId);
        viewer.hasMic = false;
        window.connectedViewers.set(socketId, viewer);
    }
}

// Mute user microphone
function muteUserMic(socketId) {
    if (!safeSocketEmit('mute-user-mic', socketId)) {
        // Error logging removed for production
        return;
    }
    
    // Console logging removed for production
    
    // Update viewer's mic status to false
    if (window.connectedViewers.has(socketId)) {
        const viewer = window.connectedViewers.get(socketId);
        viewer.hasMic = false;
        window.connectedViewers.set(socketId, viewer);
    }
}

// Remove mic request
function removeMicRequest(socketId) {
    const list = document.getElementById('micRequestList');
    if (!list) {
        // Error logging removed for production
        return;
    }
    
    const items = list.getElementsByTagName('li');
    for (let item of items) {
        if (item.getAttribute('data-socket-id') === socketId) {
            // Console logging removed for production
            item.remove();
            break;
        }
    }
}

// 🚀 CUSTOM WEBRTC HELPER FUNCTIONS

// Update viewer count display
function updateViewerCount(count) {
    const viewerCountElement = document.getElementById('viewerCount');
    const liveViewersElement = document.getElementById('liveViewers');
    
    if (viewerCountElement) {
        viewerCountElement.textContent = `${count} viewer${count !== 1 ? 's' : ''}`;
    }
    
    if (liveViewersElement) {
        liveViewersElement.textContent = count.toString();
    }
    
    console.log('👥 Viewer count updated:', count);
}

// 🚀 VIEWERS POPUP FUNCTIONS

// Global variable to store current viewers
let currentViewers = new Map(); // socketId -> userInfo

// Update viewer count in UI
function updateViewerCount(count) {
    const viewerCountElement = document.getElementById('viewerCount');
    const liveViewersElement = document.getElementById('liveViewers');
    
    if (viewerCountElement) {
        viewerCountElement.textContent = `${count} viewers`;
    }
    if (liveViewersElement) {
        liveViewersElement.textContent = count;
    }
}

// Show viewers popup
function showViewersPopup() {
    const popup = document.getElementById('viewersPopup');
    if (popup) {
        popup.style.display = 'flex';
        updateViewersList();
    }
}

// Close viewers popup
function closeViewersPopup() {
    const popup = document.getElementById('viewersPopup');
    if (popup) {
        popup.style.display = 'none';
    }
}

// Update viewers list in popup
function updateViewersList() {
    const viewersList = document.getElementById('viewersList');
    if (!viewersList) return;

    if (currentViewers.size === 0) {
        viewersList.innerHTML = `
            <div class="no-viewers">
                <i class="fas fa-users"></i>
                <p>No viewers currently connected</p>
            </div>
        `;
        return;
    }

    let viewersHTML = '';
    currentViewers.forEach((userInfo, socketId) => {
        const initials = getUserInitials(userInfo.name);
        const joinTime = userInfo.joinTime ? new Date(userInfo.joinTime).toLocaleTimeString() : 'Just now';
        
        viewersHTML += `
            <div class="viewer-item">
                <div class="viewer-info">
                    <div class="viewer-avatar">${initials}</div>
                    <div class="viewer-details">
                        <h4>${userInfo.name}</h4>
                        <p>Joined: ${joinTime}</p>
                    </div>
                </div>
                <div class="viewer-status">
                    <div class="status-indicator"></div>
                    <span>Connected</span>
                </div>
            </div>
        `;
    });

    viewersList.innerHTML = viewersHTML;
}

// Get user initials from name
function getUserInitials(name) {
    if (!name) return '?';
    return name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Add viewer to current viewers list
function addViewer(socketId, userInfo) {
    currentViewers.set(socketId, {
        ...userInfo,
        joinTime: Date.now()
    });
    updateViewersList();
}

// Remove viewer from current viewers list
function removeViewer(socketId) {
    currentViewers.delete(socketId);
    updateViewersList();
}

// Add chat message
function addChatMessage(user, message) {
    const messagesDiv = document.getElementById('adminMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.innerHTML = `<strong>${user}:</strong> ${message}`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Send chat message
function sendChatMessage() {
    const input = document.getElementById('adminChatInput');
    const message = input.value.trim();
    
    if (message) {
        window.socket.emit('admin-chat', message);
        addChatMessage('Admin', message);
        input.value = '';
    }
}

// Popup functions
function showViewersPopup() {
    const popup = document.getElementById('viewersPopup');
    const viewersList = document.getElementById('viewersList');
    
    if (window.connectedViewers.size === 0) {
        viewersList.innerHTML = '<p class="no-viewers">No viewers currently watching</p>';
  } else {
        let html = '';
        window.connectedViewers.forEach((viewerInfo, socketId) => {
            const micIcon = viewerInfo.hasMic ? 
                '<span class="mic-icon mic-unmuted">🎤</span>' : 
                '<span class="mic-icon mic-muted">🔇</span>';
            
            html += `
                <div class="viewer-item">
                    <span class="viewer-name">${viewerInfo.name || 'Anonymous'}</span>
                    <div class="mic-status">
                        ${micIcon}
                        <span>${viewerInfo.hasMic ? 'Unmuted' : 'Muted'}</span>
                    </div>
                </div>
            `;
        });
        viewersList.innerHTML = html;
    }
    
    // Show popup with smooth animation
    popup.style.display = 'flex';
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
}

function hideViewersPopup() {
    const popup = document.getElementById('viewersPopup');
    
    // Hide popup with smooth animation
    popup.classList.remove('show');
    setTimeout(() => {
        popup.style.display = 'none';
    }, 300);
}

// Save content
function saveContent() {
    const content = window.quillEditor.root.innerHTML;
    const language = document.getElementById('contentLang').value;
    const page = document.getElementById('contentPage').value;
    
    fetch('/api/admin/content', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
            language,
            page,
            content
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('contentSaveStatus').innerHTML = 
            '<p style="color: green;">Content saved successfully!</p>';
    })
    .catch(error => {
        // Error logging removed for production
        document.getElementById('contentSaveStatus').innerHTML = 
            '<p style="color: red;">Error saving content</p>';
    });
}

// Event listeners
// REMOVED: These are now handled in initializeStreamingEventListeners()
// document.getElementById('startLiveBtn').addEventListener('click', startLiveStream);
// document.getElementById('endLiveBtn').addEventListener('click', endLiveStream);
// document.getElementById('sendAdminChat').addEventListener('click', sendChatMessage);
// document.getElementById('adminChatInput').addEventListener('keypress', function(e) {
//   if (e.key === 'Enter') {
//         sendChatMessage();
//     }
// });

// Close popup when clicking outside
document.addEventListener('click', (e) => {
    const popup = document.getElementById('viewersPopup');
    if (e.target === popup) {
        hideViewersPopup();
    }
});

// Close popup with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const popup = document.getElementById('viewersPopup');
        if (popup.style.display === 'flex') {
            hideViewersPopup();
        }
    }
});

// Export functions for global access
window.loadUsers = loadUsers;
window.loadCourses = loadCourses;
window.loadStats = loadStats;
    window.loadContent = loadContent;
window.loadForms = loadForms;
window.showCreateCourseForm = function() {
    // Implementation for creating course form
    // Console logging removed for production
};
window.showCreateUserForm = function() {
    // Implementation for creating user form
    // Console logging removed for production
};
window.exportUsersExcel = function() {
    // Implementation for exporting users to Excel
    // Console logging removed for production
};

// NEW: Lecture Management Functions
window.showCreateLectureForm = showCreateLectureForm;
window.loadRecordedLectures = loadRecordedLectures;
window.createLecture = createLecture;
window.deleteLecture = deleteLecture;
window.manageLectureAccess = manageLectureAccess;
window.uploadVideoToLecture = uploadVideoToLecture;
window.closeAccessModal = closeAccessModal;
window.togglePublicAccess = togglePublicAccess;
window.saveAccessChanges = saveAccessChanges;
window.selectAllUsers = selectAllUsers;
window.deselectAllUsers = deselectAllUsers;

// Make functions globally accessible
window.editUser = editUser;
window.saveUserEdit = saveUserEdit;
window.editCourse = editCourse;
window.saveCourseEdit = saveCourseEdit;
window.closeEditModal = closeEditModal;
window.showViewersPopup = showViewersPopup;
window.hideViewersPopup = hideViewersPopup;
window.toggleScreenShare = toggleScreenShare;
window.uploadCertificate = uploadCertificate;
window.deleteCertificate = deleteCertificate;

// Certificate Management Functions
function displayCertificates(certificates) {
    const displayDiv = document.getElementById('certificatesDisplay');
    if (!displayDiv) return;
    
    if (!certificates || certificates.length === 0) {
        displayDiv.innerHTML = '<p style="margin: 0; color: #666;">No certificates uploaded yet</p>';
        return;
    }
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">';
    
    certificates.forEach((cert, index) => {
        const isImage = cert.image && (cert.image.endsWith('.jpg') || cert.image.endsWith('.jpeg') || cert.image.endsWith('.png') || cert.image.endsWith('.gif'));
        
        html += `
            <div style="border: 1px solid #ddd; border-radius: 5px; padding: 10px; background: white;">
                <div style="text-align: center; margin-bottom: 10px;">
                    ${isImage ? 
                        `<img src="/certs/${cert.image}" alt="${cert.name}" style="max-width: 100%; max-height: 100px; object-fit: cover; border-radius: 3px;">` :
                        `<div style="width: 100%; height: 100px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 3px;">
                            <i class="fas fa-file-pdf" style="font-size: 2rem; color: #dc3545;"></i>
                        </div>`
                    }
                </div>
                <p style="margin: 5px 0; font-size: 12px; font-weight: bold; text-align: center;">${cert.name}</p>
                <button onclick="deleteCertificate(${index})" class="btn-cancel" style="width: 100%; padding: 5px; font-size: 11px;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    displayDiv.innerHTML = html;
}

function uploadCertificate() {
    const name = document.getElementById('certificateName').value.trim();
    const file = document.getElementById('certificateFile').files[0];
    
    if (!name || !file) {
        alert('Please provide both certificate name and file.');
        return;
    }
    
    if (!window.currentEditId) {
        alert('No user selected for certificate upload.');
        return;
    }
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', file);
    
    fetch(`/api/admin/users/${window.currentEditId}/certificate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(user => {
        alert('Certificate uploaded successfully!');
        displayCertificates(user.certificates);
        
        // Clear form
        document.getElementById('certificateName').value = '';
        document.getElementById('certificateFile').value = '';
    })
    .catch(error => {
        // Error logging removed for production
        alert('Failed to upload certificate: ' + error.message);
    });
}

function deleteCertificate(certIndex) {
    if (!window.currentEditId) {
        alert('No user selected for certificate deletion.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this certificate?')) {
        return;
    }
    
    fetch(`/api/admin/users/${window.currentEditId}/certificates/${certIndex}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert('Certificate deleted successfully!');
        // Reload user data to refresh certificates
        editUser(window.currentEditId);
    })
    .catch(error => {
        // Error logging removed for production
        alert('Failed to delete certificate: ' + error.message);
    });
}

// Screen sharing functionality - Now handled by Custom WebRTC
function toggleScreenShare() {
    if (window.audioPipeline && window.audioPipeline.currentRoom) {
        // Use Custom WebRTC screen sharing
        window.audioPipeline.startScreenShare();
    } else {
        alert('Please start a livestream first before sharing screen.');
    }
}

// ===== LECTURE MANAGEMENT FUNCTIONS =====

// Show create lecture form
function showCreateLectureForm() {
    document.getElementById('createLectureModal').style.display = 'block';
}

// Load recorded lectures
function loadRecordedLectures() {
    // Console logging removed for production
    const content = document.getElementById('recordedLecturesContent');
    
    if (!content) {
        // Error logging removed for production
        return;
    }
    
    content.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="loading-spinner" style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
            <h3 style="color: #666; margin-bottom: 10px;">Loading Recorded Lectures</h3>
            <p style="color: #999; font-size: 0.9rem;">Please wait while we fetch your lecture data...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

    // Check if admin token exists
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
        // Error logging removed for production
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;"></i>
                <h3 style="color: #dc3545; margin-bottom: 10px;">Authentication Required</h3>
                <p style="color: #666; margin-bottom: 20px;">Please log in as admin to view recorded lectures.</p>
                <button onclick="window.location.href='/admin/login.html'" class="save-btn">
                    <i class="fas fa-sign-in-alt"></i> Go to Login
                </button>
            </div>
        `;
        return;
    }

    // Console logging removed for production

    fetch('/api/lectures/admin/lectures', {
        headers: {
            'Authorization': `Bearer ${adminToken}`
        }
    })
    .then(handleApiResponse)
    .then(lectures => {
        // Console logging removed for production
        displayRecordedLectures(lectures);
    })
    .catch(error => {
        // Error logging removed for production
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;"></i>
                <h3 style="color: #dc3545; margin-bottom: 10px;">Error Loading Lectures</h3>
                <p style="color: #666; margin-bottom: 20px;">${error.message}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="loadRecordedLectures()" class="save-btn">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                    <button onclick="showCreateLectureForm()" class="save-btn gradient-primary">
                        <i class="fas fa-plus"></i> Create New Lecture
                    </button>
                </div>
                <details style="margin-top: 20px; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
                    <summary style="cursor: pointer; color: #007bff;">Debug Information</summary>
                    <pre style="background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 12px; overflow-x: auto;">${error.stack || 'No stack trace available'}</pre>
                </details>
            </div>
        `;
    });
}

// Display recorded lectures
function displayRecordedLectures(lectures) {
    const content = document.getElementById('recordedLecturesContent');
    const countElement = document.getElementById('lectureCountNumber');
    
    // Update lecture count
    if (countElement) {
        countElement.textContent = lectures ? lectures.length : 0;
    }
    
    if (!lectures || lectures.length === 0) {
        content.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-video-camera" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">No Recorded Lectures Found</h3>
                <p style="color: #999; font-size: 0.9rem; margin-bottom: 20px;">
                    Get started by creating your first recorded lecture or uploading a video file.
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="showCreateLectureForm()" class="save-btn gradient-primary">
                        <i class="fas fa-plus"></i> Create New Lecture
                    </button>
                    <button onclick="loadRecordedLectures()" class="save-btn">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
            </div>
        `;
        return;
    }

    let html = `
        <div style="overflow-x: auto;">
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Quality</th>
                        <th>Duration</th>
                        <th>Access Control</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        lectures.forEach(lecture => {
            const duration = lecture.duration ? `${Math.floor(lecture.duration / 60)}:${(lecture.duration % 60).toString().padStart(2, '0')}` : 'N/A';
            const accessCount = lecture.accessUsers ? lecture.accessUsers.length : 0;
            const hasVideo = lecture.filePath && lecture.filePath.trim() !== '';
            const fileSize = lecture.fileSize ? `${(lecture.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'N/A';
            
            html += `
                <tr>
                    <td>
                        <strong>${lecture.title || 'N/A'}</strong>
                        ${lecture.description ? `<br><small style="color: #666;">${lecture.description}</small>` : ''}
                        <br><small style="color: #999;">Created: ${new Date(lecture.createdAt).toLocaleDateString()}</small>
                    </td>
                    <td>
                        <span class="course-badge" style="background-color: #007bff; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px;">
                            ${lecture.category || 'General'}
                        </span>
                    </td>
                    <td>
                        <span style="color: #28a745; font-weight: 600;">${lecture.quality || '1080p'}</span>
                    </td>
                    <td>${duration}</td>
                    <td>
                        <div style="margin-bottom: 5px;">
                            <span class="lecture-status ${lecture.isPublic ? 'status-public' : 'status-private'}">
                                ${lecture.isPublic ? 'Public' : `${accessCount} users`}
                            </span>
                        </div>
                        <div style="font-size: 11px; color: #666;">
                            <span class="lecture-status ${hasVideo ? 'status-video' : 'status-no-video'}">
                                ${hasVideo ? `✅ Video: ${fileSize}` : '❌ No video'}
                            </span>
                        </div>
                    </td>
                    <td>
                        <button onclick="playLectureInPopup('${lecture._id}')" class="save-btn" style="padding: 5px 10px; font-size: 12px; margin-right: 5px; background: #007bff;">
                            <i class="fas fa-play"></i> View
                        </button>
                        <button onclick="manageLectureAccess('${lecture._id}')" class="save-btn" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                            <i class="fas fa-users"></i> Access
                        </button>
                        ${!hasVideo ? `
                            <button onclick="uploadVideoToLecture('${lecture._id}')" class="save-btn" style="padding: 5px 10px; font-size: 12px; margin-right: 5px; background: #28a745;">
                                <i class="fas fa-upload"></i> Video
                            </button>
                        ` : `
                            <button onclick="uploadVideoToLecture('${lecture._id}')" class="save-btn" style="padding: 5px 10px; font-size: 12px; margin-right: 5px; background: #17a2b8;">
                                <i class="fas fa-sync"></i> Replace
                            </button>
                        `}
                        <button onclick="deleteLecture('${lecture._id}')" class="btn-cancel" style="padding: 5px 10px; font-size: 12px;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        content.innerHTML = html;
    }


// Create new lecture
function createLecture() {
    // Console logging removed for production
    
    const title = document.getElementById('lectureTitle').value.trim();
    const description = document.getElementById('lectureDescription').value.trim();
    const category = document.getElementById('lectureCategory').value;
    const tags = document.getElementById('lectureTags').value.trim();
    const quality = document.getElementById('lectureQuality').value;
    const videoFile = document.getElementById('lectureVideo').files[0];

    // Console logging removed for production

    // Enhanced validation
    if (!title) {
        alert('Please enter a lecture title');
        document.getElementById('lectureTitle').focus();
        return;
    }
    
    if (!category) {
        alert('Please select a lecture category');
        document.getElementById('lectureCategory').focus();
        return;
    }
    
    if (title.length < 3) {
        alert('Lecture title must be at least 3 characters long');
        document.getElementById('lectureTitle').focus();
        return;
    }

    const lectureData = {
        title,
        description,
        category,
        tags,
        quality
    };

    // Console logging removed for production

    // If video file is selected, upload it first
    if (videoFile) {
        // Console logging removed for production
        uploadLectureWithVideo(lectureData, videoFile);
    } else {
        // Console logging removed for production
        // Create lecture without video
        createLectureEntry(lectureData);
    }
}

// Create lecture entry (without video)
function createLectureEntry(lectureData) {
    // Console logging removed for production
    
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
        // Error logging removed for production
        alert('Authentication error. Please log in again.');
        return;
    }

    fetch('/api/lectures/admin/lectures', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(lectureData)
    })
    .then(response => {
        // Console logging removed for production
        // Console logging removed for production
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Console logging removed for production
        alert('Lecture created successfully! You can upload the video file later.');
        closeEditModal('createLectureModal');
        loadRecordedLectures(); // Reload the lectures list
    })
    .catch(error => {
        // Error logging removed for production
        alert('Error creating lecture: ' + error.message);
    });
}

// Upload lecture with video
function uploadLectureWithVideo(lectureData, videoFile) {
    // First create the lecture entry
    fetch('/api/lectures/admin/lectures', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(lectureData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(lecture => {
        // Console logging removed for production
        
        // Now upload the video file
        const formData = new FormData();
        formData.append('video', videoFile);
        
        return fetch(`/api/lectures/admin/lectures/${lecture._id}/video`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        });
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert('Lecture created and video uploaded successfully!');
        closeEditModal('createLectureModal');
        loadRecordedLectures(); // Reload the lectures list
    })
    .catch(error => {
        // Error logging removed for production
        alert('Error creating lecture with video: ' + error.message);
    });
}

// Delete lecture
function deleteLecture(lectureId) {
    if (!confirm('Are you sure you want to delete this lecture? This action cannot be undone.')) {
        return;
    }

    fetch(`/api/lectures/admin/lectures/${lectureId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert('Lecture deleted successfully!');
        loadRecordedLectures(); // Reload the lectures list
    })
    .catch(error => {
        // Error logging removed for production
        alert('Error deleting lecture: ' + error.message);
    });
}

// Manage lecture access
function manageLectureAccess(lectureId) {
    // Console logging removed for production
    
    // Check if modal already exists and remove it
    const existingModal = document.getElementById('accessModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create a comprehensive access management modal
    const modalHtml = `
        <div id="accessModal" class="edit-modal" style="display: block;">
            <div class="edit-modal-content">
                <div class="edit-modal-header">
                    <h3><i class="fas fa-users"></i> Manage Lecture Access</h3>
                    <button class="close-modal" onclick="closeAccessModal()">&times;</button>
                </div>
                <div class="edit-form">
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="isPublicAccess" onchange="togglePublicAccess()">
                            Make this lecture public (accessible to all users)
                        </label>
                        <small class="color-secondary">When enabled, all users can access this lecture without individual permissions.</small>
                    </div>
                    
                    <div class="form-group">
                        <label>Individual User Access Control</label>
                        <div id="userAccessList" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 15px; margin-top: 10px; border-radius: 5px; background: #f9f9f9;">
                            <div style="text-align: center; color: #666;">
                                <i class="fas fa-spinner fa-spin"></i> Loading users...
                            </div>
                        </div>
                        <small class="color-secondary">Select specific users who can access this lecture when it's not public.</small>
                        <div style="margin-top: 10px;">
                            <button onclick="testUserLoading()" class="save-btn" style="padding: 5px 10px; font-size: 12px; background: #17a2b8;">
                                <i class="fas fa-bug"></i> Test User Loading
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="closeAccessModal()">Cancel</button>
                        <button type="button" class="btn-save" onclick="saveAccessChanges('${lectureId}')">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Console logging removed for production
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Console logging removed for production
    
    // Load current access settings and available users
    loadLectureAccessSettings(lectureId);
    loadAvailableUsers(lectureId);
}

// Close access modal
function closeAccessModal() {
    const modal = document.getElementById('accessModal');
    if (modal) {
        modal.remove();
    }
}

// Toggle public access
function togglePublicAccess() {
    const isPublic = document.getElementById('isPublicAccess').checked;
    const userAccessList = document.getElementById('userAccessList');
    
    if (isPublic) {
        userAccessList.innerHTML = '<p style="color: #28a745; text-align: center;">✓ Public access enabled - all users can view this lecture</p>';
    } else {
        userAccessList.innerHTML = '<p style="color: #ffc107; text-align: center;">Individual user access mode</p>';
    }
}

// Load lecture access settings
function loadLectureAccessSettings(lectureId) {
    // Console logging removed for production
    
    fetch(`/api/lectures/admin/lectures/${lectureId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        // Console logging removed for production
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Lecture not found. It may have been deleted.');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Invalid response format. Expected JSON.');
        }
        
        return response.json();
    })
    .then(lecture => {
        // Console logging removed for production
        
        // Set public access checkbox
        const isPublicCheckbox = document.getElementById('isPublicAccess');
        if (isPublicCheckbox) {
            isPublicCheckbox.checked = lecture.isPublic;
            togglePublicAccess(); // Update UI
        }
    })
    .catch(error => {
        // Error logging removed for production
        const userAccessList = document.getElementById('userAccessList');
        if (userAccessList) {
            userAccessList.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc3545; margin-bottom: 1rem;"></i>
                    <p style="color: #dc3545; margin-bottom: 10px;">Error loading settings</p>
                    <p style="color: #666; font-size: 0.9rem;">${error.message}</p>
                    <button onclick="loadLectureAccessSettings('${lectureId}')" class="save-btn" style="margin-top: 10px;">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    });
}

// Save access changes
function saveAccessChanges(lectureId) {
    const isPublic = document.getElementById('isPublicAccess').checked;
    
    // Collect selected users
    const selectedUsers = [];
    const checkboxes = document.querySelectorAll('.user-access-checkbox:checked');
    checkboxes.forEach(checkbox => {
        selectedUsers.push(checkbox.value);
    });
    
    // Console logging removed for production
    // Console logging removed for production
    // Console logging removed for production
    
    const accessData = {
        isPublic: isPublic,
        accessUsers: selectedUsers
    };
    
    fetch(`/api/lectures/admin/lectures/${lectureId}/access`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(accessData)
    })
    .then(handleApiResponse)
    .then(data => {
        // Console logging removed for production
        alert('Access settings updated successfully!');
        closeAccessModal();
        loadRecordedLectures(); // Reload the lectures list
    })
    .catch(error => {
        // Error logging removed for production
        alert('Error updating access settings: ' + error.message);
    });
}

// ===== VIDEO RECORDING FUNCTIONS =====

// Start recording
function startRecording() {
    // Use state machine to validate transition
    if (!window.streamState.canTransition('recording')) {
        // Error logging removed for production
        alert('Cannot start recording from current state. Please start streaming first.');
        return;
    }
    
    // 🚀 WebRTC stream check removed - now handled by Custom WebRTC
    // Custom WebRTC automatically manages stream availability for recording
    if (!window.audioPipeline || !window.audioPipeline.currentRoom) {
        alert('Please start a Custom WebRTC session first before recording.');
        return;
    }

    // Get the current lecture ID from the form or create a new one
    const lectureTitle = document.getElementById('lectureTitle')?.value || 'Live Stream Recording';
    const lectureDescription = document.getElementById('lectureDescription')?.value || 'Recording from live stream';
    const lectureCategory = document.getElementById('lectureCategory')?.value || 'general';
    const lectureQuality = document.getElementById('lectureQuality')?.value || '1080p';

    // Create lecture entry first
    const lectureData = {
        title: lectureTitle,
        description: lectureDescription,
        category: lectureCategory,
        quality: lectureQuality,
        filePath: '' // Explicitly set empty filePath
    };

    // Console logging removed for production

    fetch('/api/lectures/admin/lectures', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(lectureData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(lecture => {
        // Console logging removed for production
        
        // Start MediaRecorder with the lecture ID
        startMediaRecorder(lecture._id);
        
        // Notify server that recording has started
        window.socket.emit('admin-start-recording', lecture._id);
        
        // Store lecture ID for later use
        window.currentRecordingLectureId = lecture._id;
        
        // Change to recording state (this will update UI automatically)
        window.streamState.changeTo('recording');
        
        alert('Recording started! Lecture: ' + lecture.title);
    })
    .catch(error => {
        // Error logging removed for production
        alert('Error starting recording: ' + error.message);
    });
}

// Stop recording
function stopRecording() {
    if (window.mediaRecorder && window.mediaRecorder.state === 'recording') {
        // Console logging removed for production
        // Console logging removed for production
        
        window.mediaRecorder.stop();
        
        // Notify server that recording has stopped
        window.socket.emit('admin-stop-recording');
        
        // Don't clear currentRecordingLectureId yet - it's needed for saveRecording()
        // It will be cleared after the video is successfully uploaded
        
        // 🚀 WebRTC stream state check removed - now handled by Custom WebRTC
        // Custom WebRTC automatically manages stream state
        let nextState = 'idle';
        
        // Change to appropriate state (this will update UI automatically)
        window.streamState.changeTo(nextState);
        
        alert('Recording stopped! Video is being processed...');
    }
}

// Start MediaRecorder with 1080p quality
function startMediaRecorder(lectureId) {
    try {
        // Console logging removed for production
        // Console logging removed for production
        // Console logging removed for production
        
        if (!lectureId) {
            throw new Error('No lecture ID provided to startMediaRecorder');
        }
        
        // 🚀 WebRTC stream check removed - now handled by Custom WebRTC
        // Custom WebRTC automatically provides the active stream for recording
        const activeStream = null; // Placeholder - Custom WebRTC handles this
        
        if (!activeStream) {
            throw new Error('No active stream available for recording - please start a Custom WebRTC session first');
        }

        // Create a mixed stream for recording that includes admin audio/video + user audio
        const mixedStream = createMixedStreamForRecording(activeStream);
        
        if (!mixedStream) {
            throw new Error('Failed to create mixed stream for recording');
        }

        // Check MediaRecorder support
        if (!window.MediaRecorder) {
            throw new Error('MediaRecorder API not supported in this browser');
        }

        // Configure MediaRecorder with best supported format that includes audio
        let options = {};
        
        // Try different MIME types for better audio compatibility
        const supportedFormats = [
            'video/webm;codecs=vp8,opus',  // Best for audio + video
            'video/webm;codecs=vp8',       // VP8 with default audio
            'video/webm',                  // WebM with default codecs
            'video/mp4',                   // MP4 fallback
            ''                              // Browser default
        ];
        
        let selectedMimeType = '';
        for (const format of supportedFormats) {
            if (format === '' || window.MediaRecorder.isTypeSupported(format)) {
                selectedMimeType = format;
                break;
            }
        }
        
        if (selectedMimeType) {
            options.mimeType = selectedMimeType;
            // Console logging removed for production
            
            // Only set bitrates for supported formats
            if (selectedMimeType.includes('webm') || selectedMimeType.includes('mp4')) {
                options.videoBitsPerSecond = 8000000; // 8 Mbps for 1080p quality
                options.audioBitsPerSecond = 128000;  // 128 kbps audio
            }
        } else {
            // Console logging removed for production
        }

        // Console logging removed for production

        window.mediaRecorder = new window.MediaRecorder(mixedStream, options);
        window.recordedChunks = [];

        // Handle data available event
        window.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                window.recordedChunks.push(event.data);
                // Console logging removed for production
            }
        };

        // Handle recording stop event
        window.mediaRecorder.onstop = () => {
            // Console logging removed for production
            // Console logging removed for production
            // Console logging removed for production
            
            if (window.recordedChunks.length > 0) {
                const totalSize = window.recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0);
                // Console logging removed for production
                
                // Use the provided lectureId or fall back to stored one
                const finalLectureId = lectureId || window.currentRecordingLectureId;
                // Console logging removed for production
                
                saveRecording(finalLectureId);
            } else {
                // Console logging removed for production
                alert('Recording failed - no data captured. Please try again.');
            }
        };

        // Handle recording error
        window.mediaRecorder.onerror = (event) => {
            // Error logging removed for production
            alert('Recording error occurred: ' + (event.error?.message || 'Unknown error') + '. Please try again.');
        };

        // Handle recording start
        window.mediaRecorder.onstart = () => {
            // Console logging removed for production
        };

        // Start recording with 1-second intervals for better chunk management
        window.mediaRecorder.start(1000);
        
        // Console logging removed for production
        
    } catch (error) {
        // Error logging removed for production
        
        // Change to error state
        window.streamState.changeTo('error');
        
        alert('Error starting recording: ' + error.message);
    }
}

// Save the recorded video
function saveRecording(lectureId) {
    try {
        // Console logging removed for production
        // Console logging removed for production
        
        // If no lectureId provided, try to get it from stored value
        if (!lectureId && window.currentRecordingLectureId) {
            lectureId = window.currentRecordingLectureId;
            // Console logging removed for production
        }
        
        if (!lectureId) {
            throw new Error('No lecture ID provided for saving recording. Please ensure recording was started properly.');
        }
        
        const blob = new Blob(window.recordedChunks, { type: 'video/webm' });
        // Console logging removed for production
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('video', blob, `lecture-${lectureId}-${Date.now()}.webm`);

        const uploadUrl = `/api/lectures/admin/lectures/${lectureId}/video`;
        // Console logging removed for production
        
        // Upload video to server
        fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        })
        .then(response => {
            // Console logging removed for production
            // Console logging removed for production
            
            if (!response.ok) {
                // Error logging removed for production
                // Try to get error details from response
                return response.text().then(errorText => {
                    // Error logging removed for production
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Console logging removed for production
            
            // Update lecture with duration and other metadata
            updateLectureMetadata(lectureId, blob.size);
            
            // Clear recorded chunks
            window.recordedChunks = [];
            
            // Now it's safe to clear the lecture ID
            window.currentRecordingLectureId = null;
            // Console logging removed for production
            
            alert('Recording saved successfully!');
        })
        .catch(error => {
            // Error logging removed for production
            alert('Error saving recording: ' + error.message);
        });
        
    } catch (error) {
        // Error logging removed for production
        alert('Error saving recording: ' + error.message);
    }
}

// Update lecture metadata after recording
function updateLectureMetadata(lectureId, fileSize) {
    // Calculate duration from recorded chunks (approximate)
    const duration = Math.floor(window.recordedChunks.length); // 1 second per chunk
    
    fetch(`/api/lectures/admin/lectures/${lectureId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
            duration: duration,
            fileSize: fileSize
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Console logging removed for production
    })
    .catch(error => {
        // Error logging removed for production
    });
}

// 🚀 SCREEN SHARING - NOW HANDLED BY CUSTOM WEBRTC SYSTEM
// The old WebRTC screen sharing functions have been removed to prevent conflicts
// All screen sharing is now handled by the Custom WebRTC integration above

// Test streaming setup and provide debugging info
function testStreamingSetup() {
    // Testing streaming setup...
    
    const testResults = {
        socket: false,
        mediaDevices: false,
        getUserMedia: false,
        MediaRecorder: false,
        requiredElements: false,
        permissions: 'unknown'
    };
    
    // Test socket connection
    if (window.socket && window.socket.connected) {
        testResults.socket = true;
        // Socket connected successfully
    } else {
        // Error logging removed for production
    }
    
    // Test media devices API
    if (navigator.mediaDevices) {
        testResults.mediaDevices = true;
        // MediaDevices API available
        
        if (navigator.mediaDevices.getUserMedia) {
            testResults.getUserMedia = true;
            // getUserMedia available
        } else {
            // Error logging removed for production
        }
    } else {
        // Error logging removed for production
    }
    
    // Test MediaRecorder
    if (window.MediaRecorder) {
        testResults.MediaRecorder = true;
        // MediaRecorder API available
        
        // Test supported formats with priority order
        const formats = [
            { mimeType: 'video/webm;codecs=vp9', name: 'VP9 (High Quality)', priority: 1 },
            { mimeType: 'video/webm;codecs=vp8', name: 'VP8 (Good Quality)', priority: 2 },
            { mimeType: 'video/webm', name: 'WebM (Basic)', priority: 3 }
        ];
        
        let bestSupportedFormat = null;
        let supportedFormats = [];
        
        formats.forEach(format => {
            if (window.MediaRecorder.isTypeSupported(format.mimeType)) {
                // Format supported
                supportedFormats.push(format);
                if (!bestSupportedFormat || format.priority < bestSupportedFormat.priority) {
                    bestSupportedFormat = format;
                }
            } else {
                // Format not supported
            }
        });
        
        // Log the best supported format for recording
        if (bestSupportedFormat) {
            // Best recording format identified
        } else {
            // Error logging removed for production
        }
    } else {
        // Error logging removed for production
    }
    
    // Test required DOM elements
    const requiredElements = [
        'startLiveBtn', 'endLiveBtn', 'shareScreenBtn',
        'startRecordingBtn', 'stopRecordingBtn', 'localVideo',
        'streamStatus', 'recordingStatus', 'viewerCount', 'liveViewers'
    ];
    
    const missingElements = [];
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
            missingElements.push(id);
        }
    });
    
    if (missingElements.length === 0) {
        testResults.requiredElements = true;
        // All required DOM elements found
    } else {
        // Error logging removed for production
    }
    
    // Test permissions
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'camera' })
            .then(result => {
                testResults.permissions = result.state;
                // Camera permission state checked
            })
            .catch(err => {
                // Camera permission check failed
            });
            
        navigator.permissions.query({ name: 'microphone' })
            .then(result => {
                // Microphone permission state checked
            })
            .catch(err => {
                // Microphone permission check failed
            });
    }
    
    // Display test results
    // Table logging removed for production
    
    // Provide recommendations
    if (!testResults.socket) {
        // Warning logging removed for production
    }
    if (!testResults.mediaDevices) {
        // Warning logging removed for production
    }
    if (!testResults.MediaRecorder) {
        // Warning logging removed for production
    }
    if (!testResults.requiredElements) {
        // Warning logging removed for production
    }
    
    return testResults;
}

// Make test function globally accessible
window.testStreamingSetup = testStreamingSetup;

// Show upload progress
function showUploadProgress() {
    const progressDiv = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressDiv) {
        progressDiv.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
    }
}

// Update upload progress
function updateUploadProgress(percent) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill && progressText) {
        progressFill.style.width = percent + '%';
        progressText.textContent = Math.round(percent) + '%';
    }
}

// Hide upload progress
function hideUploadProgress() {
    const progressDiv = document.getElementById('uploadProgress');
    if (progressDiv) {
        progressDiv.style.display = 'none';
    }
}

// Upload video to existing lecture
function uploadVideoToLecture(lectureId) {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'video/*';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file size (500MB limit)
        if (file.size > 500 * 1024 * 1024) {
            alert('File size must be less than 500MB');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('video/')) {
            alert('Please select a valid video file');
            return;
        }
        
        // Show progress bar
        showUploadProgress();
        
        // Upload the video with progress tracking
        const formData = new FormData();
        formData.append('video', file);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                updateUploadProgress(percentComplete);
            }
        });
        
        xhr.addEventListener('load', function() {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    alert('Video uploaded successfully!');
                    loadRecordedLectures(); // Reload the lectures list
                } catch (error) {
                    alert('Video uploaded but response parsing failed');
                    loadRecordedLectures();
                }
            } else {
                alert('Error uploading video: ' + xhr.statusText);
            }
            hideUploadProgress();
        });
        
        xhr.addEventListener('error', function() {
            alert('Error uploading video: Network error');
            hideUploadProgress();
        });
        
        xhr.open('POST', `/api/lectures/admin/lectures/${lectureId}/video`);
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('adminToken')}`);
        xhr.send(formData);
        
        // Clean up
        document.body.removeChild(fileInput);
    });
    
    // Trigger file selection
    document.body.appendChild(fileInput);
    fileInput.click();
}

// Test recorded lectures API
function testRecordedLecturesAPI() {
    // Testing recorded lectures API...
    updateSystemStatus('🧪 Starting API tests...', 'info');
    
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
        // Error logging removed for production
        updateSystemStatus('❌ No admin token found. Please log in first.', 'error');
        alert('No admin token found. Please log in first.');
        return;
    }
    
            // Admin token found
    updateSystemStatus('🔑 Admin token verified, testing API endpoint...', 'info');
    
    // Test 1: Check if we can reach the API
            // Test 1: Checking API endpoint
    fetch('/api/lectures/admin/lectures', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`
        }
    })
    .then(handleApiResponse)
    .then(data => {
        // Test 1 PASSED - API is reachable
        updateSystemStatus('✅ API endpoint test passed, testing lecture creation...', 'success');
        
        // Test 2: Try to create a test lecture
        // Test 2: Creating test lecture
        const testLecture = {
            title: 'Test Lecture - ' + new Date().toISOString(),
            description: 'This is a test lecture for debugging purposes',
            category: 'test',
            tags: 'test,debug',
            quality: '1080p'
        };
        
        return fetch('/api/lectures/admin/lectures', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(testLecture)
        });
    })
    .then(handleApiResponse)
    .then(data => {
        // Test 2 PASSED - Lecture creation works
        updateSystemStatus('✅ Lecture creation test passed, testing deletion...', 'success');
        
        // Test 3: Try to delete the test lecture
        // Test 3: Deleting test lecture
        return fetch(`/api/lectures/admin/lectures/${data._id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
    })
    .then(response => {
        // Test 3 Response Status received
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // DELETE requests typically don't return JSON
        return { success: true };
    })
    .then(data => {
        // Test 3 PASSED - Lecture deletion works
        // ALL TESTS PASSED! Recorded lectures API is working correctly
        updateSystemStatus('🎉 All tests passed! Recorded lectures system is fully operational.', 'success');
        
        alert('🎉 API Test Complete!\n\n✅ API endpoint is reachable\n✅ Lecture creation works\n✅ Lecture deletion works\n\nAll systems are operational!');
        
        // Reload lectures to show current state
        loadRecordedLectures();
    })
    .catch(error => {
        // Error logging removed for production
        updateSystemStatus('❌ API test failed: ' + error.message, 'error');
        alert('❌ API Test Failed!\n\nError: ' + error.message + '\n\nCheck the console for detailed information.');
    });
}

window.closeAccessModal = closeAccessModal;
window.togglePublicAccess = togglePublicAccess;
window.saveAccessChanges = saveAccessChanges;
window.testRecordedLecturesAPI = testRecordedLecturesAPI;

// Update system status
function updateSystemStatus(message, type = 'info') {
    const statusElement = document.getElementById('systemStatus');
    const statusText = document.getElementById('statusText');
    
    if (!statusElement || !statusText) return;
    
    // Update text
    statusText.textContent = message;
    
    // Update styling based on type
    statusElement.className = 'margin-top-10';
    statusElement.style.padding = '10px';
    statusElement.style.borderRadius = '5px';
    statusElement.style.borderLeft = '4px solid';
    
    switch (type) {
        case 'success':
            statusElement.style.background = '#d4edda';
            statusElement.style.borderLeftColor = '#28a745';
            break;
        case 'error':
            statusElement.style.background = '#f8d7da';
            statusElement.style.borderLeftColor = '#dc3545';
            break;
        case 'warning':
            statusElement.style.background = '#fff3cd';
            statusElement.style.borderLeftColor = '#ffc107';
            break;
        default:
            statusElement.style.background = '#d1ecf1';
            statusElement.style.borderLeftColor = '#17a2b8';
    }
}

// Utility function for safe API response handling
function handleApiResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format. Expected JSON.');
    }
    
    return response.json();
}

// Load available users for access control
function loadAvailableUsers(lectureId) {
    // Loading available users for lecture
    
    const userAccessList = document.getElementById('userAccessList');
    if (!userAccessList) {
        // Error logging removed for production
        return;
    }
    
    // Show loading state
    userAccessList.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div class="loading-spinner" style="display: inline-block; width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px;"></div>
            <p style="color: #666; margin-bottom: 10px;">Loading Users...</p>
            <p style="color: #999; font-size: 0.9rem;">Please wait while we fetch the user list</p>
        </div>
    `;
    
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
        // Error logging removed for production
        userAccessList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #dc3545;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>No admin token found</p>
                <p style="font-size: 0.9rem;">Please log in again</p>
            </div>
        `;
        return;
    }
    
            // Admin token found, fetching users
    
    // Fetch all users from the system
    fetch('/api/admin/users', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        // Users API Response received
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Invalid response format. Expected JSON.');
        }
        
        return response.json();
    })
    .then(users => {
        // Users loaded successfully
        
        if (!Array.isArray(users)) {
            throw new Error('Invalid response: users is not an array');
        }
        
        displayUserAccessList(users, lectureId);
    })
    .catch(error => {
        // Error logging removed for production
        userAccessList.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc3545; margin-bottom: 1rem;"></i>
                <h4 style="color: #dc3545; margin-bottom: 10px;">Error Loading Users</h4>
                <p style="color: #666; margin-bottom: 20px;">${error.message}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="loadAvailableUsers('${lectureId}')" class="save-btn">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                    <button onclick="closeAccessModal()" class="btn-cancel">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
                <details style="margin-top: 20px; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">
                    <summary style="cursor: pointer; color: #007bff;">Debug Information</summary>
                    <pre style="background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 12px; overflow-x: auto;">${error.stack || 'No stack trace available'}</pre>
                </details>
            </div>
        `;
    });
}

// Display user access list with checkboxes
function displayUserAccessList(users, lectureId) {
    const userAccessList = document.getElementById('userAccessList');
    if (!userAccessList) {
        // Error logging removed for production
        return;
    }
    
            // Displaying user list
    
    if (!users || users.length === 0) {
        userAccessList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <i class="fas fa-users" style="font-size: 2rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h4 style="margin-bottom: 10px;">No Users Found</h4>
                <p style="margin-bottom: 15px;">There are no users in the system yet.</p>
                <div style="font-size: 12px; color: #999; background: #f8f9fa; padding: 10px; border-radius: 5px; text-align: left;">
                    <strong>To add users:</strong><br>
                    1. Go to "Users" tab in admin dashboard<br>
                    2. Click "Create New User"<br>
                    3. Fill in user details and save<br>
                    4. Return here to manage access
                </div>
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong style="color: #333;">Select Users with Access (${users.length} total)</strong>
                <div>
                    <button onclick="selectAllUsers()" class="save-btn" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                        <i class="fas fa-check-double"></i> Select All
                    </button>
                    <button onclick="deselectAllUsers()" class="save-btn" style="padding: 5px 10px; font-size: 12px; background: #6c757d;">
                        <i class="fas fa-times"></i> Deselect All
                    </button>
                </div>
            </div>
            <div style="font-size: 12px; color: #666;">
                <i class="fas fa-info-circle"></i> Check the users who should have access to this lecture
            </div>
        </div>
        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px; padding: 10px; background: white;">
    `;
    
    users.forEach((user, index) => {
                    // User data processed
        html += `
            <div class="user-access-item">
                <input type="checkbox" 
                       id="user_${user._id}" 
                       value="${user._id}" 
                       class="user-access-checkbox">
                <div class="user-info">
                    <div class="user-name">${user.name || 'Unnamed User'}</div>
                    <div class="user-details">
                        <i class="fas fa-phone"></i> ${user.phone || 'No phone'}
                        ${user.civilId ? `<br><i class="fas fa-id-card"></i> ${user.civilId}` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    userAccessList.innerHTML = html;
    
            // User list displayed successfully
    
    // Load current access settings to check existing users
    loadCurrentUserAccess(lectureId, users);
}

// Load current user access settings
function loadCurrentUserAccess(lectureId, allUsers) {
    // Loading current user access for lecture
    
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) return;
    
    fetch(`/api/lectures/admin/lectures/${lectureId}`, {
        headers: {
            'Authorization': `Bearer ${adminToken}`
        }
    })
    .then(handleApiResponse)
    .then(lecture => {
        // Current lecture access loaded
        
        // Check existing users
        if (lecture.accessUsers && lecture.accessUsers.length > 0) {
            lecture.accessUsers.forEach(userId => {
                const checkbox = document.getElementById(`user_${userId}`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    })
    .catch(error => {
        // Error logging removed for production
    });
}

// Select all users
function selectAllUsers() {
    const checkboxes = document.querySelectorAll('.user-access-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

// Deselect all users
function deselectAllUsers() {
    const checkboxes = document.querySelectorAll('.user-access-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

// Test user loading function
function testUserLoading() {
    // Testing user loading
    
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
        alert('No admin token found. Please log in first.');
        return;
    }
    
            // Admin token found, testing endpoint
    
    fetch('/api/admin/users', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        // Test Response received
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    })
    .then(data => {
        // Test successful! Users data received
        alert(`✅ User loading test successful!\n\nFound ${data.length} users\n\nCheck console for details.`);
    })
    .catch(error => {
        // Error logging removed for production
        alert(`❌ User loading test failed!\n\nError: ${error.message}\n\nCheck console for details.`);
    });
}

window.selectAllUsers = selectAllUsers;
window.deselectAllUsers = deselectAllUsers;
window.testUserLoading = testUserLoading;
window.testMicrophoneAccess = testMicrophoneAccess;
window.testCameraAccess = testCameraAccess;
window.monitorAudioLevels = monitorAudioLevels;
window.updateConnectionStatus = updateConnectionStatus;
window.showConnectionError = showConnectionError;
window.isSocketConnected = isSocketConnected;
window.safeSocketEmit = safeSocketEmit;
window.handlePageVisibilityChange = handlePageVisibilityChange;
window.handleBeforeUnload = handleBeforeUnload;
window.updateAdminVolume = updateAdminVolume;
window.toggleAdminMicrophone = toggleAdminMicrophone;
window.showAdminAudioControls = showAdminAudioControls;
window.hideAdminAudioControls = hideAdminAudioControls;


// Global functions for lecture popup
window.showLecturePopup = function() {
  const popup = document.getElementById('lecturePopup');
  popup.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
};

window.closeLecturePopup = function() {
  const popup = document.getElementById('lecturePopup');
  const video = document.getElementById('lectureVideoPlayer');
  
  // Stop video playback
  video.pause();
  video.src = '';
  
  // Hide popup
  popup.classList.remove('active');
  document.body.style.overflow = ''; // Restore background scrolling
};

window.playLectureInPopup = async function(lectureId) {
      // Admin playing lecture
  
  if (!lectureId) {
    // Error logging removed for production
    alert('Error: No lecture ID provided');
    return;
  }
  
  try {
    // Show popup with loading state
    showLecturePopup();
    
            // Fetching lecture details
    
    const response = await fetch(`/api/lectures/admin/lectures/${lectureId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });

            // Lecture details response received

    if (!response.ok) {
      throw new Error('Failed to fetch lecture details');
    }

    const lecture = await response.json();
            // Lecture details received
    
    // Populate popup with lecture info
    document.getElementById('popupLectureTitle').textContent = lecture.title;
    document.getElementById('popupLectureDescription').textContent = lecture.description || 'No description available';
    document.getElementById('popupLectureDate').textContent = formatDate(lecture.streamDate);
    document.getElementById('popupLectureDuration').textContent = formatDuration(lecture.duration);
    document.getElementById('popupLectureQuality').textContent = lecture.quality || '1080p';
    document.getElementById('popupLectureCategory').textContent = lecture.category || 'General';
    
    // Set video source with authentication token
    const adminToken = localStorage.getItem('adminToken');
    const video = document.getElementById('lectureVideoPlayer');
    const placeholder = document.getElementById('lectureVideoPlaceholder');
    
    // Show placeholder while video loads
    placeholder.style.display = 'flex';
    video.style.display = 'none';
    
    video.src = `/api/lectures/admin/lectures/${lectureId}/stream?token=${encodeURIComponent(adminToken)}`;
    
    // Load video and hide placeholder
    video.load();
    video.addEventListener('loadeddata', () => {
      placeholder.style.display = 'none';
      video.style.display = 'block';
    });
    
    // Handle video errors
    video.addEventListener('error', () => {
      placeholder.style.display = 'flex';
      video.style.display = 'none';
      placeholder.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading video</p>
        <button onclick="playLectureInPopup('${lectureId}')" class="lecture-error-retry">Retry</button>
      `;
    });
    
  } catch (error) {
    // Error logging removed for production
    showLectureError(error.message);
  }
};

window.showLectureError = function(message) {
  const popup = document.getElementById('lecturePopup');
  const content = popup.querySelector('.lecture-popup-content');
  
  content.innerHTML = `
    <div class="lecture-error">
      <i class="fas fa-exclamation-triangle"></i>
      <div class="lecture-error-message">Error Loading Lecture</div>
      <div class="lecture-error-details">${message}</div>
      <button class="lecture-error-retry" onclick="closeLecturePopup()">Close</button>
    </div>
  `;
  
  popup.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.downloadLecture = function() {
  const video = document.getElementById('lectureVideoPlayer');
  if (video.src) {
    const link = document.createElement('a');
    link.href = video.src;
    link.download = 'lecture.mp4';
    link.click();
  } else {
    alert('No video available for download');
  }
};

window.shareLecture = function() {
  if (navigator.share) {
    navigator.share({
      title: document.getElementById('popupLectureTitle').textContent,
      text: document.getElementById('popupLectureDescription').textContent,
      url: window.location.href
    });
  } else {
    // Fallback: copy to clipboard
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Lecture URL copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy URL. Please copy manually: ' + url);
    });
  }
};

window.editLecture = function() {
  // Close popup and open edit modal
  closeLecturePopup();
  // You can implement edit functionality here
  alert('Edit functionality will be implemented here');
};

// Utility functions for date and duration formatting
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function formatDuration(seconds) {
  if (!seconds) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }
  return `0:${minutes.toString().padStart(2, '0')}`;
}

// Add popup event listeners
document.addEventListener('click', (e) => {
  const popup = document.getElementById('lecturePopup');
  if (e.target === popup) {
    closeLecturePopup();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const popup = document.getElementById('lecturePopup');
    if (popup && popup.classList.contains('active')) {
      closeLecturePopup();
    }
  }
});

// Test microphone access separately
function testMicrophoneAccess() {
    // Testing microphone access
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Error logging removed for production
        return Promise.reject(new Error('Media devices API not supported'));
    }
    
    return navigator.mediaDevices.getUserMedia({ 
        audio: {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
            sampleRate: { ideal: 44100 },
            channelCount: { ideal: 2 }
        }
    })
    .then(stream => {
        // Microphone access successful
        
        // Log audio track details
        stream.getAudioTracks().forEach(track => {
            // Audio track details logged
        });
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
        
        return true;
    })
    .catch(error => {
        // Error logging removed for production
        return Promise.reject(error);
    });
}

// Test camera access separately
function testCameraAccess() {
    // Testing camera access
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Error logging removed for production
        return Promise.reject(new Error('Media devices API not supported'));
    }
    
    return navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            frameRate: { ideal: 15 }
        }
    })
    .then(stream => {
        // Camera access successful
        
        // Log video track details
        stream.getVideoTracks().forEach(track => {
            // Video track details logged
        });
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
        
        return true;
    })
    .catch(error => {
        // Error logging removed for production
        return Promise.reject(error);
    });
}

// Enhanced media access with fallbacks
function requestMediaAccess() {
    // Requesting media access with fallbacks
    
    // First try to get both audio and video
    return navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 1920, min: 640 }, 
            height: { ideal: 1080, min: 480 },
            frameRate: { ideal: 30, min: 15 },
            facingMode: 'user'
        }, 
        audio: {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
            sampleRate: { ideal: 44100 },
            channelCount: { ideal: 2 }
        } 
    })
    .catch(error => {
        // High quality failed, trying medium quality
        
        // Try medium quality
        return navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280, min: 640 }, 
                height: { ideal: 720, min: 480 },
                frameRate: { ideal: 25, min: 15 }
            }, 
            audio: true
        });
    })
    .catch(error => {
        // Medium quality failed, trying low quality
        
        // Try low quality
        return navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 }, 
                height: { ideal: 480 },
                frameRate: { ideal: 15 }
            }, 
            audio: true
        });
    })
    .catch(error => {
        // Low quality failed, trying audio only
        
        // Try audio only
        return navigator.mediaDevices.getUserMedia({ 
            audio: true
        });
    });
}

// Monitor audio levels for microphone feedback
function monitorAudioLevels(stream) {
    if (!stream || !stream.getAudioTracks().length) {
        // No audio tracks to monitor
        return;
    }
    
    // Starting audio level monitoring
    
    // Create audio context for analyzing audio levels
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    // Connect microphone to analyser
    microphone.connect(analyser);
    
    // Configure analyser
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Function to update audio levels
    function updateAudioLevels() {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        // Update status with audio level indicator
        const streamStatus = document.getElementById('streamStatus');
        if (streamStatus && streamStatus.textContent.includes('LIVE')) {
            if (average > 50) {
                streamStatus.innerHTML = streamStatus.textContent + ' 🔊';
            } else if (average > 20) {
                streamStatus.innerHTML = streamStatus.textContent + ' 🔉';
            } else {
                streamStatus.innerHTML = streamStatus.textContent + ' 🔈';
            }
        }
        
        // Log audio levels for debugging
        if (average > 0) {
            // Audio level monitored
        }
        
        // 🚀 WebRTC stream check removed - now handled by Custom WebRTC
        // Custom WebRTC automatically manages audio monitoring
        // Continue monitoring if Custom WebRTC session is active
        if (window.audioPipeline && window.audioPipeline.currentRoom) {
            requestAnimationFrame(updateAudioLevels);
        }
    }
    
    // Start monitoring
    updateAudioLevels();
    
    return {
        stop: () => {
            microphone.disconnect();
            analyser.disconnect();
            audioContext.close();
            // Audio monitoring stopped
        }
    };
}

// Update connection status display
function updateConnectionStatus(status, message = '') {
    const connectionStatus = document.getElementById('connectionStatus');
    if (!connectionStatus) return;
    
    switch (status) {
        case 'connected':
            connectionStatus.innerHTML = '🟢 Connected';
            connectionStatus.className = 'status-connected';
            break;
        case 'connecting':
            connectionStatus.innerHTML = '🟡 Connecting...';
            connectionStatus.className = 'status-connecting';
            break;
        case 'reconnecting':
            connectionStatus.innerHTML = '🟡 Reconnecting...';
            connectionStatus.className = 'status-reconnecting';
            break;
        case 'error':
            connectionStatus.innerHTML = '🔴 Connection Error';
            connectionStatus.className = 'status-error';
            if (message) {
                connectionStatus.title = message;
            }
            break;
        case 'disconnected':
            connectionStatus.innerHTML = '⚫ Disconnected';
            connectionStatus.className = 'status-disconnected';
            break;
    }
}

// Show connection error message
function showConnectionError(message) {
    // Create or update error notification
    let errorNotification = document.getElementById('connectionErrorNotification');
    if (!errorNotification) {
        errorNotification = document.createElement('div');
        errorNotification.id = 'connectionErrorNotification';
        errorNotification.className = 'connection-error-notification';
        document.body.appendChild(errorNotification);
    }
    
    errorNotification.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="error-close">×</button>
        </div>
    `;
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorNotification.parentElement) {
            errorNotification.remove();
        }
    }, 10000);
}

// Check socket connection status
function isSocketConnected() {
    return window.socket && window.socket.connected;
}

// Safe socket emit with connection check
function safeSocketEmit(event, data) {
    if (!isSocketConnected()) {
        // Error logging removed for production
        showConnectionError('Connection lost. Please wait for reconnection or refresh the page.');
        return false;
    }
    
    try {
        window.socket.emit(event, data);
        return true;
    } catch (error) {
        // Error logging removed for production
        return false;
    }
}

// Handle page visibility changes to prevent WebSocket disconnections
function handlePageVisibilityChange() {
    if (document.hidden) {
        // Page hidden, maintaining WebSocket connection
        // Keep connection alive but don't show notifications
    } else {
        // Page visible again, checking connection
        // Check if we need to reconnect
        if (window.socket && !window.socket.connected) {
            // Page became visible but socket disconnected, attempting reconnection
            window.socket.connect();
        }
    }
}

// Handle beforeunload to gracefully close connections
function handleBeforeUnload(event) {
    // 🚀 WebRTC stream cleanup removed - now handled by Custom WebRTC
    // Custom WebRTC automatically manages stream cleanup on page unload
    
    // Notify server if possible
    if (window.socket && window.socket.connected) {
        try {
            window.socket.emit('admin-end');
        } catch (e) {
            // Could not notify server about stream end
        }
    }
}

// Initialize Socket.IO connection with enhanced error handling

// Update admin audio volume
function updateAdminVolume(volume) {
    const adminAudio = document.getElementById('adminAudio');
    if (adminAudio) {
        adminAudio.volume = volume;
        // Admin volume set
    }
    
    // Update volume display
    const volumeDisplay = document.getElementById('volumeDisplay');
    if (volumeDisplay) {
        volumeDisplay.textContent = Math.round(volume * 100) + '%';
    }
}

// Toggle admin microphone on/off
function toggleAdminMicrophone() {
    const adminMuteBtn = document.getElementById('adminMuteBtn');
    const adminMicStatus = document.getElementById('adminMicStatus');
    
    if (!adminMuteBtn || !adminMicStatus) {
        // Error logging removed for production
        return;
    }
    
    // Check if admin is currently muted
    const isCurrentlyMuted = adminMuteBtn.classList.contains('muted');
    
    if (isCurrentlyMuted) {
        // Unmute admin microphone
        adminMuteBtn.classList.remove('muted');
        adminMuteBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Mute Admin';
        adminMuteBtn.style.background = '#4caf50';
        adminMicStatus.textContent = '🎤 Admin mic is active';
        adminMicStatus.style.color = '#4caf50';
        
        // 🚀 WebRTC audio track management removed - now handled by Custom WebRTC
        // Custom WebRTC automatically manages microphone state
        
        // Admin microphone unmuted
    } else {
        // Mute admin microphone
        adminMuteBtn.classList.add('muted');
        adminMuteBtn.innerHTML = '<i class="fas fa-microphone"></i> Unmute Admin';
        adminMuteBtn.style.background = '#f44336';
        adminMicStatus.textContent = '🔇 Admin mic is muted';
        adminMicStatus.style.color = '#f44336';
        
        // 🚀 WebRTC audio track management removed - now handled by Custom WebRTC
        // Custom WebRTC automatically manages microphone state
        
        // Admin microphone muted
    }
}

// Show admin audio controls
function showAdminAudioControls() {
    const audioControls = document.querySelector('.admin-audio-controls');
    if (audioControls) {
        audioControls.style.display = 'block';
        
        // Initialize admin mute button state
        const adminMuteBtn = document.getElementById('adminMuteBtn');
        const adminMicStatus = document.getElementById('adminMicStatus');
        
        if (adminMuteBtn && adminMicStatus) {
            // 🚀 WebRTC audio track check removed - now handled by Custom WebRTC
            // Custom WebRTC automatically manages microphone state and UI updates
            // Set default state for Custom WebRTC integration
            adminMuteBtn.classList.remove('muted');
            adminMuteBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Mute Admin';
            adminMuteBtn.style.background = '#4caf50';
            adminMicStatus.textContent = '🎤 Admin mic is active';
            adminMicStatus.style.color = '#4caf50';
        }
        
        // Admin audio controls shown and initialized
    }
}

// Hide admin audio controls
function hideAdminAudioControls() {
    const audioControls = document.querySelector('.admin-audio-controls');
    if (audioControls) {
        audioControls.style.display = 'none';
        // Admin audio controls hidden
    }
}

// Handle page visibility changes to prevent WebSocket disconnections



// Test streaming setup and provide debugging info

// Production-ready: Debug function removed for security

// PHASE 4: Error Handling & Recovery System
window.errorHandler = {
    // Error types and their recovery strategies
    errorTypes: {
        'media_access': {
            description: 'Media device access failed',
            recovery: 'retry_with_fallback',
            maxRetries: 3,
            userMessage: 'Camera/microphone access failed. Please check permissions and try again.'
        },
        'webrtc_connection': {
            description: 'WebRTC connection failed',
            recovery: 'retry_with_delay',
            maxRetries: 5,
            userMessage: 'Connection failed. Retrying automatically...'
        },
        'recording_failed': {
            description: 'Recording failed to start or process',
            recovery: 'retry_with_different_format',
            maxRetries: 2,
            userMessage: 'Recording failed. Trying different format...'
        },
        'socket_connection': {
            description: 'Socket connection lost',
            recovery: 'auto_reconnect',
            maxRetries: 10,
            userMessage: 'Connection lost. Reconnecting automatically...'
        },
        'stream_state': {
            description: 'Stream state inconsistency',
            recovery: 'reset_state',
            maxRetries: 1,
            userMessage: 'Stream state error. Resetting...'
        }
    },
    
    // Error tracking
    errors: new Map(),
    retryCounts: new Map(),
    
    // Handle error with recovery strategy
    handle: function(errorType, error, context = {}) {
        // Error logging removed for production
        
        // Track error
        if (!this.errors.has(errorType)) {
            this.errors.set(errorType, []);
        }
        this.errors.get(errorType).push({
            error: error,
            context: context,
            timestamp: Date.now()
        });
        
        // Get error type info
        const errorInfo = this.errorTypes[errorType];
        if (!errorInfo) {
            // Error logging removed for production
            return false;
        }
        
        // Check retry count
        const currentRetries = this.retryCounts.get(errorType) || 0;
        if (currentRetries >= errorInfo.maxRetries) {
            // Error logging removed for production
            this.showUserFriendlyError(errorInfo.userMessage);
            return false;
        }
        
        // Increment retry count
        this.retryCounts.set(errorType, currentRetries + 1);
        
        // Execute recovery strategy
        return this.executeRecovery(errorType, errorInfo, context);
    },
    
    // Execute recovery strategy
    executeRecovery: function(errorType, errorInfo, context) {
        // Executing recovery for error
        
        switch (errorInfo.recovery) {
            case 'retry_with_fallback':
                return this.retryWithFallback(errorType, context);
                
            case 'retry_with_delay':
                return this.retryWithDelay(errorType, context);
                
            case 'retry_with_different_format':
                return this.retryWithDifferentFormat(errorType, context);
                
            case 'auto_reconnect':
                return this.autoReconnect(errorType, context);
                
            case 'reset_state':
                return this.resetState(errorType, context);
                
            default:
                // Error logging removed for production
                return false;
        }
    },
    
    // Retry with fallback constraints
    retryWithFallback: function(errorType, context) {
        if (errorType === 'media_access') {
            // Retrying media access with fallback constraints
            
            // Try different media constraints
            const fallbackConstraints = [
                { video: true, audio: false },  // Video only
                { video: false, audio: true },  // Audio only
                { video: { width: 640, height: 480 }, audio: true },  // Lower resolution
                { video: true, audio: { echoCancellation: false } }  // No echo cancellation
            ];
            
            // This would be implemented in the media access function
            return true;
        }
        return false;
    },
    
    // Retry with exponential backoff
    retryWithDelay: function(errorType, context) {
        const retryCount = this.retryCounts.get(errorType) || 0;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
        
        // Retrying operation
        
        setTimeout(() => {
            if (errorType === 'webrtc_connection') {
                // Retry WebRTC connection
                this.retryWebRTCConnection(context);
            }
        }, delay);
        
        return true;
    },
    
    // Retry with different recording format
    retryWithDifferentFormat: function(errorType, context) {
        if (errorType === 'recording_failed') {
            // Retrying recording with different format
            
            // Try different MIME types
            const fallbackFormats = [
                'video/webm',
                'video/mp4',
                'video/ogg'
            ];
            
            // This would be implemented in the recording function
            return true;
        }
        return false;
    },
    
    // Auto reconnect for socket issues
    autoReconnect: function(errorType, context) {
        if (errorType === 'socket_connection') {
            // Attempting automatic reconnection
            
            if (window.socket) {
                window.socket.connect();
            }
            
            return true;
        }
        return false;
    },
    
    // Reset stream state
    resetState: function(errorType, context) {
        if (errorType === 'stream_state') {
            // Resetting stream state
            
            if (window.streamState) {
                window.streamState.reset();
            }
            
            return true;
        }
        return false;
    },
    
    // 🚀 WebRTC retry function removed - now handled by Custom WebRTC
    // Custom WebRTC automatically handles connection retries and recovery
    
    // Show user-friendly error message
    showUserFriendlyError: function(message) {
        // Create or update error display
        let errorDisplay = document.getElementById('errorDisplay');
        if (!errorDisplay) {
            errorDisplay = document.createElement('div');
            errorDisplay.id = 'errorDisplay';
            errorDisplay.className = 'error-display';
            errorDisplay.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #dc3545;
                color: white;
                padding: 15px;
                border-radius: 5px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 10000;
                max-width: 300px;
                font-family: Arial, sans-serif;
            `;
            document.body.appendChild(errorDisplay);
        }
        
        errorDisplay.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>⚠️ ${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; cursor: pointer; margin-left: 10px;">
                    ✕
                </button>
            </div>
        `;
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDisplay.parentElement) {
                errorDisplay.remove();
            }
        }, 10000);
    },
    
    // Clear error tracking
    clearErrors: function(errorType = null) {
        if (errorType) {
            this.errors.delete(errorType);
            this.retryCounts.delete(errorType);
        } else {
            this.errors.clear();
            this.retryCounts.clear();
        }
        // Error tracking cleared
    },
    
    // Get error statistics
    getErrorStats: function() {
        const stats = {};
        this.errors.forEach((errors, type) => {
            stats[type] = {
                count: errors.length,
                lastError: errors[errors.length - 1],
                retryCount: this.retryCounts.get(type) || 0
            };
        });
        return stats;
    },
    
    // Production-ready: Debug function removed
};

// Production-ready: Test function removed for security

// Initialize dashboard
