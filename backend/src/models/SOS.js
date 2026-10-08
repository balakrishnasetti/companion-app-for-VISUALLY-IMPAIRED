const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requestId: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'CANCELLED'], default: 'ACTIVE' },
  contactDelivery: { type: String, enum: ['NOT_CONFIGURED', 'NO_CONTACTS', 'SENT', 'PARTIAL', 'FAILED'], default: 'NOT_CONFIGURED' },
  location: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
  },
  cancelledAt: { type: Date, default: null },
}, { timestamps: true });

sosSchema.index({ user: 1, requestId: 1 }, { unique: true });

module.exports = mongoose.model('SOS', sosSchema);
