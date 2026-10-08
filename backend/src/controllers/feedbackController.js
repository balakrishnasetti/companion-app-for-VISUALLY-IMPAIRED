const { body } = require('express-validator');
const Feedback = require('../models/Feedback');
const CallSession = require('../models/CallSession');
const Volunteer = require('../models/Volunteer');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validateRequest');

const createValidation = [
  body('callId').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim().isLength({ max: 1000 }),
  validate,
];

const create = asyncHandler(async (req, res) => {
  const call = await CallSession.findOne({ _id: req.body.callId, user: req.user.id, status: 'ENDED' });
  if (!call) throw new ApiError(400, 'Feedback is available only after your volunteer call has ended.');
  const feedback = await Feedback.create({
    user: req.user.id, volunteer: call.volunteer, call: call.id,
    rating: Number(req.body.rating), comment: req.body.comment || '',
  });
  const volunteer = await Volunteer.findOne({ user: call.volunteer });
  if (volunteer) {
    volunteer.rating = ((volunteer.rating * volunteer.ratingCount) + feedback.rating) / (volunteer.ratingCount + 1);
    volunteer.ratingCount += 1;
    await volunteer.save();
  }
  res.status(201).json({ success: true, data: { feedback } });
});

const list = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'ADMIN' ? {} : { user: req.user.id };
  const feedback = await Feedback.find(filter).populate('user', 'name').populate('volunteer', 'name').sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: { feedback } });
});

const moderate = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw new ApiError(404, 'Feedback not found.');
  feedback.moderated = true;
  await feedback.save();
  await AuditLog.create({ actor: req.user.id, action: 'FEEDBACK_MODERATED', resourceType: 'Feedback', resourceId: feedback.id });
  res.json({ success: true, data: { feedback } });
});

module.exports = { createValidation, create, list, moderate };
