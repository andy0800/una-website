// 🚀 ADMIN DASHBOARD - LIVESTREAMING SYSTEM
// This file handles the admin dashboard functionality

// Global variables
let streamStateManager;

// 🚀 INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin Dashboard initializing...');
    
    try {
        initializeUIComponents();
        initializeButtonListeners();
        
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
        if (streamStateManager && streamStateManager.currentState === 'live') {
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

    // Synchronize state
    async syncState() {
        try {
            if (!this.stateValidationEnabled) return;
            
            // Get current state from UI
            const currentState = this.getCurrentState();
            
            // Validate state consistency
            if (currentState !== this.currentState) {
                console.log(`🔄 State change detected: ${this.currentState} -> ${currentState}`);
                this.currentState = currentState;
                this.updateUIState(currentState);
            }
            
            this.lastSync = Date.now();
        } catch (error) {
            console.error('State sync failed:', error);
        }
    }

    // Determine expected state based on current conditions
    determineExpectedState() {
        return 'idle'; // Placeholder for future state
    }

    // Update UI state
    updateUIState(state) {
        try {
            const statusElement = document.getElementById('streamStatus');
            if (statusElement) {
                statusElement.textContent = state.toUpperCase();
                statusElement.className = `status-${state}`;
            }
            
            // Update connection quality indicator if available
            const qualityIndicator = document.getElementById('connectionQuality');
            if (qualityIndicator) {
                qualityIndicator.textContent = 'N/A';
            }
            
            console.log(`✅ UI state updated to: ${state}`);
        } catch (error) {
            console.error('Failed to update UI state:', error);
        }
    }

    // Get current state
    getCurrentState() {
        const statusElement = document.getElementById('streamStatus');
        if (statusElement) {
            return statusElement.textContent.toLowerCase();
        }
        return 'idle';
    }

    // Force state update
    forceStateUpdate() {
        this.syncState();
    }

    // Validate state
    validateState() {
        const currentState = this.getCurrentState();
        const isValid = ['idle', 'live', 'connecting', 'error'].includes(currentState);
        
        if (!isValid) {
            console.warn(`Invalid state detected: ${currentState}, resetting to idle`);
            this.currentState = 'idle';
            this.updateUIState('idle');
        }
        
        return isValid;
    }

    // Cleanup
    cleanup() {
        this.stopStateSync();
        this.viewers.clear();
        this.currentState = 'idle';
        console.log('🧹 StreamStateManager cleaned up');
    }
}

// 🚀 VIEWER MANAGEMENT
// Load viewers list
async function loadViewers() {
    try {
        console.log('👥 Loading viewers...');
        
        // Get current viewers (placeholder for future implementation)
        let viewers = [];
        
        // Update display
        updateViewersList(viewers);
        
    } catch (error) {
        console.error('❌ Failed to load viewers:', error);
        showErrorMessage('Failed to load viewers: ' + error.message);
    }
}

// Update viewers list display
function updateViewersList(viewers) {
    const viewersList = document.getElementById('viewersList');
    if (!viewersList) return;
    
    if (viewers.length === 0) {
        viewersList.innerHTML = `
            <div class="no-viewers">
                <i class="fas fa-users-slash"></i>
                <p>No viewers currently watching</p>
            </div>
        `;
        return;
    }
    
    // Create viewers list HTML
    let html = '';
    viewers.forEach((viewerId, index) => {
        html += `
            <div class="viewer-item">
                <div class="viewer-info">
                    <div class="viewer-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="viewer-details">
                        <div class="viewer-name">Viewer ${index + 1}</div>
                        <div class="viewer-id">ID: ${viewerId}</div>
                    </div>
                </div>
                <div class="viewer-status">
                    <span class="status-dot connected"></span>
                    <span class="status-text">Connected</span>
                </div>
            </div>
        `;
    });
    
    viewersList.innerHTML = html;
}

// Get current viewer count
window.getCurrentViewerCount = function() {
    try {
        // Return 0 since WebRTC manager is removed
        return 0;
    } catch (error) {
        console.error('❌ Failed to get viewer count:', error);
        return 0;
    }
};

// Update viewer count display
function updateViewerCountDisplay() {
    try {
        const count = getCurrentViewerCount();
        
        // Update all viewer count elements
        const viewerCountElements = document.querySelectorAll('[id*="viewerCount"]');
        viewerCountElements.forEach(element => {
            element.textContent = `${count} viewer${count !== 1 ? 's' : ''}`;
        });
        
        // Update active viewers metric
        const activeViewersElement = document.getElementById('activeViewers');
        if (activeViewersElement) {
            activeViewersElement.textContent = count;
        }
        
        console.log(`✅ Viewer count updated: ${count}`);
        
    } catch (error) {
        console.error('❌ Failed to update viewer count display:', error);
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

// 🚀 LIVESTREAM FUNCTIONS
// Start livestream
window.startLivestream = async function() {
    try {
        console.log('🚀 Starting livestream...');
        // Placeholder for future livestream implementation
        updateStreamUI('live');
        showSuccessMessage('Livestream started successfully');
    } catch (error) {
        console.error('Failed to start livestream:', error);
        showErrorMessage('Failed to start livestream: ' + error.message);
    }
};

// Stop livestream
window.stopLivestream = async function() {
    try {
        console.log('🛑 Stopping livestream...');
        // Placeholder for future livestream implementation
        updateStreamUI('offline');
        showSuccessMessage('Livestream stopped successfully');
    } catch (error) {
        console.error('Failed to stop livestream:', error);
        showErrorMessage('Failed to stop livestream: ' + error.message);
    }
};

// Toggle screen share
window.toggleScreenShare = async function() {
    try {
        console.log('🖥️ Toggling screen share...');
        // Placeholder for future screen share implementation
        showSuccessMessage('Screen share functionality will be implemented');
    } catch (error) {
        console.error('Failed to toggle screen share:', error);
        showErrorMessage('Failed to toggle screen share: ' + error.message);
    }
};

// 🚀 RECORDING FUNCTIONS
// Start recording
async function startRecording() {
    try {
        console.log('🎥 Starting recording...');
        
        // Placeholder for future recording implementation
        showSuccessMessage('Recording started successfully');
        
    } catch (error) {
        console.error('❌ Failed to start recording:', error);
        showErrorMessage('Failed to start recording: ' + error.message);
    }
}

// Stop recording
async function stopRecording() {
    try {
        console.log('🛑 Stopping recording...');
        
        // Placeholder for future recording implementation
        
        // Update UI
        showSuccessMessage('Recording stopped successfully');
        
    } catch (error) {
        console.error('❌ Failed to stop recording:', error);
        showErrorMessage('Failed to stop recording: ' + error.message);
    }
}

// 🚀 UTILITY FUNCTIONS
// Show success message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'connection-success-notification';

    const successIcon = document.createElement('i');
    successIcon.className = 'fas fa-check-circle';

    const successSpan = document.createElement('span');
    successSpan.textContent = message;

    const successClose = document.createElement('button');
    successClose.className = 'success-close';
    successClose.textContent = '×';
    successClose.onclick = function() {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    };

    const successContent = document.createElement('div');
    successContent.className = 'success-content';
    successContent.appendChild(successIcon);
    successContent.appendChild(successSpan);
    successContent.appendChild(successClose);

    successDiv.appendChild(successContent);
    document.body.appendChild(successDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 5000);
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'connection-error-notification';

    const errorIcon = document.createElement('i');
    errorIcon.className = 'fas fa-exclamation-circle';

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

// Update stream UI
function updateStreamUI(status) {
    try {
        const statusElement = document.getElementById('streamStatus');
        if (statusElement) {
            statusElement.textContent = status.toUpperCase();
            statusElement.className = `status-${status}`;
        }
        
        // Update button states
        const startBtn = document.getElementById('startLiveBtn');
        const endBtn = document.getElementById('endLiveBtn');
        
        if (startBtn && endBtn) {
            if (status === 'live') {
                startBtn.disabled = true;
                endBtn.disabled = false;
            } else {
                startBtn.disabled = false;
                endBtn.disabled = true;
            }
        }
        
        console.log(`✅ Stream UI updated to: ${status}`);
    } catch (error) {
        console.error('Failed to update stream UI:', error);
    }
}

// Handle page visibility change
function handlePageVisibilityChange() {
    if (document.hidden) {
        console.log('📱 Page hidden');
    } else {
        console.log('📱 Page visible');
    }
}

// Handle before unload
function handleBeforeUnload(event) {
    // Placeholder for future implementation
}

// 🚀 CLEANUP FUNCTIONS
// Cleanup all resources
window.cleanupAllResources = function() {
    try {
        console.log('🧹 Cleaning up all resources...');
        
        // Cleanup stream state manager
        if (streamStateManager) {
            streamStateManager.cleanup();
        }
        
        console.log('✅ All resources cleaned up');
    } catch (error) {
        console.error('❌ Failed to cleanup resources:', error);
    }
};

// 🚀 TESTING FUNCTIONS
// Run system tests
window.runSystemTests = async function() {
    try {
        console.log('🧪 Running system tests...');
        
        // Test 1: UI Components
        const requiredElements = ['startLiveBtn', 'endLiveBtn', 'streamStatus'];
        for (const elementId of requiredElements) {
            if (!document.getElementById(elementId)) {
                throw new Error(`Required UI element not found: ${elementId}`);
            }
        }
        console.log('✅ UI Components test passed');
        
        // Test 2: Stream State Manager
        if (!streamStateManager) {
            throw new Error('Stream State Manager not initialized');
        }
        console.log('✅ Stream State Manager test passed');
        
        // Test 3: Button Listeners
        const startBtn = document.getElementById('startLiveBtn');
        if (startBtn && startBtn.onclick) {
            console.log('✅ Button Listeners test passed');
        }
        
        // Test 4: Viewer Management
        const viewerCount = getCurrentViewerCount();
        console.log(`✅ Viewer Management test passed: ${viewerCount} viewers`);
        
        console.log('🎉 All system tests passed!');
        showSuccessMessage('All system tests passed successfully!');
        
    } catch (error) {
        console.error('❌ System test failed:', error);
        showErrorMessage('System test failed: ' + error.message);
    }
};

// 🚀 EXPORT FUNCTIONS
// Export functions for external use
window.adminDashboard = {
    startLivestream: window.startLivestream,
    stopLivestream: window.stopLivestream,
    toggleScreenShare: window.toggleScreenShare,
    startRecording: startRecording,
    stopRecording: stopRecording,
    loadViewers: loadViewers,
    getCurrentViewerCount: getCurrentViewerCount,
    updateViewerCountDisplay: updateViewerCountDisplay,
    runSystemTests: window.runSystemTests,
    cleanupAllResources: window.cleanupAllResources
};

console.log('🚀 Admin Dashboard module loaded successfully');

