const { body, param } = require('express-validator');
const Document = require('../models/Document');
const OCRResult = require('../models/OCRResult');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validateRequest');
const { SUPPORTED_LANGUAGES } = require('../constants/languages');

const createValidation = [
  body('name').trim().isLength({ min: 1, max: 120 }),
  body('text').isString().isLength({ min: 1, max: 50000 }),
  body('language').optional().isIn(SUPPORTED_LANGUAGES),
  validate,
];

const create = asyncHandler(async (req, res) => {
  const document = await Document.create({
    user: req.user.id,
    name: req.body.name,
    extractedText: req.body.text,
    language: req.body.language || req.preference.language,
  });
  await OCRResult.create({ user: req.user.id, document: document.id, language: document.language, textLength: document.extractedText.length });
  res.status(201).json({ success: true, data: { document } });
});

const list = asyncHandler(async (req, res) => {
  const documents = await Document.find({ user: req.user.id }).select('-extractedText').sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: { documents } });
});

const get = [
  param('id').isMongoId(),
  validate,
  asyncHandler(async (req, res) => {
    const document = await Document.findOne({ _id: req.params.id, user: req.user.id });
    if (!document) throw new ApiError(404, 'Saved document not found.');
    res.json({ success: true, data: { document } });
  }),
];

const remove = [
  param('id').isMongoId(),
  validate,
  asyncHandler(async (req, res) => {
    const document = await Document.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!document) throw new ApiError(404, 'Saved document not found.');
    res.json({ success: true, message: 'Saved document deleted.' });
  }),
];

module.exports = { createValidation, create, list, get, remove };
