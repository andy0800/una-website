// 🌐 NETWORK SHARING CONFIGURATION
// This file manages network access settings for your UNA Institute website

module.exports = {
  // Network sharing enabled
  enabled: true,
  
  // Your local network configuration
  localNetwork: {
    ip: '192.168.187.16',
    subnet: '192.168.187.0/24',
    gateway: '192.168.187.201',
    port: process.env.PORT || 3000
  },
  
  // Allowed origins for CORS
  allowedOrigins: [
    // Local development
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    
    // Your local network IP
    'http://192.168.187.16:3000',
    'http://192.168.187.16:3001',
    'https://192.168.187.16:3000',
    'https://192.168.187.16:3001',
    
    // Production domains (update these when you deploy)
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ],
  
  // Network access URLs
  accessUrls: {
    local: 'http://localhost:3000',
    network: 'http://192.168.187.16:3000',
    external: null // Set this when you have external access
  },
  
  // Security settings
  security: {
    allowExternalAccess: true,
    requireAuthentication: false, // Set to true in production
    rateLimitPerIP: 1000,
    maxConnectionsPerIP: 10
  },
  
  // WebRTC and streaming settings
  streaming: {
    allowNetworkAccess: true,
    maxViewers: 100,
    enableRecording: true,
    enableScreenSharing: true
  },
  
  // Logging
  logging: {
    logNetworkAccess: true,
    logBlockedRequests: true,
    logCORSViolations: true
  }
};
