const { body } = require('express-validator');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validateRequest');
const { describeImage } = require('../services/aiVisionService');
const { parseVoiceIntent } = require('../services/voiceIntent');
const VoiceCommand = require('../models/VoiceCommand');
const { SUPPORTED_LANGUAGES } = require('../constants/languages');

const imageValidation = [
  body('image').isString().isLength({ max: Number(process.env.UPLOAD_MAX_MB || 8) * 1400000 }),
  body('language').optional().isIn(SUPPORTED_LANGUAGES),
  validate,
];

const scene = asyncHandler(async (req, res) => {
  const result = await describeImage(req.body.image, 'Describe objects, layout, people, and visible hazards in the image.', req.body.language || req.preference.language);
  res.json({ success: true, data: result });
});

const obstacles = asyncHandler(async (req, res) => {
  const result = await describeImage(req.body.image, 'Identify visible obstacles and their approximate relative position. Use cautious wording; this is not a safety guarantee.', req.body.language || req.preference.language);
  res.json({ success: true, data: result });
});

const currency = asyncHandler(async (req, res) => {
  const result = await describeImage(req.body.image, 'Read only clearly visible currency denomination or invoice totals and dates. If any digits are uncertain or obscured, say so and do not guess.', req.body.language || req.preference.language);
  res.json({ success: true, data: result });
});

const documentReader = asyncHandler(async (req, res) => {
  const result = await describeImage(req.body.image, 'Read the visible document. Transcribe only clearly legible text. Do not guess obscured or uncertain words.', req.body.language || req.preference.language);
  res.json({ success: true, data: result });
});

const voiceCommand = asyncHandler(async (req, res) => {
  if (typeof req.body.phrase !== 'string' || req.body.phrase.length > 300) throw new ApiError(400, 'Voice command must be 300 characters or fewer.');
  const result = parseVoiceIntent(req.body.phrase);
  if (result.intent) await VoiceCommand.create({ user: req.user.id, intent: result.intent, language: req.body.language || req.preference.language });
  res.json({ success: true, data: result });
});

module.exports = { imageValidation, scene, obstacles, currency, documentReader, voiceCommand };
