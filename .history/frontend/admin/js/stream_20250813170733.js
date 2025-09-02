// frontend/admin/js/stream.js

const socket = io('http://localhost:5000'); // adjust if needed
const videoElement = document.getElementById('adminPreview');
const startButton = document.getElementById('startStream');
const stopButton = document.getElementById('stopStream');

let localStream;
let isStreaming = false;

// Start Stream
startButton.addEventListener('click', async () => {
  try {
    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });

    // Display preview
    videoElement.srcObject = localStream;

    // Notify server to start stream
    socket.emit('admin-start-stream');

    // Send tracks to server to broadcast
    localStream.getTracks().forEach((track) => {
      socket.emit('admin-track', track.kind);
    });

    isStreaming = true;
    startButton.disabled = true;
    stopButton.disabled = false;
  } catch (err) {
    alert('Could not start screen sharing: ' + err.message);
  }
});

// Stop Stream
stopButton.addEventListener('click', () => {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    socket.emit('admin-stop-stream');
    videoElement.srcObject = null;
  }

  isStreaming = false;
  startButton.disabled = false;
  stopButton.disabled = true;
});