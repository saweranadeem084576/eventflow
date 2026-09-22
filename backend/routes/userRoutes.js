const express = require('express');
const controller = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const { singleImage } = require('../middleware/upload');
const validate = require('../middleware/validate');
const schemas = require('../utils/schemas');

const router = express.Router();

router.use(protect);
router.get('/', restrictTo('admin'), controller.list);
router.post('/me/avatar', singleImage('avatar'), controller.uploadAvatar);
router.get('/:id', controller.getOne);
router.patch('/:id', validate(schemas.userUpdate), controller.update);
router.delete('/:id', restrictTo('admin'), controller.remove);

module.exports = router;
