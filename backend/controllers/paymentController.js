const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const bookingController = require('./bookingController');
const ApiError = require('../utils/apiError');

const findBooking = async (id, userId) => {
	if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid booking id');
	const booking = await Booking.findOne({ _id: id, user: userId }).populate('event', 'name price');
	if (!booking) throw new ApiError(404, 'Booking not found');
	if (booking.status === 'cancelled') throw new ApiError(409, 'Cancelled bookings cannot be paid');
	return booking;
};

const markPaymentFailed = async (payment) => {
	payment.status = 'failed';
	await payment.save();
	await bookingController.releaseBooking(payment.booking.id);
};

const markPaymentSucceeded = async (payment) => {
	payment.status = 'succeeded';
	await payment.save();
	await bookingController.confirmBooking(payment.booking.id);
	try {
		await notificationService.sendBookingConfirmation(payment.booking.id);
	} catch (error) {
		console.error(`Booking confirmation notification failed: ${error.message}`);
	}
};

// Returns the open payment for a booking, with a fresh client secret from the provider.
const resumePayment = async (payment) => {
	const paymentIntent = await paymentService.confirmPayment(payment.providerPaymentId);
	return { paymentId: payment.id, clientSecret: paymentIntent.client_secret };
};

exports.createIntent = async (request, response, next) => {
	try {
		const booking = await findBooking(request.body.booking, request.user.id);
		if (booking.event.price <= 0) throw new ApiError(400, 'This event does not require payment');
		if (booking.status === 'confirmed') throw new ApiError(409, 'Booking is already confirmed');

		// Resume an abandoned checkout rather than creating a second intent.
		const openStatuses = { $in: ['pending', 'succeeded'] };
		const existing = await Payment.findOne({ booking: booking.id, status: openStatuses });
		if (existing) {
			return response.status(200).json({ status: 'success', data: await resumePayment(existing) });
		}

		const paymentIntent = await paymentService.createPaymentIntent({
			amount: Math.round(booking.event.price * 100),
			currency: 'usd',
			metadata: { bookingId: booking.id, userId: request.user.id },
		});

		let payment;
		try {
			payment = await Payment.create({
				booking: booking.id,
				user: request.user.id,
				providerPaymentId: paymentIntent.id,
				amount: booking.event.price,
				currency: 'usd',
			});
		} catch (error) {
			if (error.code !== 11000) throw error;
			// A concurrent request already opened a payment; discard ours and reuse theirs.
			await paymentService.cancelPaymentIntent(paymentIntent.id).catch(() => {});
			const winner = await Payment.findOne({ booking: booking.id, status: openStatuses });
			if (!winner) throw error;
			return response.status(200).json({ status: 'success', data: await resumePayment(winner) });
		}

		booking.payment = payment.id;
		await booking.save();
		response.status(201).json({
			status: 'success',
			data: { paymentId: payment.id, clientSecret: paymentIntent.client_secret },
		});
	} catch (error) {
		next(error);
	}
};

exports.confirm = async (request, response, next) => {
	try {
		if (!mongoose.isValidObjectId(request.params.id)) throw new ApiError(400, 'Invalid payment id');
		const payment = await Payment.findOne({ _id: request.params.id, user: request.user.id }).populate('booking');
		if (!payment) throw new ApiError(404, 'Payment not found');
		if (payment.status === 'succeeded') {
			return response.status(200).json({ status: 'success', data: { payment } });
		}

		const paymentIntent = await paymentService.confirmPayment(payment.providerPaymentId);
		if (paymentIntent.status !== 'succeeded') {
			if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'canceled') {
				await markPaymentFailed(payment);
			}
			throw new ApiError(402, `Payment has not succeeded: ${paymentIntent.status}`);
		}

		await markPaymentSucceeded(payment);
		response.status(200).json({ status: 'success', data: { payment } });
	} catch (error) {
		next(error);
	}
};

exports.webhook = async (request, response, next) => {
	try {
		const signature = request.headers['stripe-signature'];
		const event = paymentService.constructWebhookEvent(request.body, signature);
		if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
			const paymentIntent = event.data.object;
			const payment = await Payment.findOne({ providerPaymentId: paymentIntent.id }).populate('booking');
			if (payment?.status === 'pending') {
				if (event.type === 'payment_intent.succeeded') await markPaymentSucceeded(payment);
				else await markPaymentFailed(payment);
			}
		}
		response.status(200).json({ received: true });
	} catch (error) {
		next(error);
	}
};
