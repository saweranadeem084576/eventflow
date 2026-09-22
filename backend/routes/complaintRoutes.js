const express = require('express');
const controller = require('../controllers/complaintController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../utils/schemas');

const router = express.Router();

router.use(protect);
router.get('/', controller.listMine);
router.post('/', validate(schemas.complaintCreate), controller.create);

module.exports = router;
