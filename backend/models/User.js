const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatar: { type: String, trim: true },
    passwordHash: { type: String, select: false },
    tokenVersion: { type: Number, default: 0 },
    role: {
      type: String,
      enum: ["user", "organizer", "admin"],
      default: "user",
    },
    firebaseUid: { type: String, unique: true, sparse: true },
    fcmTokens: { type: [String], default: [] },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.methods.toJSON = function toJSON() {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.__v;
  return user;
};

userSchema.index({ role: 1, createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
