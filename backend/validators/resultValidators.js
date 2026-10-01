const { body } = require('express-validator');

const enterResultValidators = [
  body('student_id').notEmpty().withMessage('Student ID is required.'),
  body('course_id').notEmpty().isInt().withMessage('Course ID is required.'),
  body('mark')
    .notEmpty()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Mark must be a number between 0 and 100.'),
  body('academic_year').optional().trim().notEmpty().withMessage('Academic year cannot be empty.'),
  body('semester').optional().isIn([1, 2, 3, '1', '2', '3']).withMessage('Semester must be 1, 2, or 3.'),
];

const bulkResultValidators = [
  body('results').isArray({ min: 1 }).withMessage('Results must be a non-empty array.'),
  body('results.*.student_id').notEmpty().withMessage('Each result must have a valid student_id.'),
  body('results.*.mark')
    .notEmpty()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Each mark must be between 0 and 100.'),
];

module.exports = { enterResultValidators, bulkResultValidators };
