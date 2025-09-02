const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameEn: { type: String, required: true }, // Added English name
  description: String,
  descriptionEn: String, // Added English description
  duration: String, // Added duration field
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Doctorate'],
    default: 'Beginner'
  },
  color: { type: String, default: '#007bff' }, // Added color for badges
  category: { type: String, default: 'general' }, // Added category
  image: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);