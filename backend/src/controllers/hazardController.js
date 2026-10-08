const { body, param, query } = require('express-validator');
const Hazard = require('../models/Hazard');
const AuditLog = require('../models/AuditLog');
const HazardVerification = require('../models/HazardVerification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validateRequest');

const createValidation = [
  body('category').isIn(['POTHOLE', 'CONSTRUCTION', 'BLOCKED_SIDEWALK', 'OBSTACLE', 'BROKEN_SIGNAL', 'UNSAFE_CROSSING', 'OTHER']),
  body('description').trim().isLength({ min: 3, max: 500 }),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  validate,
];

const create = asyncHandler(async (req, res) => {
  const hazard = await Hazard.create({
    reporter: req.user.id,
    category: req.body.category,
    description: req.body.description,
    location: { type: 'Point', coordinates: [Number(req.body.longitude), Number(req.body.latitude)] },
  });
  req.app.get('io')?.emit('hazard:created', { id: hazard.id, status: hazard.status });
  res.status(201).json({ success: true, data: { hazard: publicHazard(hazard) } });
});

const listValidation = [
  query('latitude').optional().isFloat({ min: -90, max: 90 }),
  query('longitude').optional().isFloat({ min: -180, max: 180 }),
  query('radius').optional().isInt({ min: 100, max: 50000 }),
  validate,
];

const list = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'ADMIN' && req.query.status
    ? { status: req.query.status }
    : { status: 'VERIFIED' };
  let hazards = Hazard.find(filter).sort({ createdAt: -1 }).limit(200);
  const hasLat = req.query.latitude !== undefined;
  const hasLng = req.query.longitude !== undefined;
  if (hasLat !== hasLng) throw new ApiError(400, 'Provide both latitude and longitude for a nearby search.');
  if (hasLat) {
    hazards = Hazard.find({
      ...filter,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(req.query.longitude), Number(req.query.latitude)] },
          $maxDistance: Number(req.query.radius || 5000),
        },
      },
    }).limit(200);
  }
  const results = await hazards;
  res.json({ success: true, data: { hazards: results.map(publicHazard) } });
});

const moderate = [
  param('id').isMongoId(),
  body('status').isIn(['VERIFIED', 'REJECTED', 'RESOLVED']),
  validate,
  asyncHandler(async (req, res) => {
    const hazard = await Hazard.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true }).select('+reporter');
    if (!hazard) throw new ApiError(404, 'Hazard report not found.');
    await HazardVerification.create({ hazard: hazard.id, moderator: req.user.id, status: hazard.status });
    await AuditLog.create({ actor: req.user.id, action: 'HAZARD_MODERATED', resourceType: 'Hazard', resourceId: hazard.id, metadata: { status: hazard.status } });
    if (hazard.status === 'VERIFIED') {
      const Notification = require('../models/Notification');
      const notification = await Notification.create({ user: hazard.reporter, type: 'HAZARD_VERIFIED', message: 'Your accessibility hazard report was verified.' });
      req.app.get('io')?.to(`user:${hazard.reporter}`).emit('notification:new', notification);
    }
    res.json({ success: true, data: { hazard: publicHazard(hazard) } });
  }),
];

function publicHazard(hazard) {
  return {
    id: hazard.id,
    category: hazard.category,
    description: hazard.description,
    latitude: hazard.location.coordinates[1],
    longitude: hazard.location.coordinates[0],
    status: hazard.status,
    createdAt: hazard.createdAt,
  };
}

module.exports = { createValidation, create, listValidation, list, moderate };
