const mongoose = require('mongoose');
const { SUPPORTED_LANGUAGES } = require('../constants/languages');

const voiceCommandSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  intent: { type: String, required: true, maxlength: 60 },
  language: { type: String, enum: SUPPORTED_LANGUAGES, default: 'en' },
}, { timestamps: true });

module.exports = mongoose.model('VoiceCommand', voiceCommandSchema);
