const mongoose = require('mongoose');
const { SUPPORTED_LANGUAGES } = require('../constants/languages');

const availabilitySlotSchema = new mongoose.Schema({
  day: { type: Number, required: true, min: 0, max: 6 },
  start: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  end: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
}, { _id: false });

const volunteerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  languages: [{ type: String, enum: SUPPORTED_LANGUAGES }],
  skills: [{ type: String, maxlength: 60 }],
  schedule: { type: [availabilitySlotSchema], default: [] },
  availability: { type: String, enum: ['AVAILABLE', 'BUSY', 'OFFLINE', 'SUSPENDED'], default: 'OFFLINE' },
  verified: { type: Boolean, default: false },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  ratingCount: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Volunteer', volunteerSchema);
