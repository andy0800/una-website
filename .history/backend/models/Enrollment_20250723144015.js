const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseName: { type: String, required: true },
  enrollmentDate: { type: Date, default: Date.now },
  status: { type: String, default: 'Enrolled' }, // can expand later
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);