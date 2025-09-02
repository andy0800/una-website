// 🚀 SIMPLIFIED WEBRTC - USER LIVESTREAM (ARABIC)
// Will be replaced with Jitsi Meet implementation

(() => {
  // 🎯 GLOBAL VARIABLES
  let isConnected = false;
  let isMuted = false;
  let socket = null;

  // 🚀 LIVESTREAMING CONFIGURATION
  // Will be configured for Jitsi Meet

  // 🎤 MICROPHONE ACCESS FUNCTIONS
  async function requestMicrophoneAccess() {
    try {
      console.log('🎤 طلب الوصول للميكروفون...');
      
      // Check if we already have permission
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
        
        if (permissionStatus.state === 'denied') {
          alert('الوصول للميكروفون مرفوض بشكل دائم. يرجى تمكينه في إعدادات المتصفح وتحديث الصفحة.');
          return false;
        }
      }
      
      // Create local audio track
      localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      console.log('✅ تم منح الوصول للميكروفون');
      
      // Update UI
      updateMicButton(true);
      
      return true;
    } catch (error) {
      console.error('❌ فشل في الوصول للميكروفون:', error);
      
      if (error.name === 'NotAllowedError') {
        alert('تم رفض الوصول للميكروفون. يرجى:\n\n' +
              '1. النقر على أيقونة الميكروفون في شريط عنوان المتصفح\n' +
              '2. اختيار "السماح" للوصول للميكروفون\n' +
              '3. تحديث الصفحة والمحاولة مرة أخرى');
      } else if (error.name === 'NotFoundError') {
        alert('لم يتم العثور على ميكروفون. يرجى توصيل ميكروفون والمحاولة مرة أخرى.');
      } else {
        alert('فشل في الوصول للميكروفون: ' + error.message);
      }
      
      return false;
    }
  }

  function updateMicButton(hasAccess) {
    const micBtn = document.getElementById('requestMicBtn');
    if (micBtn) {
      if (hasAccess) {
        micBtn.textContent = '🎤 تتحدث';
        micBtn.disabled = false;
        micBtn.style.background = '#28a745';
        micBtn.title = 'الميكروفون نشط';
      } else {
        micBtn.textContent = '🎤 طلب التحدث';
        micBtn.disabled = false;
        micBtn.style.background = '';
        micBtn.title = 'انقر لطلب الوصول للميكروفون';
      }
    }
  }

  // 🔌 LIVESTREAMING FUNCTIONS
  async function initializeLivestream() {
    try {
      console.log('🚀 تهيئة نظام البث المباشر...');
      
      // Will be replaced with Jitsi Meet implementation
      console.log('✅ نظام البث المباشر جاهز لـ Jitsi Meet');
      return true;
    } catch (error) {
      console.error('❌ فشل في تهيئة نظام البث المباشر:', error);
      return false;
    }
  }

  async function joinStream() {
    try {
      console.log('🚀 الانضمام للبث...');
      
      // Initialize livestreaming system if not already done
      await initializeLivestream();
      
      // Will be replaced with Jitsi Meet implementation
      console.log('✅ جاهز للانضمام لـ Jitsi Meet');
      
      // Update UI
      updateStreamStatus('جاهز', '#28a745');
      
    } catch (error) {
      console.error('❌ فشل في الانضمام للبث:', error);
      updateStreamStatus('خطأ', '#dc3545');
      alert('فشل في الانضمام للبث: ' + error.message);
    }
  }

  async function leaveStream() {
    try {
      // Will be replaced with Jitsi Meet implementation
      console.log('✅ تم مغادرة البث');
      
      isConnected = false;
      updateStreamStatus('غير متصل', '#dc3545');
      
    } catch (error) {
      console.error('❌ فشل في مغادرة البث:', error);
    }
  }

    // 🎤 MICROPHONE CONTROL FUNCTIONS
  async function startSpeaking() {
    try {
      // Will be replaced with Jitsi Meet implementation
      console.log('✅ بدأت التحدث');
      
      // Update UI
      updateMicButton(true);
      
      // Send mic request to admin
      if (socket) {
        socket.emit('mic-request', { user: 'مشاهد' });
      }
      
    } catch (error) {
      console.error('❌ فشل في بدء التحدث:', error);
      alert('فشل في بدء التحدث: ' + error.message);
    }
  }

  function stopSpeaking() {
    try {
      // Will be replaced with Jitsi Meet implementation
      console.log('✅ توقفت عن التحدث');
      
      // Update UI
      updateMicButton(false);
      
    } catch (error) {
      console.error('❌ فشل في التوقف عن التحدث:', error);
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
        console.log('🔌 متصل بالخادم');
        updateLiveMessage('متصل بخادم البث');
      });
      
      socket.on('disconnect', () => {
        console.log('🔌 انقطع الاتصال بالخادم');
        updateLiveMessage('انقطع الاتصال. يرجى تحديث الصفحة.');
      });
      
      socket.on('stream-started', () => {
        console.log('📡 بدأ البث');
        updateStreamStatus('يتصل...', '#ffc107');
        updateLiveMessage('البث المباشر نشط - يتصل...');
        joinStream();
      });
      
      socket.on('stream-stopped', () => {
        console.log('📡 توقف البث');
        updateStreamStatus('غير متصل', '#dc3545');
        updateLiveMessage('انتهى البث');
        leaveStream();
      });
      
      socket.on('mic-approved', () => {
        console.log('✅ تم الموافقة على الميكروفون');
        startSpeaking();
      });
      
      socket.on('mic-rejected', () => {
        console.log('❌ تم رفض الميكروفون');
        alert('تم رفض طلب الميكروفون من قبل المدير.');
      });
      
      socket.on('mic-muted', () => {
        console.log('🔇 تم كتم الميكروفون من قبل المدير');
        stopSpeaking();
        alert('تم كتم الميكروفون من قبل المدير.');
      });
      
    } catch (error) {
      console.error('❌ فشل في تهيئة اتصال Socket:', error);
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
          sender: 'مشاهد', 
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
    console.log('🚀 تهيئة البث المباشر...');
    
    // Initialize socket connection
    initializeSocketConnection();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up chat
    setupChat();
    
    // Initialize livestreaming system
    initializeLivestream();
    
    console.log('✅ تم تهيئة البث المباشر بنجاح');
  }

  // 🚀 START INITIALIZATION WHEN DOM IS READY
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLivestream);
  } else {
    initializeLivestream();
  }

})(); 