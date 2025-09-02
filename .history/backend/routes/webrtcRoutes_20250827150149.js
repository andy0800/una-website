const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// 🚀 CUSTOM WEBRTC LIVESTREAMING ROUTES

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

// Create WebRTC room
router.post('/create-room', verifyAdminToken, (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    // Create room configuration
    const roomConfig = {
      roomId,
      createdAt: new Date(),
      createdBy: req.admin.id,
      status: 'active',
      type: 'webrtc'
    };

    // In a real implementation, you would store this in a database
    res.json({
      success: true,
      room: roomConfig,
      message: 'WebRTC room created successfully'
    });

  } catch (error) {
    console.error('Error creating WebRTC room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room information
router.get('/room/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    
    res.json({
      success: true,
      room: {
        roomId,
        status: 'active',
        type: 'webrtc',
        participants: 0,
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error getting WebRTC room info:', error);
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

    res.json({
      success: true,
      message: 'WebRTC livestream ended successfully',
      roomId
    });

  } catch (error) {
    console.error('Error ending WebRTC stream:', error);
    res.status(500).json({ error: 'Failed to end stream' });
  }
});

// Get livestream status
router.get('/status', (req, res) => {
  try {
    res.json({
      success: true,
      activeStreams: 0,
      status: 'ready',
      type: 'webrtc'
    });

  } catch (error) {
    console.error('Error getting WebRTC status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Get WebRTC configuration
router.get('/config', (req, res) => {
  try {
    res.json({
      success: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        maxBitrate: 2500000,
        maxFramerate: 30,
        resolution: '1080p'
      }
    });
  } catch (error) {
    console.error('Error getting WebRTC config:', error);
    res.status(500).json({ error: 'Failed to get config' });
  }
});

// Update WebRTC configuration
router.put('/config', verifyAdminToken, (req, res) => {
  try {
    const { iceServers, maxBitrate, maxFramerate, resolution } = req.body;
    
    // In a real implementation, you would save this to a database
    res.json({
      success: true,
      message: 'WebRTC configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating WebRTC config:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// Get active streams
router.get('/streams', (req, res) => {
  try {
    res.json({
      success: true,
      streams: []
    });
  } catch (error) {
    console.error('Error getting active streams:', error);
    res.status(500).json({ error: 'Failed to get streams' });
  }
});

// Get stream statistics
router.get('/stats', (req, res) => {
  try {
    res.json({
      success: true,
      stats: {
        totalStreams: 0,
        activeStreams: 0,
        totalViewers: 0,
        averageBitrate: 0,
        uptime: 0
      }
    });
  } catch (error) {
    console.error('Error getting stream stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
