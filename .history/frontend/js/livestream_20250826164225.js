// 🚀 SIMPLIFIED WEBRTC WITH AGORA.IO - USER LIVESTREAM
// This replaces the broken custom WebRTC implementation with proven Agora.io technology

(() => {
  // 🎯 GLOBAL VARIABLES
  let agoraClient = null;
  let localAudioTrack = null;
  let remoteAudioTrack = null;
  let remoteVideoTrack = null;
  let isConnected = false;
  let isMuted = false;
  let socket = null;

  // 🚀 AGORA.IO CONFIGURATION
  const AGORA_CONFIG = {
    appId: '05cadaa553c44f7a8d73ee303c4c0156',
    channel: 'una-institute-live',
    token: null, // Will be generated server-side
    uid: Math.floor(Math.random() * 100000)
  };

  // 🎤 MICROPHONE ACCESS FUNCTIONS
  async function requestMicrophoneAccess() {
    try {
      console.log('🎤 Requesting microphone access...');
      
      // Check if we already have permission
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
        
        if (permissionStatus.state === 'denied') {
          alert('Microphone access is permanently denied. Please enable it in your browser settings and refresh the page.');
          return false;
        }
      }
      
      // Create local audio track
      localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      console.log('✅ Microphone access granted');
      
      // Update UI
      updateMicButton(true);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to access microphone:', error);
      
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please:\n\n' +
              '1. Click the microphone icon in your browser address bar\n' +
              '2. Select "Allow" for microphone access\n' +
              '3. Refresh the page and try again');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert('Failed to access microphone: ' + error.message);
      }
      
      return false;
    }
  }

  function updateMicButton(hasAccess) {
    const micBtn = document.getElementById('requestMicBtn');
    if (micBtn) {
      if (hasAccess) {
        micBtn.textContent = '🎤 Speaking';
        micBtn.disabled = false;
        micBtn.style.background = '#28a745';
        micBtn.title = 'Microphone is active';
      } else {
        micBtn.textContent = '🎤 Request to Speak';
        micBtn.disabled = false;
        micBtn.style.background = '';
        micBtn.title = 'Click to request microphone access';
      }
    }
  }

  // 🔌 AGORA.IO FUNCTIONS
  async function initializeAgora() {
    try {
      console.log('🚀 Initializing Agora client...');
      
      // Create Agora client
      agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      console.log('✅ Agora client created successfully');
      
      // Set client role
      await agoraClient.setClientRole("audience");
      console.log('✅ Client role set to audience');
      
      // Set up event handlers
      setupAgoraEventHandlers();
      
      console.log('✅ Agora client initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Agora client:', error);
      return false;
    }
  }

  function setupAgoraEventHandlers() {
    // Handle host publishing
    agoraClient.on("user-published", async (user, mediaType) => {
      console.log('📡 Host published:', mediaType);
      
      if (mediaType === "audio") {
        await agoraClient.subscribe(user, mediaType);
        remoteAudioTrack = user.audioTrack;
        console.log('✅ Subscribed to host audio');
      }
      
      if (mediaType === "video") {
        await agoraClient.subscribe(user, mediaType);
        remoteVideoTrack = user.videoTrack;
        
        // Display video
        const videoElement = document.getElementById('viewerVideo');
        if (videoElement && remoteVideoTrack) {
          remoteVideoTrack.play(videoElement);
          console.log('✅ Host video displayed');
        }
      }
    });

    // Handle host unpublishing
    agoraClient.on("user-unpublished", (user, mediaType) => {
      console.log('📡 Host unpublished:', mediaType);
      
      if (mediaType === "audio") {
        remoteAudioTrack = null;
      }
      
      if (mediaType === "video") {
        remoteVideoTrack = null;
        const videoElement = document.getElementById('viewerVideo');
        if (videoElement) {
          videoElement.srcObject = null;
        }
      }
    });

    // Handle connection state changes
    agoraClient.on("connection-state-change", (curState, prevState) => {
      console.log('🔗 Connection state changed:', prevState, '->', curState);
      
      if (curState === 'CONNECTED') {
        isConnected = true;
        updateStreamStatus('LIVE', '#28a745');
      } else if (curState === 'DISCONNECTED') {
        isConnected = false;
        updateStreamStatus('OFFLINE', '#dc3545');
      }
    });
  }

  async function joinStream() {
    try {
      console.log('🚀 Joining stream...');
      
      // Initialize Agora if not already done
      if (!agoraClient) {
        await initializeAgora();
      }
      
      // Join channel
      await agoraClient.join(AGORA_CONFIG.appId, AGORA_CONFIG.channel, AGORA_CONFIG.token, AGORA_CONFIG.uid);
      console.log('✅ Joined stream channel');
      
      // Update UI
      updateStreamStatus('CONNECTING', '#ffc107');
      
    } catch (error) {
      console.error('❌ Failed to join stream:', error);
      updateStreamStatus('ERROR', '#dc3545');
      alert('Failed to join stream: ' + error.message);
    }
  }

  async function leaveStream() {
    try {
      if (agoraClient) {
        await agoraClient.leave();
        console.log('✅ Left stream channel');
      }
      
      isConnected = false;
      updateStreamStatus('OFFLINE', '#dc3545');
      
    } catch (error) {
      console.error('❌ Failed to leave stream:', error);
    }
  }

  // 🎤 MICROPHONE CONTROL FUNCTIONS
  async function startSpeaking() {
    try {
      if (!localAudioTrack) {
        const success = await requestMicrophoneAccess();
        if (!success) return;
      }
      
      // Publish audio track
      await agoraClient.publish(localAudioTrack);
      console.log('✅ Started speaking');
      
      // Update UI
      updateMicButton(true);
      
      // Send mic request to admin
      if (socket) {
        socket.emit('mic-request', { user: 'Viewer' });
      }
      
    } catch (error) {
      console.error('❌ Failed to start speaking:', error);
      alert('Failed to start speaking: ' + error.message);
    }
  }

  function stopSpeaking() {
    try {
      if (localAudioTrack) {
        agoraClient.unpublish(localAudioTrack);
        console.log('✅ Stopped speaking');
      }
      
      // Update UI
      updateMicButton(false);
      
    } catch (error) {
      console.error('❌ Failed to stop speaking:', error);
    }
  }

  // 🎮 UI UPDATE FUNCTIONS
  function updateStreamStatus(status, color) {
    const statusElement = document.getElementById('streamStatus');
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.style.background = color;
    }
  }

  function updateLiveMessage(message) {
    const liveMsg = document.getElementById('liveMessage');
    if (liveMsg) {
      liveMsg.textContent = message;
    }
  }

  // 🔌 SOCKET.IO FUNCTIONS
  function initializeSocketConnection() {
    try {
      socket = io();
      
      socket.on('connect', () => {
        console.log('🔌 Connected to server');
        updateLiveMessage('Connected to streaming server');
      });
      
      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
        updateLiveMessage('Connection lost. Please refresh the page.');
      });
      
      socket.on('stream-started', () => {
        console.log('📡 Stream started');
        updateStreamStatus('CONNECTING', '#ffc107');
        updateLiveMessage('Live stream is active - connecting...');
        joinStream();
      });
      
      socket.on('stream-stopped', () => {
        console.log('📡 Stream stopped');
        updateStreamStatus('OFFLINE', '#dc3545');
        updateLiveMessage('Stream has ended');
        leaveStream();
      });
      
      socket.on('mic-approved', () => {
        console.log('✅ Microphone approved');
        startSpeaking();
      });
      
      socket.on('mic-rejected', () => {
        console.log('❌ Microphone rejected');
        alert('Your microphone request was rejected by the admin.');
      });
      
      socket.on('mic-muted', () => {
        console.log('🔇 Microphone muted by admin');
        stopSpeaking();
        alert('Your microphone was muted by the admin.');
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize socket connection:', error);
    }
  }

  // 💬 CHAT FUNCTIONS
  function setupChat() {
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (!chatBox || !chatInput || !sendBtn) return;
    
    // Send message
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
    
    // Enter key to send
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendBtn.click();
      }
    });
    
    // Handle incoming messages
    socket.on('chat-message', (data) => {
      const div = document.createElement('div');
      div.className = 'chat-message';
      div.innerHTML = `<strong>${data.sender}:</strong> ${data.message}`;
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    });
  }

  // 🎮 EVENT LISTENERS
  function setupEventListeners() {
    // Microphone button
    const micBtn = document.getElementById('requestMicBtn');
    if (micBtn) {
      micBtn.addEventListener('click', async () => {
        if (!localAudioTrack) {
          await requestMicrophoneAccess();
        } else {
          if (isMuted) {
            startSpeaking();
          } else {
            stopSpeaking();
          }
        }
      });
    }
    
    // Mute/Unmute buttons
    const muteBtn = document.getElementById('muteBtn');
    const unmuteBtn = document.getElementById('unmuteBtn');
    
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        stopSpeaking();
        muteBtn.style.display = 'none';
        if (unmuteBtn) unmuteBtn.style.display = 'inline-block';
        isMuted = true;
      });
    }
    
    if (unmuteBtn) {
      unmuteBtn.addEventListener('click', () => {
        startSpeaking();
        unmuteBtn.style.display = 'none';
        if (muteBtn) muteBtn.style.display = 'inline-block';
        isMuted = false;
      });
    }
  }

  // 🎯 INITIALIZATION
  function initializeLivestream() {
    console.log('🚀 Initializing livestream...');
    
    // Initialize socket connection
    initializeSocketConnection();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up chat
    setupChat();
    
    // Initialize Agora
    initializeAgora();
    
    console.log('✅ Livestream initialized successfully');
  }

  // 🚀 START INITIALIZATION WHEN DOM IS READY
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLivestream);
  } else {
    initializeLivestream();
  }

})();