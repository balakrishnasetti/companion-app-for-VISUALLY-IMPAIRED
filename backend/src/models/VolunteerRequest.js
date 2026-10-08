const mongoose = require('mongoose');
const { SUPPORTED_LANGUAGES } = require('../constants/languages');

const volunteerRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['WAITING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'], default: 'WAITING', index: true },
  idempotencyKey: { type: String, required: true, unique: true },
  language: { type: String, enum: SUPPORTED_LANGUAGES, default: 'en' },
  topic: { type: String, maxlength: 120, default: 'Accessibility assistance' },
}, { timestamps: true });

module.exports = mongoose.model('VolunteerRequest', volunteerRequestSchema);
