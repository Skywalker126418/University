const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseHelper');

/**
 * Verify JWT from Authorization: Bearer <token> header
 * Attaches decoded user to req.user
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Access denied. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return errorResponse(res, 'Access denied. Invalid token format.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token has expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid token.', 401);
  }
};

module.exports = { authenticate };
