const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', authenticate, roomController.getRooms);
router.get('/:id', authenticate, roomController.getRoomById);
router.post('/', authenticate, authorize('admin'), roomController.createRoom);
router.put('/:id', authenticate, authorize('admin'), roomController.updateRoom);
router.delete('/:id', authenticate, authorize('admin'), roomController.deleteRoom);

module.exports = router;
