const socket = io();

const remoteVideo = document.getElementById('viewerVideo');
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('requestMicBtn');

let viewerPC = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

socket.on('connect', () => {
  socket.emit('watcher'); // <-- Important! Send this after connection
});

// Receive offer from admin and respond with answer
socket.on('offer', async (socketId, offer) => {
  await viewerPC.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await viewerPC.createAnswer();
  await viewerPC.setLocalDescription(answer);

  socket.emit('answer', socketId, answer);
});

// Set incoming media stream
viewerPC.ontrack = (event) => {
  remoteVideo.srcObject = event.streams[0];
};

// ICE candidate exchange
viewerPC.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('candidate', 'admin', event.candidate);
  }
};

socket.on('candidate', (id, candidate) => {
  viewerPC.addIceCandidate(new RTCIceCandidate(candidate));
});

// Chat functionality
sendBtn.addEventListener('click', () => {
  const message = chatInput.value.trim();
  if (message !== '') {
    socket.emit('chat-message', {
      sender: 'Viewer',
      message
    });
    chatInput.value = '';
  }
});

socket.on('chat-message', (data) => {
  const div = document.createElement('div');
  div.textContent = `${data.sender}: ${data.message}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Mic request
micBtn.addEventListener('click', () => {
  socket.emit('mic-request', { user: 'Viewer' });
});

socket.on('mic-approved', () => {
  alert('Mic approved! You can now speak.');
});
socket.on('viewer-count', (count) => {
  document.getElementById('liveMessage').textContent = `عدد المشاهدين: ${count}`;
});
socket.on('stream-started', () => {
  document.getElementById('liveContainer').style.display = 'block';
  document.getElementById('liveMessage').textContent = 'البث المباشر بدأ';
});

socket.on('stream-stopped', () => {
  document.getElementById('liveContainer').style.display = 'none';
  document.getElementById('liveMessage').textContent = 'انتهى البث';
});