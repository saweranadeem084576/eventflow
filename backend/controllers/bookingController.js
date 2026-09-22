const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Event = require('../models/Event');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const ApiError = require('../utils/apiError');

const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'];

// Notifications must never fail the booking operation they follow.
const safeNotify = (task) =>
	task.catch((error) => console.error(`Notification failed: ${error.message}`));

exports.confirmBooking = (bookingId) =>
	Booking.findOneAndUpdate({ _id: bookingId, status: 'pending' }, { status: 'confirmed' }, { new: true });

exports.releaseBooking = async (bookingId) => {
	const booking = await Booking.findOneAndUpdate(
		{ _id: bookingId, status: { $in: ['pending', 'confirmed'] } },
		{ status: 'cancelled' },
		{ new: true },
	);
	if (!booking) return null;

	await Event.updateOne({ _id: booking.event, bookedSeats: { $gt: 0 } }, { $inc: { bookedSeats: -1 } });
	return booking;
};

const findBooking = async (id, userId) => {
	if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid booking id');
	const booking = await Booking.findOne({ _id: id, user: userId })
		.populate('event', 'name date location category price image')
		.populate('payment');

	if (!booking) throw new ApiError(404, 'Booking not found');
	return booking;
};

exports.list = async (request, response, next) => {
	try {
		const page = Math.max(Number.parseInt(request.query.page, 10) || 1, 1);
		const limit = Math.min(Math.max(Number.parseInt(request.query.limit, 10) || 10, 1), 50);
		const filter = { user: request.user.id };

		if (request.query.status) {
			if (!BOOKING_STATUSES.includes(request.query.status)) throw new ApiError(400, 'Invalid booking status');
			filter.status = request.query.status;
		}

		const [bookings, total] = await Promise.all([
			Booking.find(filter)
				.populate('event', 'name date location category price image')
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit),
			Booking.countDocuments(filter),
		]);

		response.status(200).json({
			status: 'success',
			results: bookings.length,
			pagination: { page, limit, total, pages: Math.ceil(total / limit) },
			data: { bookings },
		});
	} catch (error) {
		next(error);
	}
};

exports.getOne = async (request, response, next) => {
	try {
		const booking = await findBooking(request.params.id, request.user.id);
		response.status(200).json({ status: 'success', data: { booking } });
	} catch (error) {
		next(error);
	}
};

exports.create = async (request, response, next) => {
	try {
		const { event: eventId } = request.body;
		const event = await Event.findOneAndUpdate(
			{
				_id: eventId,
				status: 'published',
				date: { $gt: new Date() },
				$expr: { $lt: ['$bookedSeats', '$capacity'] },
			},
			{ $inc: { bookedSeats: 1 } },
			{ new: true },
		);
		if (!event) throw new ApiError(409, 'Event is unavailable or sold out');

		let booking;
		try {
			booking = await Booking.create({ event: eventId, user: request.user.id });
		} catch (error) {
			await Event.updateOne({ _id: eventId, bookedSeats: { $gt: 0 } }, { $inc: { bookedSeats: -1 } });
			if (error.code === 11000) throw new ApiError(409, 'You already have an active booking for this event');
			throw error;
		}

		if (event.price === 0) {
			booking = await exports.confirmBooking(booking.id);
			await safeNotify(notificationService.sendBookingConfirmation(booking.id));
		}
		response.status(201).json({ status: 'success', data: { booking } });
	} catch (error) {
		next(error);
	}
};

exports.cancel = async (request, response, next) => {
	try {
		const booking = await findBooking(request.params.id, request.user.id);
		if (booking.status === 'cancelled') throw new ApiError(409, 'Booking is already cancelled');

		const payment = await Payment.findOne({ booking: booking.id, status: 'succeeded' });
		if (payment) {
			const refund = await paymentService.refundPayment(payment.providerPaymentId);
			if (refund.status !== 'succeeded' && refund.status !== 'pending') {
				throw new ApiError(402, `Refund has not succeeded: ${refund.status}`);
			}
			await Payment.findByIdAndUpdate(payment.id, {
				status: 'refunded',
				providerRefundId: refund.id,
				refundedAt: new Date(),
			});
		}

		const cancelled = await exports.releaseBooking(booking.id);
		if (!cancelled) throw new ApiError(409, 'Booking could not be cancelled');

		await safeNotify(notificationService.sendBookingCancelled(booking));
		response.status(200).json({ status: 'success', data: { booking: cancelled } });
	} catch (error) {
		next(error);
	}
};
