const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { courseValidators, updateCourseValidators } = require('../validators/courseValidators');

router.get('/available', authenticate, courseController.getAvailableCourses);
router.get('/', authenticate, courseController.getCourses);
router.get('/:id', authenticate, courseController.getCourseById);
router.get('/:id/students', authenticate, courseController.getEnrolledStudents);
router.post('/', authenticate, authorize('admin'), courseValidators, validate, courseController.createCourse);
router.put('/:id', authenticate, authorize('admin', 'registrar', 'lecturer'), updateCourseValidators, validate, courseController.updateCourse);
router.delete('/:id', authenticate, authorize('admin'), courseController.deleteCourse);

module.exports = router;
