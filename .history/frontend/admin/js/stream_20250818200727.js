const socket = io('http://localhost:5000');
const videoElement = document.getElementById('adminPreview');
const startButton = document.getElementById('startStream');
const stopButton = document.getElementById('stopStream');

let localStream;
let peerConnections = {};

startButton.addEventListener('click', async () => {
  try {
    localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    videoElement.srcObject = localStream;

    socket.emit('admin-start-stream');

    // Accept incoming watchers
    socket.on('watcher', async (id) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnections[id] = pc;

      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('candidate', id, event.candidate);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', id, offer);
    });

    // Receive answer
    socket.on('answer', (id, answer) => {
      const pc = peerConnections[id];
      if (pc) {
        pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // Receive candidate
    socket.on('candidate', (id, candidate) => {
      const pc = peerConnections[id];
      if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    startButton.disabled = true;
    stopButton.disabled = false;
  } catch (err) {
    alert('Could not start screen sharing: ' + err.message);
  }
});

stopButton.addEventListener('click', () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    socket.emit('admin-stop-stream');
    videoElement.srcObject = null;
  }

  // Close all connections
  Object.values(peerConnections).forEach(pc => pc.close());
  peerConnections = {};

  startButton.disabled = false;
  stopButton.disabled = true;
});