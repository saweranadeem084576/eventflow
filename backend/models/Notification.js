const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['booking_confirmed', 'event_updated', 'booking_cancelled'],
    required: true,
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  data: { type: Map, of: String },
  readAt: Date,
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, readAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
