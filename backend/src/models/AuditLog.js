const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true, maxlength: 120 },
  resourceType: { type: String, maxlength: 80 },
  resourceId: { type: String, maxlength: 80 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
