const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', authenticate, facultyController.getFaculties);
router.get('/:id', authenticate, facultyController.getFacultyById);
router.post('/', authenticate, authorize('admin'), facultyController.createFaculty);
router.put('/:id', authenticate, authorize('admin'), facultyController.updateFaculty);
router.delete('/:id', authenticate, authorize('admin'), facultyController.deleteFaculty);

module.exports = router;
