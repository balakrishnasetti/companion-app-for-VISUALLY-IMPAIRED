const mongoose = require('mongoose');

const trustedContactSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, required: true, trim: true, maxlength: 24 },
  relationship: { type: String, trim: true, maxlength: 50 },
}, { timestamps: true });

module.exports = mongoose.model('TrustedContact', trustedContactSchema);
