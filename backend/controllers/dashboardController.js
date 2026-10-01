const pool = require('../config/database');
const { calculateGPA } = require('../utils/gpaCalculator');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * GET /api/dashboard
 * Returns role-specific dashboard data
 */
const getDashboard = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;

    switch (role) {
      case 'student':
        return await getStudentDashboard(req, res, userId);
      case 'lecturer':
        return await getLecturerDashboard(req, res, userId);
      case 'admin':
        return await getAdminDashboard(req, res);
      case 'registrar':
        return await getRegistrarDashboard(req, res);
      default:
        return errorResponse(res, 'Unknown role.', 400);
    }
  } catch (err) {
    next(err);
  }
};

const getStudentDashboard = async (req, res, userId) => {
  const [studentRows] = await pool.query('SELECT * FROM students WHERE user_id = ?', [userId]);
  if (studentRows.length === 0) return errorResponse(res, 'Student profile not found.', 404);
  const student = studentRows[0];

  const [enrolledCourses] = await pool.query(
    `SELECT cr.*, c.course_code, c.course_name, c.credits
     FROM course_registrations cr
     JOIN courses c ON cr.course_id = c.id
     WHERE cr.student_id = ? AND cr.status = 'approved'
     ORDER BY cr.registered_at DESC LIMIT 10`,
    [student.id]
  );

  const [results] = await pool.query(
    `SELECT r.*, c.course_code, c.course_name, c.credits
     FROM results r JOIN courses c ON r.course_id = c.id
     WHERE r.student_id = ?
     ORDER BY r.created_at DESC LIMIT 5`,
    [student.id]
  );

  const [allResults] = await pool.query(
    'SELECT grade_point, credits FROM results r JOIN courses c ON r.course_id = c.id WHERE r.student_id = ?',
    [student.id]
  );

  const gpa = calculateGPA(allResults.map(r => ({ gradePoint: r.grade_point, credits: r.credits })));
  const totalCredits = allResults.reduce((sum, r) => sum + (parseFloat(r.credits) || 0), 0);

  const [notifications] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 5',
    [userId]
  );

  const [pendingReg] = await pool.query(
    `SELECT COUNT(*) as count FROM course_registrations WHERE student_id = ? AND status = 'pending'`,
    [student.id]
  );

  return successResponse(res, {
    student,
    enrolledCourses,
    registeredCoursesCount: enrolledCourses.length,
    recentResults: results,
    gpa: gpa || 0,
    totalCredits: totalCredits || 0,
    academicSummary: { gpa: gpa || 0, totalCredits: totalCredits || 0 },
    pendingRegistrations: pendingReg[0].count,
    notifications,
  }, 'Student dashboard retrieved.');
};

const getLecturerDashboard = async (req, res, userId) => {
  const [lecRows] = await pool.query('SELECT * FROM lecturers WHERE user_id = ?', [userId]);
  if (lecRows.length === 0) return errorResponse(res, 'Lecturer profile not found.', 404);
  const lecturer = lecRows[0];

  const [assignedCourses] = await pool.query(
    `SELECT ca.*, c.course_code, c.course_name, c.credits,
       (SELECT COUNT(*) FROM course_registrations cr WHERE cr.course_id = ca.course_id AND cr.status = 'approved') as student_count,
       (SELECT COUNT(*) FROM results r WHERE r.course_id = ca.course_id) as results_entered
     FROM course_assignments ca
     JOIN courses c ON ca.course_id = c.id
     WHERE ca.lecturer_id = ? AND ca.is_active = 1`,
    [lecturer.id]
  );

  const courseIds = assignedCourses.map(c => c.course_id);
  let pendingResults = 0;
  if (courseIds.length > 0) {
    const placeholders = courseIds.map(() => '?').join(',');
    const [pending] = await pool.query(
      `SELECT COUNT(*) as count
       FROM course_registrations cr
       WHERE cr.course_id IN (${placeholders}) AND cr.status = 'approved'
       AND NOT EXISTS (SELECT 1 FROM results r WHERE r.student_id = cr.student_id AND r.course_id = cr.course_id)`,
      courseIds
    );
    pendingResults = pending[0].count;
  }

  const [todayClasses] = await pool.query(
    `SELECT tt.*, c.course_name, c.course_code
     FROM timetable tt
     JOIN course_assignments ca ON tt.assignment_id = ca.id
     JOIN courses c ON ca.course_id = c.id
     WHERE ca.lecturer_id = ? AND tt.day_of_week = DAYNAME(NOW())
     ORDER BY tt.start_time ASC`,
    [lecturer.id]
  );

  const [notifications] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 5',
    [userId]
  );

  return successResponse(res, {
    lecturer,
    assignedCourses,
    assignedCoursesCount: assignedCourses.length,
    totalStudents: assignedCourses.reduce((sum, c) => sum + (parseInt(c.student_count) || 0), 0),
    pendingResults,
    pendingResultsCount: pendingResults,
    todayClasses,
    notifications,
  }, 'Lecturer dashboard retrieved.');
};

const getAdminDashboard = async (req, res) => {
  const [[totalStudents]] = await pool.query(`SELECT COUNT(*) as count FROM students WHERE status = 'active'`);
  const [[totalLecturers]] = await pool.query(`SELECT COUNT(*) as count FROM users WHERE role = 'lecturer' AND is_active = 1`);
  const [[totalCourses]] = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE is_active = 1`);
  const [[totalDepartments]] = await pool.query(`SELECT COUNT(*) as count FROM departments WHERE is_active = 1`);
  const [[totalProgrammes]] = await pool.query(`SELECT COUNT(*) as count FROM programmes WHERE is_active = 1`);
  const [[totalFaculties]] = await pool.query(`SELECT COUNT(*) as count FROM faculties WHERE is_active = 1`);
  const [[totalRooms]] = await pool.query(`SELECT COUNT(*) as count FROM rooms WHERE is_active = 1`);

  // Enrollment by department
  const [enrollmentByDept] = await pool.query(
    `SELECT d.department_name, COUNT(s.id) as student_count
     FROM departments d
     LEFT JOIN programmes p ON p.department_id = d.id
     LEFT JOIN students s ON s.programme_id = p.id AND s.status = 'active'
     WHERE d.is_active = 1
     GROUP BY d.id, d.department_name
     ORDER BY student_count DESC`
  );

  // Recent registrations
  const [recentRegistrations] = await pool.query(
    `SELECT cr.*, c.course_name, s.student_number, u.first_name, u.last_name
     FROM course_registrations cr
     JOIN courses c ON cr.course_id = c.id
     JOIN students s ON cr.student_id = s.id
     JOIN users u ON s.user_id = u.id
     ORDER BY cr.registered_at DESC LIMIT 5`
  );

  // Monthly enrollment trend (last 6 months)
  const [enrollmentTrend] = await pool.query(
    `SELECT DATE_FORMAT(registered_at, '%Y-%m') as month, COUNT(*) as count
     FROM course_registrations
     WHERE registered_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
     GROUP BY month ORDER BY month ASC`
  );

  const statsObj = {
    totalStudents: totalStudents.count,
    totalLecturers: totalLecturers.count,
    totalCourses: totalCourses.count,
    totalDepartments: totalDepartments.count,
    totalProgrammes: totalProgrammes.count,
    totalFaculties: totalFaculties.count,
    totalRooms: totalRooms.count,
  };

  return successResponse(res, {
    stats: statsObj,
    ...statsObj, // also top-level for direct access
    studentsByDepartment: enrollmentByDept,
    enrollmentByDepartment: enrollmentByDept,
    recentRegistrations,
    enrollmentTrend,
  }, 'Admin dashboard retrieved.');
};

const getRegistrarDashboard = async (req, res) => {
  const [[pending]] = await pool.query(
    `SELECT COUNT(*) as count FROM course_registrations WHERE status = 'pending'`
  );
  const [[approved]] = await pool.query(
    `SELECT COUNT(*) as count FROM course_registrations WHERE status = 'approved'`
  );
  const [[rejected]] = await pool.query(
    `SELECT COUNT(*) as count FROM course_registrations WHERE status = 'rejected'`
  );

  const [recentRegistrations] = await pool.query(
    `SELECT cr.*, c.course_code, c.course_name, s.student_number,
            u.first_name, u.last_name, u.email
     FROM course_registrations cr
     JOIN courses c ON cr.course_id = c.id
     JOIN students s ON cr.student_id = s.id
     JOIN users u ON s.user_id = u.id
     ORDER BY cr.registered_at DESC LIMIT 10`
  );

  const [periodInfo] = await pool.query(
    `SELECT * FROM registration_periods WHERE is_open = 1 AND NOW() BETWEEN start_date AND end_date LIMIT 1`
  );

  const countsObj = {
    pending: pending.count,
    approved: approved.count,
    rejected: rejected.count,
    total: pending.count + approved.count + rejected.count,
  };

  return successResponse(res, {
    counts: countsObj,
    registrationCounts: countsObj,
    pendingCount: pending.count,
    approvedCount: approved.count,
    rejectedCount: rejected.count,
    recentRegistrations,
    pendingRegistrations: recentRegistrations.filter(r => r.status === 'pending'),
    activePeriod: periodInfo[0] || null,
  }, 'Registrar dashboard retrieved.');
};

module.exports = { getDashboard };
