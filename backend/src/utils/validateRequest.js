const { validationResult } = require('express-validator');
const ApiError = require('./ApiError');

module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return next(new ApiError(400, 'Please check the highlighted information.', result.array()));
  }
  return next();
};
