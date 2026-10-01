const { body } = require('express-validator');

const createStudentValidators = [
  body('first_name').trim().notEmpty().withMessage('First name is required.'),
  body('last_name').trim().notEmpty().withMessage('Last name is required.'),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('phone').optional({ checkFalsy: true }),
  body('date_of_birth').optional({ checkFalsy: true }),
  body('gender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other.'),
  body('programme_id').notEmpty().withMessage('Programme ID is required.'),
  body('department_id').optional({ checkFalsy: true }),
  body('preferred_room_id').optional({ checkFalsy: true }),
  body('student_number').optional({ checkFalsy: true }),
  body('year_of_study').optional({ checkFalsy: true }),
  body('intake_year').optional({ checkFalsy: true }),
];

const updateStudentValidators = [
  body('first_name').optional().trim().notEmpty().withMessage('First name cannot be empty.'),
  body('last_name').optional().trim().notEmpty().withMessage('Last name cannot be empty.'),
  body('email').optional().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }),
  body('date_of_birth').optional({ checkFalsy: true }),
  body('gender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other.'),
];

module.exports = { createStudentValidators, studentValidators: createStudentValidators, updateStudentValidators };
