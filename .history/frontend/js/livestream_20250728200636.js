// livestream.js

(() => {
  // Core initialization logic
  async function initLivestream() {
    // 1. Grab DOM nodes
    const socket       = io(window.location.origin);
    const remoteVideo  = document.getElementById('viewerVideo');
    const chatBox      = document.getElementById('chatBox');
    const chatInput    = document.getElementById('chatInput');
    const sendBtn      = document.getElementById('sendBtn');
    const micBtn       = document.getElementById('requestMicBtn');
    const liveMsg      = document.getElementById('liveMessage');
    const liveContainer= document.getElementById('liveContainer');

    // 2. Sanity checks
    if (!remoteVideo)   console.warn('#viewerVideo not found');
    if (!chatBox)       console.warn('#chatBox not found');
    if (!chatInput)     console.warn('#chatInput not found');
    if (!sendBtn)       console.warn('#sendBtn not found');
    if (!micBtn)        console.warn('#requestMicBtn not found');
    if (!liveMsg)       console.warn('#liveMessage not found');
    if (!liveContainer) console.warn('#liveContainer not found');

    // 3. WebRTC setup
    const viewerPC = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // 4. Socket.IO handlers
    socket.on('connect', () => socket.emit('watcher'));

    socket.on('offer', async (socketId, offer) => {
      try {
        await viewerPC.setRemoteDescription(offer);
        const answer = await viewerPC.createAnswer();
        await viewerPC.setLocalDescription(answer);
        socket.emit('answer', socketId, answer);
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    socket.on('candidate', (id, candidate) => {
      viewerPC.addIceCandidate(new RTCIceCandidate(candidate))
        .catch(e => console.error('ICE candidate error:', e));
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
      if (liveMsg) liveMsg.textContent = `عدد المشاهدين: ${count}`;
    });

    socket.on('stream-started', () => {
      if (liveContainer) liveContainer.style.display = 'block';
      if (liveMsg) liveMsg.textContent = 'البث المباشر بدأ';
    });

    socket.on('stream-stopped', () => {
      if (liveContainer) liveContainer.style.display = 'none';
      if (liveMsg) liveMsg.textContent = 'انتهى البث';
    });

    // 5. PeerConnection events
    viewerPC.ontrack = ({ streams }) => {
      if (remoteVideo) remoteVideo.srcObject = streams[0];
    };

    viewerPC.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit('candidate', 'admin', candidate);
    };

    // 6. UI event bindings
    if (sendBtn && chatInput) {
      sendBtn.addEventListener('click', () => {
        const msg = chatInput.value.trim();
        if (msg) {
          socket.emit('chat-message', { sender: 'Viewer', message: msg });
          chatInput.value = '';
        }
      });
    }

    if (micBtn) {
      micBtn.addEventListener('click', () => {
        socket.emit('mic-request', { user: 'Viewer' });
      });
    }
  }

  // Run once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLivestream);
  } else {
    initLivestream();
  }
})();