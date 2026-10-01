const express = require('express');
const router = express.Router();
const semesterController = require('../controllers/semesterController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Read available to all authenticated
router.get('/', authenticate, semesterController.getSemesters);
router.get('/:id', authenticate, semesterController.getSemesterById);

// Admin & Registrar write
router.post('/', authenticate, authorize('admin', 'registrar'), semesterController.createSemester);
router.put('/:id', authenticate, authorize('admin', 'registrar'), semesterController.updateSemester);
router.put('/:id/set-current', authenticate, authorize('admin', 'registrar'), semesterController.setCurrentSemester);
router.delete('/:id', authenticate, authorize('admin', 'registrar'), semesterController.deleteSemester);

module.exports = router;
