import api from './api';

const attendanceService = {
  /**
   * Get attendance for a specific course session
   */
  getAttendance: (courseId, sessionDate) =>
    api.get('/attendance', { params: { course_id: courseId, session_date: sessionDate } }).then(r => r.data),

  /**
   * Mark attendance for a session (bulk)
   */
  markAttendance: (data) =>
    api.post('/attendance/mark', data).then(r => r.data),

  /**
   * Get attendance summary (by course)
   */
  getSummary: (params) =>
    api.get('/attendance/summary', { params }).then(r => r.data),

  /**
   * Get session history for a course
   */
  getHistory: (courseId, month) =>
    api.get('/attendance/history', { params: { course_id: courseId, month } }).then(r => r.data),
};

export default attendanceService;
