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
           
           // 🔧 CRITICAL FIX: Handle autoplay restrictions with user interaction (Arabic)
           const playPromise = window.adminAudioElement.play();
           if (playPromise !== undefined) {
             playPromise.then(() => {
               console.log('✅ Admin audio playing successfully (Arabic)');
             }).catch(error => {
               console.warn('⚠️ Could not autoplay admin audio (Arabic):', error);
               
               // 🔧 AUTOPLAY FIX: Create user interaction audio activation system (Arabic)
               if (!window.audioActivationSetup) {
                 window.audioActivationSetup = true;
                 
                 // Method 1: Click anywhere to activate audio
                 const clickHandler = () => {
                   console.log('🔧 User clicked - activating admin audio (Arabic)...');
                   window.adminAudioElement.play().then(() => {
                     console.log('✅ Admin audio activated via click (Arabic)');
                     // Remove click handler after successful activation
                     document.removeEventListener('click', clickHandler);
                     document.removeEventListener('keydown', keyHandler);
                     // Remove Arabic message
                     const msg = document.getElementById('audioActivationMsg');
                     if (msg) msg.remove();
                   }).catch(e => console.warn('Still cannot play via click (Arabic):', e));
                 };
                 
                 // Method 2: Press any key to activate audio
                 const keyHandler = () => {
                   console.log('🔧 User pressed key - activating admin audio (Arabic)...');
                   window.adminAudioElement.play().then(() => {
                     console.log('✅ Admin audio activated via keypress (Arabic)');
                     // Remove handlers after successful activation
                     document.removeEventListener('click', clickHandler);
                     document.removeEventListener('keydown', keyHandler);
                     // Remove Arabic message
                     const msg = document.getElementById('audioActivationMsg');
                     if (msg) msg.remove();
                   }).catch(e => console.warn('Still cannot play via keypress (Arabic):', e));
                 };
                 
                 // Add event listeners
                 document.addEventListener('click', clickHandler);
                 document.addEventListener('keydown', keyHandler);
                 
                 // Method 3: Show user-friendly activation message (Arabic)
                 const activationMsg = document.createElement('div');
                 activationMsg.id = 'audioActivationMsg';
                 activationMsg.style.cssText = `
                   position: fixed;
                   top: 20px;
                   right: 20px;
                   background: #ffc107;
                   color: #000;
                   padding: 15px;
                   border-radius: 8px;
                   box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                   z-index: 10000;
                   font-family: Arial, sans-serif;
                   font-size: 14px;
                   max-width: 300px;
                   border-left: 4px solid #ff9800;
                   direction: rtl;
                 `;
                 activationMsg.innerHTML = `
                   <strong>🔊 تفعيل الصوت مطلوب</strong><br>
                   انقر في أي مكان أو اضغط أي مفتاح لسماع صوت المدير.<br>
                   <small>هذا مطلوب من متصفحك للأمان.</small>
                 `;
                 document.body.appendChild(activationMsg);
                 
                 // Auto-remove message after 10 seconds
                 setTimeout(() => {
                   if (activationMsg.parentNode) {
                     activationMsg.remove();
                   }
                 }, 10000);
                 
                 console.log('🔧 Audio activation system setup complete (Arabic) - waiting for user interaction');
               }
             });
           }
          
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
         
         // 🔧 BROWSER-SPECIFIC MICROPHONE WORKAROUND
         const browserInfo = getBrowserInfo();
         console.log('🌐 Browser detected (Arabic):', browserInfo);
         
         // 🔧 MOBILE COMPATIBILITY CHECK - PROGRESSIVE APPROACH
         if (!navigator.mediaDevices) {
           console.error('❌ navigator.mediaDevices is not supported on this device (Arabic)');
           
           // 🔧 MOBILE WEBRTC FALLBACK SYSTEM
           if (browserInfo.isMobile) {
             console.log('📱 Attempting mobile WebRTC fallback (Arabic)...');
             
             // Try to create a fallback mediaDevices object
             if (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia) {
               console.log('✅ Legacy getUserMedia found - creating fallback (Arabic)');
               
               // Create fallback mediaDevices
               navigator.mediaDevices = {
                 getUserMedia: function(constraints) {
                   return new Promise((resolve, reject) => {
                     const getUserMedia = navigator.getUserMedia || 
                                        navigator.webkitGetUserMedia || 
                                        navigator.mozGetUserMedia;
                     
                     getUserMedia.call(navigator, constraints, resolve, reject);
                   });
                 }
               };
               
               console.log('✅ Fallback mediaDevices created successfully (Arabic)');
             } else {
               // No fallback available
               alert('📱 تم اكتشاف جهاز محمول\n\n' +
                     'الوصول للميكروفون يتطلب متصفح محمول حديث.\n\n' +
                     'يرجى المحاولة:\n' +
                     '1. تحديث متصفحك لأحدث إصدار\n' +
                     '2. استخدام Firefox Mobile (أحدث إصدار)\n' +
                     '3. استخدام Chrome Mobile (أحدث إصدار)\n' +
                     '4. الوصول من جهاز كمبيوتر\n\n' +
                     'يمكنك الاستمرار في:\n' +
                     '✅ مشاهدة البث المباشر\n' +
                     '✅ إرسال رسائل الدردشة\n' +
                     '✅ عرض جميع المحتوى');
               return false;
             }
           } else {
             alert('الوصول للميكروفون غير مدعوم على هذا الجهاز/المتصفح.\n\n' +
                   'يرجى استخدام متصفح أو جهاز مختلف.');
             return false;
           }
         }
         
         // First, check if we already have permission
         if (navigator.permissions && navigator.permissions.query) {
           try {
             const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
             // Production-ready: Console logging removed
             
             if (permissionStatus.state === 'denied') {
               // Browser-specific error messages in Arabic
               if (browserInfo.isChrome || browserInfo.isEdge) {
                 alert('Chrome/Edge يتطلب HTTPS للوصول للميكروفون. يرجى استخدام Firefox أو الوصول عبر HTTPS.');
               } else if (browserInfo.isSafari) {
                 alert('Safari يتطلب HTTPS للوصول للميكروفون. يرجى استخدام Firefox أو الوصول عبر HTTPS.');
               } else {
                 alert('Microphone access is permanently denied. Please enable it in your browser settings and refresh the page.');
               }
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
              // Ensure the track is enabled and active
              audioTrack.enabled = true;
              
              const sender = peerConnection.addTrack(audioTrack, micStream);
              // Production-ready: Console logging removed
              
              // Store sender for later removal if needed
              window.microphoneSender = sender;
              
              // Verify track was added successfully
              if (sender) {
                // Production-ready: Console logging removed
              }
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
      console.log('🎤 Mic approved event received (Arabic):', data);
      
      // 🔧 MOBILE COMPATIBILITY CHECK FIRST
      const browserInfo = getBrowserInfo();
      if (browserInfo.isMobile && !navigator.mediaDevices) {
        console.log('📱 Mobile device detected without WebRTC support (Arabic)');
        micBtn.textContent = '📱 محدود';
        micBtn.disabled = true;
        micBtn.style.background = '#ffc107'; // Yellow for limited functionality
        micBtn.title = 'الميكروفون غير مدعوم على هذا الجهاز المحمول';
        
        // Show mobile-friendly message in Arabic
        alert('📱 تم اكتشاف جهاز محمول\n\n' +
              'الوصول للميكروفون غير مدعوم على هذا الجهاز المحمول/المتصفح.\n\n' +
              'يمكنك الاستمرار في:\n' +
              '✅ مشاهدة البث المباشر\n' +
              '✅ إرسال رسائل الدردشة\n' +
              '✅ عرض المحتوى\n\n' +
              'للحصول على وظائف الميكروفون الكاملة، يرجى استخدام:\n' +
              '• جهاز كمبيوتر\n' +
              '• متصفح محمول مختلف\n' +
              '• أحدث إصدار من المتصفح');
        return;
      }
      
      // Access microphone and add to peer connection
      const micAccessGranted = await handleMicrophoneAccess();
      console.log('🎤 Microphone access result (Arabic):', micAccessGranted);
      
      if (micAccessGranted) {
        micBtn.textContent = '🎤 تتحدث';
        micBtn.disabled = true;
        micBtn.style.background = '#28a745'; // Green to indicate active
        console.log('✅ Microphone is now active and speaking (Arabic)');
        
        // 🔧 CRITICAL FIX: Establish WebRTC connection to admin
        try {
          console.log('🔧 Establishing WebRTC connection to admin (Arabic)...');
          
          // Create peer connection if it doesn't exist
          if (!peerConnection) {
            peerConnection = createPeerConnection();
            console.log('✅ Created new peer connection (Arabic)');
          }
          
          // Create and send offer to admin
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          console.log('📤 Sending WebRTC offer to admin (Arabic)');
          socket.emit('offer', {
            target: 'admin',
            offer: offer
          });
          
          console.log('✅ WebRTC offer sent successfully (Arabic)');
        } catch (error) {
          console.error('❌ Error establishing WebRTC connection (Arabic):', error);
        }
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
        // Production-ready: Console logging removed
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Production-ready: Console logging removed
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
  
  // 🔧 BROWSER DETECTION FUNCTION
  function getBrowserInfo() {
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
    const isEdge = /Edge/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    return {
      isChrome,
      isEdge,
      isFirefox,
      isSafari,
      isMobile,
      userAgent: userAgent
    };
  }
})(); 