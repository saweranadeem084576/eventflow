const ApiError = require("../utils/apiError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config");
const firebaseService = require("./firebaseService");
const crypto = require("node:crypto");
const emailService = require("./emailService");

const createToken = (user) =>
  jwt.sign({ id: user.id, tokenVersion: user.tokenVersion }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

exports.register = async ({ name, email, password, role = "user" }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role,
  });

  return { user, token: createToken(user) };
};

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+passwordHash",
  );
  const passwordMatches =
    user && (await bcrypt.compare(password, user.passwordHash));

  if (!passwordMatches) {
    throw new ApiError(401, "Incorrect email or password");
  }

  return { user, token: createToken(user) };
};

exports.changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new ApiError(404, "User not found");

  const currentPasswordMatches = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );
  if (!currentPasswordMatches)
    throw new ApiError(401, "Current password is incorrect");
  if (currentPassword === newPassword)
    throw new ApiError(400, "New password must be different");

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.tokenVersion += 1;
  await user.save();
  return { user, token: createToken(user) };
};

exports.requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  user.passwordResetTokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  await emailService.sendPasswordReset(user.email, token);
};

exports.resetPassword = async (token, newPassword) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpiresAt");
  if (!user)
    throw new ApiError(400, "Password reset token is invalid or expired");

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.tokenVersion += 1;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();
};

exports.getUserFromToken = async (token) => {
  let payload;

  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    if (firebaseService.isConfigured())
      return exports.getUserFromFirebaseToken(token);
    throw new ApiError(401, "Invalid or expired authentication token");
  }

  const user = await User.findById(payload.id);
  if (!user)
    throw new ApiError(401, "The account for this token no longer exists");
  if (payload.tokenVersion !== user.tokenVersion)
    throw new ApiError(401, "Authentication token is no longer valid");

  return user;
};

exports.getUserFromFirebaseToken = async (token) => {
  const decoded = await firebaseService.verifyIdToken(token);
  let user = await User.findOne({ firebaseUid: decoded.uid });
  if (!user && decoded.email)
    user = await User.findOne({ email: decoded.email.toLowerCase() });
  if (!user) {
    user = await User.create({
      name: decoded.name || decoded.email?.split("@")[0] || "Firebase user",
      email: decoded.email?.toLowerCase() || `${decoded.uid}@firebase.local`,
      firebaseUid: decoded.uid,
    });
  } else if (user.firebaseUid !== decoded.uid) {
    user.firebaseUid = decoded.uid;
    await user.save();
  }
  return user;
};
