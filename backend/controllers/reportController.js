const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * GET /api/reports/enrollment
 */
const getEnrollmentReport = async (req, res, next) => {
  try {
    const [byDept] = await pool.query(`
      SELECT d.id, d.department_name, d.department_code, COUNT(s.id) as student_count
      FROM departments d
      LEFT JOIN students s ON s.department_id = d.id AND s.status = 'active'
      GROUP BY d.id, d.department_name, d.department_code
      ORDER BY student_count DESC
    `);

    const [byProg] = await pool.query(`
      SELECT p.id, p.programme_name, p.programme_code, d.department_name, COUNT(s.id) as student_count
      FROM programmes p
      JOIN departments d ON p.department_id = d.id
      LEFT JOIN students s ON s.programme_id = p.id AND s.status = 'active'
      GROUP BY p.id, p.programme_name, p.programme_code, d.department_name
      ORDER BY student_count DESC
    `);

    const [byYear] = await pool.query(`
      SELECT year_of_study, COUNT(*) as count
      FROM students
      WHERE status = 'active'
      GROUP BY year_of_study
      ORDER BY year_of_study ASC
    `);

    const [totalStudents] = await pool.query(`SELECT COUNT(*) as count FROM students WHERE status = 'active'`);

    return successResponse(res, {
      totalStudents: totalStudents[0].count,
      byDepartment: byDept,
      byProgramme: byProg,
      byYear: byYear,
    }, 'Enrollment report generated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/results
 */
const getResultsReport = async (req, res, next) => {
  try {
    const { course_id, academic_year = '2025/2026', semester = 1 } = req.query;

    let where = 'WHERE r.academic_year = ? AND r.semester = ?';
    const params = [academic_year, semester];

    if (course_id) {
      where += ' AND r.course_id = ?';
      params.push(course_id);
    }

    const [gradeDist] = await pool.query(`
      SELECT r.grade, COUNT(*) as count
      FROM results r
      ${where}
      GROUP BY r.grade
      ORDER BY FIELD(r.grade, 'A+','A','A-','B+','B','B-','C+','C','C-','D','F')
    `, params);

    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_entries,
        AVG(r.mark) as average_mark,
        MIN(r.mark) as min_mark,
        MAX(r.mark) as max_mark,
        AVG(r.grade_point) as average_gpa
      FROM results r
      ${where}
    `, params);

    const [byCourse] = await pool.query(`
      SELECT c.course_code, c.course_name, COUNT(r.id) as students_count,
             AVG(r.mark) as avg_mark,
             SUM(CASE WHEN r.grade != 'F' THEN 1 ELSE 0 END) / COUNT(r.id) * 100 as pass_rate
      FROM courses c
      JOIN results r ON r.course_id = c.id
      ${where}
      GROUP BY c.id, c.course_code, c.course_name
    `, params);

    return successResponse(res, {
      summary: stats[0],
      gradeDistribution: gradeDist,
      courseStats: byCourse,
    }, 'Results report generated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/registrations
 */
const getRegistrationReport = async (req, res, next) => {
  try {
    const { academic_year = '2025/2026', semester = 1 } = req.query;

    const [statusBreakdown] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM course_registrations
      WHERE academic_year = ? AND semester = ?
      GROUP BY status
    `, [academic_year, semester]);

    const [topCourses] = await pool.query(`
      SELECT c.course_code, c.course_name, COUNT(cr.id) as enrolled_count, c.max_students
      FROM courses c
      LEFT JOIN course_registrations cr ON cr.course_id = c.id AND cr.academic_year = ? AND cr.semester = ? AND cr.status = 'approved'
      GROUP BY c.id, c.course_code, c.course_name, c.max_students
      ORDER BY enrolled_count DESC
    `, [academic_year, semester]);

    return successResponse(res, {
      statusBreakdown,
      topCourses,
    }, 'Registration report generated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/:type/export
 */
const exportReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    let csvData = '';
    let filename = `${type}_report_${Date.now()}.csv`;

    if (type === 'enrollment') {
      const [rows] = await pool.query(`
        SELECT s.student_number, u.first_name, u.last_name, u.email, p.programme_name, d.department_name, s.year_of_study, s.status
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN programmes p ON s.programme_id = p.id
        LEFT JOIN departments d ON s.department_id = d.id
        ORDER BY s.student_number ASC
      `);
      csvData = 'Student ID,First Name,Last Name,Email,Programme,Department,Year,Status\n';
      rows.forEach(r => {
        csvData += `"${r.student_number}","${r.first_name}","${r.last_name}","${r.email}","${r.programme_name}","${r.department_name}",${r.year_of_study},"${r.status}"\n`;
      });
    } else if (type === 'results') {
      const [rows] = await pool.query(`
        SELECT s.student_number, u.first_name, u.last_name, c.course_code, c.course_name, r.mark, r.grade, r.grade_point, r.academic_year, r.semester
        FROM results r
        JOIN students s ON r.student_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN courses c ON r.course_id = c.id
        ORDER BY c.course_code, s.student_number
      `);
      csvData = 'Student ID,Student Name,Course Code,Course Name,Mark,Grade,GPA Points,Academic Year,Semester\n';
      rows.forEach(r => {
        csvData += `"${r.student_number}","${r.first_name} ${r.last_name}","${r.course_code}","${r.course_name}",${r.mark},"${r.grade}",${r.grade_point},"${r.academic_year}",${r.semester}\n`;
      });
    } else {
      const [rows] = await pool.query(`
        SELECT cr.id, s.student_number, u.first_name, u.last_name, c.course_code, c.course_name, cr.status, cr.academic_year, cr.semester, cr.registered_at
        FROM course_registrations cr
        JOIN students s ON cr.student_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN courses c ON cr.course_id = c.id
      `);
      csvData = 'Registration ID,Student ID,Student Name,Course Code,Course Name,Status,Academic Year,Semester,Date\n';
      rows.forEach(r => {
        csvData += `"${r.id}","${r.student_number}","${r.first_name} ${r.last_name}","${r.course_code}","${r.course_name}","${r.status}","${r.academic_year}",${r.semester},"${r.registered_at}"\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvData);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEnrollmentReport,
  getResultsReport,
  getRegistrationReport,
  exportReport,
};
