const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const ApiError = require('../utils/apiError');

exports.list = async (request, response, next) => {
  try {
    const page = Math.max(Number.parseInt(request.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(request.query.limit, 10) || 20, 1), 50);
    const filter = { recipient: request.user.id };

    if (request.query.unread === 'true') filter.readAt = null;
    const [notifications, total, unread] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: request.user.id, readAt: null }),
    ]);

    response.status(200).json({
      status: 'success',
      results: notifications.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: { notifications, unread },
    });
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) throw new ApiError(400, 'Invalid notification id');
    const notification = await Notification.findOneAndUpdate(
      { _id: request.params.id, recipient: request.user.id },
      { readAt: new Date() },
      { new: true },
    );
    if (!notification) throw new ApiError(404, 'Notification not found');
    response.status(200).json({ status: 'success', data: { notification } });
  } catch (error) {
    next(error);
  }
};

exports.markAllRead = async (request, response, next) => {
  try {
    await Notification.updateMany(
      { recipient: request.user.id, readAt: null },
      { readAt: new Date() },
    );
    response.status(204).send();
  } catch (error) {
    next(error);
  }
};

exports.registerDevice = async (request, response, next) => {
  try {
    const token = request.body.token?.trim();
    if (!token || token.length < 20 || token.length > 4096) {
      throw new ApiError(400, 'A valid device token is required');
    }

    await request.user.updateOne({ $addToSet: { fcmTokens: token } });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
};
