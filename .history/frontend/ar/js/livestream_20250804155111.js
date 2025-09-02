// frontend/ar/js/livestream.js - Arabic version
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

    let peerConnection = null;
    let isConnected = false;
    let isMuted = false;
    let userMicStream = null;
    let userMicPeerConnection = null;

    // Initialize WebRTC peer connection
    function createPeerConnection() {
      if (peerConnection) {
        peerConnection.close();
      }

      peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerConnection.ontrack = (event) => {
        console.log('🎥 تم استلام البث المباشر');
        remoteVideo.srcObject = event.streams[0];
        isConnected = true;
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            target: 'admin',
            candidate: event.candidate
          });
        }
      };

      peerConnection.onconnectionstatechange = () => {
        console.log('🔗 حالة الاتصال:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          console.log('✅ تم الاتصال بنجاح!');
        }
      };

      return peerConnection;
    }

    // Connect to socket and request to watch
    socket.on('connect', async () => {
      console.log('▶️ تم الاتصال كمشاهد');
      
      // Get user info from localStorage or API
      let userInfo = null;
      const token = localStorage.getItem('userToken');
      
      if (token) {
        try {
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            userInfo = await response.json();
            console.log('👤 تم تحميل معلومات المستخدم:', userInfo.name);
          }
        } catch (error) {
          console.warn('⚠️ تعذر تحميل معلومات المستخدم:', error);
        }
      }
      
      socket.emit('watcher', userInfo);
    });

    // Handle stream start
    socket.on('stream-started', () => {
      console.log('🎥 بدأ البث المباشر');
      document.getElementById('streamStatus').textContent = 'مباشر';
      document.getElementById('streamStatus').style.background = 'rgba(220, 53, 69, 0.9)';
      liveMsg.textContent = 'جاري بدء البث المباشر...';
      micRequest.style.display = 'block';
    });

    // Handle stream stop
    socket.on('stream-stopped', () => {
      console.log('⏹️ توقف البث المباشر');
      document.getElementById('streamStatus').textContent = 'غير متصل';
      document.getElementById('streamStatus').style.background = 'rgba(0,0,0,0.7)';
      liveMsg.textContent = 'انتهى البث المباشر';
      micRequest.style.display = 'none';
      if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
      }
      isConnected = false;
    });

    // Handle when no stream is active
    socket.on('stream-not-active', () => {
      console.log('⏸️ لا يوجد بث مباشر نشط');
      document.getElementById('streamStatus').textContent = 'غير متصل';
      document.getElementById('streamStatus').style.background = 'rgba(0,0,0,0.7)';
      liveMsg.textContent = 'لا يوجد بث مباشر متاح';
      micRequest.style.display = 'none';
    });

    // Handle WebRTC offer from admin
    socket.on('offer', async ({ socketId: adminId, offer }) => {
      console.log('⬇️ تم استلام عرض من المدير');
      try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('answer', { 
          target: adminId, 
          answer: answer 
        });
        
        console.log('📤 تم إرسال الرد للمدير');
      } catch (error) {
        console.error('❌ خطأ في معالجة العرض:', error);
      }
    });

    // Handle ICE candidates
    socket.on('ice-candidate', ({ socketId, candidate }) => {
      if (peerConnection && peerConnection.remoteDescription) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
          .catch(error => console.error('❌ خطأ في إضافة ICE candidate:', error));
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
          sender: 'مشاهد', 
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
      let userName = 'مشاهد';
      const token = localStorage.getItem('userToken');
      
      if (token) {
        try {
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userInfo = await response.json();
            userName = userInfo.name;
          }
        } catch (error) {
          console.warn('⚠️ تعذر تحميل معلومات المستخدم لطلب الميكروفون:', error);
        }
      }
      
      socket.emit('mic-request', { user: userName });
      micBtn.textContent = 'تم إرسال الطلب...';
      micBtn.disabled = true;
      
      setTimeout(() => {
        micBtn.textContent = 'طلب التحدث';
        micBtn.disabled = false;
      }, 3000);
    });

    socket.on('mic-approved', async () => {
      try {
        console.log('🎤 تم الموافقة على الميكروفون - طلب الوصول للميكروفون...');
        
        // Request microphone access
        userMicStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
        
        console.log('✅ تم منح الوصول للميكروفون');
        
        // Create peer connection for mic stream
        userMicPeerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });
        
        // Add mic track to peer connection
        userMicStream.getTracks().forEach(track => {
          userMicPeerConnection.addTrack(track, userMicStream);
        });
        
        // Handle ICE candidates
        userMicPeerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', {
              target: 'admin',
              candidate: event.candidate
            });
          }
        };
        
        // Create and send offer for mic stream
        const offer = await userMicPeerConnection.createOffer();
        await userMicPeerConnection.setLocalDescription(offer);
        
        socket.emit('user-mic-offer', {
          target: 'admin',
          offer: offer
        });
        
        alert('🎤 الميكروفون نشط الآن! يمكنك التحدث.');
        
      } catch (error) {
        console.error('❌ خطأ في الوصول للميكروفون:', error);
        alert('❌ تعذر الوصول للميكروفون: ' + error.message);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ تم قطع الاتصال من الخادم');
      liveContainer.style.display = 'none';
      liveMsg.textContent = 'فقد الاتصال';
    });

    // Error handling
    socket.on('connect_error', (error) => {
      console.error('❌ خطأ في الاتصال:', error);
      liveMsg.textContent = 'خطأ في الاتصال. يرجى تحديث الصفحة.';
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(); 