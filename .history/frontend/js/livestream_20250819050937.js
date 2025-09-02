// frontend/js/livestream.js
(() => {
  async function init() {
    console.log('🎥 Initializing livestream viewer...');
    
    // Initialize socket connection with better error handling
    let socket;
    try {
      const serverUrl = window.location.origin;
      console.log('🔌 Connecting to Socket.IO server at:', serverUrl);
      
      socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });
      
      console.log('✅ Socket.IO connection created');
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

    // Update stream status
    function updateStreamStatus(status, color = '#dc3545') {
        if (streamStatus) {
            streamStatus.textContent = status;
            streamStatus.style.background = color;
        }
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
        console.log('🎥 Received track:', event.track.kind);
        if (remoteVideo) {
          remoteVideo.srcObject = event.streams[0];
          updateStreamStatus('LIVE', '#28a745'); // Green for live
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
        console.log('🔗 Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('✅ WebRTC connection established');
          updateStreamStatus('LIVE', '#28a745');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          updateStreamStatus('OFFLINE', '#dc3545');
        }
      };

      return pc;
    }

    // Connect to socket and request to watch
    socket.on('connect', async () => {
      console.log('▶️ Connected as viewer with socket ID:', socket.id);
      updateStreamStatus('CONNECTING', '#ffc107'); // Yellow for connecting
      
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
  }

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();