const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * GET /api/notifications - Get current user's notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, is_read } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE n.user_id = ?';
    const params = [req.user.id];

    if (is_read !== undefined) {
      whereClause += ' AND n.is_read = ?';
      params.push(is_read === 'true' || is_read === '1' ? 1 : 0);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM notifications n ${whereClause}`, params
    );

    const [rows] = await pool.query(
      `SELECT * FROM notifications n ${whereClause}
       ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [unreadCount] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    return res.json({
      success: true,
      message: 'Notifications retrieved.',
      data: rows,
      unreadCount: unreadCount[0].count,
      pagination: {
        total: countRows[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countRows[0].total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const [unreadCount] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    return res.json({
      success: true,
      count: unreadCount[0].count,
      data: { count: unreadCount[0].count }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/notifications/:id/read - Mark single notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const [existing] = await pool.query(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return errorResponse(res, 'Notification not found.', 404);

    await pool.query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?',
      [req.params.id]
    );
    return successResponse(res, null, 'Notification marked as read.');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/notifications/read-all - Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    return successResponse(res, null, 'All notifications marked as read.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const [existing] = await pool.query(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return errorResponse(res, 'Notification not found.', 404);

    await pool.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    return successResponse(res, null, 'Notification deleted.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/send - Admin sends notification to user(s)
 */
const sendNotification = async (req, res, next) => {
  try {
    const { user_ids, title, message, type } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return errorResponse(res, 'user_ids array is required.', 400);
    }
    if (!title || !message) return errorResponse(res, 'Title and message are required.', 400);

    const values = user_ids.map(uid => [uid, title, message, type || 'general', 0, new Date(), new Date()]);

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read, created_at, updated_at) VALUES ?`,
      [values]
    );

    return successResponse(res, null, `Notification sent to ${user_ids.length} user(s).`, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, sendNotification };
