const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/enrollment', authenticate, authorize('admin', 'registrar'), reportController.getEnrollmentReport);
router.get('/results', authenticate, authorize('admin', 'registrar', 'lecturer'), reportController.getResultsReport);
router.get('/registrations', authenticate, authorize('admin', 'registrar'), reportController.getRegistrationReport);
router.get('/:type/export', authenticate, authorize('admin', 'registrar'), reportController.exportReport);

module.exports = router;
