const { body, param } = require('express-validator');
const TrustedContact = require('../models/TrustedContact');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validateRequest');

const list = asyncHandler(async (req, res) => {
  const contacts = await TrustedContact.find({ user: req.user.id }).sort({ createdAt: 1 });
  res.json({ success: true, data: { contacts } });
});

const create = [
  body('name').trim().isLength({ min: 1, max: 80 }),
  body('phone').matches(/^\+?[0-9 ()-]{7,24}$/),
  body('relationship').optional().trim().isLength({ max: 50 }),
  validate,
  asyncHandler(async (req, res) => {
    const count = await TrustedContact.countDocuments({ user: req.user.id });
    if (count >= 10) throw new ApiError(400, 'You can save up to 10 trusted contacts.');
    const contact = await TrustedContact.create({ user: req.user.id, ...req.body });
    res.status(201).json({ success: true, data: { contact } });
  }),
];

const remove = [
  param('contactId').isMongoId(),
  validate,
  asyncHandler(async (req, res) => {
    const contact = await TrustedContact.findOneAndDelete({ _id: req.params.contactId, user: req.user.id });
    if (!contact) throw new ApiError(404, 'Trusted contact not found.');
    res.json({ success: true, message: 'Trusted contact removed.' });
  }),
];

module.exports = { list, create, remove };
