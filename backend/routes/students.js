const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { studentValidators, updateStudentValidators } = require('../validators/studentValidators');

router.get('/me', authenticate, studentController.getMyProfile);
router.get('/', authenticate, authorize('admin', 'registrar', 'lecturer'), studentController.getStudents);
router.get('/:id', authenticate, authorize('admin', 'registrar', 'lecturer'), studentController.getStudentById);
router.post('/', authenticate, authorize('admin', 'registrar'), studentValidators, validate, studentController.createStudent);
router.put('/:id', authenticate, authorize('admin', 'registrar'), updateStudentValidators, validate, studentController.updateStudent);
router.delete('/:id', authenticate, authorize('admin'), studentController.deleteStudent);

module.exports = router;
