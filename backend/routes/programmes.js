const express = require('express');
const router = express.Router();
const programmeController = require('../controllers/programmeController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', authenticate, programmeController.getProgrammes);
router.get('/:id', authenticate, programmeController.getProgrammeById);
router.post('/', authenticate, authorize('admin'), programmeController.createProgramme);
router.put('/:id', authenticate, authorize('admin'), programmeController.updateProgramme);
router.delete('/:id', authenticate, authorize('admin'), programmeController.deleteProgramme);

module.exports = router;
