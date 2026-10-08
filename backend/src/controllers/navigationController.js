const { body } = require('express-validator');
const Hazard = require('../models/Hazard');
const NavigationSession = require('../models/NavigationSession');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validateRequest');

const routeValidation = [
  body('destination').trim().isLength({ min: 2, max: 200 }),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  validate,
];

const route = asyncHandler(async (req, res) => {
  const session = await NavigationSession.create({
    user: req.user.id,
    destination: req.body.destination,
    lastKnownLocation: { latitude: Number(req.body.latitude), longitude: Number(req.body.longitude) },
  });
  const nearby = await Hazard.find({
    status: 'VERIFIED',
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(req.body.longitude), Number(req.body.latitude)] },
        $maxDistance: 500,
      },
    },
  }).limit(20);
  res.status(201).json({
    success: true,
    data: {
      sessionId: session.id,
      destination: session.destination,
      alerts: nearby.map((hazard) => `Hazard reported nearby: ${hazard.category.toLowerCase().replaceAll('_', ' ')}. ${hazard.description}`),
      notice: 'BALA does not plan routes or provide collision avoidance. Google Maps can provide directions, but accessibility and safety are not guaranteed.',
    },
  });
});

const alerts = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.query;
  if (latitude === undefined || longitude === undefined) throw new ApiError(400, 'Location coordinates are required for nearby hazard alerts.');
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) || Number(latitude) < -90 || Number(latitude) > 90 || Number(longitude) < -180 || Number(longitude) > 180) {
    throw new ApiError(400, 'Location coordinates are invalid.');
  }
  const hazards = await Hazard.find({
    status: 'VERIFIED',
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(longitude), Number(latitude)] },
        $maxDistance: 500,
      },
    },
  }).limit(20);
  res.json({ success: true, data: { alerts: hazards.map((hazard) => ({
    id: hazard.id,
    message: `Hazard reported nearby: ${hazard.category.toLowerCase().replaceAll('_', ' ')}. ${hazard.description}`,
    latitude: hazard.location.coordinates[1],
    longitude: hazard.location.coordinates[0],
  })) } });
});

const stop = asyncHandler(async (req, res) => {
  await NavigationSession.deleteMany({ user: req.user.id, active: true });
  res.json({ success: true, message: 'Location alerts are stopped. BALA does not track location in the background.' });
});

module.exports = { routeValidation, route, alerts, stop };
