const ApiError = require('../utils/ApiError');

module.exports = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  const statusCode = error.code === 11000 ? 409
    : error instanceof ApiError
      ? error.statusCode
      : error.name === 'ValidationError' ? 400
      : Number.isInteger(error.status) && error.status >= 400 && error.status < 500 ? error.status : 500;
  const message = statusCode === 500 ? 'Something went wrong. Please try again.' : error.message;
  if (statusCode === 500) console.error('Unhandled API error:', error.message);
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error.details ? { errors: error.details } : {}),
    ...(error.code === 11000 ? { message: 'A record with this information already exists.' } : {}),
  });
};
