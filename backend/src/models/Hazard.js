const mongoose = require('mongoose');

const hazardSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, select: false },
  offlineRequestId: { type: String, default: undefined },
  category: { type: String, enum: ['POTHOLE', 'CONSTRUCTION', 'BLOCKED_SIDEWALK', 'OBSTACLE', 'BROKEN_SIGNAL', 'UNSAFE_CROSSING', 'OTHER'], required: true },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true, validate: (value) => value.length === 2 && value[0] >= -180 && value[0] <= 180 && value[1] >= -90 && value[1] <= 90 },
  },
  status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED', 'RESOLVED'], default: 'PENDING' },
  imageUrl: { type: String, maxlength: 2000 },
}, { timestamps: true });

hazardSchema.index({ location: '2dsphere' });
hazardSchema.index({ reporter: 1, offlineRequestId: 1 }, { unique: true, partialFilterExpression: { offlineRequestId: { $type: 'string' } } });

module.exports = mongoose.model('Hazard', hazardSchema);
