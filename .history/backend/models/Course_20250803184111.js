const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameEn: { type: String, required: true },
  description: String,
  descriptionEn: String,
  duration: String,
  level: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Doctorate'], 
    default: 'Beginner' 
  },
  color: { type: String, default: '#007bff' },
  category: { type: String, default: 'general' },
  image: String, // path or URL to thumbnail image
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);