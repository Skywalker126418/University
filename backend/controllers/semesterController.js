const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * GET /api/semesters
 * Query params: ?academic_year_id=
 */
const getSemesters = async (req, res, next) => {
  try {
    const { academic_year_id } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (academic_year_id) {
      whereClause += ' AND s.academic_year_id = ?';
      params.push(academic_year_id);
    }

    const [rows] = await pool.query(
      `SELECT s.*, ay.year_label
       FROM semesters s
       JOIN academic_years ay ON s.academic_year_id = ay.id
       ${whereClause}
       ORDER BY ay.year_label DESC, s.name ASC`,
      params
    );

    return successResponse(res, rows, 'Semesters retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/semesters/:id
 */
const getSemesterById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, ay.year_label
       FROM semesters s
       JOIN academic_years ay ON s.academic_year_id = ay.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) return errorResponse(res, 'Semester not found.', 404);
    return successResponse(res, rows[0], 'Semester retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/semesters
 * Creates a semester under an academic year
 */
const createSemester = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      academic_year_id,
      name,
      start_date,
      end_date,
      registration_start,
      registration_end,
      is_current,
    } = req.body;

    if (!academic_year_id || !name || !start_date || !end_date) {
      await conn.rollback();
      return errorResponse(res, 'academic_year_id, name, start_date, and end_date are required.', 400);
    }

    // Verify academic year exists
    const [yearRows] = await conn.query('SELECT * FROM academic_years WHERE id = ?', [academic_year_id]);
    if (yearRows.length === 0) {
      await conn.rollback();
      return errorResponse(res, 'Academic year not found.', 404);
    }
    const yearLabel = yearRows[0].year_label;

    // Check if this semester name already exists for this academic year
    const [dup] = await conn.query(
      'SELECT id FROM semesters WHERE academic_year_id = ? AND name = ?',
      [academic_year_id, name]
    );
    if (dup.length > 0) {
      await conn.rollback();
      return errorResponse(res, `${name} already exists for ${yearLabel}.`, 409);
    }

    const isCurrent = is_current ? 1 : 0;
    if (isCurrent === 1) {
      // Unset other current semesters
      await conn.query('UPDATE semesters SET is_current = 0 WHERE academic_year_id = ?', [academic_year_id]);
    }

    const [result] = await conn.query(
      `INSERT INTO semesters (academic_year_id, name, start_date, end_date, registration_start, registration_end, is_current, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        academic_year_id,
        name,
        start_date,
        end_date,
        registration_start || null,
        registration_end || null,
        isCurrent,
      ]
    );

    // Synchronize or create matching registration period
    const semNumber = name.includes('1') ? 1 : name.includes('2') ? 2 : 3;
    const regStart = registration_start || start_date;
    const regEnd = registration_end || end_date;

    const [existingPeriod] = await conn.query(
      'SELECT id FROM registration_periods WHERE academic_year = ? AND semester = ?',
      [yearLabel, semNumber]
    );

    if (existingPeriod.length === 0) {
      await conn.query(
        `INSERT INTO registration_periods (academic_year, semester, start_date, end_date, is_open, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
        [yearLabel, semNumber, `${regStart} 00:00:00`, `${regEnd} 23:59:59`]
      );
    }

    const [created] = await conn.query(
      `SELECT s.*, ay.year_label FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id WHERE s.id = ?`,
      [result.insertId]
    );

    await conn.commit();
    return successResponse(res, created[0], `${name} created successfully for ${yearLabel}.`, 201);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * PUT /api/semesters/:id
 */
const updateSemester = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      name,
      start_date,
      end_date,
      registration_start,
      registration_end,
      is_current,
    } = req.body;
    const { id } = req.params;

    const [existing] = await conn.query(
      'SELECT s.*, ay.year_label FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id WHERE s.id = ?',
      [id]
    );
    if (existing.length === 0) {
      await conn.rollback();
      return errorResponse(res, 'Semester not found.', 404);
    }

    const sem = existing[0];
    if (is_current === 1 || is_current === true) {
      await conn.query('UPDATE semesters SET is_current = 0 WHERE academic_year_id = ?', [sem.academic_year_id]);
    }

    await conn.query(
      `UPDATE semesters SET
         name = COALESCE(?, name),
         start_date = COALESCE(?, start_date),
         end_date = COALESCE(?, end_date),
         registration_start = COALESCE(?, registration_start),
         registration_end = COALESCE(?, registration_end),
         is_current = COALESCE(?, is_current)
       WHERE id = ?`,
      [
        name,
        start_date,
        end_date,
        registration_start,
        registration_end,
        is_current !== undefined ? (is_current ? 1 : 0) : null,
        id,
      ]
    );

    // Sync dates to registration_periods if provided
    const semNumber = (name || sem.name).includes('1') ? 1 : (name || sem.name).includes('2') ? 2 : 3;
    if (registration_start || registration_end) {
      await conn.query(
        `UPDATE registration_periods 
         SET start_date = COALESCE(?, start_date),
             end_date = COALESCE(?, end_date),
             updated_at = NOW()
         WHERE academic_year = ? AND semester = ?`,
        [
          registration_start ? `${registration_start} 00:00:00` : null,
          registration_end ? `${registration_end} 23:59:59` : null,
          sem.year_label,
          semNumber,
        ]
      );
    }

    const [updated] = await conn.query(
      `SELECT s.*, ay.year_label FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id WHERE s.id = ?`,
      [id]
    );

    await conn.commit();
    return successResponse(res, updated[0], 'Semester updated successfully.');
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * PUT /api/semesters/:id/set-current
 */
const setCurrentSemester = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const [existing] = await conn.query(
      'SELECT s.*, ay.year_label FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id WHERE s.id = ?',
      [id]
    );
    if (existing.length === 0) {
      await conn.rollback();
      return errorResponse(res, 'Semester not found.', 404);
    }

    const sem = existing[0];
    await conn.query('UPDATE semesters SET is_current = 0 WHERE academic_year_id = ?', [sem.academic_year_id]);
    await conn.query('UPDATE semesters SET is_current = 1 WHERE id = ?', [id]);

    const [updated] = await conn.query(
      'SELECT s.*, ay.year_label FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id WHERE s.id = ?',
      [id]
    );

    await conn.commit();
    return successResponse(res, updated[0], `${sem.name} is now the active semester.`);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * DELETE /api/semesters/:id
 */
const deleteSemester = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id, name FROM semesters WHERE id = ?', [id]);
    if (existing.length === 0) return errorResponse(res, 'Semester not found.', 404);

    await pool.query('DELETE FROM semesters WHERE id = ?', [id]);
    return successResponse(res, null, `${existing[0].name} deleted successfully.`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSemesters,
  getSemesterById,
  createSemester,
  updateSemester,
  setCurrentSemester,
  deleteSemester,
};
