const { errorResponse } = require('../utils/responseHelper');

/**
 * Global error handling middleware
 * Must be the last middleware registered in Express
 */
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err);

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return errorResponse(res, 'A record with this value already exists.', 409);
  }

  // MySQL foreign key constraint
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return errorResponse(res, 'Referenced record does not exist.', 400);
  }

  // MySQL row in use (cannot delete due to FK)
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return errorResponse(res, 'Cannot delete: record is referenced by other data.', 409);
  }

  // MySQL connection errors
  if (
    err.code === 'ECONNREFUSED' ||
    err.code === 'ER_ACCESS_DENIED_ERROR' ||
    err.code === 'ER_BAD_DB_ERROR' ||
    err.code === 'PROTOCOL_CONNECTION_LOST' ||
    err.code === 'ETIMEDOUT'
  ) {
    const detail = err.code === 'ER_BAD_DB_ERROR'
      ? 'Database not found. Please ensure database/university_management_system.sql is imported.'
      : 'Database connection error. Please ensure MySQL is running and credentials in .env are configured.';
    return errorResponse(res, detail, 503);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired.', 401);
  }
  if (err.message && err.message.includes('secretOrPrivateKey')) {
    return errorResponse(res, 'Authentication configuration error: JWT secret key is missing. Please set JWT_SECRET in .env.', 500);
  }

  // Validation errors (express-validator)
  if (err.type === 'validation') {
    return errorResponse(res, err.message || 'Validation failed.', 422, err.errors);
  }

  // Default
  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Internal server error.';

  return errorResponse(res, message, statusCode);
};

/**
 * 404 handler for unmatched routes
 */
const notFound = (req, res) => {
  return errorResponse(res, `Route ${req.originalUrl} not found.`, 404);
};

module.exports = { errorHandler, notFound };
