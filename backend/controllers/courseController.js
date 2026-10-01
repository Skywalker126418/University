const pool = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * GET /api/courses
 */
const getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '', department_id, semester, level } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE c.is_active = 1';
    const params = [];

    if (search) {
      whereClause += ' AND (c.course_name LIKE ? OR c.course_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (department_id) { whereClause += ' AND c.department_id = ?'; params.push(department_id); }
    if (semester)      { whereClause += ' AND c.semester = ?'; params.push(semester); }
    if (level)         { whereClause += ' AND c.level = ?'; params.push(level); }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM courses c ${whereClause}`, params
    );

    const [rows] = await pool.query(
      `SELECT c.*, d.department_name,
        (SELECT CONCAT(u.first_name, ' ', u.last_name) FROM lecturers l JOIN users u ON l.user_id = u.id
         JOIN course_assignments ca ON ca.lecturer_id = l.id WHERE ca.course_id = c.id AND ca.is_active = 1 LIMIT 1) as lecturer_name,
        (SELECT ca.lecturer_id FROM course_assignments ca WHERE ca.course_id = c.id AND ca.is_active = 1 LIMIT 1) as lecturer_id
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
       ${whereClause}
       ORDER BY c.course_code ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return paginatedResponse(res, rows, countRows[0].total, page, limit, 'Courses retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/courses/:id
 */
const getCourseById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, d.department_name,
        (SELECT CONCAT(u.first_name, ' ', u.last_name) FROM lecturers l JOIN users u ON l.user_id = u.id
         JOIN course_assignments ca ON ca.lecturer_id = l.id WHERE ca.course_id = c.id AND ca.is_active = 1 LIMIT 1) as lecturer_name,
        (SELECT ca.lecturer_id FROM course_assignments ca WHERE ca.course_id = c.id AND ca.is_active = 1 LIMIT 1) as lecturer_id
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id WHERE c.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return errorResponse(res, 'Course not found.', 404);
    return successResponse(res, rows[0], 'Course retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/courses
 */
const createCourse = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      course_code,
      course_name,
      credits,
      department_id,
      semester,
      level,
      description,
      prerequisites,
      lecturer_id,
    } = req.body;

    const [result] = await conn.query(
      `INSERT INTO courses (course_code, course_name, credits, department_id, semester, level, description, prerequisites, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [course_code, course_name, credits, department_id || null, semester || 1, level || 100, description || null, prerequisites || null]
    );

    const newCourseId = result.insertId;

    // Assign lecturer if selected
    if (lecturer_id) {
      await conn.query(
        `INSERT INTO course_assignments (course_id, lecturer_id, academic_year, semester, section, is_active, assigned_at, created_at)
         VALUES (?, ?, '2025/2026', ?, 'A', 1, NOW(), NOW())`,
        [newCourseId, lecturer_id, semester || 1]
      );
    }

    await conn.commit();

    const [rows] = await pool.query(
      `SELECT c.*, d.department_name,
        (SELECT CONCAT(u.first_name, ' ', u.last_name) FROM lecturers l JOIN users u ON l.user_id = u.id
         JOIN course_assignments ca ON ca.lecturer_id = l.id WHERE ca.course_id = c.id AND ca.is_active = 1 LIMIT 1) as lecturer_name,
        (SELECT ca.lecturer_id FROM course_assignments ca WHERE ca.course_id = c.id AND ca.is_active = 1 LIMIT 1) as lecturer_id
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id WHERE c.id = ?`,
      [newCourseId]
    );
    return successResponse(res, rows[0], 'Course created successfully.', 201);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * PUT /api/courses/:id
 */
const updateCourse = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      course_code,
      course_name,
      credits,
      department_id,
      semester,
      level,
      description,
      is_active,
      lecturer_id,
    } = req.body;
    const { id } = req.params;

    const [existing] = await conn.query('SELECT id FROM courses WHERE id = ?', [id]);
    if (existing.length === 0) {
      await conn.rollback();
      return errorResponse(res, 'Course not found.', 404);
    }

    // Lecturers can only update courses assigned to them
    if (req.user.role === 'lecturer') {
      const [lec] = await conn.query('SELECT id FROM lecturers WHERE user_id = ?', [req.user.id]);
      if (!lec.length) { await conn.rollback(); return errorResponse(res, 'Lecturer profile not found.', 404); }
      const [assigned] = await conn.query(
        'SELECT id FROM course_assignments WHERE course_id = ? AND lecturer_id = ? AND is_active = 1',
        [id, lec[0].id]
      );
      if (!assigned.length) { await conn.rollback(); return errorResponse(res, 'You are not assigned to this course.', 403); }
    }


    await conn.query(
      `UPDATE courses SET
        course_code   = COALESCE(?, course_code),
        course_name   = COALESCE(?, course_name),
        credits       = COALESCE(?, credits),
        department_id = COALESCE(?, department_id),
        semester      = COALESCE(?, semester),
        level         = COALESCE(?, level),
        description   = COALESCE(?, description),
        is_active     = COALESCE(?, is_active),
        updated_at    = NOW()
       WHERE id = ?`,
      [course_code, course_name, credits, department_id, semester, level, description, is_active, id]
    );

    // Update lecturer assignment if provided
    if (lecturer_id !== undefined) {
      // Deactivate current assignments
      await conn.query('UPDATE course_assignments SET is_active = 0 WHERE course_id = ?', [id]);

      if (lecturer_id) {
        await conn.query(
          `INSERT INTO course_assignments (course_id, lecturer_id, academic_year, semester, section, is_active, assigned_at, created_at)
           VALUES (?, ?, '2025/2026', ?, 'A', 1, NOW(), NOW())`,
          [id, lecturer_id, semester || 1]
        );
      }
    }

    await conn.commit();

    const [rows] = await pool.query(
      `SELECT c.*, d.department_name,
        (SELECT CONCAT(u.first_name, ' ', u.last_name) FROM lecturers l JOIN users u ON l.user_id = u.id
         JOIN course_assignments ca ON ca.lecturer_id = l.id WHERE ca.course_id = c.id AND ca.is_active = 1 LIMIT 1) as lecturer_name,
        (SELECT ca.lecturer_id FROM course_assignments ca WHERE ca.course_id = c.id AND ca.is_active = 1 LIMIT 1) as lecturer_id
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id WHERE c.id = ?`,
      [id]
    );
    return successResponse(res, rows[0], 'Course updated successfully.');
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * DELETE /api/courses/:id
 */
const deleteCourse = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id FROM courses WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return errorResponse(res, 'Course not found.', 404);

    await pool.query('UPDATE courses SET is_active = 0, updated_at = NOW() WHERE id = ?', [req.params.id]);
    await pool.query('UPDATE course_assignments SET is_active = 0 WHERE course_id = ?', [req.params.id]);
    return successResponse(res, null, 'Course deactivated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/courses/:id/students - Students enrolled in a course
 */
const getCourseStudents = async (req, res, next) => {
  try {
    // Return all active students with their existing results for this course (if any)
    // Students may be enrolled directly without going through course_registrations
    const [rows] = await pool.query(
      `SELECT s.id as student_id, s.id, s.student_number, u.first_name, u.last_name, u.email,
              r.mark, r.grade, r.grade_point
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN results r ON r.student_id = s.id AND r.course_id = ?
       WHERE s.status = 'active'
       ORDER BY u.last_name ASC, u.first_name ASC`,
      [req.params.id]
    );

    return successResponse(res, rows, `${rows.length} students found.`);
  } catch (err) {
    next(err);
  }
};


/**
 * POST /api/courses/:id/assign-lecturer
 */
const assignLecturer = async (req, res, next) => {
  try {
    const { lecturer_id, academic_year, semester, section } = req.body;
    const course_id = req.params.id;

    if (!lecturer_id) return errorResponse(res, 'Lecturer ID is required.', 400);

    // Deactivate old assignment for same course
    await pool.query(
      `UPDATE course_assignments SET is_active = 0 WHERE course_id = ?`,
      [course_id]
    );

    const [result] = await pool.query(
      `INSERT INTO course_assignments (course_id, lecturer_id, academic_year, semester, section, is_active, assigned_at, created_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [course_id, lecturer_id, academic_year || '2025/2026', semester || 1, section || 'A']
    );

    return successResponse(res, { id: result.insertId }, 'Lecturer assigned to course.');
  } catch (err) {
    next(err);
  }
};

const getAvailableCourses = getCourses;
const getEnrolledStudents = getCourseStudents;

module.exports = { 
  getCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse, 
  getCourseStudents, 
  getEnrolledStudents,
  getAvailableCourses, 
  assignLecturer 
};
