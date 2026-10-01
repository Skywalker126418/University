const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * GET /api/timetable
 * Returns timetable filtered by role or query
 */
const getTimetable = async (req, res, next) => {
  try {
    const { academic_year, semester, day_of_week, room_id } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (req.user.role === 'student') {
      const [student] = await pool.query('SELECT id, preferred_room_id FROM students WHERE user_id = ?', [req.user.id]);
      if (student.length === 0) return errorResponse(res, 'Student profile not found.', 404);

      whereClause += `
        AND (
          ca.course_id IN (
            SELECT course_id FROM course_registrations
            WHERE student_id = ? AND status = 'approved'
            ${academic_year ? 'AND academic_year = ?' : ''}
            ${semester ? 'AND semester = ?' : ''}
          )
          OR tt.room_id = ?
        )`;
      params.push(student[0].id);
      if (academic_year) params.push(academic_year);
      if (semester) params.push(semester);
      params.push(student[0].preferred_room_id || 0);
    } else if (req.user.role === 'lecturer') {
      const [lec] = await pool.query('SELECT id FROM lecturers WHERE user_id = ?', [req.user.id]);
      if (lec.length === 0) return errorResponse(res, 'Lecturer profile not found.', 404);

      whereClause += ' AND ca.lecturer_id = ?';
      params.push(lec[0].id);
      if (academic_year) { whereClause += ' AND ca.academic_year = ?'; params.push(academic_year); }
      if (semester)      { whereClause += ' AND ca.semester = ?'; params.push(semester); }
    } else {
      if (academic_year) { whereClause += ' AND ca.academic_year = ?'; params.push(academic_year); }
      if (semester)      { whereClause += ' AND ca.semester = ?'; params.push(semester); }
    }

    if (day_of_week) {
      whereClause += ' AND tt.day_of_week = ?';
      params.push(day_of_week);
    }

    if (room_id) {
      whereClause += ' AND tt.room_id = ?';
      params.push(room_id);
    }

    const [rows] = await pool.query(
      `SELECT tt.*, c.course_code, c.course_name, c.credits,
              CONCAT(u.first_name, ' ', u.last_name) as lecturer_name,
              ca.section, ca.academic_year, ca.semester,
              COALESCE(r.room_number, tt.room) as room_number,
              r.building as building,
              r.capacity as room_capacity,
              r.room_type
       FROM timetable tt
       JOIN course_assignments ca ON tt.assignment_id = ca.id
       JOIN courses c ON ca.course_id = c.id
       JOIN lecturers l ON ca.lecturer_id = l.id
       JOIN users u ON l.user_id = u.id
       LEFT JOIN rooms r ON tt.room_id = r.id
       ${whereClause}
       ORDER BY FIELD(tt.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
                tt.start_time ASC`,
      params
    );

    // Group by day
    const grouped = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(d => { grouped[d] = []; });
    rows.forEach(entry => {
      const day = entry.day_of_week;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(entry);
    });

    return successResponse(res, { timetable: rows, grouped }, 'Timetable retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/timetable - Create timetable entry
 */
const createTimetableEntry = async (req, res, next) => {
  try {
    let { assignment_id, course_id, lecturer_id, day_of_week, start_time, end_time, room_id, room, building } = req.body;

    if ((!assignment_id && (!course_id || !lecturer_id)) || !day_of_week || !start_time || !end_time) {
      return errorResponse(res, 'Course, lecturer, day of week, start time, and end time are required.', 400);
    }

    if (start_time >= end_time) {
      return errorResponse(res, 'Start time must be strictly before end time.', 400);
    }

    // If assignment_id is missing, auto-find or create in course_assignments
    if (!assignment_id && course_id && lecturer_id) {
      const [existingAsgn] = await pool.query(
        'SELECT id FROM course_assignments WHERE course_id = ? AND lecturer_id = ? LIMIT 1',
        [course_id, lecturer_id]
      );
      if (existingAsgn.length > 0) {
        assignment_id = existingAsgn[0].id;
      } else {
        const [newAsgn] = await pool.query(
          `INSERT INTO course_assignments (course_id, lecturer_id, section, is_active, assigned_at, created_at)
           VALUES (?, ?, 'A', 1, NOW(), NOW())`,
          [course_id, lecturer_id]
        );
        assignment_id = newAsgn.insertId;
      }
    }

    // Retrieve assignment info (including lecturer)
    const [asgn] = await pool.query(
      `SELECT ca.*, c.course_code, c.course_name, l.id as lecturer_id, CONCAT(u.first_name, ' ', u.last_name) as lecturer_name
       FROM course_assignments ca
       JOIN courses c ON ca.course_id = c.id
       JOIN lecturers l ON ca.lecturer_id = l.id
       JOIN users u ON l.user_id = u.id
       WHERE ca.id = ?`,
      [assignment_id]
    );

    if (asgn.length === 0) {
      return errorResponse(res, 'Course assignment not found.', 404);
    }

    const assignment = asgn[0];

    // 1. Resolve room details
    let resolvedRoomId = room_id || null;
    let roomIdentifier = room || null;
    let resolvedBuilding = building || null;

    if (resolvedRoomId) {
      const [roomData] = await pool.query('SELECT * FROM rooms WHERE id = ?', [resolvedRoomId]);
      if (roomData.length > 0) {
        roomIdentifier = roomData[0].room_number;
        resolvedBuilding = roomData[0].building;

        // Check room hours
        if (start_time < roomData[0].available_from || end_time > roomData[0].available_until) {
          return errorResponse(
            res,
            `Selected room ${roomData[0].room_number} is only available between ${roomData[0].available_from.slice(0,5)} and ${roomData[0].available_until.slice(0,5)}.`,
            400
          );
        }
      }
    } else if (roomIdentifier) {
      const [roomData] = await pool.query('SELECT * FROM rooms WHERE room_number = ?', [roomIdentifier]);
      if (roomData.length > 0) {
        resolvedRoomId = roomData[0].id;
        resolvedBuilding = roomData[0].building;
      }
    }

    // 2. Room Collision Check: Same room cannot be double-booked on same day with overlapping time
    if (resolvedRoomId || roomIdentifier) {
      const [roomConflicts] = await pool.query(
        `SELECT tt.id, tt.start_time, tt.end_time, c.course_code, c.course_name
         FROM timetable tt
         JOIN course_assignments ca ON tt.assignment_id = ca.id
         JOIN courses c ON ca.course_id = c.id
         WHERE (tt.room_id = ? OR tt.room = ?)
           AND tt.day_of_week = ?
           AND NOT (tt.end_time <= ? OR tt.start_time >= ?)`,
        [resolvedRoomId || 0, roomIdentifier || '', day_of_week, start_time, end_time]
      );

      if (roomConflicts.length > 0) {
        const conflict = roomConflicts[0];
        return errorResponse(
          res,
          `Room Collision: Room ${roomIdentifier} is already booked on ${day_of_week} for ${conflict.course_code} (${conflict.start_time} - ${conflict.end_time}).`,
          409
        );
      }
    }

    // 3. Lecturer Collision Check:
    // "hours of one subject for same lecturer in different rooms must not collapse to gether"
    const [lecturerConflicts] = await pool.query(
      `SELECT tt.id, tt.start_time, tt.end_time, tt.room, c.course_code, c.course_name
       FROM timetable tt
       JOIN course_assignments ca ON tt.assignment_id = ca.id
       JOIN courses c ON ca.course_id = c.id
       WHERE ca.lecturer_id = ?
         AND tt.day_of_week = ?
         AND NOT (tt.end_time <= ? OR tt.start_time >= ?)`,
      [assignment.lecturer_id, day_of_week, start_time, end_time]
    );

    if (lecturerConflicts.length > 0) {
      const conflict = lecturerConflicts[0];
      return errorResponse(
        res,
        `Lecturer Collision: Lecturer ${assignment.lecturer_name} already has a scheduled class for ${conflict.course_code} in Room ${conflict.room || 'TBA'} during ${conflict.start_time} - ${conflict.end_time}.`,
        409
      );
    }

    // Insert timetable entry
    const [result] = await pool.query(
      `INSERT INTO timetable (assignment_id, day_of_week, start_time, end_time, room, room_id, building, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [assignment_id, day_of_week, start_time, end_time, roomIdentifier, resolvedRoomId, resolvedBuilding]
    );

    const [rows] = await pool.query(
      `SELECT tt.*, r.room_number, r.building as r_building, r.capacity, c.course_code, c.course_name
       FROM timetable tt
       LEFT JOIN rooms r ON tt.room_id = r.id
       JOIN course_assignments ca ON tt.assignment_id = ca.id
       JOIN courses c ON ca.course_id = c.id
       WHERE tt.id = ?`,
      [result.insertId]
    );

    return successResponse(res, rows[0], 'Timetable schedule created successfully without any collision.', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/timetable/:id
 */
const updateTimetableEntry = async (req, res, next) => {
  try {
    const { day_of_week, start_time, end_time, room_id, room, building } = req.body;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM timetable WHERE id = ?', [id]);
    if (existing.length === 0) return errorResponse(res, 'Timetable entry not found.', 404);

    const current = existing[0];
    const newDay = day_of_week || current.day_of_week;
    const newStart = start_time || current.start_time;
    const newEnd = end_time || current.end_time;
    const newRoomId = room_id !== undefined ? room_id : current.room_id;
    let roomIdentifier = room !== undefined ? room : current.room;
    let resolvedBuilding = building !== undefined ? building : current.building;

    if (newStart >= newEnd) {
      return errorResponse(res, 'Start time must be strictly before end time.', 400);
    }

    if (newRoomId) {
      const [roomData] = await pool.query('SELECT * FROM rooms WHERE id = ?', [newRoomId]);
      if (roomData.length > 0) {
        roomIdentifier = roomData[0].room_number;
        resolvedBuilding = roomData[0].building;
      }
    }

    // Room collision check excluding this entry
    if (newRoomId || roomIdentifier) {
      const [roomConflicts] = await pool.query(
        `SELECT tt.id, tt.start_time, tt.end_time, c.course_code
         FROM timetable tt
         JOIN course_assignments ca ON tt.assignment_id = ca.id
         JOIN courses c ON ca.course_id = c.id
         WHERE (tt.room_id = ? OR tt.room = ?)
           AND tt.day_of_week = ?
           AND tt.id != ?
           AND NOT (tt.end_time <= ? OR tt.start_time >= ?)`,
        [newRoomId || 0, roomIdentifier || '', newDay, id, newStart, newEnd]
      );

      if (roomConflicts.length > 0) {
        return errorResponse(res, `Room ${roomIdentifier} is already booked during this time on ${newDay}.`, 409);
      }
    }

    // Lecturer collision check excluding this entry
    const [asgn] = await pool.query('SELECT lecturer_id FROM course_assignments WHERE id = ?', [current.assignment_id]);
    if (asgn.length > 0) {
      const [lecConflicts] = await pool.query(
        `SELECT tt.id, tt.start_time, tt.end_time, c.course_code
         FROM timetable tt
         JOIN course_assignments ca ON tt.assignment_id = ca.id
         JOIN courses c ON ca.course_id = c.id
         WHERE ca.lecturer_id = ?
           AND tt.day_of_week = ?
           AND tt.id != ?
           AND NOT (tt.end_time <= ? OR tt.start_time >= ?)`,
        [asgn[0].lecturer_id, newDay, id, newStart, newEnd]
      );

      if (lecConflicts.length > 0) {
        return errorResponse(res, 'Lecturer already has another class during this time.', 409);
      }
    }

    await pool.query(
      `UPDATE timetable SET
        day_of_week = ?,
        start_time  = ?,
        end_time    = ?,
        room        = ?,
        room_id     = ?,
        building    = ?
       WHERE id = ?`,
      [newDay, newStart, newEnd, roomIdentifier, newRoomId || null, resolvedBuilding || null, id]
    );

    const [rows] = await pool.query('SELECT * FROM timetable WHERE id = ?', [id]);
    return successResponse(res, rows[0], 'Timetable entry updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/timetable/:id
 */
const deleteTimetableEntry = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id FROM timetable WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return errorResponse(res, 'Timetable entry not found.', 404);

    await pool.query('DELETE FROM timetable WHERE id = ?', [req.params.id]);
    return successResponse(res, null, 'Timetable entry deleted.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry };
