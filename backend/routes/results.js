const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { enterResultValidators, bulkResultValidators } = require('../validators/resultValidators');

router.get('/my', authenticate, authorize('student'), resultController.getMyResults);
router.get('/', authenticate, resultController.getResults);
router.post('/bulk', authenticate, authorize('lecturer', 'admin'), bulkResultValidators, validate, resultController.enterBulkResults);
router.post('/', authenticate, authorize('lecturer', 'admin'), enterResultValidators, validate, resultController.enterResult);
router.put('/:id', authenticate, authorize('lecturer', 'admin'), resultController.updateResult);
router.delete('/:id', authenticate, authorize('admin'), resultController.deleteResult);

module.exports = router;
