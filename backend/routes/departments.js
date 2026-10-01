const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', authenticate, departmentController.getDepartments);
router.get('/:id', authenticate, departmentController.getDepartmentById);
router.post('/', authenticate, authorize('admin'), departmentController.createDepartment);
router.put('/:id', authenticate, authorize('admin'), departmentController.updateDepartment);
router.delete('/:id', authenticate, authorize('admin'), departmentController.deleteDepartment);

module.exports = router;
