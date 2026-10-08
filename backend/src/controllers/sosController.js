const { body, param } = require('express-validator');
const SOS = require('../models/SOS');
const Notification = require('../models/Notification');
const TrustedContact = require('../models/TrustedContact');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../utils/validateRequest');

const createValidation = [
  body('requestId').isString().isLength({ min: 8, max: 80 }),
  body('location.latitude').optional().isFloat({ min: -90, max: 90 }),
  body('location.longitude').optional().isFloat({ min: -180, max: 180 }),
  validate,
];

const create = asyncHandler(async (req, res) => {
  const existing = await SOS.findOne({ user: req.user.id, requestId: req.body.requestId });
  if (existing) return res.json({ success: true, data: { sos: existing, contactDelivery: existing.contactDelivery } });
  const hasLatitude = req.body.location?.latitude !== undefined;
  const hasLongitude = req.body.location?.longitude !== undefined;
  if (hasLatitude !== hasLongitude) throw new ApiError(400, 'Provide both coordinates or neither.');
  const sos = await SOS.create({
    user: req.user.id,
    requestId: req.body.requestId,
    ...(hasLatitude ? { location: req.body.location } : {}),
  });
  const notification = await Notification.create({
    user: req.user.id,
    type: 'SOS',
    message: 'Your SOS was recorded in BALA. Emergency services are not contacted by this app.',
    data: { sosId: sos.id },
  });
  req.app.get('io')?.to(`user:${req.user.id}`).emit('notification:new', notification);
  let contactDelivery = 'NOT_CONFIGURED';
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
    const apiKey = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const contacts = await TrustedContact.find({ user: req.user.id });
    const messages = await Promise.allSettled(contacts.map(async (contact) => {
      const body = new URLSearchParams({
        To: contact.phone,
        From: process.env.TWILIO_FROM_NUMBER,
        Body: `BALA SOS: ${req.user.name} requested help.${hasLatitude ? ` Location: https://maps.google.com/?q=${req.body.location.latitude},${req.body.location.longitude}` : ''} This is not an emergency-services dispatch.`,
      });
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: `Basic ${apiKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!response.ok) throw new Error(`SMS provider returned ${response.status}.`);
    }));
    const fulfilled = messages.filter((result) => result.status === 'fulfilled').length;
    contactDelivery = messages.length === 0 ? 'NO_CONTACTS' : fulfilled === messages.length ? 'SENT' : fulfilled > 0 ? 'PARTIAL' : 'FAILED';
    if (contactDelivery === 'FAILED') console.error('SOS notification could not be delivered to trusted contacts.');
  }
  sos.contactDelivery = contactDelivery;
  await sos.save();
  res.status(201).json({ success: true, data: { sos, contactDelivery } });
});

const history = asyncHandler(async (req, res) => {
  const sosEvents = await SOS.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: { events: sosEvents } });
});

const cancel = [
  param('id').isMongoId(),
  validate,
  asyncHandler(async (req, res) => {
    const event = await SOS.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, status: 'ACTIVE' },
      { status: 'CANCELLED', cancelledAt: new Date() },
      { new: true },
    );
    if (!event) throw new ApiError(404, 'Active SOS event not found.');
    res.json({ success: true, data: { sos: event } });
  }),
];

module.exports = { createValidation, create, history, cancel };
