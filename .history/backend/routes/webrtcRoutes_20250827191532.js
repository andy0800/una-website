const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// NEW: Input validation and sanitization
const { body, param, validationResult } = require('express-validator');

// NEW: Rate limiting for WebRTC routes
const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const webrtcRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health', // Skip health checks
  keyGenerator: (req) => {
    // Use admin ID if authenticated, otherwise use IP
    return req.admin ? req.admin.id : req.ip;
  }
});

// NEW: Sanitization helper
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, ''); // Remove potential HTML tags
  }
  return input;
};

// NEW: Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

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

// Create WebRTC room with validation
router.post('/create-room', [
  verifyAdminToken,
  body('roomId')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Room ID must be 3-50 characters, alphanumeric with hyphens/underscores only'),
  validateRequest
], (req, res) => {
  try {
    const { roomId } = req.body;
    
    // Additional sanitization
    const sanitizedRoomId = sanitizeInput(roomId);
    
    if (!sanitizedRoomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    // Create room configuration
    const roomConfig = {
      roomId: sanitizedRoomId,
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

// Get room information with validation
router.get('/room/:roomId', [
  param('roomId')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Invalid room ID format'),
  validateRequest
], (req, res) => {
  try {
    const { roomId } = req.params;
    const sanitizedRoomId = sanitizeInput(roomId);
    
    res.json({
      success: true,
      room: {
        roomId: sanitizedRoomId,
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

// End livestream with validation
router.post('/end-stream', [
  verifyAdminToken,
  body('roomId')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Invalid room ID format'),
  validateRequest
], (req, res) => {
  try {
    const { roomId } = req.body;
    const sanitizedRoomId = sanitizeInput(roomId);
    
    if (!sanitizedRoomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    res.json({
      success: true,
      message: 'WebRTC livestream ended successfully',
      roomId: sanitizedRoomId
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

// Update WebRTC configuration with validation
router.put('/config', [
  verifyAdminToken,
  body('iceServers').optional().isArray(),
  body('maxBitrate').optional().isInt({ min: 100000, max: 10000000 }),
  body('maxFramerate').optional().isInt({ min: 1, max: 60 }),
  body('resolution').optional().isIn(['480p', '720p', '1080p', '4K']),
  validateRequest
], (req, res) => {
  try {
    const { iceServers, maxBitrate, maxFramerate, resolution } = req.body;
    
    // Validate and sanitize ICE servers
    if (iceServers && Array.isArray(iceServers)) {
      const validIceServers = iceServers.filter(server => 
        server && typeof server === 'object' && 
        server.urls && typeof server.urls === 'string' &&
        (server.urls.startsWith('stun:') || server.urls.startsWith('turn:'))
      );
      
      if (validIceServers.length !== iceServers.length) {
        return res.status(400).json({ error: 'Invalid ICE server configuration' });
      }
    }
    
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

// NEW: Validate room access
router.post('/validate-room', [
  body('roomId')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Invalid room ID format'),
  body('userId').optional().isString().trim(),
  validateRequest
], (req, res) => {
  try {
    const { roomId, userId } = req.body;
    const sanitizedRoomId = sanitizeInput(roomId);
    const sanitizedUserId = userId ? sanitizeInput(userId) : null;
    
    // In a real implementation, you would check room access permissions
    res.json({
      success: true,
      hasAccess: true,
      roomId: sanitizedRoomId,
      userId: sanitizedUserId
    });
  } catch (error) {
    console.error('Error validating room access:', error);
    res.status(500).json({ error: 'Failed to validate room access' });
  }
});

// NEW: Get room participants
router.get('/room/:roomId/participants', [
  param('roomId')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Invalid room ID format'),
  validateRequest
], (req, res) => {
  try {
    const { roomId } = req.params;
    const sanitizedRoomId = sanitizeInput(roomId);
    
    // In a real implementation, you would fetch participants from the database
    res.json({
      success: true,
      roomId: sanitizedRoomId,
      participants: []
    });
  } catch (error) {
    console.error('Error getting room participants:', error);
    res.status(500).json({ error: 'Failed to get participants' });
  }
});

module.exports = router;
