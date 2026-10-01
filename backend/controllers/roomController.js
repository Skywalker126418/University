const pool = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * GET /api/rooms
 */
const getRooms = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '', room_type, day_of_week, start_time, end_time } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE r.is_active = 1';
    const params = [];

    if (search) {
      whereClause += ' AND (r.room_number LIKE ? OR r.building LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (room_type) {
      whereClause += ' AND r.room_type = ?';
      params.push(room_type);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM rooms r ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT r.*,
        (SELECT COUNT(*) FROM students s WHERE s.preferred_room_id = r.id AND s.status = 'active') as enrolled_students_count,
        (SELECT COUNT(*) FROM timetable tt WHERE tt.room_id = r.id) as scheduled_classes_count
       FROM rooms r
       ${whereClause}
       ORDER BY r.building ASC, r.room_number ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // If checking slot availability
    if (day_of_week && start_time && end_time) {
      for (const room of rows) {
        const [conflicts] = await pool.query(
          `SELECT id FROM timetable WHERE (room_id = ? OR room = ?) AND day_of_week = ?
           AND NOT (end_time <= ? OR start_time >= ?)`,
          [room.id, room.room_number, day_of_week, start_time, end_time]
        );
        room.is_available = conflicts.length === 0;
      }
    }

    return paginatedResponse(res, rows, countRows[0].total, page, limit, 'Rooms retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/rooms/:id
 */
const getRoomById = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return errorResponse(res, 'Room not found.', 404);

    // Fetch timetable sessions in this room
    const [schedule] = await pool.query(
      `SELECT tt.*, c.course_code, c.course_name, CONCAT(u.first_name, ' ', u.last_name) as lecturer_name
       FROM timetable tt
       LEFT JOIN course_assignments ca ON tt.assignment_id = ca.id
       LEFT JOIN courses c ON ca.course_id = c.id
       LEFT JOIN lecturers l ON ca.lecturer_id = l.id
       LEFT JOIN users u ON l.user_id = u.id
       WHERE tt.room_id = ? OR tt.room = ?
       ORDER BY FIELD(tt.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), tt.start_time ASC`,
      [req.params.id, rows[0].room_number]
    );

    const [enrolledStudents] = await pool.query(
      `SELECT s.id, s.student_number, u.first_name, u.last_name, u.email, p.programme_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN programmes p ON s.programme_id = p.id
       WHERE s.preferred_room_id = ? AND s.status = 'active'`,
      [req.params.id]
    );

    return successResponse(res, { ...rows[0], schedule, enrolledStudents }, 'Room details retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/rooms
 */
const createRoom = async (req, res, next) => {
  try {
    const { room_number, building, capacity, room_type, available_from, available_until } = req.body;

    if (!room_number) return errorResponse(res, 'Room number is required.', 400);
    if (!capacity || parseInt(capacity) <= 0) return errorResponse(res, 'Room capacity must be greater than 0.', 400);

    const [result] = await pool.query(
      `INSERT INTO rooms (room_number, building, capacity, room_type, available_from, available_until, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        room_number.trim(),
        building ? building.trim() : null,
        parseInt(capacity),
        room_type || 'lecture_hall',
        available_from || '07:00:00',
        available_until || '20:00:00'
      ]
    );

    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [result.insertId]);
    return successResponse(res, rows[0], 'Room created successfully.', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return errorResponse(res, 'Room number already exists. Please choose a unique room number.', 409);
    }
    next(err);
  }
};

/**
 * PUT /api/rooms/:id
 */
const updateRoom = async (req, res, next) => {
  try {
    const { room_number, building, capacity, room_type, available_from, available_until, is_active } = req.body;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM rooms WHERE id = ?', [id]);
    if (existing.length === 0) return errorResponse(res, 'Room not found.', 404);

    await pool.query(
      `UPDATE rooms SET
        room_number     = COALESCE(?, room_number),
        building        = COALESCE(?, building),
        capacity        = COALESCE(?, capacity),
        room_type       = COALESCE(?, room_type),
        available_from  = COALESCE(?, available_from),
        available_until = COALESCE(?, available_until),
        is_active       = COALESCE(?, is_active),
        updated_at      = NOW()
       WHERE id = ?`,
      [
        room_number ? room_number.trim() : null,
        building ? building.trim() : null,
        capacity ? parseInt(capacity) : null,
        room_type,
        available_from,
        available_until,
        is_active,
        id
      ]
    );

    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
    return successResponse(res, rows[0], 'Room updated successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return errorResponse(res, 'Room number already exists.', 409);
    }
    next(err);
  }
};

/**
 * DELETE /api/rooms/:id
 */
const deleteRoom = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id FROM rooms WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return errorResponse(res, 'Room not found.', 404);

    await pool.query('UPDATE rooms SET is_active = 0, updated_at = NOW() WHERE id = ?', [req.params.id]);
    return successResponse(res, null, 'Room deactivated successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getRooms, getRoomById, createRoom, updateRoom, deleteRoom };
