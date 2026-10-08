const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const VolunteerRequest = require('../models/VolunteerRequest');
const CallSession = require('../models/CallSession');
const Hazard = require('../models/Hazard');
const SOS = require('../models/SOS');
const Feedback = require('../models/Feedback');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

const dashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers, activeUsers, totalVolunteers, verifiedVolunteers, pendingVolunteers,
    activeCalls, hazardReports, verifiedHazards, pendingHazards, sosEvents,
    feedbackCount, activity,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'ACTIVE' }),
    Volunteer.countDocuments(),
    Volunteer.countDocuments({ verified: true }),
    Volunteer.countDocuments({ verified: false }),
    CallSession.countDocuments({ status: { $ne: 'ENDED' } }),
    Hazard.countDocuments(),
    Hazard.countDocuments({ status: 'VERIFIED' }),
    Hazard.countDocuments({ status: 'PENDING' }),
    SOS.countDocuments(),
    Feedback.countDocuments(),
    AuditLog.find().sort({ createdAt: -1 }).limit(20).populate('actor', 'name email'),
  ]);
  const pendingRequests = await VolunteerRequest.countDocuments({ status: 'WAITING' });
  res.json({
    success: true,
    data: {
      stats: { totalUsers, activeUsers, totalVolunteers, verifiedVolunteers, pendingVolunteers, activeCalls, hazardReports, verifiedHazards, pendingHazards, sosEvents, feedback: feedbackCount, pendingRequests },
      activity,
    },
  });
});

const listHazards = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const hazards = await Hazard.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: { hazards: hazards.map((item) => ({
    id: item.id, category: item.category, description: item.description,
    latitude: item.location.coordinates[1], longitude: item.location.coordinates[0],
    status: item.status, createdAt: item.createdAt,
  })) } });
});

const listSos = asyncHandler(async (req, res) => {
  const events = await SOS.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: { events } });
});

const listAudit = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find().populate('actor', 'name email').sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: { logs } });
});

module.exports = { dashboard, listHazards, listSos, listAudit };
