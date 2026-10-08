const { body } = require('express-validator');
const crypto = require('node:crypto');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const UserPreference = require('../models/UserPreference');
const { getOrCreatePreference } = require('../services/preferenceService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validateRequest');
const { signToken, setAuthCookie } = require('../services/tokenService');
const { SUPPORTED_LANGUAGES } = require('../constants/languages');

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 80 }),
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isLength({ min: 10, max: 128 }),
  body('role').optional().isIn(['USER', 'VOLUNTEER']),
  validate,
];

const loginValidation = [
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 1, max: 128 }),
  validate,
];

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'USER', language = 'en' } = req.body;
  if (!SUPPORTED_LANGUAGES.includes(language)) throw new ApiError(400, 'Choose a supported language.');
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists.');
  const user = await User.create({ name, email, passwordHash: password, role });
  const preference = await UserPreference.create({ user: user.id, language });
  if (role === 'VOLUNTEER') await Volunteer.create({ user: user._id });
  setAuthCookie(res, signToken(user._id.toString()));
  res.status(201).json({ success: true, data: { user: publicUser(user, preference) } });
});

const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(401, 'Email or password is incorrect.');
  }
  if (user.status !== 'ACTIVE') throw new ApiError(403, 'This account has been suspended.');
  const preference = await getOrCreatePreference(user.id);
  setAuthCookie(res, signToken(user._id.toString()));
  res.json({ success: true, data: { user: publicUser(user, preference) } });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: publicUser(req.user, req.preference) } });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('bala_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ success: true, message: 'You have been signed out.' });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const { language, accessibility } = req.body;
  if (language && !SUPPORTED_LANGUAGES.includes(language)) throw new ApiError(400, 'Unsupported language.');
  const allowed = ['highContrast', 'largeText', 'reducedMotion', 'speechRate'];
  const update = {};
  if (language) update.language = language;
  if (accessibility) {
    for (const [key, value] of Object.entries(accessibility)) {
      if (!allowed.includes(key)) throw new ApiError(400, `Unsupported accessibility setting: ${key}.`);
      if (key === 'speechRate' ? (typeof value !== 'number' || value < 0.5 || value > 1.5) : typeof value !== 'boolean') {
        throw new ApiError(400, `Invalid value for ${key}.`);
      }
      update[`accessibility.${key}`] = value;
    }
  }
  const preference = await UserPreference.findOneAndUpdate(
    { user: req.user.id },
    { $set: update },
    { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true },
  );
  req.preference = preference;
  res.json({ success: true, data: { user: publicUser(req.user, preference) } });
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  if (typeof req.body.email !== 'string' || req.body.email.length > 254) throw new ApiError(400, 'Enter a valid email address.');
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) {
    throw new ApiError(503, 'Password recovery email is not configured on this server.');
  }
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });
  if (!user) return res.json({ success: true, message: 'If the account exists, recovery instructions will be sent.' });
  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetHash = crypto.createHash('sha256').update(token).digest('hex');
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  await user.save();
  const origin = (process.env.CLIENT_URL || '').split(',')[0].trim();
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: [user.email],
      subject: 'BALA password reset',
      text: `Use this link within 15 minutes to reset your BALA password: ${origin}/reset-password?token=${token}`,
    }),
  });
  if (!response.ok) throw new ApiError(502, 'The recovery email could not be sent. Please try again.');
  res.json({ success: true, message: 'If the account exists, recovery instructions will be sent.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash('sha256').update(req.body.token || '').digest('hex');
  const user = await User.findOne({ passwordResetHash: tokenHash, passwordResetExpires: { $gt: Date.now() } }).select('+passwordHash');
  if (!user) throw new ApiError(400, 'This reset link is invalid or expired.');
  if (typeof req.body.password !== 'string' || req.body.password.length < 10 || req.body.password.length > 128) {
    throw new ApiError(400, 'Choose a password with at least 10 characters.');
  }
  user.passwordHash = req.body.password;
  user.passwordResetHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json({ success: true, message: 'Your password was updated. Please sign in.' });
});

function publicUser(user, preference = user.preference) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    language: preference?.language || 'en',
    accessibility: preference?.accessibility || { highContrast: false, largeText: false, reducedMotion: false, speechRate: 1 },
  };
}

module.exports = {
  registerValidation, loginValidation, register, login, me, logout,
  updatePreferences, requestPasswordReset, resetPassword, publicUser,
};
