const pool = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * GET /api/faculties
 */
const getFaculties = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (f.faculty_name LIKE ? OR f.faculty_code LIKE ? OR f.dean LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM faculties f ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT f.*,
        (SELECT COUNT(*) FROM departments d WHERE d.faculty_id = f.id AND d.is_active = 1) as department_count,
        (SELECT COUNT(DISTINCT p.id) FROM programmes p JOIN departments d ON p.department_id = d.id WHERE d.faculty_id = f.id AND p.is_active = 1) as programme_count
       FROM faculties f
       ${whereClause}
       ORDER BY f.faculty_name ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return paginatedResponse(res, rows, countRows[0].total, page, limit, 'Faculties retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/faculties/:id
 */
const getFacultyById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.*,
        (SELECT COUNT(*) FROM departments d WHERE d.faculty_id = f.id AND d.is_active = 1) as department_count
       FROM faculties f
       WHERE f.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return errorResponse(res, 'Faculty not found.', 404);

    const [departments] = await pool.query(
      `SELECT * FROM departments WHERE faculty_id = ? AND is_active = 1 ORDER BY department_name ASC`,
      [req.params.id]
    );

    return successResponse(res, { ...rows[0], departments }, 'Faculty retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/faculties
 */
const createFaculty = async (req, res, next) => {
  try {
    const { faculty_name, faculty_code, description, dean } = req.body;

    if (!faculty_name) return errorResponse(res, 'Faculty name is required.', 400);

    const [result] = await pool.query(
      `INSERT INTO faculties (faculty_name, faculty_code, description, dean, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [faculty_name, faculty_code || null, description || null, dean || null]
    );

    const [rows] = await pool.query('SELECT * FROM faculties WHERE id = ?', [result.insertId]);
    return successResponse(res, rows[0], 'Faculty created successfully.', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return errorResponse(res, 'Faculty code already exists. Please choose a unique code.', 409);
    }
    next(err);
  }
};

/**
 * PUT /api/faculties/:id
 */
const updateFaculty = async (req, res, next) => {
  try {
    const { faculty_name, faculty_code, description, dean, is_active } = req.body;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM faculties WHERE id = ?', [id]);
    if (existing.length === 0) return errorResponse(res, 'Faculty not found.', 404);

    await pool.query(
      `UPDATE faculties SET
        faculty_name = COALESCE(?, faculty_name),
        faculty_code = COALESCE(?, faculty_code),
        description  = COALESCE(?, description),
        dean         = COALESCE(?, dean),
        is_active    = COALESCE(?, is_active),
        updated_at   = NOW()
       WHERE id = ?`,
      [faculty_name, faculty_code, description, dean, is_active, id]
    );

    const [rows] = await pool.query('SELECT * FROM faculties WHERE id = ?', [id]);
    return successResponse(res, rows[0], 'Faculty updated successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return errorResponse(res, 'Faculty code already exists.', 409);
    }
    next(err);
  }
};

/**
 * DELETE /api/faculties/:id
 */
const deleteFaculty = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id FROM faculties WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return errorResponse(res, 'Faculty not found.', 404);

    // Unlink departments or soft-delete
    await pool.query('UPDATE faculties SET is_active = 0, updated_at = NOW() WHERE id = ?', [req.params.id]);
    return successResponse(res, null, 'Faculty deactivated successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getFaculties, getFacultyById, createFaculty, updateFaculty, deleteFaculty };
