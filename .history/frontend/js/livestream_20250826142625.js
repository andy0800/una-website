// frontend/js/livestream.js
(() => {
  async function init() {
    // Production-ready: Console logging removed
    
    // Initialize socket connection with better error handling
    let socket;
    try {
      const serverUrl = window.location.origin;
      // Production-ready: Console logging removed
      
      socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });
      
      // Production-ready: Console logging removed
    } catch (error) {
      console.error('❌ Failed to create Socket.IO connection:', error);
      alert('Failed to connect to streaming server. Please refresh the page.');
      return;
    }
    
    const remoteVideo = document.getElementById('viewerVideo');
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const micBtn = document.getElementById('requestMicBtn');
    const muteBtn = document.getElementById('muteBtn');
    const unmuteBtn = document.getElementById('unmuteBtn');
    const liveMsg = document.getElementById('liveMessage');
    const liveContainer = document.getElementById('liveContainer');
    const micRequest = document.getElementById('mic-request');
    const streamStatus = document.getElementById('streamStatus');

         let isConnected = false;
     let isMuted = false;
     let peerConnection = null;
     let userMicrophoneStream = null; // Store user's microphone stream
     let microphonePermission = 'unknown'; // Track microphone permission status

         // Update stream status
     function updateStreamStatus(status, color = '#dc3545') {
         if (streamStatus) {
             streamStatus.textContent = status;
             streamStatus.style.background = color;
         }
     }
     
     // Check and update microphone permission status
     async function checkMicrophonePermission() {
         if (navigator.permissions && navigator.permissions.query) {
             try {
                 const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
                 microphonePermission = permissionStatus.state;
                 // Production-ready: Console logging removed
                 
                 // Update UI based on permission status
                 if (micBtn) {
                     if (microphonePermission === 'denied') {
                         micBtn.textContent = '🔒 Mic Blocked';
                         micBtn.disabled = true;
                         micBtn.style.background = '#dc3545';
                         micBtn.title = 'Microphone access is blocked. Please enable it in browser settings.';
                     } else if (microphonePermission === 'granted') {
                         micBtn.textContent = '🎤 Request to Speak';
                         micBtn.disabled = false;
                         micBtn.style.background = '';
                         micBtn.title = 'Click to request microphone access';
                     } else {
                         micBtn.textContent = '🎤 Request to Speak';
                         micBtn.disabled = false;
                         micBtn.style.background = '';
                         micBtn.title = 'Click to request microphone access';
                     }
                 }
                 
                 return microphonePermission;
             } catch (error) {
                 console.warn('⚠️ Could not check microphone permission:', error);
                 return 'unknown';
             }
         }
         return 'unknown';
     }

         // Create WebRTC peer connection
     function createPeerConnection() {
       // 🔧 MOBILE WEBRTC CONFIGURATION
       const browserInfo = getBrowserInfo();
       let rtcConfig = {
         iceServers: [
           { urls: 'stun:stun.l.google.com:19302' },
           { urls: 'stun:stun1.l.google.com:19302' }
         ]
       };
       
       // Mobile-specific WebRTC configuration
       if (browserInfo.isMobile) {
         console.log('📱 Applying mobile WebRTC configuration...');
         rtcConfig = {
           ...rtcConfig,
           iceTransportPolicy: 'all',
           bundlePolicy: 'max-bundle',
           rtcpMuxPolicy: 'require',
           // Mobile-friendly constraints
           iceCandidatePoolSize: 0
         };
       }
       
       const pc = new RTCPeerConnection(rtcConfig);

      // Handle incoming tracks (video/audio)
      pc.ontrack = (event) => {
        // Production-ready: Console logging removed
        
        if (event.track.kind === 'video') {
          // Handle video track
          if (remoteVideo) {
            // Create a new MediaStream with all tracks
            if (!remoteVideo.srcObject) {
              remoteVideo.srcObject = new MediaStream();
            }
            remoteVideo.srcObject.addTrack(event.track);
            updateStreamStatus('LIVE', '#28a745'); // Green for live
          }
        } else if (event.track.kind === 'audio') {
          // Handle audio track - create audio element for admin audio
          // Production-ready: Console logging removed
          
          // Create audio element for admin audio if it doesn't exist
          if (!window.adminAudioElement) {
            window.adminAudioElement = document.createElement('audio');
            window.adminAudioElement.autoplay = true;
            window.adminAudioElement.controls = false;
            window.adminAudioElement.style.display = 'none';
            window.adminAudioElement.volume = 1.0; // Ensure full volume
            document.body.appendChild(window.adminAudioElement);
            // Production-ready: Console logging removed
          }
          
          // Add audio track to admin audio element
          const audioStream = new MediaStream([event.track]);
          window.adminAudioElement.srcObject = audioStream;
          
          // 🔧 CRITICAL FIX: Handle autoplay restrictions with user interaction
          const playPromise = window.adminAudioElement.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('✅ Admin audio playing successfully');
            }).catch(error => {
              console.warn('⚠️ Could not autoplay admin audio:', error);
              
              // 🔧 AUTOPLAY FIX: Create user interaction audio activation system
              if (!window.audioActivationSetup) {
                window.audioActivationSetup = true;
                
                // Method 1: Click anywhere to activate audio
                const clickHandler = () => {
                  console.log('🔧 User clicked - activating admin audio...');
                  window.adminAudioElement.play().then(() => {
                    console.log('✅ Admin audio activated via click');
                    // Remove click handler after successful activation
                    document.removeEventListener('click', clickHandler);
                    document.removeEventListener('keydown', keyHandler);
                  }).catch(e => console.warn('Still cannot play via click:', e));
                };
                
                // Method 2: Press any key to activate audio
                const keyHandler = () => {
                  console.log('🔧 User pressed key - activating admin audio...');
                  window.adminAudioElement.play().then(() => {
                    console.log('✅ Admin audio activated via keypress');
                    // Remove handlers after successful activation
                    document.removeEventListener('click', clickHandler);
                    document.removeEventListener('keydown', keyHandler);
                  }).catch(e => console.warn('Still cannot play via keypress:', e));
                };
                
                // Add event listeners
                document.addEventListener('click', clickHandler);
                document.addEventListener('keydown', keyHandler);
                
                // Method 3: Show user-friendly activation message
                const activationMsg = document.createElement('div');
                activationMsg.id = 'audioActivationMsg';
                activationMsg.style.cssText = `
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: #ffc107;
                  color: #000;
                  padding: 15px;
                  border-radius: 8px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                  z-index: 10000;
                  font-family: Arial, sans-serif;
                  font-size: 14px;
                  max-width: 300px;
                  border-left: 4px solid #ff9800;
                `;
                activationMsg.innerHTML = `
                  <strong>🔊 Audio Activation Required</strong><br>
                  Click anywhere or press any key to hear admin audio.<br>
                  <small>This is required by your browser for security.</small>
                `;
                document.body.appendChild(activationMsg);
                
                // Auto-remove message after 10 seconds
                setTimeout(() => {
                  if (activationMsg.parentNode) {
                    activationMsg.remove();
                  }
                }, 10000);
                
                console.log('🔧 Audio activation system setup complete - waiting for user interaction');
              }
            });
          }
          
                      // Production-ready: Console logging removed
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            target: 'admin',
            candidate: event.candidate
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        // Production-ready: Console logging removed
        if (pc.connectionState === 'connected') {
                      // Production-ready: Console logging removed
          updateStreamStatus('LIVE', '#28a745');
          
          // If we have a microphone stream, add it now
          if (window.userMicrophoneStream && !window.microphoneSender) {
            try {
              const audioTrack = window.userMicrophoneStream.getAudioTracks()[0];
              if (audioTrack) {
                const sender = pc.addTrack(audioTrack, window.userMicrophoneStream);
                window.microphoneSender = sender;
                // Production-ready: Console logging removed
              }
            } catch (error) {
              console.error('❌ Error adding microphone track after connection:', error);
            }
          }
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          updateStreamStatus('OFFLINE', '#dc3545');
        }
      };

      return pc;
    }

    // Handle microphone access and add to peer connection
    async function handleMicrophoneAccess() {
      try {
        console.log('🎤 handleMicrophoneAccess called');
        
        // 🔧 BROWSER-SPECIFIC MICROPHONE WORKAROUND
        const browserInfo = getBrowserInfo();
        console.log('🌐 Browser detected:', browserInfo);
        
        // 🔧 MOBILE COMPATIBILITY CHECK - PROGRESSIVE APPROACH
        if (!navigator.mediaDevices) {
          console.error('❌ navigator.mediaDevices is not supported on this device');
          
          // 🔧 MOBILE WEBRTC FALLBACK SYSTEM
          if (browserInfo.isMobile) {
            console.log('📱 Attempting mobile WebRTC fallback...');
            
            // Try to create a fallback mediaDevices object
            if (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia) {
              console.log('✅ Legacy getUserMedia found - creating fallback');
              
              // Create fallback mediaDevices
              navigator.mediaDevices = {
                getUserMedia: function(constraints) {
                  return new Promise((resolve, reject) => {
                    const getUserMedia = navigator.getUserMedia || 
                                       navigator.webkitGetUserMedia || 
                                       navigator.mozGetUserMedia;
                    
                    getUserMedia.call(navigator, constraints, resolve, reject);
                  });
                }
              };
              
              console.log('✅ Fallback mediaDevices created successfully');
            } else {
              // No fallback available
              alert('📱 Mobile Device Detected\n\n' +
                    'Microphone access requires a modern mobile browser.\n\n' +
                    'Please try:\n' +
                    '1. Update your browser to the latest version\n' +
                    '2. Use Firefox Mobile (latest version)\n' +
                    '3. Use Chrome Mobile (latest version)\n' +
                    '4. Access from a desktop computer\n\n' +
                    'You can still:\n' +
                    '✅ Watch live streams\n' +
                    '✅ Send chat messages\n' +
                    '✅ View all content');
              return false;
            }
          } else {
            alert('Microphone access is not supported on this device/browser.\n\n' +
                  'Please try using a different browser or device.');
            return false;
          }
        }
        
        // First, check if we already have permission
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
            console.log('🎤 Microphone permission status:', permissionStatus.state);
            
            if (permissionStatus.state === 'denied') {
              // Browser-specific error messages
              if (browserInfo.isChrome || browserInfo.isEdge) {
                alert('Chrome/Edge requires HTTPS for microphone access. Please use Firefox or access via HTTPS.');
              } else if (browserInfo.isSafari) {
                alert('Safari requires HTTPS for microphone access. Please use Firefox or access via HTTPS.');
              } else {
                alert('Microphone access is permanently denied. Please enable it in your browser settings and refresh the page.');
              }
              return false;
            }
          } catch (permError) {
            console.warn('⚠️ Could not check permission status:', permError);
          }
        }
        
                 // 🔧 MOBILE-OPTIMIZED AUDIO CONSTRAINTS
         let audioConstraints;
         
         if (browserInfo.isMobile) {
           console.log('📱 Using mobile-optimized audio constraints');
           audioConstraints = [
             // Mobile-optimized constraint set 1
             {
               audio: {
                 echoCancellation: false, // Disable on mobile for better performance
                 noiseSuppression: false, // Disable on mobile for better performance
                 autoGainControl: false,  // Disable on mobile for better performance
                 sampleRate: 22050,      // Lower sample rate for mobile
                 channelCount: 1
               },
               video: false
             },
             // Mobile-optimized constraint set 2
             {
               audio: {
                 echoCancellation: false,
                 noiseSuppression: false,
                 sampleRate: 16000
               },
               video: false
             },
             // Fallback for mobile
             {
               audio: true,
               video: false
             }
           ];
         } else {
           // Desktop constraints
           audioConstraints = [
             {
               audio: {
                 echoCancellation: true,
                 noiseSuppression: true,
                 autoGainControl: true,
                 sampleRate: 44100,
                 channelCount: 1
               },
               video: false
             },
             {
               audio: {
                 echoCancellation: true,
                 noiseSuppression: true
               },
               video: false
             },
             {
               audio: true,
               video: false
             }
           ];
         }
        
        let micStream = null;
        let lastError = null;
        
        // Try each constraint set until one works
        for (let i = 0; i < audioConstraints.length; i++) {
          try {
            console.log(`🎤 Trying constraint set ${i + 1}:`, audioConstraints[i]);
            micStream = await navigator.mediaDevices.getUserMedia(audioConstraints[i]);
            console.log(`✅ Constraint set ${i + 1} succeeded:`, micStream);
            break;
          } catch (error) {
            lastError = error;
            console.warn(`⚠️ Constraint set ${i + 1} failed:`, error.name);
            continue;
          }
        }
        
        if (!micStream) {
          throw lastError || new Error('All audio constraint sets failed');
        }
        
        userMicrophoneStream = micStream;
        console.log('✅ Microphone stream obtained:', micStream);
        
        // Store the microphone stream globally for later use
        window.userMicrophoneStream = micStream;
        
        // If peer connection exists, add the track immediately
        if (peerConnection) {
          const audioTrack = micStream.getAudioTracks()[0];
          if (audioTrack) {
            try {
              // Ensure the track is enabled and active
              audioTrack.enabled = true;
              console.log('✅ Audio track enabled:', audioTrack);
              
              const sender = peerConnection.addTrack(audioTrack, micStream);
              console.log('✅ Track added to peer connection, sender:', sender);
              
              // Store sender for later removal if needed
              window.microphoneSender = sender;
              
              // Verify track was added successfully
              if (sender) {
                console.log('✅ Microphone sender stored successfully');
              }
            } catch (error) {
              console.error('❌ Error adding track to peer connection:', error);
            }
          }
        } else {
          console.log('⚠️ No peer connection yet, track will be added when connection is established');
        }
        
        return true;
      } catch (error) {
        console.error('❌ Error accessing microphone:', error);
        
        // Provide specific error messages with solutions
        if (error.name === 'NotAllowedError') {
          const errorMsg = 'Microphone access denied. Please:\n\n' +
            '1. Click the microphone icon in your browser address bar\n' +
            '2. Select "Allow" for microphone access\n' +
            '3. Refresh the page and try again\n\n' +
            'If the issue persists, try using a different browser or incognito mode.';
          alert(errorMsg);
        } else if (error.name === 'NotFoundError') {
          alert('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError') {
          alert('Microphone is already in use by another application. Please close other apps using the microphone and try again.');
        } else if (error.name === 'SecurityError') {
          alert('Microphone access blocked due to security restrictions. Please ensure you are using HTTPS or localhost.');
        } else {
          alert('Failed to access microphone: ' + error.message + '\n\nPlease check your microphone permissions and try again.');
        }
        
        return false;
      }
    }

         // Connect to socket and request to watch
     socket.on('connect', async () => {
               // Production-ready: Console logging removed
       updateStreamStatus('CONNECTING', '#ffc107'); // Yellow for connecting
       
       // Check microphone permission status
       await checkMicrophonePermission();
       
       // Get user info from localStorage or API
       let userInfo = null;
       const token = localStorage.getItem('userToken');
      
              // Production-ready: Console logging removed
      
      if (token) {
        try {
          // Production-ready: Console logging removed
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          // Production-ready: Console logging removed
          
          if (response.ok) {
            userInfo = await response.json();
                    // Production-ready: Console logging removed
          } else {
            const errorData = await response.json();
            console.error('❌ API error:', errorData);
          }
        } catch (error) {
          console.error('❌ Could not load user info:', error);
        }
      } else {
        console.warn('⚠️ No user token found in localStorage');
        // Create anonymous user info
        userInfo = { name: 'Anonymous Viewer' };
      }
      
             // Request to watch the stream
               // Production-ready: Console logging removed
       socket.emit('watcher', userInfo);
       
       // Listen for permission changes
       if (navigator.permissions && navigator.permissions.query) {
         try {
           const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
           permissionStatus.onchange = () => {
             // Production-ready: Console logging removed
             checkMicrophonePermission();
           };
         } catch (error) {
           console.warn('⚠️ Could not set up permission change listener:', error);
         }
       }
     });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      updateStreamStatus('CONNECTION ERROR', '#dc3545');
      if (liveMsg) {
        liveMsg.textContent = 'Connection error. Please refresh the page.';
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
              // Production-ready: Console logging removed
      updateStreamStatus('DISCONNECTED', '#dc3545');
      if (liveMsg) {
        liveMsg.textContent = 'Connection lost. Please refresh the page.';
      }
      isConnected = false;
    });

    // Handle stream start
    socket.on('stream-started', () => {
              // Production-ready: Console logging removed
      updateStreamStatus('CONNECTING', '#ffc107');
      if (liveContainer) {
        liveContainer.style.display = 'block';
      }
      if (liveMsg) {
        liveMsg.textContent = 'Live stream is active - connecting...';
      }
      isConnected = true;
    });

    // Handle stream not active
    socket.on('stream-not-active', () => {
              // Production-ready: Console logging removed
      updateStreamStatus('OFFLINE', '#dc3545');
      if (liveContainer) {
        liveContainer.style.display = 'none';
      }
      if (liveMsg) {
        liveMsg.textContent = 'No live stream available at the moment';
      }
      isConnected = false;
    });

    // Handle stream stop
    socket.on('stream-stopped', () => {
              // Production-ready: Console logging removed
      updateStreamStatus('OFFLINE', '#dc3545');
      if (liveContainer) {
        liveContainer.style.display = 'none';
      }
      if (liveMsg) {
        liveMsg.textContent = 'Stream has ended';
      }
      isConnected = false;
    });

    // Handle WebRTC offer from admin
    socket.on('offer', async (data) => {
              // Production-ready: Console logging removed
      updateStreamStatus('CONNECTING', '#ffc107');
      
      try {
        // Create peer connection
        peerConnection = createPeerConnection();
        
        // Set remote description (offer)
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // Create answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        // Send answer to admin
        socket.emit('answer', {
          target: data.socketId,
          answer: answer
        });
        
        // Production-ready: Console logging removed
      } catch (error) {
        console.error('Error handling offer:', error);
        updateStreamStatus('ERROR', '#dc3545');
      }
    });

    // Handle ICE candidates from admin
    socket.on('ice-candidate', (data) => {
      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
          .catch(error => console.error('Error adding ICE candidate:', error));
      }
    });

    // Chat functionality
    socket.on('chat-message', (data) => {
      const div = document.createElement('div');
      div.className = 'chat-message';
      div.innerHTML = `<strong>${data.sender}:</strong> ${data.message}`;
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    });

    sendBtn.addEventListener('click', () => {
      const msg = chatInput.value.trim();
      if (msg) {
        socket.emit('chat-message', { 
          sender: 'Viewer', 
          message: msg 
        });
        chatInput.value = '';
      }
    });

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendBtn.click();
      }
    });

    // Mic request functionality
    micBtn.addEventListener('click', async () => {
      // Check microphone permission first
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
          // Production-ready: Console logging removed
          
          if (permissionStatus.state === 'denied') {
            alert('Microphone access is permanently denied. Please enable it in your browser settings and refresh the page.');
            return;
          }
        } catch (permError) {
          console.warn('⚠️ Could not check permission status:', permError);
        }
      }
      
      // Get user info for the request
      let userName = 'Viewer';
      const token = localStorage.getItem('userToken');
      
              // Production-ready: Console logging removed
      
      if (token) {
        try {
          // Production-ready: Console logging removed
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          // Production-ready: Console logging removed
          
          if (response.ok) {
            const userInfo = await response.json();
            userName = userInfo.name;
            // Production-ready: Console logging removed
          } else {
            const errorData = await response.json();
            console.error('🎤 API error during mic request:', errorData);
          }
        } catch (error) {
          console.error('🎤 Could not load user info for mic request:', error);
        }
      } else {
        console.warn('🎤 No user token found for mic request');
      }
      
              // Production-ready: Console logging removed
      socket.emit('mic-request', { user: userName });
      micBtn.textContent = 'Request Sent...';
      micBtn.disabled = true;
      
      // Wait for admin approval (this will be handled by socket events)
      // The admin will send an 'approve-mic' event that we'll handle
      
      setTimeout(() => {
        micBtn.textContent = 'Request to Speak';
        micBtn.disabled = false;
      }, 3000);
    });

    // Mute/Unmute functionality
    muteBtn.addEventListener('click', () => {
      if (!isMuted) {
        socket.emit('unmute-request', { user: 'Viewer' });
        muteBtn.style.display = 'none';
        unmuteBtn.style.display = 'inline-block';
        isMuted = true;
      }
    });

    unmuteBtn.addEventListener('click', () => {
      if (isMuted) {
        socket.emit('mic-request', { user: 'Viewer' });
        unmuteBtn.style.display = 'none';
        muteBtn.style.display = 'inline-block';
        isMuted = false;
      }
    });

    // Handle mic approval from admin
    socket.on('mic-approved', async (data) => {
      console.log('🎤 Mic approved event received:', data);
      
      // 🔧 MOBILE COMPATIBILITY CHECK FIRST
      const browserInfo = getBrowserInfo();
      if (browserInfo.isMobile && !navigator.mediaDevices) {
        console.log('📱 Mobile device detected without WebRTC support');
        micBtn.textContent = '📱 Mobile Limited';
        micBtn.disabled = true;
        micBtn.style.background = '#ffc107'; // Yellow for limited functionality
        micBtn.title = 'Microphone not supported on this mobile device';
        
        // Show mobile-friendly message
        alert('📱 Mobile Device Detected\n\n' +
              'Microphone access is not supported on this mobile device/browser.\n\n' +
              'You can still:\n' +
              '✅ Watch the live stream\n' +
              '✅ Send chat messages\n' +
              '✅ View content\n\n' +
              'For full microphone functionality, please use:\n' +
              '• Desktop computer\n' +
              '• Different mobile browser\n' +
              '• Latest browser version');
        return;
      }
      
      // Access microphone and add to peer connection
      const micAccessGranted = await handleMicrophoneAccess();
      console.log('🎤 Microphone access result:', micAccessGranted);
      
      if (micAccessGranted) {
        micBtn.textContent = '🎤 Speaking';
        micBtn.disabled = true;
        micBtn.style.background = '#28a745'; // Green to indicate active
        isMuted = false;
        
        // Show mute button
        if (muteBtn) muteBtn.style.display = 'inline-block';
        if (unmuteBtn) unmuteBtn.style.display = 'none';
        
        console.log('✅ Microphone is now active and speaking');
        
        // 🔧 CRITICAL FIX: Establish WebRTC connection to admin
        try {
          console.log('🔧 Establishing WebRTC connection to admin...');
          
          // Create peer connection if it doesn't exist
          if (!peerConnection) {
            peerConnection = createPeerConnection();
            console.log('✅ Created new peer connection');
          }
          
          // Create and send offer to admin
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          console.log('📤 Sending WebRTC offer to admin');
          socket.emit('offer', {
            target: 'admin',
            offer: offer
          });
          
          console.log('✅ WebRTC offer sent successfully');
        } catch (error) {
          console.error('❌ Error establishing WebRTC connection:', error);
        }
      } else {
        micBtn.textContent = 'Request to Speak';
        micBtn.disabled = false;
        micBtn.style.background = '';
        alert('Failed to access microphone. Please check permissions and try again.');
      }
    });

    // Handle mic rejection from admin
    socket.on('mic-rejected', (data) => {
              // Production-ready: Console logging removed
      micBtn.textContent = 'Request to Speak';
      micBtn.disabled = false;
      micBtn.style.background = '';
      alert('Your microphone request was rejected by the admin.');
    });

    // Handle mic mute from admin
    socket.on('mic-muted', (data) => {
              // Production-ready: Console logging removed
      isMuted = true;
      micBtn.textContent = 'Request to Speak';
      micBtn.disabled = false;
      micBtn.style.background = '';
      
      // Remove microphone track if it exists
      if (window.microphoneSender && peerConnection) {
        peerConnection.removeTrack(window.microphoneSender);
        window.microphoneSender = null;
        // Production-ready: Console logging removed
      }
      
      // Show unmute button
      if (muteBtn) muteBtn.style.display = 'none';
      if (unmuteBtn) unmuteBtn.style.display = 'inline-block';
    });
  }

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // 🔧 BROWSER DETECTION FUNCTION
  function getBrowserInfo() {
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
    const isEdge = /Edge/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    return {
      isChrome,
      isEdge,
      isFirefox,
      isSafari,
      isMobile,
      userAgent: userAgent
    };
  }
})();