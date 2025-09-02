// 🚀 SIMPLIFIED WEBRTC WITH AGORA.IO - ADMIN DASHBOARD
// This replaces the broken custom WebRTC implementation with proven Agora.io technology

(() => {
  // 🎯 GLOBAL VARIABLES
  let agoraClient = null;
  let localAudioTrack = null;
  let localVideoTrack = null;
  let localScreenTrack = null;
  let isStreaming = false;
  let isRecording = false;
  let connectedViewers = new Map();
  let socket = null;

  // 🚀 AGORA.IO CONFIGURATION
  const AGORA_CONFIG = {
    appId: 'your-agora-app-id', // Replace with your Agora App ID
    channel: 'una-institute-live',
    token: null, // Will be generated server-side
    uid: Math.floor(Math.random() * 100000)
  };

  // 🎤 AUDIO PIPELINE WITH AGORA.IO
  window.audioPipeline = {
    // Initialize Agora client
    init: async function() {
      console.log('🚀 Initializing Agora audio pipeline...');
      
      try {
        // Create Agora client
        agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        console.log('✅ Agora client created successfully');
        
        // Set client role
        await agoraClient.setClientRole("host");
        console.log('✅ Client role set to host');
        
        // Set up event handlers
        this.setupEventHandlers();
        
        console.log('✅ Audio pipeline initialized successfully');
        return true;
      } catch (error) {
        console.error('❌ Failed to initialize Agora client:', error);
        return false;
      }
    },

    // Set up Agora event handlers
    setupEventHandlers: function() {
      // Handle user joining
      agoraClient.on("user-joined", (user) => {
        console.log('👤 User joined:', user.uid);
        this.addUserAudio(user.uid, user);
      });

      // Handle user leaving
      agoraClient.on("user-left", (user) => {
        console.log('👤 User left:', user.uid);
        this.removeUserAudio(user.uid);
      });

      // Handle user publishing
      agoraClient.on("user-published", async (user, mediaType) => {
        console.log('📡 User published:', user.uid, mediaType);
        
        if (mediaType === "audio") {
          await agoraClient.subscribe(user, mediaType);
          this.addUserAudio(user.uid, user);
        }
      });

      // Handle user unpublishing
      agoraClient.on("user-unpublished", (user, mediaType) => {
        console.log('📡 User unpublished:', user.uid, mediaType);
        
        if (mediaType === "audio") {
          this.removeUserAudio(user.uid);
        }
      });
    },

    // Start local stream
    startLocalStream: async function() {
      try {
        console.log('🎤 Starting local stream...');
        
        // Create local audio track
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        console.log('✅ Local audio track created');
        
        // Create local video track
        localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        console.log('✅ Local video track created');
        
        // Publish local tracks
        await agoraClient.publish([localAudioTrack, localVideoTrack]);
        console.log('✅ Local tracks published successfully');
        
        // Update UI
        this.updateStreamStatus(true);
        
        return true;
      } catch (error) {
        console.error('❌ Failed to start local stream:', error);
        return false;
      }
    },

    // Stop local stream
    stopLocalStream: function() {
      if (localAudioTrack) {
        localAudioTrack.close();
        localAudioTrack = null;
      }
      if (localVideoTrack) {
        localVideoTrack.close();
        localVideoTrack = null;
      }
      if (localScreenTrack) {
        localScreenTrack.close();
        localScreenTrack = null;
      }
      
      console.log('✅ Local stream stopped');
      this.updateStreamStatus(false);
    },

    // Start screen sharing
    startScreenShare: async function() {
      try {
        console.log('🖥️ Starting screen share...');
        
        localScreenTrack = await AgoraRTC.createScreenVideoTrack();
        console.log('✅ Screen share track created');
        
        await agoraClient.publish(localScreenTrack);
        console.log('✅ Screen share published successfully');
        
        return true;
      } catch (error) {
        console.error('❌ Failed to start screen share:', error);
        return false;
      }
    },

    // Stop screen sharing
    stopScreenShare: function() {
      if (localScreenTrack) {
        localScreenTrack.close();
        localScreenTrack = null;
        console.log('✅ Screen share stopped');
      }
    },

    // Add user audio
    addUserAudio: function(uid, user) {
      console.log('🎤 Adding user audio:', uid);
      connectedViewers.set(uid, {
        uid: uid,
        hasMic: true,
        user: user
      });
      this.updateAudioStatusIndicator();
    },

    // Remove user audio
    removeUserAudio: function(uid) {
      console.log('🎤 Removing user audio:', uid);
      connectedViewers.delete(uid);
      this.updateAudioStatusIndicator();
    },

    // Update audio status indicator
    updateAudioStatusIndicator: function() {
      const indicator = document.getElementById('userAudioIndicator');
      if (indicator) {
        const count = connectedViewers.size;
        if (count > 0) {
          indicator.textContent = `${count} user(s) speaking`;
          indicator.style.color = '#28a745';
        } else {
          indicator.textContent = 'No user audio';
          indicator.style.color = '#666';
        }
      }
    },

    // Update stream status
    updateStreamStatus: function(isActive) {
      const statusElement = document.getElementById('streamStatus');
      if (statusElement) {
        if (isActive) {
          statusElement.textContent = 'LIVE';
          statusElement.style.background = '#28a745';
        } else {
          statusElement.textContent = 'OFFLINE';
          statusElement.style.background = '#dc3545';
        }
      }
    },

    // Update admin volume
    updateAdminVolume: function(volume) {
      if (localAudioTrack) {
        localAudioTrack.setVolume(parseFloat(volume));
        // Update volume display
        const volumeDisplay = document.getElementById('volumeDisplay');
        if (volumeDisplay) {
          volumeDisplay.textContent = Math.round(volume * 100) + '%';
        }
      }
    },

    // Get all audio tracks for recording
    getAllAudioTracks: function() {
      const allTracks = [];
      
      // Add local audio track
      if (localAudioTrack) {
        allTracks.push(localAudioTrack);
      }
      
      // Add user audio tracks
      connectedViewers.forEach((viewer) => {
        if (viewer.user && viewer.user.audioTrack) {
          allTracks.push(viewer.user.audioTrack);
        }
      });
      
      return allTracks;
    },

    // Clear all audio
    clear: function() {
      this.stopLocalStream();
      connectedViewers.clear();
      console.log('✅ Audio pipeline cleared');
    }
  };

  // 🎬 STREAMING FUNCTIONS
  async function startStream() {
    try {
      console.log('🚀 Starting stream...');
      
      // Initialize audio pipeline
      await window.audioPipeline.init();
      
      // Join Agora channel
      await agoraClient.join(AGORA_CONFIG.appId, AGORA_CONFIG.channel, AGORA_CONFIG.token, AGORA_CONFIG.uid);
      console.log('✅ Joined Agora channel');
      
      // Start local stream
      await window.audioPipeline.startLocalStream();
      
      // Update UI
      document.getElementById('startStreamBtn').style.display = 'none';
      document.getElementById('stopStreamBtn').style.display = 'inline-block';
      
      isStreaming = true;
      console.log('✅ Stream started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start stream:', error);
      alert('Failed to start stream: ' + error.message);
    }
  }

  function stopStream() {
    try {
      console.log('⏹️ Stopping stream...');
      
      // Stop local stream
      window.audioPipeline.stopLocalStream();
      
      // Leave Agora channel
      if (agoraClient) {
        agoraClient.leave();
      }
      
      // Update UI
      document.getElementById('startStreamBtn').style.display = 'inline-block';
      document.getElementById('stopStreamBtn').style.display = 'none';
      
      isStreaming = false;
      console.log('✅ Stream stopped successfully');
      
    } catch (error) {
      console.error('❌ Failed to stop stream:', error);
    }
  }

  // 🖥️ SCREEN SHARING FUNCTIONS
  async function startScreenShare() {
    try {
      await window.audioPipeline.startScreenShare();
      document.getElementById('startScreenBtn').style.display = 'none';
      document.getElementById('stopScreenBtn').style.display = 'inline-block';
    } catch (error) {
      console.error('❌ Failed to start screen share:', error);
      alert('Failed to start screen share: ' + error.message);
    }
  }

  function stopScreenShare() {
    window.audioPipeline.stopScreenShare();
    document.getElementById('startScreenBtn').style.display = 'inline-block';
    document.getElementById('stopScreenBtn').style.display = 'none';
  }

  // 📹 RECORDING FUNCTIONS
  let mediaRecorder = null;
  let recordedChunks = [];

  function startRecording() {
    try {
      console.log('🎬 Starting recording...');
      
      // Get all audio tracks
      const audioTracks = window.audioPipeline.getAllAudioTracks();
      
      if (audioTracks.length === 0) {
        alert('No audio tracks available for recording');
        return;
      }
      
      // Create mixed stream
      const mixedStream = new MediaStream();
      audioTracks.forEach(track => {
        if (track && track.enabled) {
          mixedStream.addTrack(track);
        }
      });
      
      // Start recording
      mediaRecorder = new MediaRecorder(mixedStream);
      recordedChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${Date.now()}.webm`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('✅ Recording saved');
      };
      
      mediaRecorder.start();
      isRecording = true;
      
      // Update UI
      document.getElementById('startRecordBtn').style.display = 'none';
      document.getElementById('stopRecordBtn').style.display = 'inline-block';
      
      console.log('✅ Recording started');
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      alert('Failed to start recording: ' + error.message);
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      
      // Update UI
      document.getElementById('startRecordBtn').style.display = 'inline-block';
      document.getElementById('stopRecordBtn').style.display = 'none';
      
      console.log('✅ Recording stopped');
    }
  }

  // 🔌 SOCKET.IO FUNCTIONS
  function initializeSocketConnection() {
    try {
      socket = io();
      
      socket.on('connect', () => {
        console.log('🔌 Connected to server');
      });
      
      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
      });
      
      socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize socket connection:', error);
    }
  }

  // 🎯 INITIALIZATION
  function initializeDashboard() {
    console.log('🚀 Initializing dashboard...');
    
    // Initialize socket connection
    initializeSocketConnection();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize audio pipeline
    window.audioPipeline.init();
    
    console.log('✅ Dashboard initialized successfully');
  }

  // 🎮 EVENT LISTENERS
  function setupEventListeners() {
    // Stream controls
    const startStreamBtn = document.getElementById('startStreamBtn');
    const stopStreamBtn = document.getElementById('stopStreamBtn');
    
    if (startStreamBtn) {
      startStreamBtn.addEventListener('click', startStream);
    }
    
    if (stopStreamBtn) {
      stopStreamBtn.addEventListener('click', stopStream);
    }
    
    // Screen sharing controls
    const startScreenBtn = document.getElementById('startScreenBtn');
    const stopScreenBtn = document.getElementById('stopScreenBtn');
    
    if (startScreenBtn) {
      startScreenBtn.addEventListener('click', startScreenShare);
    }
    
    if (stopScreenBtn) {
      stopScreenBtn.addEventListener('click', stopScreenShare);
    }
    
    // Recording controls
    const startRecordBtn = document.getElementById('startRecordBtn');
    const stopRecordBtn = document.getElementById('stopRecordBtn');
    
    if (startRecordBtn) {
      startRecordBtn.addEventListener('click', startRecording);
    }
    
    if (stopRecordBtn) {
      stopRecordBtn.addEventListener('click', stopRecording);
    }
    
    // Volume control
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        window.audioPipeline.updateAdminVolume(e.target.value);
      });
    }
  }

  // 🌐 GLOBAL FUNCTIONS (for HTML access)
  window.startStream = startStream;
  window.stopStream = stopStream;
  window.startScreenShare = startScreenShare;
  window.stopScreenShare = stopScreenShare;
  window.startRecording = startRecording;
  window.stopRecording = stopRecording;
  window.updateAdminVolume = (volume) => window.audioPipeline.updateAdminVolume(volume);

  // 🚀 START INITIALIZATION WHEN DOM IS READY
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
  } else {
    initializeDashboard();
  }

})();
