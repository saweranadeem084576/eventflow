const express = require('express');
const controller = require('../controllers/eventController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../utils/schemas');

const router = express.Router();
const manage = [protect, restrictTo('admin', 'organizer')];

router.get('/', controller.list);
router.get('/mine', ...manage, controller.listMine);
router.get('/:id', controller.getOne);
router.get('/:id/bookings', ...manage, controller.listBookings);
router.post('/', ...manage, validate(schemas.eventCreate), controller.create);
router.patch('/:id', ...manage, validate(schemas.eventUpdate), controller.update);
router.delete('/:id', ...manage, controller.remove);

module.exports = router;
