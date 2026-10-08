const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/offlineController');

const router = express.Router();
router.use(authenticate, authorize('USER'));
router.post('/sync', controller.syncValidation, controller.sync);

module.exports = router;
