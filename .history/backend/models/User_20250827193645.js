const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  civilId: { type: String },
  passportNumber: { type: String },
  dateOfBirth: { type: Date },
  password: { type: String, required: true },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }], // Fixed: Use ObjectId references
  level: { type: String }, // replaces 'levelBadge' for consistency in dashboard.js
  certificates: [
    {
      name: String,   // instead of 'title'
      image: String   // instead of 'imageUrl'
    }
  ],
  recordedLectures: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RecordedLecture' }], // NEW: Access to recorded lectures
  preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  privacySettings: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  // 🚀 LIVESTREAMING SUPPORT
  livestreamPreferences: {
    autoJoin: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
    quality: { type: String, enum: ['720p', '1080p', '4K'], default: '1080p' },
    language: { type: String, enum: ['en', 'ar'], default: 'en' }
  },
  streamHistory: [{
    streamId: String,
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date,
    duration: Number,
    roomId: String
  }],
  currentStream: {
    roomId: String,
    joinedAt: Date,
    isActive: { type: Boolean, default: false }
  },
  
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Add indexes for better performance
userSchema.index({ phone: 1 });
userSchema.index({ civilId: 1 });
userSchema.index({ courses: 1 });
userSchema.index({ level: 1 });
userSchema.index({ createdAt: -1 });

// NEW: Add TTL index for stream history cleanup (older than 30 days)
userSchema.index({ 'streamHistory.joinedAt': 1 }, { expireAfterSeconds: 2592000 });

// NEW: Add compound index for livestream queries
userSchema.index({ 'currentStream.isActive': 1, 'currentStream.roomId': 1 });

// Add instance methods
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

userSchema.methods.addCourse = function(courseId) {
  if (!this.courses.includes(courseId)) {
    this.courses.push(courseId);
    return this.save();
  }
  return Promise.resolve(this);
};

userSchema.methods.removeCourse = function(courseId) {
  this.courses = this.courses.filter(id => id.toString() !== courseId.toString());
  return this.save();
};

userSchema.methods.addCertificate = function(certificate) {
  this.certificates.push(certificate);
  return this.save();
};

userSchema.methods.removeCertificate = function(certificateIndex) {
  this.certificates.splice(certificateIndex, 1);
  return this.save();
};

// Add static methods
userSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone });
};

userSchema.statics.findByCivilId = function(civilId) {
  return this.findOne({ civilId });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

userSchema.statics.getUserStats = function() {
  return this.aggregate([
    { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } }
  ]);
};

module.exports = mongoose.model('User', userSchema);