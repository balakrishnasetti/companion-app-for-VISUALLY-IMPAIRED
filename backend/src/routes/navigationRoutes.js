const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/navigationController');

const router = express.Router();
router.use(authenticate, authorize('USER'));
router.post('/route', controller.routeValidation, controller.route);
router.get('/alerts', controller.alerts);
router.delete('/route', controller.stop);

module.exports = router;
