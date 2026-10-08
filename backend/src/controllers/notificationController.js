const { param } = require('express-validator');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validateRequest');

const list = asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100),
    Notification.countDocuments({ user: req.user.id, readAt: null }),
  ]);
  res.json({ success: true, data: { notifications, unreadCount } });
});

const markRead = [
  param('id').isMongoId(),
  validate,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { readAt: new Date() },
      { new: true },
    );
    if (!notification) throw new ApiError(404, 'Notification not found.');
    res.json({ success: true, data: { notification } });
  }),
];

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, readAt: null }, { readAt: new Date() });
  res.json({ success: true, message: 'All notifications marked as read.' });
});

const adminList = asyncHandler(async (req, res) => {
  const notifications = await Notification.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: { notifications } });
});

module.exports = { list, markRead, markAllRead, adminList };
