const mongoose = require('mongoose');

const recordedLectureSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: String,
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin', 
    required: true 
  },
  streamDate: { 
    type: Date, 
    default: Date.now 
  },
  duration: Number, // in seconds
  filePath: { 
    type: String, 
    required: false, // Changed from true to false - will be updated when video is uploaded
    default: '' // Provide default empty string
  }, // stored video file path
  thumbnail: String, // video thumbnail
  accessUsers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }], // users who can view
  isPublic: { 
    type: Boolean, 
    default: false 
  }, // public access flag
  category: String, // course category
  tags: [String],
  fileSize: Number, // file size in bytes
  quality: {
    type: String,
    enum: ['720p', '1080p', '4K'],
    default: '1080p'
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
recordedLectureSchema.index({ adminId: 1, streamDate: -1 });
recordedLectureSchema.index({ accessUsers: 1 });
recordedLectureSchema.index({ isPublic: 1, category: 1 });

module.exports = mongoose.model('RecordedLecture', recordedLectureSchema);
