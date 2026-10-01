const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * GET /api/users - List all users (admin only)
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', role } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (role) {
      whereClause += ' AND u.role = ?';
      params.push(role);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, role, phone, is_active, created_at
       FROM users u ${whereClause} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return paginatedResponse(res, rows, countRows[0].total, page, limit, 'Users retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, role, phone, avatar, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return errorResponse(res, 'User not found.', 404);
    return successResponse(res, rows[0], 'User retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/profile - own profile
 */
const getProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, role, phone, avatar, is_active, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return errorResponse(res, 'User not found.', 404);
    return successResponse(res, rows[0], 'Profile retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/profile - update own profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, avatar } = req.body;
    await pool.query(
      `UPDATE users SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        avatar = COALESCE(?, avatar),
        updated_at = NOW()
       WHERE id = ?`,
      [first_name, last_name, phone, avatar, req.user.id]
    );

    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, role, phone, avatar, is_active FROM users WHERE id = ?`,
      [req.user.id]
    );
    return successResponse(res, rows[0], 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users - Create user (admin)
 */
const createUser = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, role, phone } = req.body;

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return errorResponse(res, 'Email already in use.', 409);

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password, password_hash, role, phone, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [first_name, last_name, email, hashed, hashed, role || 'student', phone || null]
    );

    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, role, phone, is_active, created_at FROM users WHERE id = ?`,
      [result.insertId]
    );
    return successResponse(res, rows[0], 'User created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id - Update user (admin)
 */
const updateUser = async (req, res, next) => {
  try {
    const { first_name, last_name, email, role, phone, is_active } = req.body;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) return errorResponse(res, 'User not found.', 404);

    await pool.query(
      `UPDATE users SET
        first_name = COALESCE(?, first_name),
        last_name  = COALESCE(?, last_name),
        email      = COALESCE(?, email),
        role       = COALESCE(?, role),
        phone      = COALESCE(?, phone),
        is_active  = COALESCE(?, is_active),
        updated_at = NOW()
       WHERE id = ?`,
      [first_name, last_name, email, role, phone, is_active, id]
    );

    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, role, phone, is_active, updated_at FROM users WHERE id = ?`,
      [id]
    );
    return successResponse(res, rows[0], 'User updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id - Soft delete (admin)
 */
const deleteUser = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return errorResponse(res, 'User not found.', 404);

    await pool.query('UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?', [req.params.id]);
    return successResponse(res, null, 'User deactivated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/toggle-status
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id, is_active FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return errorResponse(res, 'User not found.', 404);

    const newStatus = existing[0].is_active ? 0 : 1;
    await pool.query('UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?', [newStatus, req.params.id]);
    return successResponse(res, { is_active: newStatus }, `User ${newStatus ? 'activated' : 'deactivated'} successfully.`);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/profile-photo - Logged-in user uploads own photo
 */
const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No image file uploaded.', 400);
    }
    const avatarUrl = `/uploads/profiles/${req.file.filename}`;
    await pool.query(
      'UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?',
      [avatarUrl, req.user.id]
    );
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, role, phone, avatar, is_active FROM users WHERE id = ?',
      [req.user.id]
    );
    return successResponse(res, rows[0], 'Profile photo updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/:id/profile-photo - Admin uploads photo for any user
 */
const uploadUserPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No image file uploaded.', 400);
    }
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) return errorResponse(res, 'User not found.', 404);

    const avatarUrl = `/uploads/profiles/${req.file.filename}`;
    await pool.query(
      'UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?',
      [avatarUrl, id]
    );
    await pool.query(
      'UPDATE students SET profile_photo = ?, updated_at = NOW() WHERE user_id = ?',
      [avatarUrl, id]
    );
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, role, phone, avatar, is_active FROM users WHERE id = ?',
      [id]
    );
    return successResponse(res, rows[0], 'User photo updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/profile-photo - Logged-in user deletes own photo
 */
const deleteProfilePhoto = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT avatar FROM users WHERE id = ?', [req.user.id]);
    if (rows.length && rows[0].avatar) {
      const filePath = path.join(__dirname, '..', rows[0].avatar);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
      }
    }
    await pool.query('UPDATE users SET avatar = NULL, updated_at = NOW() WHERE id = ?', [req.user.id]);
    await pool.query('UPDATE students SET profile_photo = NULL, updated_at = NOW() WHERE user_id = ?', [req.user.id]);

    const [updated] = await pool.query(
      'SELECT id, first_name, last_name, email, role, phone, avatar, is_active FROM users WHERE id = ?',
      [req.user.id]
    );
    return successResponse(res, updated[0], 'Profile photo removed successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id/profile-photo - Admin deletes user's photo
 */
const deleteUserPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT avatar FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return errorResponse(res, 'User not found.', 404);

    if (rows[0].avatar) {
      const filePath = path.join(__dirname, '..', rows[0].avatar);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
      }
    }
    await pool.query('UPDATE users SET avatar = NULL, updated_at = NOW() WHERE id = ?', [id]);
    await pool.query('UPDATE students SET profile_photo = NULL, updated_at = NOW() WHERE user_id = ?', [id]);

    const [updated] = await pool.query(
      'SELECT id, first_name, last_name, email, role, phone, avatar, is_active FROM users WHERE id = ?',
      [id]
    );
    return successResponse(res, updated[0], 'User photo removed successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/security-gate - Admin views current Master PIN and Password
 */
const getSecurityGateSettings = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT setting_key, setting_value, description, updated_at FROM system_settings WHERE setting_key IN ('admin_master_pin', 'admin_master_password')`
    );
    let pin = '12345678';
    let password = 'admin12';
    rows.forEach(r => {
      if (r.setting_key === 'admin_master_pin') pin = r.setting_value;
      if (r.setting_key === 'admin_master_password') password = r.setting_value;
    });
    return successResponse(res, { pin, password }, 'Security gate settings retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/security-gate - Admin updates Master PIN and/or Password
 */
const updateSecurityGateSettings = async (req, res, next) => {
  try {
    const { pin, password } = req.body;
    if (!pin && !password) {
      return errorResponse(res, 'At least one setting (pin or password) is required.', 400);
    }
    if (pin) {
      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value, description)
         VALUES ('admin_master_pin', ?, 'Master PIN required to access administrator registration form')
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [pin.trim(), pin.trim()]
      );
    }
    if (password) {
      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value, description)
         VALUES ('admin_master_password', ?, 'Master password required to access administrator registration form')
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [password.trim(), password.trim()]
      );
    }
    return successResponse(res, { pin, password }, 'Security gate settings updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/registrars - Admin creates a new Registrar account
 */
const createRegistrar = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { first_name, last_name, email, password, phone } = req.body;
    if (!first_name || !last_name || !email || !password) {
      return errorResponse(res, 'First name, last name, email, and password are required.', 400);
    }
    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await conn.rollback();
      return errorResponse(res, 'Email already in use.', 409);
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    let avatarPath = null;
    if (req.file) {
      avatarPath = `/uploads/profiles/${req.file.filename}`;
    }

    const [userResult] = await conn.query(
      `INSERT INTO users (first_name, last_name, email, password, password_hash, role, phone, avatar, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'registrar', ?, ?, 1, NOW(), NOW())`,
      [first_name, last_name, email, hashed, hashed, phone || null, avatarPath]
    );

    await conn.query(
      `INSERT INTO registrars (user_id) VALUES (?)`,
      [userResult.insertId]
    );

    await conn.commit();
    const [newUser] = await pool.query(
      `SELECT id, first_name, last_name, email, role, phone, avatar, is_active FROM users WHERE id = ?`,
      [userResult.insertId]
    );
    return successResponse(res, newUser[0], 'Registrar account created successfully.', 201);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * GET /api/users/registrars - Admin lists all Registrars
 */
const getRegistrars = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.is_active, u.created_at,
              r.id as registrar_record_id
       FROM users u
       JOIN registrars r ON u.id = r.user_id
       WHERE u.role = 'registrar'
       ORDER BY u.created_at DESC`
    );
    return successResponse(res, rows, 'Registrars retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUserById,
  getProfile,
  updateProfile,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  uploadProfilePhoto,
  uploadUserPhoto,
  deleteProfilePhoto,
  deleteUserPhoto,
  getSecurityGateSettings,
  updateSecurityGateSettings,
  createRegistrar,
  getRegistrars
};

