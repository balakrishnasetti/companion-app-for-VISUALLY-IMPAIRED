const express = require('express');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/documentController');

const router = express.Router();
router.use(authenticate);
router.post('/', controller.createValidation, controller.create);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.delete('/:id', controller.remove);

module.exports = router;
