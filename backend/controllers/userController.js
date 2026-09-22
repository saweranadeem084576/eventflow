const mongoose = require('mongoose');
const User = require('../models/User');
const Booking = require('../models/Booking');
const imageService = require('../services/imageService');
const { releaseBooking } = require('./bookingController');
const ApiError = require('../utils/apiError');

const PUBLIC_FIELDS = 'name email role avatar createdAt';

const validateId = (id) => {
	if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid user id');
};

exports.list = async (request, response, next) => {
	try {
		const users = await User.find().sort({ createdAt: -1 }).select(PUBLIC_FIELDS);
		response.status(200).json({ status: 'success', results: users.length, data: { users } });
	} catch (error) {
		next(error);
	}
};

exports.getOne = async (request, response, next) => {
	try {
		validateId(request.params.id);
		if (request.user.role !== 'admin' && request.user.id !== request.params.id) {
			throw new ApiError(403, 'You can only view your own profile');
		}
		const user = await User.findById(request.params.id).select(PUBLIC_FIELDS);
		if (!user) throw new ApiError(404, 'User not found');
		response.status(200).json({ status: 'success', data: { user } });
	} catch (error) {
		next(error);
	}
};

exports.update = async (request, response, next) => {
	try {
		validateId(request.params.id);
		const isAdmin = request.user.role === 'admin';
		if (!isAdmin && request.user.id !== request.params.id) {
			throw new ApiError(403, 'You can only update your own profile');
		}

		const updates = {};
		if (request.body.name !== undefined) updates.name = request.body.name;
		if (isAdmin && request.body.role !== undefined) updates.role = request.body.role;

		const user = await User.findByIdAndUpdate(request.params.id, updates, {
			new: true,
			runValidators: true,
		}).select(PUBLIC_FIELDS);
		if (!user) throw new ApiError(404, 'User not found');
		response.status(200).json({ status: 'success', data: { user } });
	} catch (error) {
		next(error);
	}
};

exports.uploadAvatar = async (request, response, next) => {
	try {
		if (!request.file) throw new ApiError(400, 'An image file is required');
		const avatar = await imageService.saveAvatar(request.file.buffer, request.user.id);
		const previous = request.user.avatar;
		request.user.avatar = avatar;
		await request.user.save();
		await imageService.removeUpload(previous);
		response.status(200).json({ status: 'success', data: { user: request.user } });
	} catch (error) {
		next(error);
	}
};

exports.remove = async (request, response, next) => {
	try {
		validateId(request.params.id);
		if (request.user.id === request.params.id) throw new ApiError(400, 'You cannot delete your own admin account');
		const user = await User.findByIdAndDelete(request.params.id);
		if (!user) throw new ApiError(404, 'User not found');

		// Release any seats the deleted user was holding and drop their avatar file.
		const active = await Booking.find({ user: user.id, status: { $in: ['pending', 'confirmed'] } }).select('_id');
		await Promise.all([...active.map((booking) => releaseBooking(booking.id)), imageService.removeUpload(user.avatar)]);
		response.status(204).send();
	} catch (error) {
		next(error);
	}
};
