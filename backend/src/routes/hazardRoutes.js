const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/hazardController');

const router = express.Router();
router.use(authenticate);
router.post('/', authorize('USER', 'ADMIN'), controller.createValidation, controller.create);
router.get('/', controller.listValidation, controller.list);
router.get('/nearby', controller.listValidation, controller.list);
router.put('/:id', authorize('ADMIN'), controller.moderate);

module.exports = router;
