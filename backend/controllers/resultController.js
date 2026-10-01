const pool = require('../config/database');
const { calculateGrade } = require('../utils/gradeCalculator');
const { calculateGPA } = require('../utils/gpaCalculator');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * GET /api/results
 * - Admin/Registrar: all results
 * - Lecturer: results for their courses
 * - Student: their own results
 */
const getResults = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, student_id, course_id, academic_year, semester } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (req.user.role === 'student') {
      const [student] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (student.length === 0) return errorResponse(res, 'Student profile not found.', 404);
      whereClause += ' AND r.student_id = ?';
      params.push(student[0].id);
    } else if (req.user.role === 'lecturer') {
      const [lec] = await pool.query('SELECT id FROM lecturers WHERE user_id = ?', [req.user.id]);
      if (lec.length === 0) return errorResponse(res, 'Lecturer profile not found.', 404);
      whereClause += ' AND ca.lecturer_id = ?';
      params.push(lec[0].id);
    } else {
      if (student_id) { whereClause += ' AND r.student_id = ?'; params.push(student_id); }
    }

    if (course_id)     { whereClause += ' AND r.course_id = ?'; params.push(course_id); }
    if (academic_year) { whereClause += ' AND r.academic_year = ?'; params.push(academic_year); }
    if (semester)      { whereClause += ' AND r.semester = ?'; params.push(semester); }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total
       FROM results r
       JOIN course_assignments ca ON ca.course_id = r.course_id
       ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT r.*, c.course_code, c.course_name, c.credits,
              s.student_number, u.first_name, u.last_name
       FROM results r
       JOIN courses c ON r.course_id = c.id
       JOIN students s ON r.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN course_assignments ca ON ca.course_id = r.course_id AND ca.is_active = 1
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return paginatedResponse(res, rows, countRows[0].total, page, limit, 'Results retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/results/my - Student's own results with GPA
 */
const getMyResults = async (req, res, next) => {
  try {
    const { academic_year, semester } = req.query;

    const [student] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (student.length === 0) return errorResponse(res, 'Student profile not found.', 404);

    let whereClause = 'WHERE r.student_id = ?';
    const params = [student[0].id];

    if (academic_year) { whereClause += ' AND r.academic_year = ?'; params.push(academic_year); }
    if (semester)      { whereClause += ' AND r.semester = ?'; params.push(semester); }

    const [rows] = await pool.query(
      `SELECT r.*, c.course_code, c.course_name, c.credits
       FROM results r
       JOIN courses c ON r.course_id = c.id
       ${whereClause}
       ORDER BY r.academic_year DESC, r.semester ASC`,
      params
    );

    const gpa = calculateGPA(rows.map(r => ({ gradePoint: r.grade_point, credits: r.credits })));
    const totalCredits = rows.reduce((sum, r) => sum + (parseFloat(r.credits) || 0), 0);

    return successResponse(res, { results: rows, gpa, totalCredits }, 'Results retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/results - Lecturer enters a single result
 */
const enterResult = async (req, res, next) => {
  try {
    const { student_id, course_id, mark, academic_year, semester } = req.body;

    // If lecturer, verify they teach this course
    if (req.user.role === 'lecturer') {
      const [lec] = await pool.query('SELECT id FROM lecturers WHERE user_id = ?', [req.user.id]);
      if (lec.length === 0) return errorResponse(res, 'Lecturer profile not found.', 404);

      const [assignment] = await pool.query(
        `SELECT id FROM course_assignments WHERE lecturer_id = ? AND course_id = ? AND is_active = 1`,
        [lec[0].id, course_id]
      );
      if (assignment.length === 0) return errorResponse(res, 'You are not assigned to this course.', 403);
    }

    const { grade, gradePoint } = calculateGrade(mark);

    // Upsert result
    const [existing] = await pool.query(
      `SELECT id FROM results WHERE student_id = ? AND course_id = ? AND academic_year = ? AND semester = ?`,
      [student_id, course_id, academic_year, semester]
    );

    let resultId;
    if (existing.length > 0) {
      await pool.query(
        `UPDATE results SET mark = ?, grade = ?, grade_point = ?, updated_at = NOW() WHERE id = ?`,
        [mark, grade, gradePoint, existing[0].id]
      );
      resultId = existing[0].id;
    } else {
      const [result] = await pool.query(
        `INSERT INTO results (student_id, course_id, mark, grade, grade_point, academic_year, semester, entered_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [student_id, course_id, mark, grade, gradePoint, academic_year, semester, req.user.id]
      );
      resultId = result.insertId;
    }

    const [rows] = await pool.query(
      `SELECT r.*, c.course_name, c.course_code, s.student_number, u.first_name, u.last_name
       FROM results r JOIN courses c ON r.course_id = c.id
       JOIN students s ON r.student_id = s.id JOIN users u ON s.user_id = u.id
       WHERE r.id = ?`,
      [resultId]
    );

    return successResponse(res, rows[0], 'Result saved successfully.', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/results/bulk - Lecturer enters bulk results for a course
 */
const enterBulkResults = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { course_id, academic_year, semester, results } = req.body;

    if (!results || !Array.isArray(results)) {
      return errorResponse(res, 'Results array is required.', 400);
    }

    // Verify lecturer assignment
    if (req.user.role === 'lecturer') {
      const [lec] = await conn.query('SELECT id FROM lecturers WHERE user_id = ?', [req.user.id]);
      if (lec.length === 0) return errorResponse(res, 'Lecturer profile not found.', 404);

      const [assignment] = await conn.query(
        `SELECT id FROM course_assignments WHERE lecturer_id = ? AND course_id = ? AND is_active = 1`,
        [lec[0].id, course_id]
      );
      if (assignment.length === 0) return errorResponse(res, 'You are not assigned to this course.', 403);
    }

    const acYear = academic_year || '2025/2026';
    const sem = semester || 1;

    const saved = [];
    for (const item of results) {
      let { student_id, mark } = item;
      if (isNaN(parseInt(student_id))) {
        const [st] = await conn.query('SELECT id FROM students WHERE student_number = ? OR student_id = ? LIMIT 1', [student_id, student_id]);
        if (st.length > 0) student_id = st[0].id;
      }
      student_id = parseInt(student_id);

      const { grade, gradePoint } = calculateGrade(mark);

      const [existing] = await conn.query(
        `SELECT id FROM results WHERE student_id = ? AND course_id = ? AND academic_year = ? AND semester = ?`,
        [student_id, course_id, acYear, sem]
      );

      if (existing.length > 0) {
        await conn.query(
          `UPDATE results SET mark = ?, grade = ?, grade_point = ?, updated_at = NOW() WHERE id = ?`,
          [mark, grade, gradePoint, existing[0].id]
        );
        saved.push({ student_id, resultId: existing[0].id, grade });
      } else {
        const [res2] = await conn.query(
          `INSERT INTO results (student_id, course_id, mark, grade, grade_point, academic_year, semester, entered_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [student_id, course_id, mark, grade, gradePoint, acYear, sem, req.user.id]
        );
        saved.push({ student_id, resultId: res2.insertId, grade });
      }
    }

    await conn.commit();
    return successResponse(res, { saved, count: saved.length }, `${saved.length} results saved.`, 201);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * PUT /api/results/:id
 */
const updateResult = async (req, res, next) => {
  try {
    const { mark } = req.body;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM results WHERE id = ?', [id]);
    if (existing.length === 0) return errorResponse(res, 'Result not found.', 404);

    const { grade, gradePoint } = calculateGrade(mark);

    await pool.query(
      `UPDATE results SET mark = ?, grade = ?, grade_point = ?, updated_at = NOW() WHERE id = ?`,
      [mark, grade, gradePoint, id]
    );

    const [rows] = await pool.query(
      `SELECT r.*, c.course_name FROM results r JOIN courses c ON r.course_id = c.id WHERE r.id = ?`, [id]
    );
    return successResponse(res, rows[0], 'Result updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/results/:id
 */
const deleteResult = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id FROM results WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return errorResponse(res, 'Result not found.', 404);

    await pool.query('DELETE FROM results WHERE id = ?', [req.params.id]);
    return successResponse(res, null, 'Result deleted.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getResults, getMyResults, enterResult, enterBulkResults, updateResult, deleteResult };
