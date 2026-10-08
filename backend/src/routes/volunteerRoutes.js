const express = require('express');
const controller = require('../controllers/volunteerController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.get('/', controller.listAvailable);
router.get('/availability', controller.listAvailable);
router.get('/me', authorize('VOLUNTEER'), controller.getSelf);
router.put('/availability', authorize('VOLUNTEER'), controller.availability);
router.put('/profile', authorize('VOLUNTEER'), controller.updateProfile);
router.post('/ai-assist', authorize('USER'), controller.aiAssistValidation, controller.aiAssist);
router.post('/requests', authorize('USER'), controller.createRequestValidation, controller.createRequest);
router.get('/requests', authorize('USER', 'VOLUNTEER', 'ADMIN'), controller.listRequests);
router.put('/requests/:id/cancel', authorize('USER'), controller.cancelRequest);
router.put('/requests/:id/accept', authorize('VOLUNTEER'), controller.accept);
router.put('/requests/:id/reject', authorize('ADMIN'), controller.reject);

module.exports = router;
