// 🚀 AGORA.IO CONFIGURATION
// This file contains the configuration for Agora.io WebRTC service

module.exports = {
  // 🔑 Agora App Configuration
  appId: process.env.AGORA_APP_ID || 'ad0f3ae4ba69420d8a4b2fafd004184b',
  appCertificate: process.env.AGORA_APP_CERTIFICATE || 'your-agora-app-certificate',
  
  // 🌐 Channel Configuration
  defaultChannel: 'UNA',
  
  // ⏰ Token Configuration
  tokenExpiration: 3600, // 1 hour in seconds
  
  // 🎯 Stream Configuration
  streamConfig: {
    mode: 'live', // live or rtc
    codec: 'vp8', // vp8 or h264
    role: 'host' // host or audience
  },
  
  // 📱 Mobile Configuration
  mobileConfig: {
    audioProfile: 0, // 0: Standard, 1: Standard Stereo, 2: High Quality, 3: High Quality Stereo
    audioScenario: 0, // 0: Default, 1: Chatroom Entertainment, 2: Education, 3: Game Streaming, 4: Showroom, 5: Chatroom Gaming
    videoEncoderConfig: {
      width: 640,
      height: 360,
      bitrate: 800,
      frameRate: 15,
      orientationMode: 0
    }
  },
  
  // 🔒 Security Configuration
  security: {
    enableEncryption: false, // Set to true for production
    encryptionMode: 'AES-128-XTS' // AES-128-XTS, AES-256-XTS, AES-128-ECB
  },
  
  // 📊 Monitoring Configuration
  monitoring: {
    enableLogging: true,
    logLevel: 'info', // debug, info, warn, error
    enableMetrics: true
  }
};
