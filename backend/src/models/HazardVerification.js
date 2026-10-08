const mongoose = require('mongoose');

const hazardVerificationSchema = new mongoose.Schema({
  hazard: { type: mongoose.Schema.Types.ObjectId, ref: 'Hazard', required: true, index: true },
  moderator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['VERIFIED', 'REJECTED', 'RESOLVED'], required: true },
  note: { type: String, maxlength: 300, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('HazardVerification', hazardVerificationSchema);
