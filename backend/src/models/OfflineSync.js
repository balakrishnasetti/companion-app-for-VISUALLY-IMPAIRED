const mongoose = require('mongoose');

const offlineSyncSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestId: { type: String, required: true, maxlength: 80 },
  action: { type: String, enum: ['HAZARD_REPORT', 'FEEDBACK', 'PREFERENCES'], required: true },
  resourceId: { type: String },
}, { timestamps: true });

offlineSyncSchema.index({ user: 1, requestId: 1 }, { unique: true });

module.exports = mongoose.model('OfflineSync', offlineSyncSchema);
