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
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

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
          
          // Force play the audio
          const playPromise = window.adminAudioElement.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              // Production-ready: Console logging removed
            }).catch(error => {
              console.warn('⚠️ Could not autoplay admin audio:', error);
              // Try to play on user interaction
              document.addEventListener('click', () => {
                window.adminAudioElement.play().catch(e => console.warn('Still cannot play:', e));
              }, { once: true });
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
        // Production-ready: Console logging removed
        
        // First, check if we already have permission
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
            // Production-ready: Console logging removed
            
            if (permissionStatus.state === 'denied') {
              alert('Microphone access is permanently denied. Please enable it in your browser settings and refresh the page.');
              return false;
            }
          } catch (permError) {
            console.warn('⚠️ Could not check permission status:', permError);
          }
        }
        
        // Try multiple audio constraint sets for better compatibility
        const audioConstraints = [
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
        
        let micStream = null;
        let lastError = null;
        
        // Try each constraint set until one works
        for (let i = 0; i < audioConstraints.length; i++) {
          try {
            // Production-ready: Console logging removed
            micStream = await navigator.mediaDevices.getUserMedia(audioConstraints[i]);
            // Production-ready: Console logging removed
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
        // Production-ready: Console logging removed
        
        // Store the microphone stream globally for later use
        window.userMicrophoneStream = micStream;
        
        // If peer connection exists, add the track immediately
        if (peerConnection) {
          const audioTrack = micStream.getAudioTracks()[0];
          if (audioTrack) {
            try {
              const sender = peerConnection.addTrack(audioTrack, micStream);
              // Production-ready: Console logging removed
              
              // Store sender for later removal if needed
              window.microphoneSender = sender;
            } catch (error) {
              console.error('❌ Error adding track to peer connection:', error);
            }
          }
        } else {
          console.log('⚠️ Peer connection not ready yet, will add track when available');
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
       console.log('▶️ Connected as viewer with socket ID:', socket.id);
       updateStreamStatus('CONNECTING', '#ffc107'); // Yellow for connecting
       
       // Check microphone permission status
       await checkMicrophonePermission();
       
       // Get user info from localStorage or API
       let userInfo = null;
       const token = localStorage.getItem('userToken');
      
      console.log('🔍 Checking for user token:', token ? 'Token found' : 'No token');
      
      if (token) {
        try {
          console.log('📡 Fetching user info from /api/users/me...');
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('📡 Response status:', response.status);
          
          if (response.ok) {
            userInfo = await response.json();
            console.log('👤 User info loaded successfully:', userInfo);
            console.log('👤 User name:', userInfo.name);
            console.log('👤 User phone:', userInfo.phone);
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
       console.log('📡 Requesting to watch stream with user info:', userInfo);
       socket.emit('watcher', userInfo);
       
       // Listen for permission changes
       if (navigator.permissions && navigator.permissions.query) {
         try {
           const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
           permissionStatus.onchange = () => {
             console.log('🔐 Microphone permission changed to:', permissionStatus.state);
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
      console.log('❌ Socket disconnected:', reason);
      updateStreamStatus('DISCONNECTED', '#dc3545');
      if (liveMsg) {
        liveMsg.textContent = 'Connection lost. Please refresh the page.';
      }
      isConnected = false;
    });

    // Handle stream start
    socket.on('stream-started', () => {
      console.log('🎥 Stream started event received');
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
      console.log('⏸️ Stream not active event received');
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
      console.log('⏹️ Stream stopped event received');
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
      console.log('📥 Received offer from admin');
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
        
        console.log('📤 Sent answer to admin');
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
          console.log('🔐 Current microphone permission before request:', permissionStatus.state);
          
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
      
      console.log('🎤 Mic request - checking user token:', token ? 'Token found' : 'No token');
      
      if (token) {
        try {
          console.log('🎤 Fetching user info for mic request...');
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('🎤 Mic request response status:', response.status);
          
          if (response.ok) {
            const userInfo = await response.json();
            userName = userInfo.name;
            console.log('🎤 Using user name for mic request:', userName);
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
      
      console.log('🎤 Sending mic request with user name:', userName);
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
      console.log('✅ Mic request approved by admin');
      
      // Access microphone and add to peer connection
      const micAccessGranted = await handleMicrophoneAccess();
      
      if (micAccessGranted) {
        micBtn.textContent = '🎤 Speaking';
        micBtn.disabled = true;
        micBtn.style.background = '#28a745'; // Green to indicate active
        isMuted = false;
        
        // Show mute button
        if (muteBtn) muteBtn.style.display = 'inline-block';
        if (unmuteBtn) unmuteBtn.style.display = 'none';
        
        console.log('🎤 User is now speaking');
      } else {
        micBtn.textContent = 'Request to Speak';
        micBtn.disabled = false;
        micBtn.style.background = '';
        alert('Failed to access microphone. Please check permissions and try again.');
      }
    });

    // Handle mic rejection from admin
    socket.on('mic-rejected', (data) => {
      console.log('❌ Mic request rejected by admin');
      micBtn.textContent = 'Request to Speak';
      micBtn.disabled = false;
      micBtn.style.background = '';
      alert('Your microphone request was rejected by the admin.');
    });

    // Handle mic mute from admin
    socket.on('mic-muted', (data) => {
      console.log('🔇 Mic muted by admin');
      isMuted = true;
      micBtn.textContent = 'Request to Speak';
      micBtn.disabled = false;
      micBtn.style.background = '';
      
      // Remove microphone track if it exists
      if (window.microphoneSender && peerConnection) {
        peerConnection.removeTrack(window.microphoneSender);
        window.microphoneSender = null;
        console.log('🎤 Microphone track removed by admin');
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
})();