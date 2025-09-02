# 🚀 Jitsi Meet Livestreaming Implementation

## Overview
This document describes the complete Jitsi Meet livestreaming implementation that has replaced the previous Agora.io system in the UNA Institute website.

## ✨ Features Implemented

### 🎥 Admin Dashboard Livestreaming
- **Room Creation**: Admins can create new livestream rooms with custom names
- **Moderator Controls**: Full control over meeting settings and participant management
- **Screen Sharing**: Built-in screen sharing functionality
- **Recording**: Livestream recording capabilities
- **Participant Management**: Mute/unmute participants, manage permissions

### 👥 User-Side Livestreaming
- **Join Streams**: Users can join livestreams using room IDs
- **Microphone Access**: Request and use microphone during streams
- **Real-time Communication**: Full audio/video communication with other participants
- **Multi-language Support**: English and Arabic interfaces

### 🔧 Technical Features
- **WebRTC Technology**: Modern, browser-native communication
- **No Installation Required**: Works directly in web browsers
- **Cross-platform**: Compatible with desktop and mobile devices
- **Secure**: End-to-end encryption for communications

## 🏗️ Architecture

### Backend Components
```
backend/
├── routes/
│   └── jitsiRoutes.js          # Jitsi Meet API endpoints
├── server.js                    # Main server with Jitsi routes
└── middleware/
    └── security.js              # CSP headers for Jitsi domains
```

### Frontend Components
```
frontend/
├── admin/
│   ├── dashboard.html           # Admin dashboard with Jitsi SDK
│   └── js/
│       └── dashboard.js         # Jitsi Meet manager and controls
├── en/
│   ├── livestream.html          # English user interface
│   └── js/
│       └── livestream.js        # User-side Jitsi implementation
└── ar/
    ├── livestream.html          # Arabic user interface
    └── js/
        └── livestream-ar.js     # Arabic user-side implementation
```

## 🚀 Getting Started

### 1. Start the Server
```bash
npm start
```

### 2. Access Admin Dashboard
- Navigate to `/admin/dashboard.html`
- Login with admin credentials
- Use the livestreaming controls

### 3. Create a Livestream
- Click "Start Livestream" button
- Enter a room name
- The system will create a Jitsi Meet room
- Share the room ID with participants

### 4. Join as User
- Navigate to `/en/livestream.html` or `/ar/livestream.html`
- Enter the room ID provided by admin
- Grant microphone permissions when prompted
- Start communicating!

## 🔧 API Endpoints

### POST `/api/jitsi/create-room`
Creates a new livestream room.

**Request Body:**
```json
{
  "roomName": "My Livestream",
  "isPrivate": false,
  "maxParticipants": 50
}
```

**Response:**
```json
{
  "success": true,
  "room": {
    "roomId": "My-Livestream-1234567890-abc123",
    "roomName": "My Livestream",
    "status": "active"
  }
}
```

### GET `/api/jitsi/room/:roomId`
Gets information about a specific room.

### POST `/api/jitsi/end-stream`
Ends an active livestream (admin only).

### GET `/api/jitsi/status`
Gets the current livestreaming system status.

## 🎮 Admin Controls

### JitsiMeetManager Class
The admin dashboard uses a custom `JitsiMeetManager` class that provides:

- **Room Management**: Create, join, and leave rooms
- **Event Handling**: Participant join/leave, audio/video status changes
- **Command Execution**: Mute/unmute, screen sharing, etc.

### Key Methods
```javascript
// Initialize the manager
await jitsiManager.init();

// Create and join a room
const room = await jitsiManager.createRoom('livestream', 'My Stream');
await jitsiManager.joinRoom(room.roomId, {
  username: 'Admin',
  role: 'moderator',
  audio: true,
  video: true
});

// Leave room
await jitsiManager.leaveRoom();
```

## 👥 User Experience

### English Interface (`/en/livestream.html`)
- Clean, modern interface
- Simple room joining process
- Microphone permission handling
- Real-time status updates

### Arabic Interface (`/ar/livestream.html`)
- Full Arabic localization
- Right-to-left (RTL) support
- Culturally appropriate messaging

### User Controls
```javascript
// Join a stream
await window.livestreamAPI.join(roomId);

// Start speaking
await window.livestreamAPI.startSpeaking();

// Stop speaking
await window.livestreamAPI.stopSpeaking();

// Leave stream
await window.livestreamAPI.leave();
```

## 🔒 Security Features

### Content Security Policy
The system includes CSP headers that allow Jitsi Meet domains:

```javascript
"connect-src 'self' ws: wss: https://*.jitsi.net https://*.jit.si"
```

### Authentication
- Admin routes require valid JWT tokens
- User routes are public but can be restricted if needed
- Room access is controlled by room IDs

## 🌐 Browser Compatibility

### Supported Browsers
- **Chrome**: 80+ (Full support)
- **Firefox**: 75+ (Full support)
- **Safari**: 13+ (Full support)
- **Edge**: 80+ (Full support)

### Required Permissions
- **Microphone**: For audio communication
- **Camera**: For video communication (optional)
- **Screen Sharing**: For presentation features

## 🚨 Troubleshooting

### Common Issues

#### 1. Microphone Not Working
- Check browser permissions
- Ensure microphone is not muted
- Try refreshing the page

#### 2. Can't Join Room
- Verify room ID is correct
- Check if room is still active
- Ensure stable internet connection

#### 3. Video Issues
- Check camera permissions
- Verify camera is not in use by other applications
- Try different browsers

### Debug Information
Enable browser console logging to see detailed information about:
- Connection status
- Participant events
- Audio/video state changes
- Error messages

## 🔄 Migration from Agora.io

### What Was Removed
- All Agora.io SDK references
- Agora-specific configuration files
- Agora routes and middleware
- Agora-related environment variables

### What Was Added
- Jitsi Meet External API integration
- New Jitsi Meet routes
- Updated frontend implementations
- Enhanced security configuration

### Benefits of Migration
- **Free Service**: No usage costs or limits
- **Better Performance**: Modern WebRTC implementation
- **Easier Setup**: No API keys or certificates required
- **Open Source**: Community-driven development

## 🚀 Future Enhancements

### Planned Features
- **Room Persistence**: Save room configurations
- **User Management**: Role-based access control
- **Analytics**: Stream statistics and metrics
- **Mobile App**: Native mobile applications
- **Integration**: LMS and CMS integration

### Technical Improvements
- **Database Storage**: Room and user data persistence
- **WebSocket Updates**: Real-time status updates
- **Caching**: Improved performance and reliability
- **Monitoring**: Health checks and error tracking

## 📚 Resources

### Documentation
- [Jitsi Meet External API](https://github.com/jitsi/jitsi-meet/blob/master/doc/api.md)
- [WebRTC Standards](https://webrtc.org/)
- [Jitsi Meet Community](https://community.jitsi.org/)

### Support
- **Technical Issues**: Check browser console for error messages
- **Feature Requests**: Submit through project management system
- **Community**: Join Jitsi Meet community forums

---

## 🎯 Quick Start Checklist

- [ ] Server is running (`npm start`)
- [ ] Admin dashboard accessible (`/admin/dashboard.html`)
- [ ] Jitsi Meet SDK loaded in browser
- [ ] Microphone permissions granted
- [ ] Room created successfully
- [ ] Users can join and communicate
- [ ] Audio/video working properly
- [ ] Screen sharing functional

**🎉 Congratulations! Your Jitsi Meet livestreaming system is ready to use!**
