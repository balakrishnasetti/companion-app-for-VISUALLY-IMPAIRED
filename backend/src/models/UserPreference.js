const mongoose = require('mongoose');
const { SUPPORTED_LANGUAGES } = require('../constants/languages');

const accessibilitySchema = new mongoose.Schema({
  highContrast: { type: Boolean, default: false },
  largeText: { type: Boolean, default: false },
  reducedMotion: { type: Boolean, default: false },
  speechRate: { type: Number, min: 0.5, max: 1.5, default: 1 },
}, { _id: false });

const userPreferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  language: { type: String, enum: SUPPORTED_LANGUAGES, default: 'en' },
  accessibility: { type: accessibilitySchema, default: () => ({}) },
}, { timestamps: true });

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
