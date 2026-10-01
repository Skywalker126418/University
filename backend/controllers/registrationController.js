const pool = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * GET /api/registrations
 * Admin/Registrar sees all; Student sees their own
 */
const getRegistrations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, academic_year, semester, student_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // Students can only see their own registrations
    if (req.user.role === 'student') {
      const [student] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (student.length === 0) return errorResponse(res, 'Student profile not found.', 404);
      whereClause += ' AND cr.student_id = ?';
      params.push(student[0].id);
    } else if (student_id) {
      whereClause += ' AND cr.student_id = ?';
      params.push(student_id);
    }

    if (status)        { whereClause += ' AND cr.status = ?'; params.push(status); }
    if (academic_year) { whereClause += ' AND cr.academic_year = ?'; params.push(academic_year); }
    if (semester)      { whereClause += ' AND cr.semester = ?'; params.push(semester); }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM course_registrations cr ${whereClause}`, params
    );

    const [rows] = await pool.query(
      `SELECT cr.*, c.course_code, c.course_name, c.credits,
              s.student_number, u.first_name, u.last_name, u.email
       FROM course_registrations cr
       JOIN courses c ON cr.course_id = c.id
       JOIN students s ON cr.student_id = s.id
       JOIN users u ON s.user_id = u.id
       ${whereClause}
       ORDER BY cr.registered_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return paginatedResponse(res, rows, countRows[0].total, page, limit, 'Registrations retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/registrations/:id
 */
const getRegistrationById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT cr.*, c.course_code, c.course_name, c.credits,
              s.student_number, u.first_name, u.last_name, u.email
       FROM course_registrations cr
       JOIN courses c ON cr.course_id = c.id
       JOIN students s ON cr.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE cr.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return errorResponse(res, 'Registration not found.', 404);

    // Students can only see their own
    if (req.user.role === 'student') {
      const [student] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (student.length === 0 || rows[0].student_id !== student[0].id) {
        return errorResponse(res, 'Access denied.', 403);
      }
    }

    return successResponse(res, rows[0], 'Registration retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/registrations - Student submits course registration
 */
const submitRegistration = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { course_ids, academic_year, semester } = req.body;

    if (!course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
      return errorResponse(res, 'At least one course ID is required.', 400);
    }

    // Get student record
    const [studentRows] = await conn.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (studentRows.length === 0) return errorResponse(res, 'Student profile not found.', 404);
    const studentId = studentRows[0].id;

    const acYear = academic_year || '2025/2026';
    const sem = parseInt(semester) || 1;

    // Check registration period is open
    const [periods] = await conn.query(
      `SELECT * FROM registration_periods 
       WHERE academic_year = ? AND semester = ? AND is_open = 1 
       AND (start_date IS NULL OR end_date IS NULL OR (NOW() >= start_date AND NOW() <= end_date))`,
      [acYear, sem]
    );
    if (periods.length === 0) {
      await conn.rollback();
      return errorResponse(res, 'Registration period is currently closed for this semester.', 403);
    }

    // Enforce Minimum (3) and Maximum (7) courses allowed per semester
    const [existingRows] = await conn.query(
      `SELECT COUNT(*) as total FROM course_registrations 
       WHERE student_id = ? AND academic_year = ? AND semester = ? AND status != 'rejected'`,
      [studentId, acYear, sem]
    );
    const existingCount = Number(existingRows[0]?.total || 0);
    const totalCount = existingCount + course_ids.length;

    if (existingCount === 0 && course_ids.length < 3) {
      await conn.rollback();
      return errorResponse(res, `You must register for a minimum of 3 courses per semester. You submitted ${course_ids.length}.`, 400);
    }
    if (totalCount < 3) {
      await conn.rollback();
      return errorResponse(res, `You must register for a minimum of 3 courses per semester. You currently have ${existingCount} registered course(s).`, 400);
    }
    if (totalCount > 7) {
      await conn.rollback();
      return errorResponse(res, `You cannot register for more than 7 courses per semester. You already have ${existingCount} registered course(s). You may add at most ${Math.max(0, 7 - existingCount)} more course(s).`, 400);
    }

    const results = [];
    const errors = [];

    for (const courseId of course_ids) {
      // Check if course exists
      const [course] = await conn.query('SELECT id, course_name FROM courses WHERE id = ? AND is_active = 1', [courseId]);
      if (course.length === 0) {
        errors.push({ courseId, error: 'Course not found or inactive.' });
        continue;
      }

      // Check duplicate registration
      const [dupCheck] = await conn.query(
        `SELECT id FROM course_registrations WHERE student_id = ? AND course_id = ? AND academic_year = ? AND semester = ?`,
        [studentId, courseId, acYear, sem]
      );
      if (dupCheck.length > 0) {
        errors.push({ courseId, error: 'Already registered for this course.' });
        continue;
      }

      const [regResult] = await conn.query(
        `INSERT INTO course_registrations (student_id, course_id, academic_year, semester, status, registered_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', NOW(), NOW(), NOW())`,
        [studentId, courseId, acYear, sem]
      );

      results.push({ id: regResult.insertId, courseId, status: 'pending' });
    }

    await conn.commit();

    return successResponse(res, { registered: results, errors }, 'Registration submitted successfully.', 201);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * PUT /api/registrations/:id/approve - Registrar approves
 */
const approveRegistration = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id, status FROM course_registrations WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return errorResponse(res, 'Registration not found.', 404);
    if (existing[0].status !== 'pending') {
      return errorResponse(res, `Cannot approve registration with status: ${existing[0].status}`, 400);
    }

    await pool.query(
      `UPDATE course_registrations 
       SET status = 'approved', 
           approved_by = ?, 
           reviewed_by = ?, 
           approved_at = NOW(), 
           reviewed_at = NOW(), 
           updated_at = NOW() 
       WHERE id = ?`,
      [req.user.id, req.user.id, req.params.id]
    );

    return successResponse(res, null, 'Registration approved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/registrations/:id/reject - Registrar rejects
 */
const rejectRegistration = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const [existing] = await pool.query('SELECT id, status FROM course_registrations WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return errorResponse(res, 'Registration not found.', 404);
    if (existing[0].status !== 'pending') {
      return errorResponse(res, `Cannot reject registration with status: ${existing[0].status}`, 400);
    }

    await pool.query(
      `UPDATE course_registrations 
       SET status = 'rejected', 
           rejection_reason = ?, 
           approved_by = ?, 
           reviewed_by = ?, 
           approved_at = NOW(), 
           reviewed_at = NOW(), 
           updated_at = NOW() 
       WHERE id = ?`,
      [reason || null, req.user.id, req.user.id, req.params.id]
    );

    return successResponse(res, null, 'Registration rejected.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/registrations/:id - Student withdraws pending registration
 */
const withdrawRegistration = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id, status, student_id FROM course_registrations WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return errorResponse(res, 'Registration not found.', 404);

    if (req.user.role === 'student') {
      const [student] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (student.length === 0 || existing[0].student_id !== student[0].id) {
        return errorResponse(res, 'Access denied.', 403);
      }
    }

    if (existing[0].status === 'approved') {
      return errorResponse(res, 'Cannot withdraw an approved registration.', 400);
    }

    await pool.query('DELETE FROM course_registrations WHERE id = ?', [req.params.id]);
    return successResponse(res, null, 'Registration withdrawn.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/registrations/periods - List registration periods
 */
const getRegistrationPeriods = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM registration_periods ORDER BY start_date DESC');
    return successResponse(res, rows, 'Registration periods retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/registrations/periods/status - Check if registration is open
 */
const getPeriodStatus = async (req, res, next) => {
  try {
    const academic_year = req.query.academic_year || '2025/2026';
    const semester = parseInt(req.query.semester) || 1;

    const [rows] = await pool.query(
      `SELECT * FROM registration_periods 
       WHERE academic_year = ? AND semester = ?
       ORDER BY updated_at DESC, id DESC LIMIT 1`,
      [academic_year, semester]
    );

    if (rows.length === 0) {
      return successResponse(res, {
        is_open: false,
        academic_year,
        semester,
        period: null,
        message: 'Registration period has not been opened yet.',
      }, 'Registration status retrieved.');
    }

    const period = rows[0];
    const now = new Date();
    const startDate = period.start_date ? new Date(period.start_date) : null;
    const endDate = period.end_date ? new Date(period.end_date) : null;

    const isOpenByFlag = Boolean(period.is_open);
    const isInDateRange = (!startDate || now >= startDate) && (!endDate || now <= endDate);
    const isOpen = isOpenByFlag && isInDateRange;

    return successResponse(res, {
      is_open: isOpen,
      academic_year,
      semester,
      period,
      message: isOpen ? 'Registration is open.' : 'Registration is closed.',
    }, 'Registration status retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/registrations/periods/toggle - Quick toggle open/close
 */
const toggleRegistrationPeriod = async (req, res, next) => {
  try {
    const { academic_year = '2025/2026', semester = 1, is_open, start_date, end_date } = req.body;

    const targetOpen = is_open ? 1 : 0;
    const acYear = academic_year || '2025/2026';
    const sem = parseInt(semester) || 1;

    const [existing] = await pool.query(
      'SELECT id FROM registration_periods WHERE academic_year = ? AND semester = ?',
      [acYear, sem]
    );

    if (existing.length > 0) {
      if (targetOpen === 1) {
        await pool.query(
          `UPDATE registration_periods 
           SET is_open = 1,
               start_date = COALESCE(?, NOW()),
               end_date = COALESCE(?, DATE_ADD(NOW(), INTERVAL 90 DAY)),
               updated_at = NOW()
           WHERE id = ?`,
          [start_date || null, end_date || null, existing[0].id]
        );
      } else {
        await pool.query(
          `UPDATE registration_periods SET is_open = 0, updated_at = NOW() WHERE id = ?`,
          [existing[0].id]
        );
      }
    } else {
      await pool.query(
        `INSERT INTO registration_periods (academic_year, semester, start_date, end_date, is_open, created_at, updated_at)
         VALUES (?, ?, COALESCE(?, NOW()), COALESCE(?, DATE_ADD(NOW(), INTERVAL 90 DAY)), ?, NOW(), NOW())`,
        [acYear, sem, start_date || null, end_date || null, targetOpen]
      );
    }

    const [updated] = await pool.query(
      'SELECT * FROM registration_periods WHERE academic_year = ? AND semester = ?',
      [acYear, sem]
    );

    return successResponse(res, {
      is_open: Boolean(targetOpen),
      period: updated[0] || null,
    }, targetOpen ? 'Registration period opened successfully.' : 'Registration period closed.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/registrations/periods - Create/update registration period
 */
const upsertRegistrationPeriod = async (req, res, next) => {
  try {
    const { academic_year, semester, start_date, end_date, is_open } = req.body;

    if (!academic_year || !semester) return errorResponse(res, 'Academic year and semester are required.', 400);

    const [existing] = await pool.query(
      'SELECT id FROM registration_periods WHERE academic_year = ? AND semester = ?',
      [academic_year, semester]
    );

    if (existing.length > 0) {
      await pool.query(
        `UPDATE registration_periods SET start_date = ?, end_date = ?, is_open = ?, updated_at = NOW() WHERE id = ?`,
        [start_date, end_date, is_open !== undefined ? is_open : 1, existing[0].id]
      );
      return successResponse(res, null, 'Registration period updated.');
    } else {
      const [result] = await pool.query(
        `INSERT INTO registration_periods (academic_year, semester, start_date, end_date, is_open, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [academic_year, semester, start_date, end_date, is_open !== undefined ? is_open : 1]
      );
      return successResponse(res, { id: result.insertId }, 'Registration period created.', 201);
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRegistrations, getRegistrationById, submitRegistration,
  approveRegistration, rejectRegistration, withdrawRegistration,
  getRegistrationPeriods, getPeriodStatus, toggleRegistrationPeriod, upsertRegistrationPeriod,
};

