const { body } = require('express-validator');
const OfflineSync = require('../models/OfflineSync');
const Hazard = require('../models/Hazard');
const User = require('../models/User');
const UserPreference = require('../models/UserPreference');
const CallSession = require('../models/CallSession');
const Feedback = require('../models/Feedback');
const Volunteer = require('../models/Volunteer');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validateRequest');
const { SUPPORTED_LANGUAGES } = require('../constants/languages');

const syncValidation = [
  body('requestId').isString().isLength({ min: 8, max: 80 }),
  body('action').isIn(['HAZARD_REPORT', 'FEEDBACK', 'PREFERENCES']),
  body('payload').isObject(),
  validate,
];

const sync = asyncHandler(async (req, res) => {
  const prior = await OfflineSync.findOne({ user: req.user.id, requestId: req.body.requestId });
  if (prior) return res.json({ success: true, data: { duplicate: true, resourceId: prior.resourceId } });
  let resource;
  let resourceId;
  if (req.body.action === 'HAZARD_REPORT') {
    const data = req.body.payload;
    if (!['POTHOLE', 'CONSTRUCTION', 'BLOCKED_SIDEWALK', 'OBSTACLE', 'BROKEN_SIGNAL', 'UNSAFE_CROSSING', 'OTHER'].includes(data.category)
      || typeof data.description !== 'string' || data.description.length < 3 || data.description.length > 500
      || !Number.isFinite(data.latitude) || data.latitude < -90 || data.latitude > 90
      || !Number.isFinite(data.longitude) || data.longitude < -180 || data.longitude > 180) {
      throw new ApiError(400, 'The queued hazard report is invalid.');
    }
    resource = await Hazard.findOne({ reporter: req.user.id, offlineRequestId: req.body.requestId });
    if (!resource) {
      try {
        resource = await Hazard.create({
          reporter: req.user.id, category: data.category, description: data.description,
          location: { type: 'Point', coordinates: [data.longitude, data.latitude] },
          offlineRequestId: req.body.requestId,
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        resource = await Hazard.findOne({ reporter: req.user.id, offlineRequestId: req.body.requestId });
      }
    }
    resourceId = resource.id;
  } else if (req.body.action === 'PREFERENCES') {
    const data = req.body.payload;
    if (data.language && !SUPPORTED_LANGUAGES.includes(data.language)) throw new ApiError(400, 'Unsupported language.');
    const allowed = ['highContrast', 'largeText', 'reducedMotion', 'speechRate'];
    const update = {};
    if (data.language) update.language = data.language;
    if (data.accessibility) {
      for (const [key, value] of Object.entries(data.accessibility)) {
        if (!allowed.includes(key) || (key === 'speechRate'
          ? typeof value !== 'number' || value < 0.5 || value > 1.5
          : typeof value !== 'boolean')) throw new ApiError(400, 'The queued preferences are invalid.');
        update[`accessibility.${key}`] = value;
      }
    }
    await UserPreference.findOneAndUpdate({ user: req.user.id }, { $set: update }, { upsert: true, setDefaultsOnInsert: true });
    resourceId = req.user.id;
  } else if (req.body.action === 'FEEDBACK') {
    const data = req.body.payload;
    if (!/^[a-f\d]{24}$/i.test(data.callId || '') || !Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5
      || (data.comment !== undefined && (typeof data.comment !== 'string' || data.comment.length > 1000))) {
      throw new ApiError(400, 'The queued feedback is invalid.');
    }
    const call = await CallSession.findOne({ _id: data.callId, user: req.user.id, status: 'ENDED' });
    if (!call) throw new ApiError(400, 'Feedback can only be synced for a completed call.');
    resource = await Feedback.findOneAndUpdate(
      { call: call.id },
      { user: req.user.id, volunteer: call.volunteer, call: call.id, rating: data.rating, comment: data.comment || '' },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    const scores = await Feedback.aggregate([
      { $match: { volunteer: call.volunteer, moderated: false } },
      { $group: { _id: '$volunteer', rating: { $avg: '$rating' }, ratingCount: { $sum: 1 } } },
    ]);
    if (scores[0]) await Volunteer.findOneAndUpdate({ user: call.volunteer }, { rating: scores[0].rating, ratingCount: scores[0].ratingCount });
    resourceId = resource.id;
  } else {
    throw new ApiError(400, 'Unsupported offline action.');
  }
  await OfflineSync.create({ user: req.user.id, requestId: req.body.requestId, action: req.body.action, resourceId });
  res.status(201).json({ success: true, data: { duplicate: false, resourceId } });
});

module.exports = { syncValidation, sync };
