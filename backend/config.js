const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config();

const required = ["MONGODB_URI", "JWT_SECRET"];

if (process.env.NODE_ENV === "production") {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/event-flow",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "development-only-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "",
  uploadsDir: process.env.UPLOADS_DIR || path.join(__dirname, "uploads"),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 1000,
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    from: process.env.SMTP_FROM || "EventFlow <no-reply@example.com>",
  },
  passwordResetUrl:
    process.env.PASSWORD_RESET_URL || "http://localhost:5173/reset-password",
};
