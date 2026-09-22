const express = require('express');
const controller = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../utils/schemas');

const router = express.Router();

router.use(protect);
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', validate(schemas.bookingCreate), controller.create);
router.patch('/:id/cancel', controller.cancel);

module.exports = router;
