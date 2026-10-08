const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getOrCreatePreference } = require('../services/preferenceService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.bala_token || req.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new ApiError(401, 'Please sign in to continue.');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }

  const user = await User.findById(payload.sub).select('-passwordHash');
  if (!user || user.status !== 'ACTIVE') throw new ApiError(401, 'This account is not available.');
  req.preference = await getOrCreatePreference(user.id);
  req.user = user;
  next();
});

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
