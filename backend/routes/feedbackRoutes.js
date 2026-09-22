const express = require('express');
const controller = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../utils/schemas');

const router = express.Router();

router.get('/recent', controller.listRecent);
router.get('/event/:eventId', controller.listByEvent);
router.post('/', protect, validate(schemas.feedbackCreate), controller.create);

module.exports = router;
