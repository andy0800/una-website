const mongoose = require('mongoose');

const PageContentSchema = new mongoose.Schema({
  page: { type: String, required: true },       // e.g., 'index'
  lang: { type: String, enum: ['en', 'ar'], required: true },
  sections: { type: Object, required: true },   // { heroText: "...", aboutText: "..." }
}, { timestamps: true });

module.exports = mongoose.model('PageContent', PageContentSchema);