const express = require('express');
const router = express.Router();
const academicYearController = require('../controllers/academicYearController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Public to authenticated users (e.g. students and lecturers need to view them)
router.get('/', authenticate, academicYearController.getAcademicYears);
router.get('/:id', authenticate, academicYearController.getAcademicYearById);

// Admin & Registrar can modify
router.post('/', authenticate, authorize('admin', 'registrar'), academicYearController.createAcademicYear);
router.put('/:id', authenticate, authorize('admin', 'registrar'), academicYearController.updateAcademicYear);
router.put('/:id/set-current', authenticate, authorize('admin', 'registrar'), academicYearController.setCurrentAcademicYear);
router.delete('/:id', authenticate, authorize('admin', 'registrar'), academicYearController.deleteAcademicYear);

module.exports = router;
