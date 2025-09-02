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
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);