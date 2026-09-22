const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const ApiError = require('../utils/apiError');

const validateEventId = (eventId) => {
	if (!mongoose.isValidObjectId(eventId)) throw new ApiError(400, 'Invalid event id');
};

exports.listByEvent = async (request, response, next) => {
	try {
		const { eventId } = request.params;
		validateEventId(eventId);

		const event = await Event.findOne({ _id: eventId, status: 'published' }).select('_id');
		if (!event) throw new ApiError(404, 'Event not found');

		const page = Math.max(Number.parseInt(request.query.page, 10) || 1, 1);
		const limit = Math.min(Math.max(Number.parseInt(request.query.limit, 10) || 10, 1), 50);
		const [feedback, summary] = await Promise.all([
			Feedback.find({ event: eventId })
				.populate('user', 'name avatar')
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit),
			Feedback.aggregate([
				{ $match: { event: new mongoose.Types.ObjectId(eventId) } },
				{ $group: { _id: null, averageRating: { $avg: '$rating' }, total: { $sum: 1 } } },
			]),
		]);

		const stats = summary[0] || { averageRating: 0, total: 0 };
		response.status(200).json({
			status: 'success',
			results: feedback.length,
			data: {
				feedback,
				summary: { averageRating: Number(stats.averageRating.toFixed(2)), total: stats.total },
			},
		});
	} catch (error) {
		next(error);
	}
};

exports.listRecent = async (request, response, next) => {
	try {
		const feedback = await Feedback.find({ comment: { $exists: true, $ne: '' } })
			.populate('user', 'name avatar')
			.populate('event', 'name category image')
			.sort({ createdAt: -1 })
			.limit(6);
		response.status(200).json({ status: 'success', results: feedback.length, data: { feedback } });
	} catch (error) {
		next(error);
	}
};

exports.create = async (request, response, next) => {
	try {
		const { event: eventId } = request.body;
		const event = await Event.findOne({ _id: eventId, status: 'published' }).select('date');
		if (!event) throw new ApiError(404, 'Event not found');
		if (event.date > new Date()) throw new ApiError(400, 'Feedback can only be submitted after the event');

		const booking = await Booking.findOne({ event: eventId, user: request.user.id, status: 'confirmed' });
		if (!booking) throw new ApiError(403, 'Only users with a confirmed booking can submit feedback');

		const feedback = await Feedback.create({ ...request.body, user: request.user.id });

		response.status(201).json({ status: 'success', data: { feedback } });
	} catch (error) {
		if (error.code === 11000) return next(new ApiError(409, 'You have already reviewed this event'));
		next(error);
	}
};
