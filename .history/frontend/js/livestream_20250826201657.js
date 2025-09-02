// 🚀 JITSI MEET LIVESTREAMING - USER SIDE

(() => {
  // 🎯 GLOBAL VARIABLES
  let jitsiApi = null;
  let currentRoom = null;
  let isConnected = false;
  let isMuted = false;

  // 🚀 JITSI MEET CONFIGURATION
  const JITSI_CONFIG = {
    domain: 'meet.jit.si'
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
      
      // Microphone access will be handled by Jitsi Meet
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

  // 🔌 JITSI MEET LIVESTREAMING FUNCTIONS
  async function initializeLivestream() {
    try {
      console.log('🚀 Initializing Jitsi Meet livestreaming system...');
      
      // Check if Jitsi Meet API is available
      if (typeof JitsiMeetExternalAPI === 'undefined') {
        throw new Error('Jitsi Meet API not loaded');
      }
      
      // Check if container exists
      const container = document.getElementById('jitsi-container');
      if (!container) {
        throw new Error('Jitsi container element not found');
      }
      
      console.log('✅ Jitsi Meet system initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Jitsi Meet:', error);
      return false;
    }
  }

  async function joinStream(roomId) {
    try {
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      
      console.log('🎥 Joining Jitsi Meet livestream...');
      
      // Get the container element with fallback
      const container = document.getElementById('jitsi-container') || document.body;
      
      // Show the container if it exists
      if (document.getElementById('jitsi-container')) {
        document.getElementById('jitsi-container').style.display = 'block';
      }
      
      // Create Jitsi Meet API instance with proper container reference
      jitsiApi = new JitsiMeetExternalAPI(JITSI_CONFIG.domain, {
        roomName: roomId,
        parentNode: container, // Use the actual DOM element or fallback to body
        width: '100%',
        height: '100%',
        userInfo: {
          displayName: 'UNA Institute User'
        },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableClosePage: false,
          enableWelcomePage: false,
          enableLobbyChat: false,
          enableKnocking: false,
          enableInsecureRoomNameWarning: false,
          enableAudioLevels: true,
          enableNoAudioDetection: true,
          enableNoisyMicDetection: true,
          enableRemb: true,
          enableTcc: true,
          openBridgeChannel: 'websocket'
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
            'tileview', 'select-background', 'download', 'help', 'mute-everyone', 'security'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_POWERED_BY: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_PROMOTIONAL_SPACE: false,
          GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
          AUTHENTICATION_ENABLE: false,
          LANG_DETECTION: false,
          INVITATION_POWERED_BY: false,
          VIDEO_LAYOUT_FIT: 'height',
          TOOLBAR_ALWAYS_VISIBLE: true,
          TOOLBAR_BUTTONS_ALWAYS_VISIBLE: true,
          HIDE_JITSI_WATERMARK: true,
          HIDE_WATERMARK_FOR_GUESTS: true,
          HIDE_POWERED_BY: true,
          HIDE_BRAND_WATERMARK: true,
          HIDE_PROMOTIONAL_SPACE: true
        }
      });
      
      // Set up event listeners
      jitsiApi.addEventListeners({
        'participantJoined': onParticipantJoined,
        'participantLeft': onParticipantLeft,
        'audioMuteStatusChanged': onAudioMuteStatusChanged,
        'videoMuteStatusChanged': onVideoMuteStatusChanged,
        'meetingJoined': onMeetingJoined,
        'meetingLeft': onMeetingLeft
      });
      
      currentRoom = roomId;
      isConnected = true;
      console.log('✅ Successfully joined Jitsi Meet livestream');
      
      // Update UI
      updateStreamStatus('CONNECTED', '#28a745');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to join livestream:', error);
      updateStreamStatus('ERROR', '#dc3545');
      throw error;
    }
  }

  async function leaveStream() {
    try {
      if (jitsiApi) {
        jitsiApi.executeCommand('hangup');
        jitsiApi.dispose();
        jitsiApi = null;
      }
      currentRoom = null;
      isConnected = false;
      console.log('✅ Successfully left Jitsi Meet livestream');
      
      // Hide the container
      const container = document.getElementById('jitsi-container');
      if (container) {
        container.style.display = 'none';
      }
      
      // Update UI
      updateStreamStatus('DISCONNECTED', '#6c757d');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to leave livestream:', error);
      return false;
    }
  }

  // 🎤 SPEAKING FUNCTIONS
  async function startSpeaking() {
    try {
      if (jitsiApi && isConnected) {
        jitsiApi.executeCommand('mute', false);
        isMuted = false;
        console.log('🎤 Microphone unmuted');
        
        // Update UI
        updateMicButton(true);
        updateStreamStatus('SPEAKING', '#ffc107');
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to unmute microphone:', error);
      return false;
    }
  }

  async function stopSpeaking() {
    try {
      if (jitsiApi && isConnected) {
        jitsiApi.executeCommand('mute', true);
        isMuted = true;
        console.log('🔇 Microphone muted');
        
        // Update UI
        updateMicButton(false);
        updateStreamStatus('CONNECTED', '#28a745');
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to mute microphone:', error);
      return false;
    }
  }

  // 📡 JITSI MEET EVENT HANDLERS
  function onParticipantJoined(participant) {
    console.log('👤 Participant joined:', participant);
  }

  function onParticipantLeft(participant) {
    console.log('👤 Participant left:', participant);
  }

  function onAudioMuteStatusChanged(participant) {
    console.log('🎤 Audio mute status changed:', participant);
    if (participant.isLocal) {
      isMuted = participant.muted;
      updateMicButton(!isMuted);
    }
  }

  function onVideoMuteStatusChanged(participant) {
    console.log('📹 Video mute status changed:', participant);
  }

  function onMeetingJoined() {
    console.log('✅ Successfully joined Jitsi Meet meeting');
    updateStreamStatus('CONNECTED', '#28a745');
  }

  function onMeetingLeft() {
    console.log('👋 Left Jitsi Meet meeting');
    isConnected = false;
    updateStreamStatus('DISCONNECTED', '#6c757d');
  }

  // 🎨 UI UPDATE FUNCTIONS
  function updateStreamStatus(status, color) {
    const statusElement = document.getElementById('streamStatus');
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.style.color = color;
    }
  }

  // 🔗 PUBLIC API
  window.livestreamAPI = {
    initialize: initializeLivestream,
    join: joinStream,
    leave: leaveStream,
    startSpeaking: startSpeaking,
    stopSpeaking: stopSpeaking,
    requestMicrophoneAccess: requestMicrophoneAccess,
    isConnected: () => isConnected,
    isMuted: () => isMuted
  };

  // 🚀 INITIALIZATION
  document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing Jitsi Meet livestreaming system...');
    
    try {
      await initializeLivestream();
      console.log('✅ Jitsi Meet system ready');
      
      // Set up UI event listeners
      setupUIEventListeners();
      
    } catch (error) {
      console.error('❌ Failed to initialize Jitsi Meet system:', error);
    }
  });

  function setupUIEventListeners() {
    // Microphone request button
    const micBtn = document.getElementById('requestMicBtn');
    if (micBtn) {
      micBtn.addEventListener('click', requestMicrophoneAccess);
    }

    // Join stream button
    const joinBtn = document.getElementById('joinStreamBtn');
    if (joinBtn) {
      joinBtn.addEventListener('click', () => {
        const roomId = prompt('Enter room ID to join:');
        if (roomId) {
          joinStream(roomId);
        }
      });
    }

    // Leave stream button
    const leaveBtn = document.getElementById('leaveStreamBtn');
    if (leaveBtn) {
      leaveBtn.addEventListener('click', leaveStream);
    }

    // Speak button
    const speakBtn = document.getElementById('speakBtn');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        if (isMuted) {
          startSpeaking();
        } else {
          stopSpeaking();
        }
      });
    }
  }

})();