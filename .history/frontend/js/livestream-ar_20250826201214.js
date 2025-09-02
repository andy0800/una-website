// 🚀 JITSI MEET LIVESTREAMING - USER SIDE (ARABIC)

(() => {
  // 🎯 GLOBAL VARIABLES
  let jitsiApi = null;
  let currentRoom = null;
  let isConnected = false;
  let isMuted = false;

  // 🚀 JITSI MEET CONFIGURATION
  const JITSI_CONFIG = {
    domain: 'meet.jit.si',
    width: 700,
    height: 700,
    parentNode: '#jitsi-container',
    configOverwrite: {
      startWithAudioMuted: false,
      startWithVideoMuted: false,
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
  };

  // 🎤 MICROPHONE ACCESS FUNCTIONS
  async function requestMicrophoneAccess() {
    try {
      console.log('🎤 طلب الوصول إلى الميكروفون...');
      
      // Check if we already have permission
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
        
        if (permissionStatus.state === 'denied') {
          alert('تم رفض الوصول إلى الميكروفون بشكل دائم. يرجى تمكينه في إعدادات المتصفح وتحديث الصفحة.');
          return false;
        }
      }
      
      // Microphone access will be handled by Jitsi Meet
      console.log('✅ تم منح الوصول إلى الميكروفون');
      
      // Update UI
      updateMicButton(true);
      
      return true;
    } catch (error) {
      console.error('❌ فشل في الوصول إلى الميكروفون:', error);
      
      if (error.name === 'NotAllowedError') {
        alert('تم رفض الوصول إلى الميكروفون. يرجى:\n\n' +
              '1. النقر على أيقونة الميكروفون في شريط عنوان المتصفح\n' +
              '2. اختيار "السماح" للوصول إلى الميكروفون\n' +
              '3. تحديث الصفحة والمحاولة مرة أخرى');
      } else if (error.name === 'NotFoundError') {
        alert('لم يتم العثور على ميكروفون. يرجى توصيل ميكروفون والمحاولة مرة أخرى.');
      } else {
        alert('فشل في الوصول إلى الميكروفون: ' + error.message);
      }
      
      return false;
    }
  }

  function updateMicButton(hasAccess) {
    const micBtn = document.getElementById('requestMicBtn');
    if (micBtn) {
      if (hasAccess) {
        micBtn.textContent = '🎤 يتحدث';
        micBtn.disabled = false;
        micBtn.style.background = '#28a745';
        micBtn.title = 'الميكروفون نشط';
      } else {
        micBtn.textContent = '🎤 طلب التحدث';
        micBtn.disabled = false;
        micBtn.style.background = '';
        micBtn.title = 'انقر لطلب الوصول إلى الميكروفون';
      }
    }
  }

  // 🔌 JITSI MEET LIVESTREAMING FUNCTIONS
  async function initializeLivestream() {
    try {
      console.log('🚀 تهيئة نظام البث المباشر Jitsi Meet...');
      
      // Check if Jitsi Meet API is available
      if (typeof JitsiMeetExternalAPI === 'undefined') {
        throw new Error('Jitsi Meet API غير محمل');
      }
      
      // Check if container exists
      const container = document.getElementById('jitsi-container');
      if (!container) {
        throw new Error('عنصر حاوية Jitsi غير موجود');
      }
      
      console.log('✅ تم تهيئة نظام Jitsi Meet بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل في تهيئة Jitsi Meet:', error);
      return false;
    }
  }

  async function joinStream(roomId) {
    try {
      if (!roomId) {
        throw new Error('معرف الغرفة مطلوب');
      }
      
      console.log('🎥 الانضمام إلى البث المباشر Jitsi Meet...');
      
      // Create Jitsi Meet API instance
      jitsiApi = new JitsiMeetExternalAPI(JITSI_CONFIG.domain, {
        ...JITSI_CONFIG,
        roomName: roomId,
        userInfo: {
          displayName: 'مستخدم معهد UNA'
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
      console.log('✅ تم الانضمام إلى البث المباشر Jitsi Meet بنجاح');
      
      // Update UI
      updateStreamStatus('متصل', '#28a745');
      
      return true;
    } catch (error) {
      console.error('❌ فشل في الانضمام إلى البث المباشر:', error);
      updateStreamStatus('خطأ', '#dc3545');
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
      console.log('✅ تم مغادرة البث المباشر Jitsi Meet بنجاح');
      
      // Update UI
      updateStreamStatus('غير متصل', '#6c757d');
      
      return true;
    } catch (error) {
      console.error('❌ فشل في مغادرة البث المباشر:', error);
      return false;
    }
  }

  // 🎤 SPEAKING FUNCTIONS
  async function startSpeaking() {
    try {
      if (jitsiApi && isConnected) {
        jitsiApi.executeCommand('mute', false);
        isMuted = false;
        console.log('🎤 تم إلغاء كتم الميكروفون');
        
        // Update UI
        updateMicButton(true);
        updateStreamStatus('يتحدث', '#ffc107');
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ فشل في إلغاء كتم الميكروفون:', error);
      return false;
    }
  }

  async function stopSpeaking() {
    try {
      if (jitsiApi && isConnected) {
        jitsiApi.executeCommand('mute', true);
        isMuted = true;
        console.log('🔇 تم كتم الميكروفون');
        
        // Update UI
        updateMicButton(false);
        updateStreamStatus('متصل', '#28a745');
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ فشل في كتم الميكروفون:', error);
      return false;
    }
  }

  // 📡 JITSI MEET EVENT HANDLERS
  function onParticipantJoined(participant) {
    console.log('👤 انضم مشارك:', participant);
  }

  function onParticipantLeft(participant) {
    console.log('👤 غادر مشارك:', participant);
  }

  function onAudioMuteStatusChanged(participant) {
    console.log('🎤 تغير حالة كتم الصوت:', participant);
    if (participant.isLocal) {
      isMuted = participant.muted;
      updateMicButton(!isMuted);
    }
  }

  function onVideoMuteStatusChanged(participant) {
    console.log('📹 تغير حالة كتم الفيديو:', participant);
  }

  function onMeetingJoined() {
    console.log('✅ تم الانضمام إلى اجتماع Jitsi Meet بنجاح');
    updateStreamStatus('متصل', '#28a745');
  }

  function onMeetingLeft() {
    console.log('👋 تم مغادرة اجتماع Jitsi Meet');
    isConnected = false;
    updateStreamStatus('غير متصل', '#6c757d');
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
    console.log('🚀 تهيئة نظام البث المباشر Jitsi Meet...');
    
    try {
      await initializeLivestream();
      console.log('✅ نظام Jitsi Meet جاهز');
      
      // Set up UI event listeners
      setupUIEventListeners();
      
    } catch (error) {
      console.error('❌ فشل في تهيئة نظام Jitsi Meet:', error);
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
        const roomId = prompt('أدخل معرف الغرفة للانضمام:');
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