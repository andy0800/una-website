const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  
  // 🚀 LIVESTREAMING SUPPORT
  livestreamSettings: {
    defaultQuality: { type: String, enum: ['720p', '1080p', '4K'], default: '1080p' },
    maxViewers: { type: Number, default: 100 },
    allowRecording: { type: Boolean, default: true },
    allowScreenShare: { type: Boolean, default: true },
    allowChat: { type: Boolean, default: true },
    allowMicRequests: { type: Boolean, default: true }
  },
  streamPermissions: {
    canStartStream: { type: Boolean, default: true },
    canRecord: { type: Boolean, default: true },
    canManageUsers: { type: Boolean, default: true },
    canViewStats: { type: Boolean, default: true }
  },
  streamHistory: [{
    streamId: String,
    roomId: String,
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    duration: Number,
    viewerCount: Number,
    wasRecorded: { type: Boolean, default: false }
  }],
  currentStream: {
    roomId: String,
    startedAt: Date,
    isActive: { type: Boolean, default: false },
    viewerCount: { type: Number, default: 0 }
  }
});

// NEW: Add TTL index for stream history cleanup (older than 30 days)
adminSchema.index({ 'streamHistory.startedAt': 1 }, { expireAfterSeconds: 2592000 });

// NEW: Add compound index for active streams
adminSchema.index({ 'currentStream.isActive': 1, 'currentStream.roomId': 1 });

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('Admin', adminSchema);