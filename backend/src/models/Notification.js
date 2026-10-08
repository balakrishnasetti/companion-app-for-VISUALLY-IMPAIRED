const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['VOLUNTEER_REQUEST', 'VOLUNTEER_ACCEPTED', 'CALL_STARTED', 'CALL_ENDED', 'HAZARD_NEARBY', 'HAZARD_VERIFIED', 'SOS', 'SYSTEM', 'FEEDBACK'], default: 'SYSTEM' },
  message: { type: String, required: true, maxlength: 300 },
  readAt: { type: Date, default: null },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
