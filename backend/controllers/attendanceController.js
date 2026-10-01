const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * GET /api/attendance?course_id=&session_date=
 * Lecturer gets attendance for a course session
 */
const getAttendance = async (req, res, next) => {
  try {
    const { course_id, session_date } = req.query;

    if (!course_id || !session_date) {
      return errorResponse(res, 'course_id and session_date are required.', 400);
    }

    // Verify lecturer owns this course (unless admin)
    if (req.user.role === 'lecturer') {
      const [lec] = await pool.query('SELECT id FROM lecturers WHERE user_id = ?', [req.user.id]);
      if (!lec.length) return errorResponse(res, 'Lecturer profile not found.', 404);

      const [assigned] = await pool.query(
        'SELECT id FROM course_assignments WHERE course_id = ? AND lecturer_id = ?',
        [course_id, lec[0].id]
      );
      if (!assigned.length) return errorResponse(res, 'You are not assigned to this course.', 403);
    }

    // Get ALL active students with their attendance for this session
    // We show all students so the lecturer can mark attendance for anyone
    const [students] = await pool.query(
      `SELECT s.id as student_id, s.student_number, u.first_name, u.last_name, u.avatar,
              a.id as attendance_id, a.status, a.remarks, a.recorded_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN attendance a ON a.student_id = s.id AND a.course_id = ? AND a.session_date = ?
       WHERE s.status = 'active'
       ORDER BY u.last_name ASC, u.first_name ASC`,
      [course_id, session_date]
    );

    // Aggregate stats for this session
    const total = students.length;
    const present = students.filter(s => s.status === 'present').length;
    const absent = students.filter(s => s.status === 'absent').length;
    const late = students.filter(s => s.status === 'late').length;
    const excused = students.filter(s => s.status === 'excused').length;

    return successResponse(res, {
      students,
      stats: { total, present, absent, late, excused, not_marked: total - present - absent - late - excused },
    }, 'Attendance retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/attendance/mark
 * Lecturer marks attendance for a full session (bulk)
 */
const markAttendance = async (req, res, next) => {
  try {
    const { course_id, session_date, records } = req.body;
    // records: [{ student_id, status, remarks }]

    if (!course_id || !session_date || !Array.isArray(records) || records.length === 0) {
      return errorResponse(res, 'course_id, session_date, and records[] are required.', 400);
    }

    // Get lecturer id
    let lecturerId = null;
    if (req.user.role === 'lecturer') {
      const [lec] = await pool.query('SELECT id FROM lecturers WHERE user_id = ?', [req.user.id]);
      if (!lec.length) return errorResponse(res, 'Lecturer profile not found.', 404);
      lecturerId = lec[0].id;

      const [assigned] = await pool.query(
        'SELECT id FROM course_assignments WHERE course_id = ? AND lecturer_id = ?',
        [course_id, lecturerId]
      );
      if (!assigned.length) return errorResponse(res, 'You are not assigned to this course.', 403);
    } else {
      // admin — find first lecturer assigned to this course
      const [lec] = await pool.query(
        'SELECT lecturer_id FROM course_assignments WHERE course_id = ? LIMIT 1', [course_id]
      );
      lecturerId = lec[0]?.lecturer_id || null;
    }

    const dayOfWeek = new Date(session_date).toLocaleDateString('en-US', { weekday: 'long' });
    let marked = 0;

    for (const rec of records) {
      const { student_id, status, remarks } = rec;
      if (!student_id || !status) continue;

      await pool.query(
        `INSERT INTO attendance (course_id, lecturer_id, student_id, session_date, day_of_week, status, remarks, recorded_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), updated_at = NOW()`,
        [course_id, lecturerId, student_id, session_date, dayOfWeek, status, remarks || null]
      );
      marked++;
    }

    return successResponse(res, { marked, session_date, course_id }, 'Attendance saved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/attendance/summary?course_id=&student_id=
 * Summary attendance rate for a student in a course (or all)
 */
const getAttendanceSummary = async (req, res, next) => {
  try {
    const { course_id, student_id } = req.query;

    let where = 'WHERE 1=1';
    const params = [];

    if (course_id) { where += ' AND a.course_id = ?'; params.push(course_id); }
    if (student_id) { where += ' AND a.student_id = ?'; params.push(student_id); }

    if (req.user.role === 'student') {
      const [s] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (!s.length) return errorResponse(res, 'Student not found.', 404);
      where += ' AND a.student_id = ?';
      params.push(s[0].id);
    } else if (req.user.role === 'lecturer') {
      const [lec] = await pool.query('SELECT id FROM lecturers WHERE user_id = ?', [req.user.id]);
      if (!lec.length) return errorResponse(res, 'Lecturer not found.', 404);
      where += ' AND a.lecturer_id = ?';
      params.push(lec[0].id);
    }

    const [rows] = await pool.query(
      `SELECT c.course_code, c.course_name,
              COUNT(*) as total_sessions,
              SUM(a.status = 'present') as present,
              SUM(a.status = 'absent') as absent,
              SUM(a.status = 'late') as late,
              SUM(a.status = 'excused') as excused,
              ROUND(SUM(a.status IN ('present','late','excused')) / COUNT(*) * 100, 1) as attendance_rate
       FROM attendance a
       JOIN courses c ON a.course_id = c.id
       ${where}
       GROUP BY a.course_id`,
      params
    );

    return successResponse(res, rows, 'Attendance summary retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/attendance/history?course_id=&month=YYYY-MM
 * All sessions for a course in a month
 */
const getAttendanceHistory = async (req, res, next) => {
  try {
    const { course_id, month } = req.query;
    if (!course_id) return errorResponse(res, 'course_id is required.', 400);

    let dateWhere = '';
    const params = [course_id];

    if (month) {
      dateWhere = 'AND DATE_FORMAT(a.session_date, "%Y-%m") = ?';
      params.push(month);
    }

    const [sessions] = await pool.query(
      `SELECT a.session_date, a.day_of_week,
              COUNT(*) as total,
              SUM(a.status = 'present') as present,
              SUM(a.status = 'absent') as absent,
              SUM(a.status = 'late') as late,
              SUM(a.status = 'excused') as excused
       FROM attendance a
       WHERE a.course_id = ? ${dateWhere}
       GROUP BY a.session_date
       ORDER BY a.session_date DESC`,
      params
    );

    return successResponse(res, sessions, 'Attendance history retrieved.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAttendance, markAttendance, getAttendanceSummary, getAttendanceHistory };
