const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * GET /api/students
 */
const getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', programme_id, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR s.student_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (programme_id) {
      whereClause += ' AND s.programme_id = ?';
      params.push(programme_id);
    }
    if (status) {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM students s JOIN users u ON s.user_id = u.id ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.is_active,
              p.programme_name,
              COALESCE(d.department_name, pd.department_name) AS department_name,
              r.room_number, r.building
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN programmes p ON s.programme_id = p.id
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN departments pd ON p.department_id = pd.id
       LEFT JOIN rooms r ON s.preferred_room_id = r.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return paginatedResponse(res, rows, countRows[0].total, page, limit, 'Students retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/students/:id
 */
const getStudentById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.is_active,
              p.programme_name,
              COALESCE(d.department_name, pd.department_name) AS department_name,
              r.room_number, r.building
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN programmes p ON s.programme_id = p.id
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN departments pd ON p.department_id = pd.id
       LEFT JOIN rooms r ON s.preferred_room_id = r.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return errorResponse(res, 'Student not found.', 404);
    return successResponse(res, rows[0], 'Student retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/students/me - Student's own profile
 */
const getMyProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, u.email, u.phone, u.avatar,
              p.programme_name,
              COALESCE(d.department_name, pd.department_name) AS department_name,
              r.room_number, r.building
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN programmes p ON s.programme_id = p.id
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN departments pd ON p.department_id = pd.id
       LEFT JOIN rooms r ON s.preferred_room_id = r.id
       WHERE s.user_id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return errorResponse(res, 'Student profile not found.', 404);
    return successResponse(res, rows[0], 'Student profile retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/students
 */
const createStudent = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      date_of_birth,
      gender,
      programme_id,
      department_id,
      preferred_room_id,
      year_of_study,
      student_number,
      student_id,
      intake_year,
      address,
    } = req.body;

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await conn.rollback();
      return errorResponse(res, 'Email already in use.', 409);
    }

    // Check room capacity if a preferred room is selected
    if (preferred_room_id) {
      const [roomRows] = await conn.query('SELECT capacity, room_number FROM rooms WHERE id = ?', [preferred_room_id]);
      if (roomRows.length > 0 && roomRows[0].capacity > 0) {
        const [countResult] = await conn.query(
          'SELECT COUNT(*) as total FROM students WHERE preferred_room_id = ? AND status = "active"',
          [preferred_room_id]
        );
        if (countResult[0].total >= roomRows[0].capacity) {
          await conn.rollback();
          return errorResponse(
            res,
            `Selected room ${roomRows[0].room_number} has reached maximum capacity (${roomRows[0].capacity} students). Please pick another room.`,
            400
          );
        }
      }
    }

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);

    const [userResult] = await conn.query(
      `INSERT INTO users (first_name, last_name, email, password, password_hash, role, phone, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'student', ?, 1, NOW(), NOW())`,
      [first_name, last_name, email, hashed, hashed, phone || null]
    );

    // Format student number
    const currentYear = intake_year || new Date().getFullYear();
    const finalStudentNumber =
      (student_number && student_number.trim()) ||
      (student_id && student_id.trim()) ||
      `STU-${currentYear}-${String(userResult.insertId).padStart(5, '0')}`;

    const [studentResult] = await conn.query(
      `INSERT INTO students (
        user_id, student_number, student_id, programme_id, department_id,
        preferred_room_id, year_of_study, current_semester, enrollment_date,
        intake_year, date_of_birth, gender, phone, address, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURDATE(), ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [
        userResult.insertId,
        finalStudentNumber,
        finalStudentNumber,
        programme_id,
        department_id || null,
        preferred_room_id || null,
        year_of_study || 1,
        currentYear,
        date_of_birth || null,
        gender || 'other',
        phone || null,
        address || null,
      ]
    );

    await conn.commit();

    const [rows] = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, u.email, u.phone, p.programme_name,
              COALESCE(d.department_name, pd.department_name) AS department_name,
              r.room_number, r.building
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN programmes p ON s.programme_id = p.id
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN departments pd ON p.department_id = pd.id
       LEFT JOIN rooms r ON s.preferred_room_id = r.id
       WHERE s.id = ?`,
      [studentResult.insertId]
    );

    return successResponse(res, rows[0], 'Student created successfully.', 201);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * PUT /api/students/:id
 */
const updateStudent = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      date_of_birth,
      gender,
      address,
      programme_id,
      department_id,
      preferred_room_id,
      year_of_study,
      current_semester,
      status,
    } = req.body;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, user_id FROM students WHERE id = ?', [id]);
    if (existing.length === 0) return errorResponse(res, 'Student not found.', 404);

    const { user_id } = existing[0];

    await pool.query(
      `UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name),
       phone = COALESCE(?, phone), updated_at = NOW() WHERE id = ?`,
      [first_name, last_name, phone, user_id]
    );

    await pool.query(
      `UPDATE students SET
        date_of_birth     = COALESCE(?, date_of_birth),
        gender            = COALESCE(?, gender),
        address           = COALESCE(?, address),
        programme_id      = COALESCE(?, programme_id),
        department_id     = COALESCE(?, department_id),
        preferred_room_id = COALESCE(?, preferred_room_id),
        year_of_study     = COALESCE(?, year_of_study),
        current_semester  = COALESCE(?, current_semester),
        status            = COALESCE(?, status),
        phone             = COALESCE(?, phone),
        updated_at        = NOW()
       WHERE id = ?`,
      [
        date_of_birth,
        gender,
        address,
        programme_id,
        department_id,
        preferred_room_id,
        year_of_study,
        current_semester,
        status,
        phone,
        id,
      ]
    );

    const [rows] = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, u.email, u.phone, p.programme_name,
              COALESCE(d.department_name, pd.department_name) AS department_name,
              r.room_number, r.building
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN programmes p ON s.programme_id = p.id
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN departments pd ON p.department_id = pd.id
       LEFT JOIN rooms r ON s.preferred_room_id = r.id
       WHERE s.id = ?`,
      [id]
    );
    return successResponse(res, rows[0], 'Student updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/students/:id - Soft delete
 */
const deleteStudent = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id, user_id FROM students WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return errorResponse(res, 'Student not found.', 404);

    await pool.query('UPDATE students SET status = ?, updated_at = NOW() WHERE id = ?', ['inactive', req.params.id]);
    await pool.query('UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?', [existing[0].user_id]);

    return successResponse(res, null, 'Student deactivated successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getStudents, getStudentById, getMyProfile, createStudent, updateStudent, deleteStudent };
