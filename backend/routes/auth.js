const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginValidators, changePasswordValidators } = require('../validators/authValidators');

const userController = require('../controllers/userController');

const { uploadProfilePhoto } = require('../middleware/upload');

router.post('/login', loginValidators, validate, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, userController.updateProfile);
router.post('/change-password', authenticate, changePasswordValidators, validate, authController.changePassword);
router.put('/me/password', authenticate, changePasswordValidators, validate, authController.changePassword);

// Administrator Security Gate & Self-Registration
router.post('/verify-admin-gate', authController.verifyAdminGate);
router.post('/register-admin', uploadProfilePhoto.single('avatar'), authController.registerAdmin);

module.exports = router;
