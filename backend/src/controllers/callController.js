const { param, body } = require('express-validator');
const crypto = require('node:crypto');
const CallSession = require('../models/CallSession');
const VolunteerRequest = require('../models/VolunteerRequest');
const Notification = require('../models/Notification');
const Volunteer = require('../models/Volunteer');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validateRequest');

const getCall = [
  param('id').isMongoId(),
  validate,
  asyncHandler(async (req, res) => {
    const call = await CallSession.findById(req.params.id).populate('user', 'name').populate('volunteer', 'name');
    if (!call) throw new ApiError(404, 'Call session not found.');
    if (![call.user.id, call.volunteer.id].includes(req.user.id) && req.user.role !== 'ADMIN') throw new ApiError(403, 'This call session is private.');
    res.json({ success: true, data: { call } });
  }),
];

const endCall = [
  param('id').isMongoId(),
  body('status').optional().isIn(['ENDED']),
  validate,
  asyncHandler(async (req, res) => {
    const call = await CallSession.findById(req.params.id);
    if (!call) throw new ApiError(404, 'Call session not found.');
    if (![call.user.toString(), call.volunteer.toString()].includes(req.user.id)) throw new ApiError(403, 'This call session is private.');
    if (call.status !== 'ENDED') {
      call.status = 'ENDED';
      call.endedAt = new Date();
      await call.save();
      await VolunteerRequest.findByIdAndUpdate(call.request, { status: 'COMPLETED' });
      await Volunteer.findOneAndUpdate({ user: call.volunteer, verified: true, availability: 'BUSY' }, { availability: 'AVAILABLE' });
      const notification = await Notification.create({ user: call.user, type: 'CALL_ENDED', message: 'Your volunteer call has ended.', data: { callId: call.id } });
      req.app.get('io')?.to(`user:${call.user}`).emit('notification:new', notification);
      req.app.get('io')?.to(`user:${call.user}`).emit('call:ended', { callId: call.id });
      req.app.get('io')?.to(`user:${call.volunteer}`).emit('call:ended', { callId: call.id });
    }
    res.json({ success: true, data: { call } });
  }),
];

const listMine = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'ADMIN' ? {} : { $or: [{ user: req.user.id }, { volunteer: req.user.id }] };
  const calls = await CallSession.find(filter)
    .populate('user', 'name').populate('volunteer', 'name').sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: { calls } });
});

const iceServers = (req, res) => {
  const servers = [{ urls: 'stun:stun.l.google.com:19302' }];
  if (process.env.TURN_URLS && process.env.TURN_SHARED_SECRET) {
    const expiry = Math.floor(Date.now() / 1000) + 60 * 60;
    const username = `${expiry}:${req.user.id}`;
    const credential = crypto.createHmac('sha1', process.env.TURN_SHARED_SECRET).update(username).digest('base64');
    servers.push({
      urls: process.env.TURN_URLS.split(',').map((url) => url.trim()),
      username,
      credential,
    });
  }
  res.json({ success: true, data: { iceServers } });
};

module.exports = { getCall, endCall, listMine, iceServers };
