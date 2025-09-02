// frontend/js/livestream.js
(() => {
  async function init() {
    const socket = io(window.location.origin);
    const remoteVideo = document.getElementById('viewerVideo');
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const micBtn = document.getElementById('requestMicBtn');
    const liveMsg = document.getElementById('liveMessage');
    const liveContainer = document.getElementById('liveContainer');
    const micRequest = document.getElementById('mic-request');

    let peerConnection = null;
    let isConnected = false;

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
      
      if (token) {
        try {
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            userInfo = await response.json();
            console.log('👤 User info loaded:', userInfo.name);
          }
        } catch (error) {
          console.warn('⚠️ Could not load user info:', error);
        }
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

    socket.on('mic-approved', () => {
      alert('🎤 Your mic request has been approved!');
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