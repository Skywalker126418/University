const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * GET /api/lecturers
 */
const getLecturers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', department_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR l.staff_id LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (department_id) {
      whereClause += ' AND l.department_id = ?';
      params.push(department_id);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM lecturers l JOIN users u ON l.user_id = u.id ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT l.*, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.is_active,
              d.department_name
       FROM lecturers l
       JOIN users u ON l.user_id = u.id
       LEFT JOIN departments d ON l.department_id = d.id
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return paginatedResponse(res, rows, countRows[0].total, page, limit, 'Lecturers retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lecturers/:id
 */
const getLecturerById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.*, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.is_active,
              d.department_name
       FROM lecturers l
       JOIN users u ON l.user_id = u.id
       LEFT JOIN departments d ON l.department_id = d.id
       WHERE l.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return errorResponse(res, 'Lecturer not found.', 404);
    return successResponse(res, rows[0], 'Lecturer retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lecturers/me
 */
const getMyProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.*, u.first_name, u.last_name, u.email, u.phone, u.avatar,
              d.department_name
       FROM lecturers l
       JOIN users u ON l.user_id = u.id
       LEFT JOIN departments d ON l.department_id = d.id
       WHERE l.user_id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return errorResponse(res, 'Lecturer profile not found.', 404);
    return successResponse(res, rows[0], 'Lecturer profile retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/lecturers
 */
const createLecturer = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { first_name, last_name, email, password, phone, department_id, specialization, qualification } = req.body;

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await conn.rollback();
      return errorResponse(res, 'Email already in use.', 409);
    }

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);

    const [userResult] = await conn.query(
      `INSERT INTO users (first_name, last_name, email, password, password_hash, role, phone, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'lecturer', ?, 1, NOW(), NOW())`,
      [first_name, last_name, email, hashed, hashed, phone || null]
    );

    const staffId = `LEC-${new Date().getFullYear()}-${String(userResult.insertId).padStart(4, '0')}`;

    const [lecResult] = await conn.query(
      `INSERT INTO lecturers (user_id, staff_id, department_id, specialization, qualification, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [userResult.insertId, staffId, department_id || null, specialization || null, qualification || null]
    );

    await conn.commit();

    const [rows] = await pool.query(
      `SELECT l.*, u.first_name, u.last_name, u.email, u.phone, d.department_name
       FROM lecturers l JOIN users u ON l.user_id = u.id
       LEFT JOIN departments d ON l.department_id = d.id
       WHERE l.id = ?`,
      [lecResult.insertId]
    );

    return successResponse(res, rows[0], 'Lecturer created successfully.', 201);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * PUT /api/lecturers/:id
 */
const updateLecturer = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, department_id, specialization, qualification } = req.body;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, user_id FROM lecturers WHERE id = ?', [id]);
    if (existing.length === 0) return errorResponse(res, 'Lecturer not found.', 404);

    await pool.query(
      `UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name),
       phone = COALESCE(?, phone), updated_at = NOW() WHERE id = ?`,
      [first_name, last_name, phone, existing[0].user_id]
    );

    await pool.query(
      `UPDATE lecturers SET
        department_id  = COALESCE(?, department_id),
        specialization = COALESCE(?, specialization),
        qualification  = COALESCE(?, qualification),
        updated_at     = NOW()
       WHERE id = ?`,
      [department_id, specialization, qualification, id]
    );

    const [rows] = await pool.query(
      `SELECT l.*, u.first_name, u.last_name, u.email, u.phone, d.department_name
       FROM lecturers l JOIN users u ON l.user_id = u.id
       LEFT JOIN departments d ON l.department_id = d.id WHERE l.id = ?`,
      [id]
    );
    return successResponse(res, rows[0], 'Lecturer updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/lecturers/:id - Soft delete
 */
const deleteLecturer = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id, user_id FROM lecturers WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return errorResponse(res, 'Lecturer not found.', 404);

    await pool.query('UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?', [existing[0].user_id]);
    return successResponse(res, null, 'Lecturer deactivated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lecturers/:id/courses
 */
const getLecturerCourses = async (req, res, next) => {
  try {
    const lecturerId = req.params.id || null;
    let lecId = lecturerId;

    if (!lecId) {
      const [lec] = await pool.query('SELECT id FROM lecturers WHERE user_id = ?', [req.user.id]);
      if (lec.length === 0) return errorResponse(res, 'Lecturer profile not found.', 404);
      lecId = lec[0].id;
    }

    const [rows] = await pool.query(
      `SELECT c.*, ca.academic_year, ca.semester, ca.section,
              d.department_name
       FROM course_assignments ca
       JOIN courses c ON ca.course_id = c.id
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE ca.lecturer_id = ? AND ca.is_active = 1`,
      [lecId]
    );
    return successResponse(res, rows, 'Lecturer courses retrieved.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getLecturers, getLecturerById, getMyProfile, createLecturer, updateLecturer, deleteLecturer, getLecturerCourses };
