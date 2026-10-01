const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responseHelper');

/**
 * Middleware to check express-validator results and return errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation failed.', 422, errors.array());
  }
  next();
};

module.exports = { validate };
