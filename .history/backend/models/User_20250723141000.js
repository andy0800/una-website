const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  civilId: { type: String },
  passportNumber: { type: String },
  dateOfBirth: { type: Date },
  password: { type: String, required: true },
  courses: [{ type: String }], // array of course names
  certificates: [{
    imageUrl: String,
    title: String
  }],
  levelBadge: { type: String }, // e.g. Beginner, Intermediate, Advanced
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);