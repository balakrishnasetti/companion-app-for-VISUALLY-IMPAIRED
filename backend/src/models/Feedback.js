const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  call: { type: mongoose.Schema.Types.ObjectId, ref: 'CallSession', required: true, unique: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 1000 },
  moderated: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
