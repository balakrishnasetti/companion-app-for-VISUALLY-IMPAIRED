const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const admin = require('../controllers/adminController');
const users = require('../controllers/userController');
const volunteers = require('../controllers/volunteerController');
const hazards = require('../controllers/hazardController');
const notifications = require('../controllers/notificationController');
const feedback = require('../controllers/feedbackController');

const router = express.Router();
router.use(authenticate, authorize('ADMIN'));
router.get('/dashboard', admin.dashboard);
router.get('/users', users.list);
router.put('/users/:id/status', users.updateStatus);
router.get('/volunteers', volunteers.adminVolunteers);
router.put('/volunteers/:id/verify', volunteers.verifyVolunteer);
router.get('/hazards', admin.listHazards);
router.put('/hazards/:id/verify', hazards.moderate);
router.get('/reports', admin.listAudit);
router.get('/audit-logs', admin.listAudit);
router.get('/notifications', notifications.adminList);
router.get('/sos', admin.listSos);
router.get('/feedback', feedback.list);

module.exports = router;
