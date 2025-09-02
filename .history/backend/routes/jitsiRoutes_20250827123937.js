const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// 🚀 JITSI MEET LIVESTREAMING ROUTES

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Generate Jitsi Meet room configuration
router.post('/create-room', verifyAdminToken, (req, res) => {
  try {
    const { roomName, isPrivate = false, maxParticipants = 50 } = req.body;
    
    if (!roomName) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    // Generate unique room ID
    const roomId = `${roomName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create room configuration
    const roomConfig = {
      roomId,
      roomName,
      isPrivate,
      maxParticipants,
      createdAt: new Date(),
      createdBy: req.admin.id,
      status: 'active'
    };

    // In a real implementation, you might want to store this in a database
    // For now, we'll return the configuration
    res.json({
      success: true,
      room: roomConfig,
      jitsiConfig: {
        roomName: roomId,
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
          openBridgeChannel: 'websocket',
          // 🚀 CRITICAL: Disable members-only restrictions
          membersOnly: false,
          guestDialOutEnabled: false,
          guestDialOutUrl: null,
          // 🚀 CRITICAL: Allow public access
          publicRoom: true,
          // 🚀 CRITICAL: Disable lobby system
          lobby: {
            enabled: false
          },
          // 🚀 CRITICAL: Additional settings to prevent restrictions
          hosts: {
            domain: 'meet.jit.si'
          },
          // 🚀 CRITICAL: Disable authentication requirements
          authentication: {
            enabled: false
          },
          // 🚀 CRITICAL: Allow anonymous access
          anonymous: true,
          clientHeight: 700,
          clientWidth: 700,
          constraints: {
            video: {
              height: {
                ideal: 720,
                max: 720,
                min: 180
              }
            }
          }
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
      }
    });

  } catch (error) {
    console.error('Error creating Jitsi room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room information
router.get('/room/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    
    // In a real implementation, you would fetch this from a database
    // For now, return basic room info
    res.json({
      success: true,
      room: {
        roomId,
        status: 'active',
        participants: 0,
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error getting room info:', error);
    res.status(500).json({ error: 'Failed to get room information' });
  }
});

// End livestream
router.post('/end-stream', verifyAdminToken, (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    // In a real implementation, you would update the room status in a database
    // For now, return success
    res.json({
      success: true,
      message: 'Livestream ended successfully',
      roomId
    });

  } catch (error) {
    console.error('Error ending stream:', error);
    res.status(500).json({ error: 'Failed to end stream' });
  }
});

// Get livestream status
router.get('/status', (req, res) => {
  try {
    // In a real implementation, you would check active streams from a database
    // For now, return no active streams
    res.json({
      success: true,
      activeStreams: 0,
      status: 'ready'
    });

  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

module.exports = router;
