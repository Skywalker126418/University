const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const { uploadProfilePhoto } = require('../middleware/upload');

// User profile management & photo upload
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.post('/profile-photo', authenticate, uploadProfilePhoto.single('photo'), userController.uploadProfilePhoto);
router.delete('/profile-photo', authenticate, userController.deleteProfilePhoto);

// Admin-only Security Gate configuration
router.get('/security-gate', authenticate, authorize('admin'), userController.getSecurityGateSettings);
router.put('/security-gate', authenticate, authorize('admin'), userController.updateSecurityGateSettings);

// Admin-only Registrar management
router.get('/registrars', authenticate, authorize('admin'), userController.getRegistrars);
router.post('/registrars', authenticate, authorize('admin'), uploadProfilePhoto.single('photo'), userController.createRegistrar);

// General User management (Admin)
router.get('/', authenticate, authorize('admin'), userController.getUsers);
router.get('/:id', authenticate, authorize('admin'), userController.getUserById);
router.post('/', authenticate, authorize('admin'), userController.createUser);
router.put('/:id', authenticate, authorize('admin'), userController.updateUser);
router.patch('/:id/toggle-status', authenticate, authorize('admin'), userController.toggleUserStatus);
router.post('/:id/profile-photo', authenticate, authorize('admin', 'registrar'), uploadProfilePhoto.single('photo'), userController.uploadUserPhoto);
router.delete('/:id/profile-photo', authenticate, authorize('admin', 'registrar'), userController.deleteUserPhoto);
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

module.exports = router;
