const { body } = require('express-validator');

const createCourseValidators = [
  body('course_code').trim().notEmpty().withMessage('Course code is required.'),
  body('course_name').trim().notEmpty().withMessage('Course name is required.'),
  body('credits').isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10.'),
  body('department_id').notEmpty().withMessage('Department is required.'),
  body('semester').optional({ checkFalsy: true }),
  body('level').optional({ checkFalsy: true }),
  body('lecturer_id').optional({ checkFalsy: true }),
];

const updateCourseValidators = [
  body('course_name').optional().trim().notEmpty().withMessage('Course name cannot be empty.'),
  body('credits').optional({ checkFalsy: true }).isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10.'),
  body('department_id').optional({ checkFalsy: true }),
  body('semester').optional({ checkFalsy: true }),
  body('lecturer_id').optional({ checkFalsy: true }),
];

module.exports = { createCourseValidators, courseValidators: createCourseValidators, updateCourseValidators };
