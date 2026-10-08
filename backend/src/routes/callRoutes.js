const express = require('express');
const { body } = require('express-validator');
const CallSession = require('../models/CallSession');
const VolunteerRequest = require('../models/VolunteerRequest');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/callController');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const validate = require('../utils/validateRequest');

const router = express.Router();
router.use(authenticate);
router.get('/', controller.listMine);
router.get('/ice-servers', controller.iceServers);
router.post('/', [
  body('requestId').isMongoId(),
  validate,
  asyncHandler(async (req, res) => {
    const request = await VolunteerRequest.findOne({ _id: req.body.requestId, status: 'ACCEPTED' });
    if (!request || ![request.user.toString(), request.volunteer.toString()].includes(req.user.id)) {
      throw new ApiError(404, 'Accepted volunteer assistance request not found.');
    }
    const call = await CallSession.findOne({ request: request.id });
    if (!call) throw new ApiError(404, 'Call session is not available.');
    res.json({ success: true, data: { call } });
  }),
]);
router.get('/:id', controller.getCall);
router.post('/:id/end', controller.endCall);

module.exports = router;
