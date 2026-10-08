const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/sosController');
const admin = require('../controllers/adminController');

const router = express.Router();
router.use(authenticate);
router.post('/', authorize('USER'), controller.createValidation, controller.create);
router.get('/history', authorize('USER'), controller.history);
router.post('/:id/cancel', authorize('USER'), controller.cancel);
router.get('/admin', authorize('ADMIN'), admin.listSos);

module.exports = router;
