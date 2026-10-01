const pool = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * GET /api/programmes
 */
const getProgrammes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', department_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (p.programme_name LIKE ? OR p.programme_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (department_id) {
      whereClause += ' AND p.department_id = ?';
      params.push(department_id);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM programmes p ${whereClause}`, params
    );

    const [rows] = await pool.query(
      `SELECT p.*, d.department_name,
        (SELECT COUNT(*) FROM students s WHERE s.programme_id = p.id AND s.status = 'active') as student_count
       FROM programmes p
       LEFT JOIN departments d ON p.department_id = d.id
       ${whereClause}
       ORDER BY p.programme_name ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return paginatedResponse(res, rows, countRows[0].total, page, limit, 'Programmes retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/programmes/:id
 */
const getProgrammeById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, d.department_name,
        (SELECT COUNT(*) FROM students s WHERE s.programme_id = p.id) as student_count
       FROM programmes p
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return errorResponse(res, 'Programme not found.', 404);
    return successResponse(res, rows[0], 'Programme retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/programmes
 */
const createProgramme = async (req, res, next) => {
  try {
    const { programme_name, programme_code, department_id, duration_years, description, degree_type } = req.body;

    if (!programme_name) return errorResponse(res, 'Programme name is required.', 400);

    const [result] = await pool.query(
      `INSERT INTO programmes (programme_name, programme_code, department_id, duration_years, description, degree_type, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [programme_name, programme_code || null, department_id || null, duration_years || 3, description || null, degree_type || 'Bachelor']
    );

    const [rows] = await pool.query(
      `SELECT p.*, d.department_name FROM programmes p LEFT JOIN departments d ON p.department_id = d.id WHERE p.id = ?`,
      [result.insertId]
    );
    return successResponse(res, rows[0], 'Programme created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/programmes/:id
 */
const updateProgramme = async (req, res, next) => {
  try {
    const { programme_name, programme_code, department_id, duration_years, description, degree_type, is_active } = req.body;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM programmes WHERE id = ?', [id]);
    if (existing.length === 0) return errorResponse(res, 'Programme not found.', 404);

    await pool.query(
      `UPDATE programmes SET
        programme_name = COALESCE(?, programme_name),
        programme_code = COALESCE(?, programme_code),
        department_id  = COALESCE(?, department_id),
        duration_years = COALESCE(?, duration_years),
        description    = COALESCE(?, description),
        degree_type    = COALESCE(?, degree_type),
        is_active      = COALESCE(?, is_active),
        updated_at     = NOW()
       WHERE id = ?`,
      [programme_name, programme_code, department_id, duration_years, description, degree_type, is_active, id]
    );

    const [rows] = await pool.query(
      `SELECT p.*, d.department_name FROM programmes p LEFT JOIN departments d ON p.department_id = d.id WHERE p.id = ?`,
      [id]
    );
    return successResponse(res, rows[0], 'Programme updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/programmes/:id
 */
const deleteProgramme = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id FROM programmes WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return errorResponse(res, 'Programme not found.', 404);

    await pool.query('UPDATE programmes SET is_active = 0, updated_at = NOW() WHERE id = ?', [req.params.id]);
    return successResponse(res, null, 'Programme deactivated successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getProgrammes, getProgrammeById, createProgramme, updateProgramme, deleteProgramme };
