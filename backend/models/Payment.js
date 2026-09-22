const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, enum: ['stripe'], default: 'stripe' },
  providerPaymentId: String,
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'usd', lowercase: true },
  status: { type: String, enum: ['pending', 'succeeded', 'failed', 'refunded'], default: 'pending' },
  providerRefundId: String,
  refundedAt: Date,
}, { timestamps: true });

paymentSchema.index(
  { booking: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'succeeded'] } } },
);

module.exports = mongoose.model('Payment', paymentSchema);
