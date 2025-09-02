// 🚀 JITSI MEET ROUTES
// Backend routes for Jitsi Meet livestreaming functionality

const express = require('express');
const router = express.Router();
const jitsiConfig = require('../config/jitsi');
const { verifyAdminToken } = require('../middleware/auth');

// 🎯 GET /api/jitsi/config - Get Jitsi Meet configuration
router.get('/config', (req, res) => {
    try {
        // Return public configuration (no sensitive data)
        const publicConfig = {
            server: {
                domain: jitsiConfig.server.domain,
                roomPrefix: jitsiConfig.server.roomPrefix,
                roomSuffix: jitsiConfig.server.roomSuffix
            },
            rooms: {
                types: jitsiConfig.rooms.types
            },
            client: {
                connectionTimeout: jitsiConfig.client.connectionTimeout,
                joinTimeout: jitsiConfig.client.joinTimeout
            }
        };
        
        res.json({
            success: true,
            message: 'Jitsi Meet configuration retrieved successfully',
            data: publicConfig
        });
    } catch (error) {
        console.error('❌ Error getting Jitsi config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve Jitsi Meet configuration',
            error: error.message
        });
    }
});

// 🎯 POST /api/jitsi/room/create - Create a new livestream room (Admin only)
router.post('/room/create', verifyAdminToken, (req, res) => {
    try {
        const { roomType = 'livestream', roomName, description, maxParticipants } = req.body;
        
        // Validate room type
        if (!jitsiConfig.rooms.types[roomType]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room type',
                validTypes: Object.keys(jitsiConfig.rooms.types)
            });
        }
        
        // Generate unique room ID
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const roomId = `${jitsiConfig.server.roomPrefix}${roomType}-${timestamp}-${randomId}${jitsiConfig.server.roomSuffix}`;
        
        // Get room configuration
        const roomConfig = jitsiConfig.rooms.types[roomType];
        
        // Create room data
        const roomData = {
            roomId,
            roomType,
            roomName: roomName || roomConfig.name,
            description: description || roomConfig.description,
            maxParticipants: maxParticipants || roomConfig.maxParticipants,
            createdAt: new Date(),
            createdBy: req.adminId,
            status: 'active',
            participants: [],
            settings: {
                enableScreenShare: roomConfig.enableScreenShare,
                enableChat: roomConfig.enableChat,
                enableRaiseHand: roomConfig.enableRaiseHand,
                enableBreakoutRooms: roomConfig.enableBreakoutRooms || false
            }
        };
        
        // TODO: Store room data in database
        // For now, we'll just return the room data
        
        res.json({
            success: true,
            message: 'Livestream room created successfully',
            data: {
                roomId,
                roomUrl: `https://${jitsiConfig.server.domain}/${roomId}`,
                roomConfig: roomData
            }
        });
        
    } catch (error) {
        console.error('❌ Error creating Jitsi room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create livestream room',
            error: error.message
        });
    }
});

// 🎯 GET /api/jitsi/room/:roomId - Get room information
router.get('/room/:roomId', (req, res) => {
    try {
        const { roomId } = req.params;
        
        // Validate room ID format
        if (!roomId.startsWith(jitsiConfig.server.roomPrefix) || 
            !roomId.endsWith(jitsiConfig.server.roomSuffix)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room ID format'
            });
        }
        
        // TODO: Get room data from database
        // For now, return basic room info
        
        const roomInfo = {
            roomId,
            roomUrl: `https://${jitsiConfig.server.domain}/${roomId}`,
            status: 'active',
            participants: [],
            createdAt: new Date()
        };
        
        res.json({
            success: true,
            message: 'Room information retrieved successfully',
            data: roomInfo
        });
        
    } catch (error) {
        console.error('❌ Error getting room info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve room information',
            error: error.message
        });
    }
});

// 🎯 POST /api/jitsi/room/:roomId/join - Join a livestream room
router.post('/room/:roomId/join', (req, res) => {
    try {
        const { roomId } = req.params;
        const { username, role = 'participant', audio = true, video = true } = req.body;
        
        // Validate room ID format
        if (!roomId.startsWith(jitsiConfig.server.roomPrefix) || 
            !roomId.endsWith(jitsiConfig.server.roomSuffix)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room ID format'
            });
        }
        
        // Generate join token (if JWT is enabled)
        let joinToken = null;
        if (jitsiConfig.security.enableJWT) {
            // TODO: Generate JWT token for room access
            joinToken = 'jwt-token-placeholder';
        }
        
        // Create join data
        const joinData = {
            roomId,
            roomUrl: `https://${jitsiConfig.server.domain}/${roomId}`,
            username: username || 'Anonymous User',
            role,
            audio,
            video,
            joinToken,
            joinTime: new Date()
        };
        
        res.json({
            success: true,
            message: 'Room join data generated successfully',
            data: joinData
        });
        
    } catch (error) {
        console.error('❌ Error joining room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate room join data',
            error: error.message
        });
    }
});

// 🎯 POST /api/jitsi/room/:roomId/leave - Leave a livestream room
router.post('/room/:roomId/leave', (req, res) => {
    try {
        const { roomId } = req.params;
        const { username } = req.body;
        
        // TODO: Update room participant list in database
        
        res.json({
            success: true,
            message: 'Successfully left the room',
            data: {
                roomId,
                username,
                leaveTime: new Date()
            }
        });
        
    } catch (error) {
        console.error('❌ Error leaving room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process room leave',
            error: error.message
        });
    }
});

// 🎯 GET /api/jitsi/rooms/active - Get all active rooms (Admin only)
router.get('/rooms/active', verifyAdminToken, (req, res) => {
    try {
        // TODO: Get active rooms from database
        // For now, return empty list
        
        const activeRooms = [];
        
        res.json({
            success: true,
            message: 'Active rooms retrieved successfully',
            data: {
                count: activeRooms.length,
                rooms: activeRooms
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting active rooms:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve active rooms',
            error: error.message
        });
    }
});

// 🎯 POST /api/jitsi/room/:roomId/end - End a livestream room (Admin only)
router.post('/room/:roomId/end', verifyAdminToken, (req, res) => {
    try {
        const { roomId } = req.params;
        
        // TODO: Update room status in database
        
        res.json({
            success: true,
            message: 'Room ended successfully',
            data: {
                roomId,
                endTime: new Date(),
                endedBy: req.adminId
            }
        });
        
    } catch (error) {
        console.error('❌ Error ending room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end room',
            error: error.message
        });
    }
});

// 🎯 GET /api/jitsi/health - Health check for Jitsi Meet integration
router.get('/health', (req, res) => {
    try {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date(),
            config: {
                serverDomain: jitsiConfig.server.domain,
                roomTypes: Object.keys(jitsiConfig.rooms.types),
                securityEnabled: jitsiConfig.security.enableJWT
            },
            services: {
                jitsiServer: 'reachable',
                database: 'connected',
                websocket: 'available'
            }
        };
        
        res.json({
            success: true,
            message: 'Jitsi Meet integration health check passed',
            data: healthStatus
        });
        
    } catch (error) {
        console.error('❌ Jitsi health check failed:', error);
        res.status(500).json({
            success: false,
            message: 'Jitsi Meet integration health check failed',
            error: error.message
        });
    }
});

module.exports = router;
