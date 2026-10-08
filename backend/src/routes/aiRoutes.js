const express = require('express');
const controller = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(authenticate);
router.post('/scene-description', controller.imageValidation, controller.scene);
router.post('/obstacle-detection', controller.imageValidation, controller.obstacles);
router.post('/currency-reader', controller.imageValidation, controller.currency);
router.post('/document-reader', controller.imageValidation, controller.documentReader);
module.exports = router;
