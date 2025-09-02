// frontend/js/livestream.js
(() => {
  async function init() {
    const socket       = io(window.location.origin);
    const remoteVideo  = document.getElementById('viewerVideo');
    const chatBox      = document.getElementById('chatBox');
    const chatInput    = document.getElementById('chatInput');
    const sendBtn      = document.getElementById('sendBtn');
    const micBtn       = document.getElementById('requestMicBtn');
    const liveMsg      = document.getElementById('liveMessage');
    const liveContainer= document.getElementById('liveContainer');

    // 1. Tell server you’re watching
    socket.on('connect', () => {
      console.log('▶️ connected as watcher');
      socket.emit('watcher');
    });

    // 2. Receive WebRTC offer
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pc.ontrack = e => { remoteVideo.srcObject = e.streams[0]; };
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('ice-candidate', {
          target: 'admin',
          candidate
        });
      }
    };

    socket.on('offer', async ({ socketId: adminId, offer }) => {
      console.log('⬇️ offer from admin');
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { target: adminId, answer });
    });

    socket.on('answer', ({ socketId, answer }) => {
      // Not used by viewer
    });

    socket.on('ice-candidate', ({ socketId, candidate }) => {
      pc.addIceCandidate(candidate);
    });

    // 3. Stream start/stop UI
    socket.on('stream-started', () => {
      liveContainer.style.display = 'block';
      liveMsg.textContent = 'البث المباشر بدأ';
    });
    socket.on('stream-stopped', () => {
      liveContainer.style.display = 'none';
      liveMsg.textContent = 'انتهى البث';
    });

    // 4. Chat
    socket.on('chat-message', data => {
      const div = document.createElement('div');
      div.textContent = `${data.sender}: ${data.message}`;
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    });
    sendBtn.addEventListener('click', () => {
      const msg = chatInput.value.trim();
      if (msg) {
        socket.emit('chat-message', { sender: 'Viewer', message: msg });
        chatInput.value = '';
      }
    });

    // 5. Mic request
    micBtn.addEventListener('click', () => {
      socket.emit('mic-request', { user: 'Viewer' });
    });
    socket.on('mic-approved', () => {
      alert('✔️ Your mic is now live!');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();