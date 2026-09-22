const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1600&q=85",
      trim: true,
    },
    images: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    bookedSeats: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["pending", "published", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

eventSchema.index({ name: "text", description: "text", category: "text" });
eventSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model("Event", eventSchema);
