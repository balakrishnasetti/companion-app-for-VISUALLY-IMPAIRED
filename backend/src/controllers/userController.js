const { body, param } = require('express-validator');
const User = require('../models/User');
const UserPreference = require('../models/UserPreference');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validateRequest');
const { publicUser } = require('./authController');

const updateProfile = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('email').optional().trim().isEmail().normalizeEmail(),
  validate,
  asyncHandler(async (req, res) => {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.email !== undefined) updates.email = req.body.email;
    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true });
    res.json({ success: true, data: { user: publicUser(user, req.preference) } });
  }),
];

const list = asyncHandler(async (req, res) => {
  const users = await User.find().select('name email role status createdAt').sort({ createdAt: -1 }).limit(200);
  const preferences = await UserPreference.find({ user: { $in: users.map((user) => user.id) } }).select('user language');
  const byUser = new Map(preferences.map((item) => [item.user.toString(), item.language]));
  res.json({ success: true, data: { users: users.map((user) => ({ ...user.toObject(), language: byUser.get(user.id) || 'en' })) } });
});

const updateStatus = [
  param('id').isMongoId(),
  body('status').isIn(['ACTIVE', 'SUSPENDED']),
  validate,
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) throw new ApiError(400, 'You cannot change your own account status.');
    const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).select('-passwordHash');
    if (!user) throw new ApiError(404, 'User not found.');
    const preference = await UserPreference.findOne({ user: user.id });
    res.json({ success: true, data: { user: publicUser(user, preference) } });
  }),
];

module.exports = { updateProfile, list, updateStatus };
