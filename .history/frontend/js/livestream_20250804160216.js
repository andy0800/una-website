// frontend/js/livestream.js
(() => {
  async function init() {
    const socket = io(window.location.origin);
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

    let peerConnection = null;
    let isConnected = false;
    let isMuted = false;

    // Initialize WebRTC peer connection
    function createPeerConnection() {
      if (peerConnection) {
        peerConnection.close();
      }

      peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerConnection.ontrack = (event) => {
        console.log('🎥 Received remote stream');
        remoteVideo.srcObject = event.streams[0];
        isConnected = true;
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            target: 'admin',
            candidate: event.candidate
          });
        }
      };

      peerConnection.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          console.log('✅ WebRTC connected!');
        }
      };

      return peerConnection;
    }

    // Connect to socket and request to watch
    socket.on('connect', async () => {
      console.log('▶️ Connected as viewer');
      
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
      }
      
      socket.emit('watcher', userInfo);
    });

    // Handle stream start
    socket.on('stream-started', () => {
      console.log('🎥 Stream started');
      document.getElementById('streamStatus').textContent = 'LIVE';
      document.getElementById('streamStatus').style.background = 'rgba(220, 53, 69, 0.9)';
      liveMsg.textContent = 'Live stream is starting...';
      micRequest.style.display = 'block';
    });

    // Handle stream stop
    socket.on('stream-stopped', () => {
      console.log('⏹️ Stream stopped');
      document.getElementById('streamStatus').textContent = 'OFFLINE';
      document.getElementById('streamStatus').style.background = 'rgba(0,0,0,0.7)';
      liveMsg.textContent = 'Stream has ended';
      micRequest.style.display = 'none';
      if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
      }
      isConnected = false;
    });

    // Handle when no stream is active
    socket.on('stream-not-active', () => {
      console.log('⏸️ No active stream');
      document.getElementById('streamStatus').textContent = 'OFFLINE';
      document.getElementById('streamStatus').style.background = 'rgba(0,0,0,0.7)';
      liveMsg.textContent = 'No live stream available';
      micRequest.style.display = 'none';
    });

    // Handle WebRTC offer from admin
    socket.on('offer', async ({ socketId: adminId, offer }) => {
      console.log('⬇️ Received offer from admin');
      try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('answer', { 
          target: adminId, 
          answer: answer 
        });
        
        console.log('📤 Sent answer to admin');
      } catch (error) {
        console.error('❌ Error handling offer:', error);
      }
    });

    // Handle ICE candidates
    socket.on('ice-candidate', ({ socketId, candidate }) => {
      if (peerConnection && peerConnection.remoteDescription) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
          .catch(error => console.error('❌ Error adding ICE candidate:', error));
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
      // Get user info for the request
      let userName = 'Viewer';
      const token = localStorage.getItem('userToken');
      
      if (token) {
        try {
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userInfo = await response.json();
            userName = userInfo.name;
          }
        } catch (error) {
          console.warn('⚠️ Could not load user info for mic request:', error);
        }
      }
      
      socket.emit('mic-request', { user: userName });
      micBtn.textContent = 'Request Sent...';
      micBtn.disabled = true;
      
      setTimeout(() => {
        micBtn.textContent = 'Request to Speak';
        micBtn.disabled = false;
      }, 3000);
    });

    // Handle unmute approval
    socket.on('unmute-approved', () => {
      if (userMicStream && isMuted) {
        userMicStream.getAudioTracks().forEach(track => {
          track.enabled = true;
        });
        isMuted = false;
        muteBtn.style.display = 'inline-block';
        unmuteBtn.style.display = 'none';
        console.log('🔊 Microphone unmuted');
        alert('🎤 Your microphone has been unmuted!');
      }
    });

    let userMicStream = null;
    let userMicPeerConnection = null;

    socket.on('mic-approved', async () => {
      try {
        console.log('🎤 Mic approved - requesting microphone access...');
        
        // Request microphone access
        userMicStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
        
        console.log('✅ Microphone access granted');
        
        // Create peer connection for mic stream
        userMicPeerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });
        
        // Add mic track to peer connection
        userMicStream.getTracks().forEach(track => {
          userMicPeerConnection.addTrack(track, userMicStream);
        });
        
        // Handle ICE candidates
        userMicPeerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', {
              target: 'admin',
              candidate: event.candidate
            });
          }
        };
        
        // Create and send offer for mic stream
        const offer = await userMicPeerConnection.createOffer();
        await userMicPeerConnection.setLocalDescription(offer);
        
        socket.emit('user-mic-offer', {
          target: 'admin',
          offer: offer
        });
        
        alert('🎤 Your microphone is now active! You can speak.');
        
        // Show mute/unmute buttons
        muteBtn.style.display = 'inline-block';
        unmuteBtn.style.display = 'inline-block';
        
      } catch (error) {
        console.error('❌ Error accessing microphone:', error);
        alert('❌ Could not access microphone: ' + error.message);
      }
    });

    // Mute functionality
    muteBtn.addEventListener('click', () => {
      if (userMicStream) {
        userMicStream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
        isMuted = true;
        muteBtn.style.display = 'none';
        unmuteBtn.style.display = 'inline-block';
        console.log('🔇 Microphone muted');
      }
    });

    // Unmute functionality - requires admin approval
    unmuteBtn.addEventListener('click', async () => {
      // Get user info for the unmute request
      let userName = 'Viewer';
      const token = localStorage.getItem('userToken');
      
      if (token) {
        try {
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userInfo = await response.json();
            userName = userInfo.name;
          }
        } catch (error) {
          console.warn('⚠️ Could not load user info for unmute request:', error);
        }
      }
      
      socket.emit('unmute-request', { user: userName });
      unmuteBtn.textContent = 'Requesting...';
      unmuteBtn.disabled = true;
      
      setTimeout(() => {
        unmuteBtn.textContent = '🔊 Unmute';
        unmuteBtn.disabled = false;
      }, 3000);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      liveContainer.style.display = 'none';
      liveMsg.textContent = 'Connection lost';
    });

    // Error handling
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      liveMsg.textContent = 'Connection error. Please refresh the page.';
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();