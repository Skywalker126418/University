const { body } = require('express-validator');

const loginValidators = [
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const changePasswordValidators = [
  body('oldPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters.'),
];

module.exports = { loginValidators, changePasswordValidators };
