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

    let isConnected = false;
    let isMuted = false;
    let streamUrl = null;

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
      
      // Request to watch the stream
      console.log('📡 Requesting to watch stream with user info:', userInfo);
      socket.emit('watcher', userInfo);
    });

    // Handle stream start
    socket.on('stream-started', () => {
      console.log('🎥 Stream started');
      if (liveContainer) {
        liveContainer.style.display = 'block';
      }
      if (liveMsg) {
        liveMsg.textContent = 'Live stream is active';
      }
      isConnected = true;
      
      // Set up video element for streaming
      setupVideoStream();
    });

    // Handle stream not active
    socket.on('stream-not-active', () => {
      console.log('⏸️ Stream not active');
      if (liveContainer) {
        liveContainer.style.display = 'none';
      }
      if (liveMsg) {
        liveMsg.textContent = 'No live stream available';
      }
      isConnected = false;
    });

    // Handle stream stop
    socket.on('stream-stopped', () => {
      console.log('⏹️ Stream stopped');
      if (liveContainer) {
        liveContainer.style.display = 'none';
      }
      if (liveMsg) {
        liveMsg.textContent = 'Stream ended';
      }
      isConnected = false;
      
      // Clear video source
      if (remoteVideo) {
        remoteVideo.srcObject = null;
      }
    });

    // Handle stream info
    socket.on('stream-info', (data) => {
      console.log('📡 Received stream info:', data);
      if (data.hasStream && remoteVideo) {
        // For now, we'll use a placeholder approach
        // In a real implementation, you'd set up WebRTC here
        remoteVideo.src = '/placeholder-stream.mp4'; // Placeholder
        remoteVideo.play().catch(e => console.log('Video play failed:', e));
      }
    });

    // Setup video stream
    function setupVideoStream() {
      if (remoteVideo) {
        // For now, we'll use a simple approach
        // In a real implementation, you'd set up WebRTC peer connection here
        remoteVideo.src = '/placeholder-stream.mp4'; // Placeholder
        remoteVideo.play().catch(e => console.log('Video play failed:', e));
      }
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      if (liveContainer) {
        liveContainer.style.display = 'none';
      }
      if (liveMsg) {
        liveMsg.textContent = 'Connection lost';
      }
      
      // Clear video source
      if (remoteVideo) {
        remoteVideo.srcObject = null;
      }
    });

    // Error handling
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      if (liveMsg) {
        liveMsg.textContent = 'Connection error. Please refresh the page.';
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