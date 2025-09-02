const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  page: { type: String, required: true },      // e.g. 'index', 'about'
  lang: { type: String, required: true },      // 'en' or 'ar'
  content: { type: String, required: true },   // HTML content
}, { timestamps: true });

contentSchema.index({ page: 1, lang: 1 }, { unique: true }); // one content per page/lang

module.exports = mongoose.model('Content', contentSchema);