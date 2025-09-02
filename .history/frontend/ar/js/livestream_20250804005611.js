// frontend/ar/js/livestream.js
(() => {
  async function init() {
    const socket = io(window.location.origin);
    const remoteVideo = document.getElementById('viewerVideo');
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const micBtn = document.getElementById('requestMicBtn');
    const muteBtn = document.getElementById('muteBtn');
    const unmuteBtn = document.getElementById('unmuteBtn');
    const liveMsg = document.getElementById('liveMessage');
    const liveContainer = document.getElementById('liveContainer');
    const micRequest = document.getElementById('mic-request');
    const streamStatus = document.getElementById('streamStatus');

    let isConnected = false;
    let isMuted = false;
    let peerConnection = null;

    // Update stream status
    function updateStreamStatus(status, color = '#dc3545') {
        if (streamStatus) {
            streamStatus.textContent = status;
            streamStatus.style.background = color;
        }
    }

    // Create WebRTC peer connection
    function createPeerConnection() {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Handle incoming tracks (video/audio)
      pc.ontrack = (event) => {
        console.log('🎥 تم استلام المسار:', event.track.kind);
        if (remoteVideo) {
          remoteVideo.srcObject = event.streams[0];
          updateStreamStatus('مباشر', '#28a745'); // Green for live
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            target: 'admin',
            candidate: event.candidate
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('🔗 حالة الاتصال:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('✅ تم إنشاء اتصال WebRTC');
          updateStreamStatus('مباشر', '#28a745');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          updateStreamStatus('غير متصل', '#dc3545');
        }
      };

      return pc;
    }

    // Connect to socket and request to watch
    socket.on('connect', async () => {
      console.log('▶️ تم الاتصال كمتفرج');
      updateStreamStatus('جاري الاتصال', '#ffc107'); // Yellow for connecting
      
      // Get user info from localStorage or API
      let userInfo = null;
      const token = localStorage.getItem('userToken');
      
      console.log('🔍 التحقق من رمز المستخدم:', token ? 'تم العثور على الرمز' : 'لا يوجد رمز');
      
      if (token) {
        try {
          console.log('📡 جاري جلب معلومات المستخدم من /api/users/me...');
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('📡 حالة الاستجابة:', response.status);
          
          if (response.ok) {
            userInfo = await response.json();
            console.log('👤 تم تحميل معلومات المستخدم بنجاح:', userInfo);
            console.log('👤 اسم المستخدم:', userInfo.name);
            console.log('👤 هاتف المستخدم:', userInfo.phone);
          } else {
            const errorData = await response.json();
            console.error('❌ خطأ في API:', errorData);
          }
        } catch (error) {
          console.error('❌ لا يمكن تحميل معلومات المستخدم:', error);
        }
      } else {
        console.warn('⚠️ لم يتم العثور على رمز المستخدم في localStorage');
      }
      
      // Request to watch the stream
      console.log('📡 طلب مشاهدة البث المباشر مع معلومات المستخدم:', userInfo);
      socket.emit('watcher', userInfo);
    });

    // Handle stream start
    socket.on('stream-started', () => {
      console.log('🎥 بدأ البث المباشر');
      updateStreamStatus('جاري الاتصال', '#ffc107');
      if (liveContainer) {
        liveContainer.style.display = 'block';
      }
      if (liveMsg) {
        liveMsg.textContent = 'البث المباشر نشط';
      }
      isConnected = true;
    });

    // Handle stream not active
    socket.on('stream-not-active', () => {
      console.log('⏸️ البث المباشر غير نشط');
      updateStreamStatus('غير متصل', '#dc3545');
      if (liveContainer) {
        liveContainer.style.display = 'none';
      }
      if (liveMsg) {
        liveMsg.textContent = 'لا يوجد بث مباشر متاح';
      }
      isConnected = false;
    });

    // Handle stream stop
    socket.on('stream-stopped', () => {
      console.log('⏹️ توقف البث المباشر');
      updateStreamStatus('غير متصل', '#dc3545');
      if (liveContainer) {
        liveContainer.style.display = 'none';
      }
      if (liveMsg) {
        liveMsg.textContent = 'انتهى البث المباشر';
      }
      isConnected = false;
      
      // Close peer connection
      if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
      }
    });

    // Handle WebRTC offer from admin
    socket.on('offer', async (data) => {
      console.log('📥 تم استلام العرض من المدير');
      updateStreamStatus('جاري الاتصال', '#ffc107');
      
      try {
        // Create peer connection
        peerConnection = createPeerConnection();
        
        // Set remote description (offer)
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // Create answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        // Send answer to admin
        socket.emit('answer', {
          target: data.socketId,
          answer: answer
        });
        
        console.log('📤 تم إرسال الإجابة إلى المدير');
      } catch (error) {
        console.error('خطأ في معالجة العرض:', error);
        updateStreamStatus('خطأ', '#dc3545');
      }
    });

    // Handle ICE candidates from admin
    socket.on('ice-candidate', (data) => {
      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
          .catch(error => console.error('خطأ في إضافة ICE candidate:', error));
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ تم قطع الاتصال من الخادم');
      updateStreamStatus('غير متصل', '#dc3545');
      if (liveContainer) {
        liveContainer.style.display = 'none';
      }
      if (liveMsg) {
        liveMsg.textContent = 'فقد الاتصال';
      }
      
      // Close peer connection
      if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
      }
    });

    // Error handling
    socket.on('connect_error', (error) => {
      console.error('❌ خطأ في الاتصال:', error);
      updateStreamStatus('خطأ', '#dc3545');
      if (liveMsg) {
        liveMsg.textContent = 'خطأ في الاتصال. يرجى تحديث الصفحة.';
      }
    });

    // Chat functionality
    socket.on('chat-message', (data) => {
      const div = document.createElement('div');
      div.className = 'chat-message';
      div.innerHTML = `<strong>${data.sender}:</strong> ${data.message}`;
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    });

    sendBtn.addEventListener('click', () => {
      const msg = chatInput.value.trim();
      if (msg) {
        socket.emit('chat-message', { 
          sender: 'متفرج', 
          message: msg 
        });
        chatInput.value = '';
      }
    });

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendBtn.click();
      }
    });

    // Mic request functionality
    micBtn.addEventListener('click', async () => {
      // Get user info for the request
      let userName = 'متفرج';
      const token = localStorage.getItem('userToken');
      
      console.log('🎤 طلب الميكروفون - التحقق من رمز المستخدم:', token ? 'تم العثور على الرمز' : 'لا يوجد رمز');
      
      if (token) {
        try {
          console.log('🎤 جاري جلب معلومات المستخدم لطلب الميكروفون...');
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('🎤 حالة استجابة طلب الميكروفون:', response.status);
          
          if (response.ok) {
            const userInfo = await response.json();
            userName = userInfo.name;
            console.log('🎤 استخدام اسم المستخدم لطلب الميكروفون:', userName);
          } else {
            const errorData = await response.json();
            console.error('🎤 خطأ في API أثناء طلب الميكروفون:', errorData);
          }
        } catch (error) {
          console.error('🎤 لا يمكن تحميل معلومات المستخدم لطلب الميكروفون:', error);
        }
      } else {
        console.warn('🎤 لم يتم العثور على رمز المستخدم لطلب الميكروفون');
      }
      
      console.log('🎤 إرسال طلب الميكروفون باسم المستخدم:', userName);
      socket.emit('mic-request', { user: userName });
      micBtn.textContent = 'تم الإرسال...';
      micBtn.disabled = true;
      
      setTimeout(() => {
        micBtn.textContent = 'طلب التحدث';
        micBtn.disabled = false;
      }, 3000);
    });

    // Mute/Unmute functionality
    muteBtn.addEventListener('click', () => {
      if (!isMuted) {
        socket.emit('unmute-request', { user: 'متفرج' });
        muteBtn.style.display = 'none';
        unmuteBtn.style.display = 'inline-block';
        isMuted = true;
      }
    });

    unmuteBtn.addEventListener('click', () => {
      if (isMuted) {
        socket.emit('mic-request', { user: 'متفرج' });
        unmuteBtn.style.display = 'none';
        muteBtn.style.display = 'inline-block';
        isMuted = false;
      }
    });
  }

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(); 