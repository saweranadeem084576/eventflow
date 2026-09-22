const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const User = require('../models/User');
const firebaseService = require('./firebaseService');

const pushToDevices = async (recipientId, notification) => {
  if (!firebaseService.isConfigured()) return;
  const user = await User.findById(recipientId).select('fcmTokens');
  if (!user?.fcmTokens.length) return;
  try {
    await firebaseService.sendToTokens(user.fcmTokens, {
      title: notification.title,
      body: notification.message,
    });
  } catch (error) {
    console.error(`Push notification failed: ${error.message}`);
  }
};

const notify = async (recipientId, { type, title, message, data }) => {
  const notification = await Notification.create({
    recipient: recipientId,
    type,
    title,
    message,
    data: new Map(Object.entries(data)),
  });
  await pushToDevices(recipientId, notification);
  return notification;
};

exports.sendBookingConfirmation = async (bookingId) => {
  const booking = await Booking.findById(bookingId).populate('event', 'name');
  if (!booking) return null;

  const existing = await Notification.findOne({
    recipient: booking.user,
    type: 'booking_confirmed',
    'data.bookingId': booking.id,
  });
  if (existing) return existing;

  return notify(booking.user, {
    type: 'booking_confirmed',
    title: 'Booking confirmed',
    message: `Your booking for ${booking.event.name} is confirmed.`,
    data: { bookingId: booking.id, eventId: booking.event.id },
  });
};

exports.sendBookingCancelled = async (booking) =>
  notify(booking.user, {
    type: 'booking_cancelled',
    title: 'Booking cancelled',
    message: `Your booking for ${booking.event.name} has been cancelled.`,
    data: { bookingId: booking.id, eventId: booking.event.id },
  });

exports.sendEventUpdated = async (event) => {
  const bookings = await Booking.find({
    event: event.id,
    status: { $in: ['pending', 'confirmed'] },
  }).select('user');

  await Promise.all(
    bookings.map((booking) =>
      notify(booking.user, {
        type: 'event_updated',
        title: 'Event updated',
        message: `${event.name} has updated details. Please review your booking.`,
        data: { eventId: event.id },
      }),
    ),
  );
};
