const express = require('express');
const controller = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../utils/schemas');

const router = express.Router();

router.use(protect);
router.get('/', controller.list);
router.post('/devices', validate(schemas.device), controller.registerDevice);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);

module.exports = router;
