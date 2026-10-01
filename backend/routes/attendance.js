const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const {
  getAttendance,
  markAttendance,
  getAttendanceSummary,
  getAttendanceHistory,
} = require('../controllers/attendanceController');

router.get('/', authenticate, authorize('admin', 'lecturer', 'registrar'), getAttendance);
router.post('/mark', authenticate, authorize('admin', 'lecturer'), markAttendance);
router.get('/summary', authenticate, getAttendanceSummary);
router.get('/history', authenticate, authorize('admin', 'lecturer', 'registrar'), getAttendanceHistory);

module.exports = router;
