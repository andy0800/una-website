// Check if user is authenticated
const token = localStorage.getItem('userToken');
if (!token) {
  window.location.href = '/frontend/en/login.html'; // change to Arabic if needed
}

// DOM elements
const remoteVideo = document.getElementById('remoteVideo');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChat');
const messagesDiv = document.getElementById('messages');
const requestMicBtn = document.getElementById('requestMic');

// Socket.IO connection
const socket = io();

// === WebRTC Setup ===
let peerConnection;
const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' } // public STUN server
  ]
};

// Ask for stream from admin
socket.emit('viewer-join');

// When admin sends offer
socket.on('offer', async (offer) => {
  peerConnection = new RTCPeerConnection(config);

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit('answer', answer);
});

// When ICE candidate is received
socket.on('ice-candidate', (candidate) => {
  if (peerConnection) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

// === Chat System ===
sendChatBtn.addEventListener('click', () => {
  const message = chatInput.value.trim();
  if (message !== '') {
    socket.emit('chat-message', { message });
    chatInput.value = '';
  }
});

socket.on('chat-message', (data) => {
  const msgEl = document.createElement('div');
  msgEl.className = 'chat-message';
  msgEl.textContent = `${data.sender}: ${data.message}`;
  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// === Mic Access Request ===
requestMicBtn.addEventListener('click', () => {
  socket.emit('mic-request', { user: 'Viewer' });
  alert('Microphone access request sent to admin.');
});

// === Handle mic approval from admin (optional future feature) ===
socket.on('mic-approved', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getAudioTracks().forEach(track => socket.emit('audio-stream', track));
});