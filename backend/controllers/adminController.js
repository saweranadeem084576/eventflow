const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Complaint = require("../models/Complaint");
const Event = require("../models/Event");
const User = require("../models/User");
const ApiError = require("../utils/apiError");

exports.overview = async (request, response, next) => {
  try {
    const [users, events, bookings, openComplaints] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments({ status: "published" }),
      Booking.countDocuments({ status: { $in: ["pending", "confirmed"] } }),
      Complaint.countDocuments({ status: "open" }),
    ]);
    response.status(200).json({
      status: "success",
      data: { users, events, bookings, openComplaints },
    });
  } catch (error) {
    next(error);
  }
};

exports.approveEvent = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id))
      throw new ApiError(400, "Invalid event id");
    const event = await Event.findOneAndUpdate(
      { _id: request.params.id, status: "pending" },
      { status: "published" },
      { new: true, runValidators: true },
    );
    if (!event) throw new ApiError(404, "Pending event not found");
    response.status(200).json({ status: "success", data: { event } });
  } catch (error) {
    next(error);
  }
};

exports.listEvents = async (request, response, next) => {
  try {
    const page = Math.max(Number.parseInt(request.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(request.query.limit, 10) || 20, 1),
      100,
    );
    if (
      request.query.status &&
      !["pending", "published", "cancelled"].includes(request.query.status)
    ) {
      throw new ApiError(400, "Invalid event status");
    }
    const filter = request.query.status ? { status: request.query.status } : {};
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("organizer", "name email role")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Event.countDocuments(filter),
    ]);
    response.status(200).json({
      status: "success",
      results: events.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: { events },
    });
  } catch (error) {
    next(error);
  }
};

exports.listBookings = async (request, response, next) => {
  try {
    const page = Math.max(Number.parseInt(request.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(request.query.limit, 10) || 20, 1),
      100,
    );
    if (
      request.query.status &&
      !["pending", "confirmed", "cancelled"].includes(request.query.status)
    ) {
      throw new ApiError(400, "Invalid booking status");
    }
    const filter = request.query.status ? { status: request.query.status } : {};
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("user", "name email avatar")
        .populate("event", "name date")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);
    response.status(200).json({
      status: "success",
      results: bookings.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
};

exports.listComplaints = async (request, response, next) => {
  try {
    const filter = request.query.status ? { status: request.query.status } : {};
    const complaints = await Complaint.find(filter)
      .populate("submittedBy", "name email")
      .populate("resolvedBy", "name email")
      .sort({ createdAt: -1 });
    response.status(200).json({
      status: "success",
      results: complaints.length,
      data: { complaints },
    });
  } catch (error) {
    next(error);
  }
};

exports.resolveComplaint = async (request, response, next) => {
  try {
    const complaint = await Complaint.findOneAndUpdate(
      { _id: request.params.id, status: "open" },
      {
        status: "resolved",
        resolution: request.body.resolution,
        resolvedBy: request.user.id,
        resolvedAt: new Date(),
      },
      { new: true, runValidators: true },
    ).populate("submittedBy", "name email");
    if (!complaint) throw new ApiError(404, "Open complaint not found");
    response.status(200).json({ status: "success", data: { complaint } });
  } catch (error) {
    next(error);
  }
};
