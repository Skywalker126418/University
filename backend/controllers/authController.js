const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: `${user.first_name} ${user.last_name}` },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      `SELECT u.*, 
        CASE u.role
          WHEN 'student' THEN s.student_id
          WHEN 'lecturer' THEN l.lecturer_id
          ELSE NULL
        END as profile_id
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id AND u.role = 'student'
       LEFT JOIN lecturers l ON u.id = l.user_id AND u.role = 'lecturer'
       WHERE u.email = ? AND u.is_active = 1`,
      [email]
    );

    if (rows.length === 0) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const user = rows[0];
    const hash = user.password_hash || user.password;
    if (!hash) {
      return errorResponse(res, 'Invalid account configuration.', 500);
    }
    const isMatch = await bcrypt.compare(password, hash);

    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const token = generateToken(user);

    const { password: _, ...userWithoutPassword } = user;

    return successResponse(
      res,
      { token, user: userWithoutPassword },
      'Login successful.'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * JWT is stateless — instruct client to discard token
 */
const logout = async (req, res) => {
  return successResponse(res, null, 'Logged out successfully.');
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, role, phone, avatar, is_active, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return errorResponse(res, 'User not found.', 404);
    }

    return successResponse(res, rows[0], 'User profile retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return errorResponse(res, 'User not found.', 404);

    const user = rows[0];
    const hash = user.password_hash || user.password;
    const isMatch = await bcrypt.compare(oldPassword, hash);
    if (!isMatch) return errorResponse(res, 'Current password is incorrect.', 400);

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = ?, password_hash = ?, updated_at = NOW() WHERE id = ?', [hashed, hashed, req.user.id]);

    return successResponse(res, null, 'Password changed successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-admin-gate
 */
const verifyAdminGate = async (req, res, next) => {
  try {
    const { pinOrPassword } = req.body;
    if (!pinOrPassword) {
      return errorResponse(res, 'Please provide the Master PIN or Security Password.', 400);
    }

    let pin = '12345678';
    let masterPass = 'admin12';

    try {
      const [settings] = await pool.query(
        `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('admin_master_pin', 'admin_master_password')`
      );
      settings.forEach(s => {
        if (s.setting_key === 'admin_master_pin') pin = s.setting_value;
        if (s.setting_key === 'admin_master_password') masterPass = s.setting_value;
      });
    } catch (dbErr) {
      // Table may not exist yet, fallback to defaults
    }

    const trimmedInput = pinOrPassword.trim();
    const isMatch = (trimmedInput === pin.trim() || trimmedInput === masterPass.trim());
    if (!isMatch) {
      return errorResponse(res, 'Invalid Master PIN or Password. Access denied.', 403);
    }

    return successResponse(res, { verified: true }, 'Administrative security verification passed.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/register-admin
 */
const registerAdmin = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { pinOrPassword, first_name, last_name, email, password, phone } = req.body;

    if (!pinOrPassword) {
      return errorResponse(res, 'Master PIN or Master Password required to create administrator.', 403);
    }

    let pin = '12345678';
    let masterPass = 'admin12';

    try {
      const [settings] = await conn.query(
        `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('admin_master_pin', 'admin_master_password')`
      );
      settings.forEach(s => {
        if (s.setting_key === 'admin_master_pin') pin = s.setting_value;
        if (s.setting_key === 'admin_master_password') masterPass = s.setting_value;
      });
    } catch (dbErr) {
      // Table may not exist yet, fallback to defaults
    }

    const trimmedInput = pinOrPassword.trim();
    if (trimmedInput !== pin.trim() && trimmedInput !== masterPass.trim()) {
      await conn.rollback();
      return errorResponse(res, 'Invalid Master PIN or Password. Access denied.', 403);
    }

    if (!first_name || !last_name || !email || !password) {
      await conn.rollback();
      return errorResponse(res, 'First name, last name, email, and password are required.', 400);
    }

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await conn.rollback();
      return errorResponse(res, 'An account with this email already exists.', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    let avatarPath = null;
    if (req.file) {
      avatarPath = `/uploads/profiles/${req.file.filename}`;
    }

    const [userResult] = await conn.query(
      `INSERT INTO users (first_name, last_name, email, password, password_hash, role, phone, avatar, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'admin', ?, ?, 1, NOW(), NOW())`,
      [first_name, last_name, email, hashed, hashed, phone || null, avatarPath]
    );

    await conn.query(
      `INSERT INTO administrators (user_id) VALUES (?)`,
      [userResult.insertId]
    );

    await conn.commit();

    const [newUser] = await pool.query(
      `SELECT id, first_name, last_name, email, role, phone, avatar, is_active FROM users WHERE id = ?`,
      [userResult.insertId]
    );

    const token = generateToken(newUser[0]);

    return successResponse(
      res,
      { token, user: newUser[0] },
      'Administrator registered successfully.',
      201
    );
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

module.exports = { login, logout, getMe, changePassword, verifyAdminGate, registerAdmin };
