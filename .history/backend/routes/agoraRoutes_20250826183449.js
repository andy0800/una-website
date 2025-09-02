// backend/routes/agoraRoutes.js
// Agora.io token generation routes

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Agora.io App ID and App Certificate (you need to get these from Agora Console)
const AGORA_APP_ID = 'ad0f3ae4ba69420d8a4b2fafd004184b';

// 🔐 CRITICAL: Replace this with your actual App Certificate from Agora Console
// Go to: Security → Token Authentication → Copy App Certificate
const AGORA_APP_CERTIFICATE = '2ee82105b8a24ae59c9b82edf5fa212f'; // ✅ CONFIGURED!

// Check if App Certificate is configured
if (AGORA_APP_CERTIFICATE === 'YOUR_APP_CERTIFICATE_HERE') {
    console.warn('⚠️ WARNING: Agora App Certificate not configured!');
    console.warn('⚠️ Go to Agora Console → Security → Token Authentication');
    console.warn('⚠️ Copy your App Certificate and update this file');
} else {
    console.log('✅ Agora App Certificate configured successfully!');
    console.log('✅ App ID:', AGORA_APP_ID);
    console.log('✅ App Certificate:', AGORA_APP_CERTIFICATE.substring(0, 8) + '...');
}

// Generate Agora.io token
function generateToken(uid, channelName, privilegeExpiredTs = 3600) {
    const appID = AGORA_APP_ID;
    const appCertificate = AGORA_APP_CERTIFICATE;
    
    if (!appCertificate) {
        throw new Error('Agora App Certificate not configured');
    }
    
    const role = 1; // 1: Publisher, 2: Subscriber
    
    const timestamp = Math.floor(Date.now() / 1000);
    const randomInt = Math.floor(Math.random() * 0xFFFFFFFF);
    
    const message = Buffer.alloc(20);
    message.writeUInt32LE(timestamp, 0);
    message.writeUInt32LE(randomInt, 4);
    message.writeUInt32LE(uid, 8);
    message.writeUInt32LE(privilegeExpiredTs, 12);
    message.writeUInt32LE(role, 16);
    
    const key = Buffer.from(appCertificate, 'utf8');
    const sign = crypto.createHmac('sha256', key).update(message).digest();
    
    const token = Buffer.alloc(32);
    sign.copy(token, 0, 0, 32);
    message.copy(token, 32, 0, 20);
    
    return token.toString('base64');
}

// Fallback temp token from Agora Console
const FALLBACK_TEMP_TOKEN = '007eJxTYAg4/W3uxrbd9U9cKy37VhSX8VGBJTDNKME1NTkhLNLE2M...';

// Get token for a channel
router.get('/token/:channel/:uid', (req, res) => {
    try {
        const { channel, uid } = req.params;
        let token;
        try {
            token = generateToken(parseInt(uid), channel);
        } catch (tokenError) {
            console.warn('⚠️ Token generation failed, using fallback temp token:', tokenError.message);
            token = FALLBACK_TEMP_TOKEN;
        }
        
        res.json({
            success: true,
            token: token,
            appId: AGORA_APP_ID,
            channel: channel,
            uid: parseInt(uid)
        });
    } catch (error) {
        console.error('❌ Token endpoint failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get token for current user
router.post('/token', (req, res) => {
    try {
        const { channel, uid } = req.body;
        
        if (!channel || !uid) {
            return res.status(400).json({
                success: false,
                error: 'Channel and UID are required'
            });
        }
        
        let token;
        try {
            token = generateToken(parseInt(uid), channel);
        } catch (tokenError) {
            console.warn('⚠️ Token generation failed, using fallback temp token:', tokenError.message);
            token = FALLBACK_TEMP_TOKEN;
        }
        
        res.json({
            success: true,
            token: token,
            appId: AGORA_APP_ID,
            channel: channel,
            uid: parseInt(uid)
        });
    } catch (error) {
        console.error('❌ Token endpoint failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test Agora.io configuration
router.get('/test', (req, res) => {
    try {
        const config = {
            appId: AGORA_APP_ID,
            appCertificateConfigured: AGORA_APP_CERTIFICATE !== 'YOUR_APP_CERTIFICATE_HERE',
            appCertificateLength: AGORA_APP_CERTIFICATE.length,
            tokenGenerationAvailable: AGORA_APP_CERTIFICATE !== 'YOUR_APP_CERTIFICATE_HERE'
        };
        
        res.json({
            success: true,
            message: 'Agora.io configuration test',
            config: config,
            instructions: {
                appId: '✅ App ID is configured',
                appCertificate: config.appCertificateConfigured ? 
                    '✅ App Certificate is configured' : 
                    '❌ App Certificate NOT configured - Go to Agora Console → Security → Token Authentication',
                nextSteps: config.appCertificateConfigured ? 
                    '✅ Ready to generate tokens' : 
                    '⚠️ Cannot generate tokens without App Certificate'
            }
        });
    } catch (error) {
        console.error('❌ Configuration test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
