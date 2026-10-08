const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/feedbackController');

const router = express.Router();
router.use(authenticate);
router.post('/', authorize('USER'), controller.createValidation, controller.create);
router.get('/', controller.list);
router.put('/:id/moderate', authorize('ADMIN'), controller.moderate);

module.exports = router;
