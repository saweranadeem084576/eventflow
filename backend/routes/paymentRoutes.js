const express = require('express');
const controller = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../utils/schemas');

const router = express.Router();

router.use(protect);
router.post('/intent', validate(schemas.paymentIntent), controller.createIntent);
router.post('/:id/confirm', controller.confirm);

module.exports = router;
