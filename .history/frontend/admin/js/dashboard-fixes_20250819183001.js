// SCREEN SHARING RECORDING FIXES FOR dashboard.js
// Apply these fixes to fix the issue where recording only captures audio, not screen sharing video

// FIX 1: Enhanced createMixedStreamForRecording function
function createMixedStreamForRecording(adminStream) {
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
}

// FIX 2: Enhanced startMediaRecorder function debugging
function startMediaRecorder(lectureId) {
    try {
        console.log('🎬 Starting MediaRecorder for lecture:', lectureId);
        
        // Get the active stream (either camera or screen)
        const activeStream = screenStream || localStream;
        
        if (!activeStream) {
            throw new Error('No active stream available for recording');
        }

        // Enhanced debugging for screen sharing recording
        console.log('🎬 Recording stream selection:', {
            usingScreenStream: !!screenStream,
            usingLocalStream: !screenStream && !!localStream,
            screenStreamTracks: screenStream ? screenStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })) : 'none',
            localStreamTracks: localStream ? localStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })) : 'none',
            activeStreamTracks: activeStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })),
            isScreenSharing: window.isScreenSharing
        });

        // Create a mixed stream for recording that includes admin audio/video + user audio
        const mixedStream = createMixedStreamForRecording(activeStream);
        
        if (!mixedStream) {
            throw new Error('Failed to create mixed stream for recording');
        }

        // Verify mixed stream has video before proceeding
        if (mixedStream.getVideoTracks().length === 0) {
            console.error('❌ CRITICAL ERROR: Mixed stream has no video tracks!');
            console.error('❌ Recording will be audio-only!');
            console.error('❌ Screen sharing may not be working properly!');
            
            // Try to diagnose the issue
            if (screenStream && screenStream.getVideoTracks().length > 0) {
                console.log('🔍 Screen stream has video tracks, but they were not added to mixed stream');
                console.log('🔍 Screen stream video tracks:', screenStream.getVideoTracks().map(t => ({ enabled: t.enabled, readyState: t.readyState })));
            }
            
            if (localStream && localStream.getVideoTracks().length > 0) {
                console.log('🔍 Local stream has video tracks, but they were not added to mixed stream');
                console.log('🔍 Local stream video tracks:', localStream.getVideoTracks().map(t => ({ enabled: t.enabled, readyState: t.readyState })));
            }
        }

        // Continue with existing MediaRecorder setup...
        // [Rest of the function remains the same]
        
    } catch (error) {
        console.error('❌ Error starting MediaRecorder:', error);
        alert('Failed to start recording: ' + error.message);
    }
}

// FIX 3: Enhanced screen sharing start function
function startScreenShare() {
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        .then(stream => {
            screenStream = stream;
            
            console.log('🖥️ Screen sharing started successfully');
            console.log('🖥️ Screen stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
            
            // Update local video display
            document.getElementById('localVideo').srcObject = stream;
            document.getElementById('shareScreenBtn').textContent = 'Stop Sharing';
            isScreenSharing = true;
            
            // Update admin audio to screen stream if it has audio
            const adminAudio = document.getElementById('adminAudio');
            if (adminAudio && stream.getAudioTracks().length > 0) {
                adminAudio.srcObject = stream;
                console.log('🎤 Updated admin audio to screen stream');
            }
            
            // Update all existing peer connections with screen stream
            Object.keys(peerConnections).forEach(socketId => {
                const pc = peerConnections[socketId];
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
            
            // Handle screen share stop
            stream.getVideoTracks()[0].onended = () => {
                console.log('🖥️ Screen sharing ended by user');
                stopScreenShare();
            };
            
            console.log('✅ Screen sharing setup complete');
            
        })
        .catch(error => {
            console.error('❌ Error sharing screen:', error);
            alert('Error sharing screen. Please try again.');
        });
}

// FIX 4: Debug function to check recording state
function debugRecordingState() {
    console.log('=== RECORDING STATE DEBUG ===');
    console.log('isScreenSharing:', window.isScreenSharing);
    console.log('screenStream:', window.screenStream);
    console.log('localStream:', window.localStream);
    console.log('mediaRecorder:', window.mediaRecorder);
    
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
    
    console.log('User audio streams:', window.userAudioStreams);
    console.log('========================');
}

// Add to window for console access
window.debugRecordingState = debugRecordingState;
