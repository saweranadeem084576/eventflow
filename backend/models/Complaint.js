const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  resolution: { type: String, trim: true, maxlength: 2000 },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
}, { timestamps: true });

complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ submittedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);