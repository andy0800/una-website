// frontend/js/livestream-ar.js - Arabic version
(() => {
  async function init() {
    const socket = io(window.location.origin);
    const remoteVideo = document.getElementById('viewerVideo');
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const micBtn = document.getElementById('requestMicBtn');
    const liveMsg = document.getElementById('liveMessage');
    const micRequest = document.getElementById('mic-request');

         let peerConnection = null;
     let isConnected = false;
     let userMicrophoneStream = null; // Store user's microphone stream
     let microphonePermission = 'unknown'; // Track microphone permission status

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
        // Production-ready: Console logging removed
        
        if (event.track.kind === 'video') {
          // Handle video track
          if (remoteVideo) {
            // Create a new MediaStream with all tracks
            if (!remoteVideo.srcObject) {
              remoteVideo.srcObject = new MediaStream();
            }
            remoteVideo.srcObject.addTrack(event.track);
            isConnected = true;
          }
        } else if (event.track.kind === 'audio') {
          // Handle audio track - create audio element for admin audio
          // Production-ready: Console logging removed
          
          // Create audio element for admin audio if it doesn't exist
          if (!window.adminAudioElement) {
            window.adminAudioElement = document.createElement('audio');
            window.adminAudioElement.autoplay = true;
            window.adminAudioElement.controls = false;
            window.adminAudioElement.style.display = 'none';
            document.body.appendChild(window.adminAudioElement);
            // Production-ready: Console logging removed
          }
          
          // Add audio track to admin audio element
          const audioStream = new MediaStream([event.track]);
          window.adminAudioElement.srcObject = audioStream;
          window.adminAudioElement.play().catch(error => {
            console.warn('⚠️ Could not autoplay admin audio:', error);
          });
          
          // Production-ready: Console logging removed
        }
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
        // Production-ready: Console logging removed
        if (peerConnection.connectionState === 'connected') {
          // Production-ready: Console logging removed
          
          // If we have a microphone stream, add it now
          if (window.userMicrophoneStream && !window.microphoneSender) {
            try {
              const audioTrack = window.userMicrophoneStream.getAudioTracks()[0];
              if (audioTrack) {
                const sender = peerConnection.addTrack(audioTrack, window.userMicrophoneStream);
                window.microphoneSender = sender;
                // Production-ready: Console logging removed
              }
            } catch (error) {
              console.error('❌ Error adding microphone track after connection:', error);
            }
          }
        }
      };

      return peerConnection;
    }

         // Handle microphone access and add to peer connection
     async function handleMicrophoneAccess() {
       try {
         // Production-ready: Console logging removed
         
         // First, check if we already have permission
         if (navigator.permissions && navigator.permissions.query) {
           try {
             const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
             // Production-ready: Console logging removed
             
             if (permissionStatus.state === 'denied') {
               alert('Microphone access is permanently denied. Please enable it in your browser settings and refresh the page.');
               return false;
             }
           } catch (permError) {
             console.warn('⚠️ Could not check permission status:', permError);
           }
         }
         
         // Try multiple audio constraint sets for better compatibility
         const audioConstraints = [
           {
             audio: {
               echoCancellation: true,
               noiseSuppression: true,
               autoGainControl: true,
               sampleRate: 44100,
               channelCount: 1
             },
             video: false
           },
           {
             audio: {
               echoCancellation: true,
               noiseSuppression: true
             },
             video: false
           },
           {
             audio: true,
             video: false
           }
         ];
         
         let micStream = null;
         let lastError = null;
         
         // Try each constraint set until one works
         for (let i = 0; i < audioConstraints.length; i++) {
           try {
             // Production-ready: Console logging removed
             micStream = await navigator.mediaDevices.getUserMedia(audioConstraints[i]);
             // Production-ready: Console logging removed
             break;
           } catch (error) {
             lastError = error;
             console.warn(`⚠️ Constraint set ${i + 1} failed:`, error.name);
             continue;
           }
         }
         
         if (!micStream) {
           throw lastError || new Error('All audio constraint sets failed');
         }
         
         userMicrophoneStream = micStream;
         // Production-ready: Console logging removed
         
         // Store the microphone stream globally for later use
         window.userMicrophoneStream = micStream;
         
         // If peer connection exists, add the track immediately
         if (peerConnection) {
           const audioTrack = micStream.getAudioTracks()[0];
           if (audioTrack) {
             try {
               const sender = peerConnection.addTrack(audioTrack, micStream);
               // Production-ready: Console logging removed
               
               // Store sender for later removal if needed
               window.microphoneSender = sender;
             } catch (error) {
               console.error('❌ Error adding track to peer connection:', error);
             }
           }
         } else {
           // Production-ready: Console logging removed
         }
         
         return true;
       } catch (error) {
         console.error('❌ Error accessing microphone:', error);
         
         // Provide specific error messages with solutions
         if (error.name === 'NotAllowedError') {
           const errorMsg = 'Microphone access denied. Please:\n\n' +
             '1. Click the microphone icon in your browser address bar\n' +
             '2. Select "Allow" for microphone access\n' +
             '3. Refresh the page and try again\n\n' +
             'If the issue persists, try using a different browser or incognito mode.';
           alert(errorMsg);
         } else if (error.name === 'NotFoundError') {
           alert('No microphone found. Please connect a microphone and try again.');
         } else if (error.name === 'NotReadableError') {
           alert('Microphone is already in use by another application. Please close other apps using the microphone and try again.');
         } else if (error.name === 'SecurityError') {
           alert('Microphone access blocked due to security restrictions. Please ensure you are using HTTPS or localhost.');
         } else {
           alert('Failed to access microphone: ' + error.message + '\n\nPlease check your microphone permissions and try again.');
         }
         
         return false;
       }
     }

    // Connect to socket and request to watch
    socket.on('connect', () => {
      // Production-ready: Console logging removed
      socket.emit('watcher');
    });

    // Handle stream start
    socket.on('stream-started', () => {
      // Production-ready: Console logging removed
      document.getElementById('streamStatus').textContent = 'مباشر';
      document.getElementById('streamStatus').style.background = 'rgba(220, 53, 69, 0.9)';
      liveMsg.textContent = 'البث المباشر يبدأ الآن...';
      micRequest.style.display = 'block';
    });

    // Handle stream stop
    socket.on('stream-stopped', () => {
      // Production-ready: Console logging removed
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
      // Production-ready: Console logging removed
      document.getElementById('streamStatus').textContent = 'غير متصل';
      document.getElementById('streamStatus').style.background = 'rgba(0,0,0,0.7)';
      liveMsg.textContent = 'لا يوجد بث مباشر متاح حالياً';
      micRequest.style.display = 'none';
    });

    // Handle WebRTC offer from admin
    socket.on('offer', async ({ socketId: adminId, offer }) => {
      // Production-ready: Console logging removed
      try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('answer', { 
          target: adminId, 
          answer: answer 
        });
        
        // Production-ready: Console logging removed
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
    micBtn.addEventListener('click', () => {
      socket.emit('mic-request', { user: 'مشاهد' });
      micBtn.textContent = 'تم إرسال الطلب...';
      micBtn.disabled = true;
      
      setTimeout(() => {
        micBtn.textContent = '🎤 طلب التحدث';
        micBtn.disabled = false;
      }, 3000);
    });

    // Handle mic approval from admin
    socket.on('mic-approved', async (data) => {
              // Production-ready: Console logging removed
      
      // Access microphone and add to peer connection
      const micAccessGranted = await handleMicrophoneAccess();
      
      if (micAccessGranted) {
        micBtn.textContent = '🎤 تتحدث';
        micBtn.disabled = true;
        micBtn.style.background = '#28a745'; // Green to indicate active
        // Production-ready: Console logging removed
      } else {
        micBtn.textContent = '🎤 طلب التحدث';
        micBtn.disabled = false;
        micBtn.style.background = '';
        alert('فشل في الوصول للميكروفون. يرجى التحقق من الأذونات والمحاولة مرة أخرى.');
      }
    });

    // Handle mic rejection from admin
    socket.on('mic-rejected', (data) => {
              // Production-ready: Console logging removed
      micBtn.textContent = '🎤 طلب التحدث';
      micBtn.disabled = false;
      micBtn.style.background = '';
      alert('تم رفض طلب الميكروفون من قبل المدير.');
    });

    // Handle mic mute from admin
    socket.on('mic-muted', (data) => {
              // Production-ready: Console logging removed
      micBtn.textContent = '🎤 طلب التحدث';
      micBtn.disabled = false;
      micBtn.style.background = '';
      
      // Remove microphone track if it exists
      if (window.microphoneSender && peerConnection) {
        peerConnection.removeTrack(window.microphoneSender);
        window.microphoneSender = null;
        console.log('🎤 Microphone track removed by admin');
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ تم قطع الاتصال من الخادم');
      document.getElementById('streamStatus').textContent = 'غير متصل';
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