const mongoose = require('mongoose');
const { SUPPORTED_LANGUAGES } = require('../constants/languages');

const documentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, maxlength: 120 },
  extractedText: { type: String, maxlength: 50000 },
  language: { type: String, enum: SUPPORTED_LANGUAGES, default: 'en' },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
