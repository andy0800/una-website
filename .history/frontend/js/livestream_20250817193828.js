const socket = io();

const remoteVideo = document.getElementById('viewerVideo');
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('requestMicBtn');

let viewerPC = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

socket.emit('viewer-join');

// Handle offer
socket.on('offer', async (data) => {
  await viewerPC.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await viewerPC.createAnswer();
  await viewerPC.setLocalDescription(answer);

  socket.emit('answer', {
    target: data.socketId,
    answer: answer
  });
});

viewerPC.ontrack = (event) => {
  remoteVideo.srcObject = event.streams[0];
};

viewerPC.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('ice-candidate', {
      target: 'admin',
      candidate: event.candidate
    });
  }
};

socket.on('ice-candidate', (data) => {
  viewerPC.addIceCandidate(new RTCIceCandidate(data.candidate));
});

// Chat
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
  socket.emit('mic-request', {
    user: 'Viewer'
  });
});

socket.on('mic-approved', () => {
  alert('Mic approved! You can now speak.');
  // You can now enable audio stream here
});