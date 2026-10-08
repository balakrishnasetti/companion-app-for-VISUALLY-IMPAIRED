const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validateRequest');
const ApiError = require('../utils/ApiError');
const VoiceCommand = require('../models/VoiceCommand');
const UserPreference = require('../models/UserPreference');
const { SUPPORTED_LANGUAGES } = require('../constants/languages');

const router = express.Router();
router.use(authenticate);
router.post('/command', controller.voiceCommand);
router.get('/settings', (req, res) => res.json({ success: true, data: { language: req.preference.language, supportedLanguages: SUPPORTED_LANGUAGES } }));
router.put('/settings', body('language').isIn(SUPPORTED_LANGUAGES), validate, asyncHandler(async (req, res) => {
  if (!SUPPORTED_LANGUAGES.includes(req.body.language)) throw new ApiError(400, 'Choose a supported language.');
  req.preference = await UserPreference.findOneAndUpdate({ user: req.user.id }, { language: req.body.language }, { new: true, upsert: true });
  res.json({ success: true, data: { language: req.preference.language } });
}));
router.get('/history', asyncHandler(async (req, res) => {
  const commands = await VoiceCommand.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: { commands } });
}));

module.exports = router;
