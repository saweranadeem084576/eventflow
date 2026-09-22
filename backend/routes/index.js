const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const eventRoutes = require('./eventRoutes');
const bookingRoutes = require('./bookingRoutes');
const paymentRoutes = require('./paymentRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const notificationRoutes = require('./notificationRoutes');
const complaintRoutes = require('./complaintRoutes');
const adminRoutes = require('./adminRoutes');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get('/health', healthController.getHealth);
router.get('/ready', healthController.getReadiness);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/notifications', notificationRoutes);
router.use('/complaints', complaintRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
