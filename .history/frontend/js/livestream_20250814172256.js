const socket = io("http://localhost:5000");

// DOM Elements
const video = document.getElementById("liveVideo");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

let peerConnection;
const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ]
};

// 1. Listen for stream offer from admin
socket.on("offer", async ({ sdp }) => {
  peerConnection = new RTCPeerConnection(config);

  // Set remote description
  await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));

  // Create answer
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  // Send answer back to admin
  socket.emit("answer", { sdp: peerConnection.localDescription });

  // When remote stream received, display it
  peerConnection.ontrack = (event) => {
    video.srcObject = event.streams[0];
  };
});

// 2. Chat feature: receive messages
socket.on("chatMessage", ({ name, message }) => {
  const msg = document.createElement("div");
  msg.classList.add("message");
  msg.innerHTML = `<strong>${name}:</strong> ${message}`;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// 3. Chat feature: send messages
sendBtn.addEventListener("click", () => {
  const message = chatInput.value.trim();
  if (message) {
    const userName = localStorage.getItem("userName") || "User";
    socket.emit("chatMessage", { name: userName, message });
    chatInput.value = "";
  }
});