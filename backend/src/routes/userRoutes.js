const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/userController');
const auth = require('../controllers/authController');
const contacts = require('../controllers/trustedContactController');
const { authenticate } = require('../middleware/auth');
const validate = require('../utils/validateRequest');
const asyncHandler = require('../utils/asyncHandler');
const { SUPPORTED_LANGUAGES } = require('../constants/languages');

const router = express.Router();

router.use(authenticate);
router.get('/me', (req, res) => res.json({ success: true, data: { user: auth.publicUser(req.user, req.preference) } }));
router.put('/me', controller.updateProfile);
router.put('/preferences', asyncHandler(async (req, res, next) => {
  const rules = [
    body('language').optional().isIn(SUPPORTED_LANGUAGES),
    body('accessibility').optional().isObject(),
  ];
  await Promise.all(rules.map((rule) => rule.run(req)));
  next();
}), validate, auth.updatePreferences);
router.get('/contacts', contacts.list);
router.post('/contacts', contacts.create);
router.delete('/contacts/:contactId', contacts.remove);
module.exports = router;
