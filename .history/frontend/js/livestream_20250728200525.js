// livestream.js

// 1. Wait until the full DOM is parsed
document.addEventListener('DOMContentLoaded', () => {
  // 2. Grab your DOM nodes
  const remoteVideo = document.getElementById('viewerVideo');
  const chatBox     = document.getElementById('chatBox');
  const chatInput   = document.getElementById('chatInput');
  const sendBtn     = document.getElementById('sendBtn');
  const micBtn      = document.getElementById('requestMicBtn');

  // 3. Initialize Socket.IO
  const socket = io(window.location.origin);

  // 4. WebRTC PeerConnection
  const viewerPC = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  // 5. Socket handlers
  socket.on('connect', () => socket.emit('watcher'));

  socket.on('offer', async (socketId, offer) => {
    await viewerPC.setRemoteDescription(offer);
    const answer = await viewerPC.createAnswer();
    await viewerPC.setLocalDescription(answer);
    socket.emit('answer', socketId, answer);
  });

  socket.on('candidate', (id, candidate) => {
    viewerPC.addIceCandidate(new RTCIceCandidate(candidate));
  });

  socket.on('chat-message', data => {
    if (!chatBox) return;
    const div = document.createElement('div');
    div.textContent = `${data.sender}: ${data.message}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  socket.on('mic-approved', () => alert('Mic approved! You can now speak.'));

  socket.on('viewer-count', count => {
    const liveMsg = document.getElementById('liveMessage');
    if (liveMsg) liveMsg.textContent = `عدد المشاهدين: ${count}`;
  });

  socket.on('stream-started', () => {
    const liveContainer = document.getElementById('liveContainer');
    const liveMsg       = document.getElementById('liveMessage');
    if (liveContainer) liveContainer.style.display = 'block';
    if (liveMsg)       liveMsg.textContent = 'البث المباشر بدأ';
  });

  socket.on('stream-stopped', () => {
    const liveContainer = document.getElementById('liveContainer');
    const liveMsg       = document.getElementById('liveMessage');
    if (liveContainer) liveContainer.style.display = 'none';
    if (liveMsg)       liveMsg.textContent = 'انتهى البث';
  });

  // 6. PeerConnection tracks & ICE
  viewerPC.ontrack = event => {
    if (remoteVideo) remoteVideo.srcObject = event.streams[0];
  };

  viewerPC.onicecandidate = ({ candidate }) => {
    if (candidate) socket.emit('candidate', 'admin', candidate);
  };

  // 7. Chat send button
  if (sendBtn && chatInput) {
    sendBtn.addEventListener('click', () => {
      const message = chatInput.value.trim();
      if (message !== '') {
        socket.emit('chat-message', { sender: 'Viewer', message });
        chatInput.value = '';
      }
    });
  }

  // 8. Mic request button
  if (micBtn) {
    micBtn.addEventListener('click', () => {
      socket.emit('mic-request', { user: 'Viewer' });
    });
  }
});