const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../utils/validateRequest');

const router = express.Router();
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });

router.post('/register', authLimit, controller.registerValidation, controller.register);
router.post('/login', authLimit, controller.loginValidation, controller.login);
router.post('/logout', authenticate, controller.logout);
router.post('/forgot-password', authLimit, body('email').trim().isEmail().normalizeEmail(), validate, controller.requestPasswordReset);
router.post('/reset-password', authLimit, body('token').isString().isLength({ min: 32, max: 128 }), body('password').isString().isLength({ min: 10, max: 128 }), validate, controller.resetPassword);
router.get('/me', authenticate, controller.me);

module.exports = router;
