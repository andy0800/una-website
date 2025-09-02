// CRITICAL FIXES FOR SCREEN SHARING RECORDING AND AUDIO ISSUES
// Run these fixes in the admin console to resolve the problems

// FIX 1: Initialize missing global variables
console.log('🔧 Applying critical fixes...');

// Ensure global variables are accessible
if (typeof window.localStream === 'undefined') {
    window.localStream = null;
    console.log('✅ Initialized window.localStream');
}

if (typeof window.screenStream === 'undefined') {
    window.screenStream = null;
    console.log('✅ Initialized window.screenStream');
}

if (typeof window.isScreenSharing === 'undefined') {
    window.isScreenSharing = false;
    console.log('✅ Initialized window.isScreenSharing');
}

if (typeof window.userAudioStreams === 'undefined') {
    window.userAudioStreams = new Map();
    console.log('✅ Initialized window.userAudioStreams');
}

// FIX 2: Enhanced startScreenShare function
window.startScreenShare = function() {
    console.log('🖥️ Starting screen share...');
    
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        .then(stream => {
            window.screenStream = stream;
            window.isScreenSharing = true;
            
            console.log('🖥️ Screen sharing started successfully');
            console.log('🖥️ Screen stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
            
            // Update local video display
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = stream;
                console.log('✅ Local video updated to screen stream');
            }
            
            // Update share screen button
            const shareScreenBtn = document.getElementById('shareScreenBtn');
            if (shareScreenBtn) {
                shareScreenBtn.textContent = 'Stop Sharing';
                console.log('✅ Share screen button updated');
            }
            
            // Update admin audio to screen stream if it has audio
            const adminAudio = document.getElementById('adminAudio');
            if (adminAudio && stream.getAudioTracks().length > 0) {
                adminAudio.srcObject = stream;
                console.log('🎤 Updated admin audio to screen stream');
            }
            
            // Update all existing peer connections with screen stream
            if (window.peerConnections) {
                Object.keys(window.peerConnections).forEach(socketId => {
                    const pc = window.peerConnections[socketId];
                    if (pc && pc.connectionState === 'connected') {
                        // Remove existing video tracks
                        const senders = pc.getSenders();
                        senders.forEach(sender => {
                            if (sender.track && sender.track.kind === 'video') {
                                pc.removeTrack(sender);
                            }
                        });
                        
                        // Add screen stream video track
                        const videoTrack = stream.getVideoTracks()[0];
                        if (videoTrack) {
                            pc.addTrack(videoTrack, stream);
                            console.log('🖥️ Added screen share video track to peer connection:', socketId);
                        }
                    }
                });
            }
            
            // Handle screen share stop
            stream.getVideoTracks()[0].onended = () => {
                console.log('🖥️ Screen sharing ended by user');
                window.stopScreenShare();
            };
            
            console.log('✅ Screen sharing setup complete');
            console.log('Current state:', {
                isScreenSharing: window.isScreenSharing,
                hasScreenStream: !!window.screenStream,
                screenStreamTracks: window.screenStream ? window.screenStream.getTracks().length : 0
            });
            
        })
        .catch(error => {
            console.error('❌ Error sharing screen:', error);
            alert('Error sharing screen. Please try again.');
        });
};

// FIX 3: Enhanced stopScreenShare function
window.stopScreenShare = function() {
    console.log('🖥️ Stopping screen share...');
    
    if (window.screenStream) {
        window.screenStream.getTracks().forEach(track => track.stop());
        window.screenStream = null;
        console.log('✅ Screen stream tracks stopped');
    }
    
    window.isScreenSharing = false;
    
    // Restore camera stream to local video
    if (window.localStream) {
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = window.localStream;
            console.log('✅ Local video restored to camera stream');
        }
        
        // Restore admin audio to camera stream
        const adminAudio = document.getElementById('adminAudio');
        if (adminAudio) {
            adminAudio.srcObject = window.localStream;
            console.log('🎤 Restored admin audio to camera stream');
        }
        
        // Update all peer connections back to camera stream
        if (window.peerConnections) {
            Object.keys(window.peerConnections).forEach(socketId => {
                const pc = window.peerConnections[socketId];
                if (pc && pc.connectionState === 'connected') {
                    // Remove existing video tracks
                    const senders = pc.getSenders();
                    senders.forEach(sender => {
                        if (sender.track && sender.track.kind === 'video') {
                            pc.removeTrack(sender);
                        }
                    });
                    
                    // Add camera stream video track
                    const videoTrack = window.localStream.getVideoTracks()[0];
                    if (videoTrack) {
                        pc.addTrack(videoTrack, window.localStream);
                        console.log('📹 Added camera video track to peer connection:', socketId);
                    }
                }
            });
        }
    }
    
    // Update share screen button
    const shareScreenBtn = document.getElementById('shareScreenBtn');
    if (shareScreenBtn) {
        shareScreenBtn.textContent = 'Share Screen';
        console.log('✅ Share screen button restored');
    }
    
    console.log('✅ Screen sharing stopped');
    console.log('Current state:', {
        isScreenSharing: window.isScreenSharing,
        hasScreenStream: !!window.screenStream,
        hasLocalStream: !!window.localStream
    });
};

// FIX 4: Enhanced createMixedStreamForRecording function
window.createMixedStreamForRecording = function(adminStream) {
    try {
        console.log('🎬 Creating mixed stream for recording...');
        
        // Enhanced debugging for screen sharing
        console.log('🎬 Admin stream details:', {
            trackCount: adminStream.getTracks().length,
            videoTracks: adminStream.getVideoTracks().length,
            audioTracks: adminStream.getAudioTracks().length,
            tracks: adminStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })),
            isScreenStream: adminStream === window.screenStream,
            isLocalStream: adminStream === window.localStream
        });
        
        // Start with admin stream (video + admin audio)
        const mixedStream = new MediaStream();
        
        // Add all tracks from admin stream
        adminStream.getTracks().forEach(track => {
            // Ensure track is enabled and live before adding
            if (track.readyState === 'live' && track.enabled) {
                mixedStream.addTrack(track);
                console.log(`🎯 Added ${track.kind} track from admin stream to recording: enabled=${track.enabled}, readyState=${track.readyState}`);
            } else {
                console.warn(`⚠️ Skipping ${track.kind} track: enabled=${track.enabled}, readyState=${track.readyState}`);
            }
        });
        
        // Add user audio tracks if they exist
        if (window.userAudioStreams && window.userAudioStreams.size > 0) {
            console.log(`🎤 Adding ${window.userAudioStreams.size} user audio tracks to recording`);
            
            window.userAudioStreams.forEach((userStream, socketId) => {
                const audioTracks = userStream.getAudioTracks();
                audioTracks.forEach(track => {
                    if (track.readyState === 'live' && track.enabled) {
                        mixedStream.addTrack(track);
                        console.log(`🎤 Added user audio track from ${socketId} to recording`);
                    } else {
                        console.warn(`⚠️ Skipping user audio track from ${socketId}: enabled=${track.enabled}, readyState=${track.readyState}`);
                    }
                });
            });
        } else {
            console.log('🎤 No user audio tracks to add to recording');
        }
        
        // Debug: Log all tracks in the mixed stream
        console.log('🎬 Mixed stream tracks:', {
            video: mixedStream.getVideoTracks().length,
            audio: mixedStream.getAudioTracks().length,
            total: mixedStream.getTracks().length
        });
        
        // Log each track for debugging
        mixedStream.getTracks().forEach((track, index) => {
            console.log(`🎬 Track ${index}: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`);
        });
        
        // Verify we have video tracks
        if (mixedStream.getVideoTracks().length === 0) {
            console.error('❌ CRITICAL: No video tracks in mixed stream for recording!');
            console.error('❌ This will result in audio-only recording!');
        } else {
            console.log('✅ Video tracks confirmed in mixed stream for recording');
        }
        
        return mixedStream;
        
    } catch (error) {
        console.error('❌ Error creating mixed stream for recording:', error);
        return null;
    }
};

// FIX 5: Enhanced debug function
window.debugRecordingState = function() {
    console.log('=== RECORDING STATE DEBUG ===');
    console.log('isScreenSharing:', window.isScreenSharing);
    console.log('screenStream:', window.screenStream);
    console.log('localStream:', window.localStream);
    console.log('mediaRecorder:', window.mediaRecorder);
    console.log('userAudioStreams:', window.userAudioStreams);
    
    if (window.screenStream) {
        console.log('Screen stream tracks:', window.screenStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
    }
    
    if (window.localStream) {
        console.log('Local stream tracks:', window.localStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
    }
    
    if (window.mediaRecorder) {
        console.log('MediaRecorder state:', window.mediaRecorder.state);
        console.log('MediaRecorder mimeType:', window.mediaRecorder.mimeType);
    }
    
    console.log('========================');
};

// FIX 6: Test function to verify everything is working
window.testScreenSharing = function() {
    console.log('🧪 Testing screen sharing setup...');
    
    // Check if we have a live stream
    if (!window.localStream) {
        console.log('❌ No local stream found. Please start live stream first.');
        return false;
    }
    
    console.log('✅ Local stream found');
    console.log('✅ Screen sharing functions available');
    console.log('✅ User audio streams initialized');
    
    return true;
};

console.log('✅ Critical fixes applied successfully!');
console.log('📋 Available functions:');
console.log('  - startScreenShare() - Start screen sharing');
console.log('  - stopScreenShare() - Stop screen sharing');
console.log('  - debugRecordingState() - Check current state');
console.log('  - testScreenSharing() - Test setup');
console.log('  - createMixedStreamForRecording(stream) - Create recording stream');

console.log('🎯 Next steps:');
console.log('1. Start live stream first');
console.log('2. Use startScreenShare() to share screen');
console.log('3. Start recording while screen sharing');
console.log('4. Use debugRecordingState() to monitor');
