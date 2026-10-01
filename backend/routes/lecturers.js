const express = require('express');
const router = express.Router();
const lecturerController = require('../controllers/lecturerController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/me', authenticate, lecturerController.getMyProfile);
router.get('/', authenticate, lecturerController.getLecturers);
router.get('/:id', authenticate, lecturerController.getLecturerById);
router.get('/:id/courses', authenticate, lecturerController.getLecturerCourses);
router.post('/', authenticate, authorize('admin'), lecturerController.createLecturer);
router.put('/:id', authenticate, authorize('admin'), lecturerController.updateLecturer);
router.delete('/:id', authenticate, authorize('admin'), lecturerController.deleteLecturer);

module.exports = router;
