const mongoose = require('mongoose');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const notificationService = require('../services/notificationService');
const ApiError = require('../utils/apiError');

const ACTIVE_BOOKING = { status: { $in: ['pending', 'confirmed'] } };

const paginate = (query, fallbackLimit = 10) => {
	const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || fallbackLimit, 1), 50);
	return { page, limit, skip: (page - 1) * limit };
};

const paginated = (response, key, items, total, { page, limit }) =>
	response.status(200).json({
		status: 'success',
		results: items.length,
		pagination: { page, limit, total, pages: Math.ceil(total / limit) },
		data: { [key]: items },
	});

const exactMatch = (value) =>
	new RegExp(`^${value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

const parseQueryDate = (value, field) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) throw new ApiError(400, `${field} must be a valid date`);
	return date;
};

// Loads an event the current user is allowed to manage (owner or admin).
const findManagedEvent = async (id, user) => {
	if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid event id');
	const event = await Event.findById(id).populate('organizer', 'name email role avatar');
	if (!event) throw new ApiError(404, 'Event not found');
	if (user.role !== 'admin' && event.organizer.id !== user.id) {
		throw new ApiError(403, 'You can only manage your own events');
	}
	return event;
};

exports.list = async (request, response, next) => {
	try {
		const { page, limit, skip } = paginate(request.query);
		const filter = { status: 'published' };

		if (request.query.category) filter.category = exactMatch(request.query.category);
		if (request.query.search) filter.$text = { $search: request.query.search.trim() };
		if (request.query.from) filter.date = { ...filter.date, $gte: parseQueryDate(request.query.from, 'from') };
		if (request.query.to) filter.date = { ...filter.date, $lte: parseQueryDate(request.query.to, 'to') };
		const sort = request.query.sort === 'desc' ? -1 : 1;

		const [events, total] = await Promise.all([
			Event.find(filter).populate('organizer', 'name avatar').sort({ date: sort }).skip(skip).limit(limit),
			Event.countDocuments(filter),
		]);
		paginated(response, 'events', events, total, { page, limit });
	} catch (error) {
		next(error);
	}
};

exports.listMine = async (request, response, next) => {
	try {
		const { page, limit, skip } = paginate(request.query, 20);
		const filter = { organizer: request.user.id };
		const [events, total] = await Promise.all([
			Event.find(filter).sort({ date: 1 }).skip(skip).limit(limit),
			Event.countDocuments(filter),
		]);
		paginated(response, 'events', events, total, { page, limit });
	} catch (error) {
		next(error);
	}
};

exports.getOne = async (request, response, next) => {
	try {
		if (!mongoose.isValidObjectId(request.params.id)) throw new ApiError(400, 'Invalid event id');
		const event = await Event.findOne({ _id: request.params.id, status: 'published' }).populate('organizer', 'name avatar');
		if (!event) throw new ApiError(404, 'Event not found');
		response.status(200).json({ status: 'success', data: { event } });
	} catch (error) {
		next(error);
	}
};

exports.create = async (request, response, next) => {
	try {
		const event = await Event.create({
			...request.body,
			status: request.user.role === 'admin' ? 'published' : 'pending',
			organizer: request.user.id,
		});
		response.status(201).json({ status: 'success', data: { event } });
	} catch (error) {
		next(error);
	}
};

exports.update = async (request, response, next) => {
	try {
		const event = await findManagedEvent(request.params.id, request.user);
		if (request.body.capacity !== undefined && request.body.capacity < event.bookedSeats) {
			throw new ApiError(400, `Capacity cannot be lower than the ${event.bookedSeats} seats already booked`);
		}

		Object.assign(event, request.body);
		await event.save();
		await notificationService.sendEventUpdated(event).catch((error) => {
			console.error(`Event update notification failed: ${error.message}`);
		});
		response.status(200).json({ status: 'success', data: { event } });
	} catch (error) {
		next(error);
	}
};

exports.remove = async (request, response, next) => {
	try {
		const event = await findManagedEvent(request.params.id, request.user);
		const activeBookings = await Booking.countDocuments({ event: event.id, ...ACTIVE_BOOKING });
		if (activeBookings) {
			throw new ApiError(409, `Event has ${activeBookings} active booking(s) and cannot be deleted`);
		}

		await event.deleteOne();
		response.status(204).send();
	} catch (error) {
		next(error);
	}
};

exports.listBookings = async (request, response, next) => {
	try {
		const event = await findManagedEvent(request.params.id, request.user);
		const { page, limit, skip } = paginate(request.query, 20);
		const filter = { event: event.id, ...ACTIVE_BOOKING };
		const [bookings, total] = await Promise.all([
			Booking.find(filter).populate('user', 'name email avatar').sort({ createdAt: -1 }).skip(skip).limit(limit),
			Booking.countDocuments(filter),
		]);
		paginated(response, 'bookings', bookings, total, { page, limit });
	} catch (error) {
		next(error);
	}
};
