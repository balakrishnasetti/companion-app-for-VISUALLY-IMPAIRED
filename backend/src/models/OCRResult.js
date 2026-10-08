const mongoose = require('mongoose');
const { SUPPORTED_LANGUAGES } = require('../constants/languages');

const ocrResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, unique: true },
  language: { type: String, enum: SUPPORTED_LANGUAGES, default: 'en' },
  textLength: { type: Number, min: 0, required: true },
}, { timestamps: true });

module.exports = mongoose.model('OCRResult', ocrResultSchema);
