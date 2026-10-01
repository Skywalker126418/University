const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * GET /api/academic-years
 * Returns list of academic years with semesters count
 */
const getAcademicYears = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT ay.*,
        (SELECT COUNT(*) FROM semesters s WHERE s.academic_year_id = ay.id) as semester_count
      FROM academic_years ay
      ORDER BY ay.year_label DESC
    `);

    return successResponse(res, rows, 'Academic years retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/academic-years/:id
 * Returns a single academic year with its semesters
 */
const getAcademicYearById = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM academic_years WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return errorResponse(res, 'Academic year not found.', 404);

    const [semesters] = await pool.query(
      'SELECT * FROM semesters WHERE academic_year_id = ? ORDER BY name ASC',
      [req.params.id]
    );

    return successResponse(res, { ...rows[0], semesters }, 'Academic year details retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/academic-years
 * Creates a new academic year
 */
const createAcademicYear = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { year_label, start_date, end_date, is_current } = req.body;

    if (!year_label || !start_date || !end_date) {
      await conn.rollback();
      return errorResponse(res, 'Year label, start date, and end date are required.', 400);
    }

    // Check duplicate year_label
    const [existing] = await conn.query('SELECT id FROM academic_years WHERE year_label = ?', [year_label]);
    if (existing.length > 0) {
      await conn.rollback();
      return errorResponse(res, `Academic year "${year_label}" already exists.`, 409);
    }

    const isCurrent = is_current ? 1 : 0;
    if (isCurrent === 1) {
      await conn.query('UPDATE academic_years SET is_current = 0');
    }

    const [result] = await conn.query(
      `INSERT INTO academic_years (year_label, start_date, end_date, is_current, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [year_label, start_date, end_date, isCurrent]
    );

    const [created] = await conn.query('SELECT * FROM academic_years WHERE id = ?', [result.insertId]);

    await conn.commit();
    return successResponse(res, created[0], 'Academic year created successfully.', 201);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * PUT /api/academic-years/:id
 * Updates an academic year
 */
const updateAcademicYear = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { year_label, start_date, end_date, is_current } = req.body;
    const { id } = req.params;

    const [existing] = await conn.query('SELECT id FROM academic_years WHERE id = ?', [id]);
    if (existing.length === 0) {
      await conn.rollback();
      return errorResponse(res, 'Academic year not found.', 404);
    }

    if (is_current === 1 || is_current === true) {
      await conn.query('UPDATE academic_years SET is_current = 0');
    }

    await conn.query(
      `UPDATE academic_years SET
         year_label = COALESCE(?, year_label),
         start_date = COALESCE(?, start_date),
         end_date = COALESCE(?, end_date),
         is_current = COALESCE(?, is_current)
       WHERE id = ?`,
      [year_label, start_date, end_date, is_current !== undefined ? (is_current ? 1 : 0) : null, id]
    );

    const [updated] = await conn.query('SELECT * FROM academic_years WHERE id = ?', [id]);

    await conn.commit();
    return successResponse(res, updated[0], 'Academic year updated successfully.');
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * PUT /api/academic-years/:id/set-current
 * Quickly activates an academic year as the current one
 */
const setCurrentAcademicYear = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const [existing] = await conn.query('SELECT * FROM academic_years WHERE id = ?', [id]);
    if (existing.length === 0) {
      await conn.rollback();
      return errorResponse(res, 'Academic year not found.', 404);
    }

    await conn.query('UPDATE academic_years SET is_current = 0');
    await conn.query('UPDATE academic_years SET is_current = 1 WHERE id = ?', [id]);

    const [updated] = await conn.query('SELECT * FROM academic_years WHERE id = ?', [id]);

    await conn.commit();
    return successResponse(res, updated[0], `Academic year ${existing[0].year_label} is now active.`);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * DELETE /api/academic-years/:id
 * Deletes an academic year and its semesters
 */
const deleteAcademicYear = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const [existing] = await conn.query('SELECT id, year_label FROM academic_years WHERE id = ?', [id]);
    if (existing.length === 0) {
      await conn.rollback();
      return errorResponse(res, 'Academic year not found.', 404);
    }

    // Delete associated semesters first
    await conn.query('DELETE FROM semesters WHERE academic_year_id = ?', [id]);
    await conn.query('DELETE FROM academic_years WHERE id = ?', [id]);

    await conn.commit();
    return successResponse(res, null, `Academic year "${existing[0].year_label}" deleted successfully.`);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

module.exports = {
  getAcademicYears,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  setCurrentAcademicYear,
  deleteAcademicYear,
};
