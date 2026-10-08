const mongoose = require('mongoose');

const callSessionSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'VolunteerRequest', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['RINGING', 'CONNECTED', 'ENDED'], default: 'RINGING' },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('CallSession', callSessionSchema);
