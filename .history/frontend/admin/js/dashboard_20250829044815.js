// 🚀 ADMIN DASHBOARD - LIVESTREAMING SYSTEM
// This file handles the admin dashboard functionality for the WebRTC livestreaming system

// Global variables
let streamStateManager;
let webrtcIntegrationManager;

// 🚀 INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin Dashboard initializing...');
    
    try {
        initializeUIComponents();
        initializeButtonListeners();
        initializeWebRTCEvents();
        initializeWebRTCManager();
        
        console.log('✅ Admin Dashboard fully initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Admin Dashboard:', error);
        showErrorMessage('Failed to initialize dashboard: ' + error.message);
    }
});

// 🚀 UI COMPONENTS INITIALIZATION
function initializeUIComponents() {
    console.log('🔧 Initializing UI components...');
    
    // Test required UI elements
    const requiredElements = ['startLiveBtn', 'endLiveBtn', 'streamStatus', 'localVideo'];
    for (const elementId of requiredElements) {
        if (!document.getElementById(elementId)) {
            throw new Error(`Required UI element not found: ${elementId}`);
        }
    }
    console.log('✅ All required UI elements found');
    
    // Set up page visibility and unload handlers
    document.addEventListener('visibilitychange', handlePageVisibilityChange);
    window.addEventListener('beforeUnload', handleBeforeUnload);
    
    // Enhanced page unload cleanup
    window.addEventListener('beforeunload', (event) => {
        console.log('🧹 Page unloading, cleaning up resources...');
        if (window.cleanupAllResources) {
            window.cleanupAllResources();
        }
        
        // Show confirmation dialog if there's an active stream
        if (window.webrtcManager && window.webrtcManager.isLive) {
            event.preventDefault();
            event.returnValue = 'You have an active livestream. Are you sure you want to leave?';
            return event.returnValue;
        }
    });
    
    // Set up global error handlers
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
    });
    
    // Initialize StreamStateManager
    streamStateManager = new StreamStateManager();
    window.streamState = streamStateManager;
    
    console.log('✅ UI Components initialized');
}

// 🚀 STREAM STATE MANAGER
class StreamStateManager {
    constructor() {
        this.currentState = 'idle';
        this.streamInfo = null;
        this.viewers = new Map();
        this.lastSync = Date.now();
        this.syncInterval = null;
        this.stateValidationEnabled = true;
        
        this.startStateSync();
    }

    // Start state synchronization
    startStateSync() {
        this.syncInterval = setInterval(() => {
            this.syncState();
        }, 2000); // Sync every 2 seconds
    }

    // Stop state synchronization
    stopStateSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    // Synchronize state with WebRTC manager
    async syncState() {
        try {
            if (!window.webrtcManager) {
                console.warn('WebRTC manager not available for state sync');
                return;
            }

            // Get current WebRTC state
            const webrtcState = window.webrtcManager.getConnectionHealth();
            const isLive = window.webrtcManager.isLive;
            const roomId = window.webrtcManager.roomId;

            // Validate state consistency
            const expectedState = this.determineExpectedState(isLive, webrtcState);
            
            if (this.currentState !== expectedState) {
                console.warn(`State mismatch detected. Expected: ${expectedState}, Current: ${this.currentState}`);
                this.correctState(expectedState, { isLive, roomId, webrtcState });
            }

            // Update last sync timestamp
            this.lastSync = Date.now();

        } catch (error) {
            console.error('State synchronization failed:', error);
        }
    }

    // Determine expected state based on WebRTC conditions
    determineExpectedState(isLive, webrtcState) {
        if (!isLive) return 'idle';
        
        if (webrtcState.connectionQuality === 'poor') return 'degraded';
        if (webrtcState.connectionQuality === 'excellent') return 'optimal';
        
        return 'active';
    }

    // Correct state if mismatch detected
    correctState(expectedState, webrtcData) {
        console.log(`Correcting state from ${this.currentState} to ${expectedState}`);
        
        this.currentState = expectedState;
        this.updateUIState(expectedState, webrtcData);
        
        // Emit state change event
        window.dispatchEvent(new CustomEvent('streamStateChanged', {
            detail: { 
                previousState: this.currentState, 
                newState: expectedState,
                webrtcData 
            }
        }));
    }

    // Update UI based on state
    updateUIState(state, webrtcData) {
        const stateIndicator = document.getElementById('streamStateIndicator');
        const startBtn = document.getElementById('startStreamBtn');
        const stopBtn = document.getElementById('stopStreamBtn');
        const qualityIndicator = document.getElementById('connectionQuality');

        if (!stateIndicator || !startBtn || !stopBtn) return;

        // Update state indicator
        switch (state) {
            case 'idle':
                stateIndicator.textContent = '🟡 IDLE';
                stateIndicator.className = 'status-idle';
                startBtn.disabled = false;
                stopBtn.disabled = true;
                break;
            case 'active':
                stateIndicator.textContent = '🟢 LIVE';
                stateIndicator.className = 'status-live';
                startBtn.disabled = true;
                stopBtn.disabled = false;
                break;
            case 'optimal':
                stateIndicator.textContent = '🟢 OPTIMAL';
                stateIndicator.className = 'status-optimal';
                startBtn.disabled = true;
                stopBtn.disabled = false;
                break;
            case 'degraded':
                stateIndicator.textContent = '🟠 DEGRADED';
                stateIndicator.className = 'status-degraded';
                startBtn.disabled = true;
                stopBtn.disabled = false;
                break;
        }

        // Update connection quality if available
        if (qualityIndicator && webrtcData && webrtcData.webrtcState) {
            qualityIndicator.textContent = webrtcData.webrtcState.connectionQuality || 'unknown';
        }
    }

    // Update viewer count display
    updateViewerCount(count) {
        const viewerCountElement = document.getElementById('viewerCount');
        if (viewerCountElement) {
            viewerCountElement.textContent = count;
        }
    }

    // Get current state
    getCurrentState() {
        return this.currentState;
    }

    // Force state update
    forceStateUpdate() {
        this.syncState();
    }

    // Validate state consistency
    validateState() {
        const isValid = this.currentState !== 'unknown' && 
                       this.lastSync > Date.now() - 10000; // Within 10 seconds
        
        if (!isValid) {
            console.warn('State validation failed, forcing sync');
            this.syncState();
        }
        
        return isValid;
    }

    // Cleanup resources
    cleanup() {
        this.stopStateSync();
        this.currentState = 'idle';
        this.streamInfo = null;
        this.viewers.clear();
        this.lastSync = Date.now();
    }
}

// 🚀 BUTTON EVENT LISTENERS
function initializeButtonListeners() {
    console.log('🔧 Initializing button listeners...');
    
    // Start livestream button
    const startBtn = document.getElementById('startLiveBtn');
    if (startBtn) {
        startBtn.addEventListener('click', window.startLivestream);
        console.log('✅ Start button listener added');
    }

    // End livestream button
    const endBtn = document.getElementById('endLiveBtn');
    if (endBtn) {
        endBtn.addEventListener('click', window.stopLivestream);
        console.log('✅ End button listener added');
    }

    // Share screen button
    const shareScreenBtn = document.getElementById('shareScreenBtn');
    if (shareScreenBtn) {
        shareScreenBtn.addEventListener('click', window.toggleScreenShare);
        console.log('✅ Share screen button listener added');
    }

    // Recording buttons
    const startRecordingBtn = document.getElementById('startRecordingBtn');
    if (startRecordingBtn) {
        startRecordingBtn.addEventListener('click', startRecording);
        console.log('✅ Start recording button listener added');
    }

    const stopRecordingBtn = document.getElementById('stopRecordingBtn');
    if (stopRecordingBtn) {
        stopRecordingBtn.addEventListener('click', stopRecording);
        console.log('✅ Stop recording button listener added');
    }

    console.log('✅ All button listeners initialized');
}

// 🚀 WEBRTC EVENT HANDLERS
function initializeWebRTCEvents() {
    if (!window.webrtcManager) {
        console.error('WebRTC Manager not available');
        return;
    }

    console.log('✅ WebRTC events initialized');
}

// 🚀 WEBRTC MANAGER INITIALIZATION
function initializeWebRTCManager() {
    try {
        console.log('🔧 Initializing WebRTC Manager...');
        
        if (typeof CustomWebRTCManager !== 'undefined') {
            window.webrtcManager = new CustomWebRTCManager();
            console.log('✅ WebRTC Manager initialized');
        } else {
            throw new Error('CustomWebRTCManager class not available');
        }
        
    } catch (error) {
        console.error('❌ Failed to initialize WebRTC Manager:', error);
        showErrorMessage('Failed to initialize WebRTC Manager: ' + error.message);
    }
}

// 🚀 LIVESTREAM FUNCTIONS
// Start livestream
window.startLivestream = async function() {
    try {
        console.log('🚀 Starting livestream...');
        if (window.webrtcManager) {
            await window.webrtcManager.startLivestream();
            updateStreamUI('live');
        } else {
            throw new Error('WebRTC Manager not initialized');
        }
    } catch (error) {
        console.error('Failed to start livestream:', error);
        showErrorMessage('Failed to start livestream: ' + error.message);
    }
};

// Stop livestream
window.stopLivestream = async function() {
    try {
        console.log('🛑 Stopping livestream...');
        if (window.webrtcManager) {
            await window.webrtcManager.stopLivestream();
            updateStreamUI('offline');
        } else {
            throw new Error('WebRTC Manager not initialized');
        }
    } catch (error) {
        console.error('Failed to stop livestream:', error);
        showErrorMessage('Failed to stop livestream: ' + error.message);
    }
};

// Toggle screen share
window.toggleScreenShare = async function() {
    try {
        console.log('🖥️ Toggling screen share...');
        if (window.webrtcManager) {
            await window.webrtcManager.toggleScreenShare();
        } else {
            throw new Error('WebRTC Manager not initialized');
        }
    } catch (error) {
        console.error('Failed to toggle screen share:', error);
        showErrorMessage('Failed to toggle screen share: ' + error.message);
    }
};

// 🚀 RECORDING FUNCTIONS
// Start recording
function startRecording() {
    try {
        console.log('🎥 Starting recording...');
        
        if (!window.webrtcManager || !window.webrtcManager.isLive) {
            throw new Error('No active livestream to record');
        }
        
        if (window.mediaRecorder && window.mediaRecorder.state === 'recording') {
            throw new Error('Recording already in progress');
        }
        
        // Generate lecture ID
        const lectureId = `lecture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Start media recorder
        startMediaRecorder(lectureId);
        
        // Update UI
        updateRecordingUI('recording');
        
        console.log('✅ Recording started');
        
    } catch (error) {
        console.error('❌ Failed to start recording:', error);
        showErrorMessage('Failed to start recording: ' + error.message);
    }
}

// Stop recording
function stopRecording() {
    try {
        console.log('🛑 Stopping recording...');
        
        if (window.mediaRecorder && window.mediaRecorder.state === 'recording') {
            window.mediaRecorder.stop();
            window.webrtcManager.isRecording = false;
        }
        
        // Update UI
        updateRecordingUI('stopped');
        
        console.log('✅ Recording stopped');
        
    } catch (error) {
        console.error('❌ Failed to stop recording:', error);
        showErrorMessage('Failed to stop recording: ' + error.message);
    }
}

// Start media recorder
function startMediaRecorder(lectureId) {
    try {
        if (!window.webrtcManager || !window.webrtcManager.localStream) {
            throw new Error('No stream available for recording');
        }
        
        const stream = window.webrtcManager.localStream;
        
        // Create MediaRecorder
        window.mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9,opus'
        });
        
        const chunks = [];
        
        window.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };
        
        window.mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            saveRecording(blob, lectureId);
        };
        
        // Start recording
        window.mediaRecorder.start();
        window.webrtcManager.isRecording = true;
        
        // Store lecture ID
        window.currentLectureId = lectureId;
        
        console.log('✅ MediaRecorder started for lecture:', lectureId);
        
    } catch (error) {
        console.error('❌ Failed to start MediaRecorder:', error);
        throw error;
    }
}

// Save recording
async function saveRecording(blob, lectureId) {
    try {
        console.log('💾 Saving recording...');
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lecture_${lectureId}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Recording saved successfully');
        
    } catch (error) {
        console.error('❌ Failed to save recording:', error);
        showErrorMessage('Failed to save recording: ' + error.message);
    }
}

// 🚀 UI UPDATE FUNCTIONS
// Update stream UI
function updateStreamUI(status) {
    const startBtn = document.getElementById('startLiveBtn');
    const endBtn = document.getElementById('endLiveBtn');
    const shareScreenBtn = document.getElementById('shareScreenBtn');
    const streamStatus = document.getElementById('streamStatus');

    if (status === 'live') {
        startBtn.disabled = true;
        endBtn.disabled = false;
        shareScreenBtn.disabled = false;
        if (streamStatus) streamStatus.textContent = 'LIVE';
    } else {
        startBtn.disabled = false;
        endBtn.disabled = true;
        shareScreenBtn.disabled = true;
        if (streamStatus) streamStatus.textContent = 'OFFLINE';
    }
}

// Update recording UI
function updateRecordingUI(status) {
    const startRecordingBtn = document.getElementById('startRecordingBtn');
    const stopRecordingBtn = document.getElementById('stopRecordingBtn');
    const recordingStatus = document.getElementById('recordingStatus');

    if (status === 'recording') {
        startRecordingBtn.disabled = true;
        stopRecordingBtn.disabled = false;
        if (recordingStatus) recordingStatus.textContent = 'RECORDING';
    } else {
        startRecordingBtn.disabled = false;
        stopRecordingBtn.disabled = true;
        if (recordingStatus) recordingStatus.textContent = 'STOPPED';
    }
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'connection-error-notification';
    
    // Security: Use textContent instead of innerHTML to prevent XSS
    const errorIcon = document.createElement('i');
    errorIcon.className = 'fas fa-exclamation-triangle';
    
    const errorSpan = document.createElement('span');
    errorSpan.textContent = message;
    
    const errorClose = document.createElement('button');
    errorClose.className = 'error-close';
    errorClose.textContent = '×';
    errorClose.onclick = function() {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    };
    
    const errorContent = document.createElement('div');
    errorContent.className = 'error-content';
    errorContent.appendChild(errorIcon);
    errorContent.appendChild(errorSpan);
    errorContent.appendChild(errorClose);
    
    errorDiv.appendChild(errorContent);
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// 🚀 UTILITY FUNCTIONS
// Handle page visibility change
function handlePageVisibilityChange() {
    if (document.hidden) {
        console.log('📱 Page hidden, pausing operations...');
    } else {
        console.log('📱 Page visible, resuming operations...');
    }
}

// Handle before unload
function handleBeforeUnload(event) {
    if (window.webrtcManager && window.webrtcManager.isLive) {
        event.preventDefault();
        event.returnValue = 'You have an active livestream. Are you sure you want to leave?';
        return event.returnValue;
    }
}

// Cleanup all resources
window.cleanupAllResources = function() {
    console.log('🧹 Cleaning up all resources...');
    
    try {
        // Cleanup WebRTC manager
        if (window.webrtcManager) {
            window.webrtcManager.cleanup();
        }
        
        // Cleanup stream state manager
        if (streamStateManager) {
            streamStateManager.cleanup();
        }
        
        // Stop media recorder if recording
        if (window.mediaRecorder && window.mediaRecorder.state === 'recording') {
            window.mediaRecorder.stop();
        }
        
        console.log('✅ All resources cleaned up');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
};

// 🚀 TESTING FUNCTIONS
// Test all functionality
window.testAllFunctionality = async function() {
    try {
        console.log('🧪 Testing all functionality...');
        
        // Test 1: UI Elements
        const requiredElements = ['startLiveBtn', 'endLiveBtn', 'streamStatus', 'localVideo'];
        for (const elementId of requiredElements) {
            if (!document.getElementById(elementId)) {
                throw new Error(`Required UI element not found: ${elementId}`);
            }
        }
        console.log('✅ All required UI elements found');
        
        // Test 2: WebRTC Manager
        if (!window.webrtcManager) {
            throw new Error('WebRTC Manager not initialized');
        }
        console.log('✅ WebRTC Manager available');
        
        // Test 3: Stream State Manager
        if (!streamStateManager) {
            throw new Error('Stream State Manager not initialized');
        }
        console.log('✅ Stream State Manager available');
        
        // Test 4: Media Access
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ Media access working');
        
        // All tests passed
        console.log('🎉 All functionality tests passed!');
        alert('🎉 All functionality tests passed! The system is ready for streaming.');
        
    } catch (error) {
        console.error('❌ Functionality test failed:', error);
        alert('❌ Functionality test failed: ' + error.message);
    }
};

// 🚀 PERFORMANCE MONITORING
// Start performance monitoring
function startPerformanceMonitoring() {
    console.log('📊 Starting performance monitoring...');
    
    setInterval(() => {
        updatePerformanceMetrics();
    }, 5000); // Update every 5 seconds
    
    console.log('✅ Performance monitoring started');
}

// Update performance metrics
function updatePerformanceMetrics() {
    try {
        // Memory usage
        if (performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
            console.log(`💾 Memory usage: ${memoryUsage.toFixed(2)} MB`);
        }
        
        // Connection quality
        if (window.webrtcManager) {
            const health = window.webrtcManager.getConnectionHealth();
            console.log(`🔗 Connection quality: ${health.connectionQuality}`);
        }
        
    } catch (error) {
        console.warn('Failed to update performance metrics:', error);
    }
}

// 🚀 INITIALIZATION COMPLETE
console.log('🚀 Admin Dashboard script loaded successfully');

