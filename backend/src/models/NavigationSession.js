const mongoose = require('mongoose');

const navigationSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  destination: { type: String, required: true, maxlength: 200 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('NavigationSession', navigationSessionSchema);
