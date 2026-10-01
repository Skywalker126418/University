const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/my', authenticate, registrationController.getRegistrations);
router.get('/periods', authenticate, registrationController.getRegistrationPeriods);
router.get('/periods/status', authenticate, registrationController.getPeriodStatus);
router.post('/periods/toggle', authenticate, authorize('admin', 'registrar'), registrationController.toggleRegistrationPeriod);
router.post('/periods', authenticate, authorize('admin', 'registrar'), registrationController.upsertRegistrationPeriod);


router.get('/', authenticate, registrationController.getRegistrations);
router.get('/:id', authenticate, registrationController.getRegistrationById);
router.post('/', authenticate, authorize('student'), registrationController.submitRegistration);
router.put('/:id/approve', authenticate, authorize('admin', 'registrar'), registrationController.approveRegistration);
router.put('/:id/reject', authenticate, authorize('admin', 'registrar'), registrationController.rejectRegistration);
router.delete('/:id', authenticate, registrationController.withdrawRegistration);

module.exports = router;
