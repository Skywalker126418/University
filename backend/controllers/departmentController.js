const pool = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * GET /api/departments
 */
const getDepartments = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '', faculty_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (d.department_name LIKE ? OR d.department_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (faculty_id) {
      whereClause += ' AND d.faculty_id = ?';
      params.push(faculty_id);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM departments d ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT d.*, f.faculty_name, f.faculty_code,
        (SELECT COUNT(*) FROM programmes p WHERE p.department_id = d.id AND p.is_active = 1) as programme_count,
        (SELECT COUNT(*) FROM lecturers l WHERE l.department_id = d.id) as lecturer_count,
        (SELECT COUNT(*) FROM courses c WHERE c.department_id = d.id AND c.is_active = 1) as course_count
       FROM departments d
       LEFT JOIN faculties f ON d.faculty_id = f.id
       ${whereClause}
       ORDER BY f.faculty_name ASC, d.department_name ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return paginatedResponse(res, rows, countRows[0].total, page, limit, 'Departments retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/departments/:id
 */
const getDepartmentById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, f.faculty_name, f.faculty_code,
        (SELECT COUNT(*) FROM programmes p WHERE p.department_id = d.id) as programme_count,
        (SELECT COUNT(*) FROM lecturers l WHERE l.department_id = d.id) as lecturer_count,
        (SELECT COUNT(*) FROM courses c WHERE c.department_id = d.id) as course_count
       FROM departments d
       LEFT JOIN faculties f ON d.faculty_id = f.id
       WHERE d.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return errorResponse(res, 'Department not found.', 404);
    return successResponse(res, rows[0], 'Department retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/departments
 */
const createDepartment = async (req, res, next) => {
  try {
    const { faculty_id, department_name, department_code, description, head_of_department } = req.body;

    if (!department_name) return errorResponse(res, 'Department name is required.', 400);

    const [result] = await pool.query(
      `INSERT INTO departments (faculty_id, department_name, department_code, description, head_of_department, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [faculty_id || null, department_name, department_code || null, description || null, head_of_department || null]
    );

    const [rows] = await pool.query(
      `SELECT d.*, f.faculty_name FROM departments d LEFT JOIN faculties f ON d.faculty_id = f.id WHERE d.id = ?`,
      [result.insertId]
    );
    return successResponse(res, rows[0], 'Department created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/departments/:id
 */
const updateDepartment = async (req, res, next) => {
  try {
    const { faculty_id, department_name, department_code, description, head_of_department, is_active } = req.body;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM departments WHERE id = ?', [id]);
    if (existing.length === 0) return errorResponse(res, 'Department not found.', 404);

    await pool.query(
      `UPDATE departments SET
        faculty_id         = COALESCE(?, faculty_id),
        department_name    = COALESCE(?, department_name),
        department_code    = COALESCE(?, department_code),
        description        = COALESCE(?, description),
        head_of_department = COALESCE(?, head_of_department),
        is_active          = COALESCE(?, is_active),
        updated_at         = NOW()
       WHERE id = ?`,
      [faculty_id, department_name, department_code, description, head_of_department, is_active, id]
    );

    const [rows] = await pool.query(
      `SELECT d.*, f.faculty_name FROM departments d LEFT JOIN faculties f ON d.faculty_id = f.id WHERE d.id = ?`,
      [id]
    );
    return successResponse(res, rows[0], 'Department updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/departments/:id
 */
const deleteDepartment = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id FROM departments WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return errorResponse(res, 'Department not found.', 404);

    await pool.query('UPDATE departments SET is_active = 0, updated_at = NOW() WHERE id = ?', [req.params.id]);
    return successResponse(res, null, 'Department deactivated successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment };
