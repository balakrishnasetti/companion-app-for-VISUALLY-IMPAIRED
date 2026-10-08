const { body, param } = require('express-validator');
const Volunteer = require('../models/Volunteer');
const User = require('../models/User');
const VolunteerRequest = require('../models/VolunteerRequest');
const CallSession = require('../models/CallSession');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validateRequest');
const { respondToAssistance } = require('../services/aiVolunteerService');
const { SUPPORTED_LANGUAGES } = require('../constants/languages');

const createRequestValidation = [
  body('requestId').isString().isLength({ min: 8, max: 80 }),
  body('topic').optional().trim().isLength({ max: 120 }),
  body('language').optional().isIn(SUPPORTED_LANGUAGES),
  validate,
];

const aiAssistValidation = [
  body('requestId').isString().isLength({ min: 8, max: 80 }),
  body('message').isString().trim().isLength({ min: 2, max: 1000 }),
  body('language').optional().isIn(SUPPORTED_LANGUAGES),
  body('consent').isBoolean().custom((value) => value === true).withMessage('Consent is required before sending text to the AI service.'),
  validate,
];

const aiAssist = asyncHandler(async (req, res) => {
  const { requestId, message, language = req.preference.language } = req.body;
  const existingRequest = await VolunteerRequest.findOne({ idempotencyKey: requestId });
  if (existingRequest) {
    if (existingRequest.user.toString() !== req.user.id) throw new ApiError(409, 'Request identifier has already been used.');
    res.json({ success: true, data: { fallback: true, request: publicRequest(existingRequest), message: 'Your request is already with human volunteers.' } });
    return;
  }

  let result;
  try {
    result = await respondToAssistance(message, language);
  } catch (error) {
    const { request } = await createHumanRequest(req, {
      requestId,
      topic: 'AI volunteer could not respond',
      language,
    });
    res.json({
      success: true,
      data: {
        fallback: true,
        request: publicRequest(request),
        message: error.message || 'The AI volunteer could not respond. Your request has been sent to human volunteers.',
      },
    });
    return;
  }
  const humanRequest = await VolunteerRequest.findOne({ idempotencyKey: requestId });
  if (humanRequest) {
    if (humanRequest.user.toString() !== req.user.id) throw new ApiError(409, 'Request identifier has already been used.');
    res.json({ success: true, data: { fallback: true, request: publicRequest(humanRequest), message: 'Your request has been sent to human volunteers.' } });
    return;
  }
  res.json({ success: true, data: { ...result, fallback: false } });
});

async function createHumanRequest(req, { requestId, topic = 'Accessibility assistance', language = req.preference.language }) {
  let request = await VolunteerRequest.findOne({ idempotencyKey: requestId });
  if (request && request.user.toString() !== req.user.id) throw new ApiError(409, 'Request identifier has already been used.');
  const created = !request;
  if (!request) {
    request = await VolunteerRequest.create({ user: req.user.id, idempotencyKey: requestId, topic, language });
    req.app.get('io')?.to('volunteers:available').emit('volunteer:request', {
      id: request.id,
      topic: request.topic,
      language: request.language,
      createdAt: request.createdAt,
    });
  }
  return { request, created };
}

const createRequest = asyncHandler(async (req, res) => {
  const { requestId, topic = 'Accessibility assistance', language = req.preference.language } = req.body;
  const { request, created } = await createHumanRequest(req, { requestId, topic, language });
  res.status(created ? 201 : 200).json({ success: true, data: { request: publicRequest(request) } });
});

const listRequests = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'VOLUNTEER'
    ? { status: 'WAITING' }
    : { user: req.user.id };
  const requests = await VolunteerRequest.find(filter).sort({ createdAt: -1 }).limit(50)
    .populate('user', 'name');
  res.json({ success: true, data: { requests: requests.map(publicRequest) } });
});

const listAvailable = asyncHandler(async (req, res) => {
  const volunteers = await Volunteer.find({ verified: true, availability: 'AVAILABLE' })
    .select('languages skills rating ratingCount')
    .populate('user', 'name');
  res.json({ success: true, data: { volunteers } });
});

const availability = [
  body('availability').isIn(['AVAILABLE', 'OFFLINE']),
  validate,
  asyncHandler(async (req, res) => {
    const volunteer = await Volunteer.findOneAndUpdate(
      { user: req.user.id, verified: true },
      { availability: req.body.availability },
      { new: true, runValidators: true },
    );
    if (!volunteer) throw new ApiError(403, 'Your volunteer profile must be verified before setting availability.');
    const socket = req.app.get('io');
    if (req.body.availability === 'AVAILABLE') socket?.to('volunteers:available').emit('volunteer:availability', { volunteerId: req.user.id, available: true });
    else socket?.to('volunteers:available').emit('volunteer:availability', { volunteerId: req.user.id, available: false });
    res.json({ success: true, data: { availability: volunteer.availability } });
  }),
];

const accept = [
  param('id').isMongoId(),
  validate,
  asyncHandler(async (req, res) => {
    const volunteer = await Volunteer.findOneAndUpdate(
      { user: req.user.id, verified: true, availability: 'AVAILABLE' },
      { availability: 'BUSY' },
      { new: true },
    );
    if (!volunteer) throw new ApiError(403, 'Only verified, available volunteers can accept requests.');
    const request = await VolunteerRequest.findOneAndUpdate(
      { _id: req.params.id, status: 'WAITING' },
      { status: 'ACCEPTED', volunteer: req.user.id },
      { new: true },
    );
    if (!request) {
      await Volunteer.findOneAndUpdate({ _id: volunteer.id, availability: 'BUSY' }, { availability: 'AVAILABLE' });
      throw new ApiError(409, 'This request is no longer available.');
    }
    let call;
    try {
      call = await CallSession.create({ request: request._id, user: request.user, volunteer: req.user.id });
    } catch (error) {
      await Promise.all([
        Volunteer.findOneAndUpdate({ _id: volunteer.id, availability: 'BUSY' }, { availability: 'AVAILABLE' }),
        VolunteerRequest.findByIdAndUpdate(request.id, { status: 'WAITING', volunteer: null }),
      ]);
      throw error;
    }
    const notification = await Notification.create({
      user: request.user,
      type: 'VOLUNTEER_ACCEPTED',
      message: 'A volunteer accepted your request. Your browser can now start a video call.',
      data: { requestId: request.id, callId: call.id },
    });
    req.app.get('io')?.to(`user:${request.user}`).emit('notification:new', notification);
    req.app.get('io')?.to(`user:${request.user}`).emit('volunteer:accepted', { requestId: request.id, callId: call.id });
    req.app.get('io')?.to(`user:${req.user.id}`).emit('volunteer:accepted', { requestId: request.id, callId: call.id });
    res.json({ success: true, data: { request: publicRequest(request), callId: call.id } });
  }),
];

const reject = [
  param('id').isMongoId(),
  validate,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'ADMIN') throw new ApiError(403, 'Only administrators can reject a volunteer request.');
    const request = await VolunteerRequest.findOneAndUpdate({ _id: req.params.id, status: 'WAITING' }, { status: 'REJECTED' }, { new: true });
    if (!request) throw new ApiError(404, 'Open assistance request not found.');
    res.json({ success: true, data: { request: publicRequest(request) } });
  }),
];

const adminVolunteers = asyncHandler(async (req, res) => {
  const volunteers = await Volunteer.find().populate('user', 'name email status').sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: { volunteers } });
});

const verifyVolunteer = [
  param('id').isMongoId(),
  body('verified').isBoolean(),
  validate,
  asyncHandler(async (req, res) => {
    const volunteer = await Volunteer.findById(req.params.id).populate('user', 'name email');
    if (!volunteer) throw new ApiError(404, 'Volunteer profile not found.');
    volunteer.verified = req.body.verified;
    if (!volunteer.verified) volunteer.availability = 'OFFLINE';
    await volunteer.save();
    await AuditLog.create({ actor: req.user.id, action: 'VOLUNTEER_VERIFICATION_CHANGED', resourceType: 'Volunteer', resourceId: volunteer.id, metadata: { verified: volunteer.verified } });
    res.json({ success: true, data: { volunteer } });
  }),
];

const updateProfile = asyncHandler(async (req, res) => {
  const { languages = [], skills = [], schedule = [] } = req.body;
  if (!Array.isArray(languages) || languages.some((item) => !SUPPORTED_LANGUAGES.includes(item))) throw new ApiError(400, 'Choose supported volunteer languages.');
  if (!Array.isArray(skills) || skills.length > 20 || skills.some((item) => typeof item !== 'string' || item.length > 60)) throw new ApiError(400, 'Volunteer skills are invalid.');
  if (!Array.isArray(schedule) || schedule.length > 21 || schedule.some((slot) => !Number.isInteger(slot.day) || slot.day < 0 || slot.day > 6
    || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.start || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.end || '')
    || slot.start >= slot.end)) throw new ApiError(400, 'Volunteer schedule slots must have a valid day and end after their start time.');
  const volunteer = await Volunteer.findOneAndUpdate(
    { user: req.user.id },
    { languages: [...new Set(languages)], skills: [...new Set(skills)], schedule },
    { new: true, upsert: true, runValidators: true },
  );
  res.json({ success: true, data: { volunteer } });
});

const getSelf = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findOne({ user: req.user.id });
  if (!volunteer) throw new ApiError(404, 'Volunteer profile not found.');
  res.json({ success: true, data: { volunteer } });
});

const cancelRequest = [
  param('id').isMongoId(),
  validate,
  asyncHandler(async (req, res) => {
    const request = await VolunteerRequest.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, status: 'WAITING' },
      { status: 'CANCELLED' },
      { new: true },
    );
    if (!request) throw new ApiError(404, 'Waiting assistance request not found.');
    res.json({ success: true, data: { request: publicRequest(request) } });
  }),
];

function publicRequest(request) {
  const user = request.user && typeof request.user === 'object' ? { name: request.user.name, language: request.user.language } : undefined;
  return { id: request.id, status: request.status, topic: request.topic, language: request.language, createdAt: request.createdAt, ...(user ? { user } : {}) };
}

module.exports = { aiAssistValidation, aiAssist, createRequestValidation, createRequest, listRequests, listAvailable, availability, accept, reject, adminVolunteers, verifyVolunteer, updateProfile, getSelf, cancelRequest };
