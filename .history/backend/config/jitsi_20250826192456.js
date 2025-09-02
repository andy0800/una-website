// 🚀 JITSI MEET CONFIGURATION
// Configuration for Jitsi Meet livestreaming integration

const jitsiConfig = {
    // Jitsi Meet server configuration
    server: {
        // Use the free public Jitsi Meet server
        domain: 'meet.jit.si',
        // Alternative: use a custom Jitsi Meet server if needed
        // domain: process.env.JITSI_SERVER_DOMAIN || 'meet.jit.si',
        
        // Room configuration
        roomPrefix: 'una-institute-',
        roomSuffix: '-livestream',
        
        // Security settings
        enableLobby: true,
        enablePassword: false,
        enableRecording: false,
        
        // Audio/Video settings
        startAudioOnly: false,
        startVideoMuted: false,
        startAudioMuted: false,
        
        // UI customization
        disableDeepLinking: true,
        disableInviteFunctions: true,
        disablePolls: true,
        disableReactions: true,
        disableSelfView: false,
        
        // Branding
        brandingRoomAlias: 'UNA Institute Livestream',
        brandingRoomName: 'UNA Institute Professional Training',
        
        // Features
        enableClosePage: false,
        enableWelcomePage: false,
        enablePrejoinPage: false,
        
        // Permissions
        userRoles: {
            admin: ['moderator', 'participant'],
            user: ['participant']
        }
    },
    
    // Client configuration
    client: {
        // Connection settings
        websocket: 'wss://meet.jit.si/xmpp-websocket',
        bosh: 'https://meet.jit.si/http-bind',
        
        // Timeout settings
        connectionTimeout: 10000,
        joinTimeout: 15000,
        
        // Retry settings
        maxRetries: 3,
        retryDelay: 2000
    },
    
    // Room management
    rooms: {
        // Default room settings
        defaultSettings: {
            maxParticipants: 100,
            maxVideoSenders: 10,
            maxAudioSenders: 20,
            
            // Quality settings
            videoQuality: 'medium', // low, medium, high
            audioQuality: 'high',
            
            // Bandwidth settings
            maxBitrate: 2000000, // 2 Mbps
            startBitrate: 800000, // 800 Kbps
        },
        
        // Room types
        types: {
            livestream: {
                name: 'Livestream Room',
                description: 'Main livestream room for UNA Institute',
                maxParticipants: 200,
                enableScreenShare: true,
                enableChat: true,
                enableRaiseHand: true
            },
            training: {
                name: 'Training Room',
                description: 'Interactive training session room',
                maxParticipants: 50,
                enableScreenShare: true,
                enableChat: true,
                enableRaiseHand: true,
                enableBreakoutRooms: true
            },
            meeting: {
                name: 'Meeting Room',
                description: 'General meeting room',
                maxParticipants: 30,
                enableScreenShare: true,
                enableChat: true,
                enableRaiseHand: false
            }
        }
    },
    
    // Security and authentication
    security: {
        // JWT token settings (if using custom server)
        enableJWT: false,
        jwtSecret: process.env.JITSI_JWT_SECRET || '',
        jwtExpiry: 3600, // 1 hour
        
        // Room access control
        enableRoomLock: true,
        enableModeratorApproval: true,
        
        // Content security
        allowedDomains: [
            'meet.jit.si',
            'localhost',
            '127.0.0.1'
        ]
    },
    
    // Monitoring and logging
    monitoring: {
        enableLogging: true,
        logLevel: 'info', // debug, info, warn, error
        enableMetrics: false,
        
        // Event tracking
        trackEvents: [
            'room-joined',
            'room-left',
            'participant-joined',
            'participant-left',
            'stream-started',
            'stream-stopped'
        ]
    }
};

module.exports = jitsiConfig;
