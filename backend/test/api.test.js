process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
// Keep the suite independent of the developer's local .env (dotenv never overrides these).
process.env.STRIPE_SECRET_KEY = "";
process.env.STRIPE_WEBHOOK_SECRET = "";
process.env.FIREBASE_SERVICE_ACCOUNT_JSON = "";
process.env.UPLOADS_DIR = require("node:path").join(require("node:os").tmpdir(), "eventflow-test-uploads");

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const mongoose = require("mongoose");
const sharp = require("sharp");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const User = require("../models/User");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Feedback = require("../models/Feedback");
const Notification = require("../models/Notification");
const Complaint = require("../models/Complaint");
const paymentService = require("../services/paymentService");

let mongoServer;

const eventData = (overrides = {}) => ({
  name: "Community Conference",
  description: "A useful event for the community",
  date: new Date(Date.now() + 86_400_000).toISOString(),
  location: "Lahore",
  category: "Technology",
  price: 25,
  capacity: 2,
  ...overrides,
});

const register = async (overrides = {}) => {
  const credentials = {
    name: "Test User",
    email: `user-${Date.now()}-${Math.random()}@example.com`,
    password: "password123",
    ...overrides,
  };
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send(credentials);
  assert.equal(response.status, 201);
  return { ...credentials, ...response.body.data };
};

const makeAdmin = async () => {
  const account = await register({ name: "Administrator" });
  await User.findByIdAndUpdate(account.user._id, { role: "admin" });
  return account;
};

const createPublishedEvent = async (overrides = {}) =>
  Event.create({
    organizer: new mongoose.Types.ObjectId(),
    status: "published",
    ...eventData(overrides),
  });

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

test.beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Booking.deleteMany({}),
    Feedback.deleteMany({}),
    Notification.deleteMany({}),
    Complaint.deleteMany({}),
  ]);
});

test.after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await fs.rm(process.env.UPLOADS_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
});

test("users upload an avatar that is resized and served, and invalid files are rejected", async () => {
  const user = await register();
  const image = await sharp({
    create: { width: 900, height: 600, channels: 3, background: "#3366ff" },
  })
    .png()
    .toBuffer();

  const uploaded = await request(app)
    .post("/api/v1/users/me/avatar")
    .set("Authorization", `Bearer ${user.token}`)
    .attach("avatar", image, "photo.png");
  assert.equal(uploaded.status, 200);
  const avatar = uploaded.body.data.user.avatar;
  assert.match(avatar, /^\/uploads\/avatars\/.+\.webp$/);

  const file = path.join(process.env.UPLOADS_DIR, avatar.replace("/uploads/", ""));
  // Read into a buffer so sharp does not keep the file handle open on Windows.
  const meta = await sharp(await fs.readFile(file)).metadata();
  assert.deepEqual([meta.width, meta.height, meta.format], [256, 256, "webp"]);

  const served = await request(app).get(avatar);
  assert.equal(served.status, 200);
  assert.equal(served.headers["cross-origin-resource-policy"], "cross-origin");

  const rejected = await request(app)
    .post("/api/v1/users/me/avatar")
    .set("Authorization", `Bearer ${user.token}`)
    .attach("avatar", Buffer.from("not an image"), "notes.txt");
  assert.equal(rejected.status, 400);
});

test("health endpoint responds successfully", async () => {
  const response = await request(app).get("/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "success");

  const readiness = await request(app).get("/api/v1/ready");
  assert.equal(readiness.status, 200);
  assert.equal(readiness.body.data.database, "connected");
});

test("registration, login, protected access, and password rotation work", async () => {
  const account = await register();
  const me = await request(app)
    .get("/api/v1/auth/me")
    .set("Authorization", `Bearer ${account.token}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.email, account.email);

  const changed = await request(app)
    .patch("/api/v1/auth/password")
    .set("Authorization", `Bearer ${account.token}`)
    .send({ currentPassword: account.password, newPassword: "newpassword123" });
  assert.equal(changed.status, 200);

  const stale = await request(app)
    .get("/api/v1/auth/me")
    .set("Authorization", `Bearer ${account.token}`);
  assert.equal(stale.status, 401);

  const login = await request(app).post("/api/v1/auth/login").send({
    email: account.email,
    password: "newpassword123",
  });
  assert.equal(login.status, 200);
  assert.ok(login.body.data.token);
});

test("registration cannot self-assign the admin role", async () => {
  const response = await request(app).post("/api/v1/auth/register").send({
    name: "Sneaky",
    email: "sneaky@example.com",
    password: "password123",
    role: "admin",
  });
  assert.equal(response.status, 400);
});

test("organizers create pending events and admins approve them", async () => {
  const organizer = await register({ name: "Organizer", role: "organizer" });
  const admin = await makeAdmin();
  const created = await request(app)
    .post("/api/v1/events")
    .set("Authorization", `Bearer ${organizer.token}`)
    .send(eventData());
  assert.equal(created.status, 201);
  assert.equal(created.body.data.event.status, "pending");

  const hidden = await request(app).get("/api/v1/events?search=Community");
  assert.equal(hidden.body.results, 0);

  const mine = await request(app)
    .get("/api/v1/events/mine")
    .set("Authorization", `Bearer ${organizer.token}`);
  assert.equal(mine.status, 200);
  assert.equal(mine.body.results, 1);

  const approved = await request(app)
    .patch(`/api/v1/admin/events/${created.body.data.event._id}/approve`)
    .set("Authorization", `Bearer ${admin.token}`);
  assert.equal(approved.status, 200);
  assert.equal(approved.body.data.event.status, "published");

  const listed = await request(app).get("/api/v1/events?search=Community");
  assert.equal(listed.status, 200);
  assert.equal(listed.body.results, 1);

  const byCategory = await request(app).get("/api/v1/events?category=technology");
  assert.equal(byCategory.body.results, 1);
});

test("event updates enforce organizer ownership", async () => {
  const organizer = await register({ name: "Owner", role: "organizer" });
  const otherOrganizer = await register({ name: "Other Owner", role: "organizer" });
  const created = await request(app)
    .post("/api/v1/events")
    .set("Authorization", `Bearer ${organizer.token}`)
    .send(eventData());

  const response = await request(app)
    .patch(`/api/v1/events/${created.body.data.event._id}`)
    .set("Authorization", `Bearer ${otherOrganizer.token}`)
    .send({ name: "Unauthorized update" });
  assert.equal(response.status, 403);
});

test("organizers see registrations, updates notify attendees, and booked events cannot be deleted", async () => {
  const organizer = await register({ name: "Owner", role: "organizer" });
  const attendee = await register();
  const created = await request(app)
    .post("/api/v1/events")
    .set("Authorization", `Bearer ${organizer.token}`)
    .send(eventData({ price: 0 }));
  const eventId = created.body.data.event._id;
  await Event.updateOne({ _id: eventId }, { status: "published" });

  const booked = await request(app)
    .post("/api/v1/bookings")
    .set("Authorization", `Bearer ${attendee.token}`)
    .send({ event: eventId });
  assert.equal(booked.status, 201);

  const registrations = await request(app)
    .get(`/api/v1/events/${eventId}/bookings`)
    .set("Authorization", `Bearer ${organizer.token}`);
  assert.equal(registrations.status, 200);
  assert.equal(registrations.body.results, 1);
  assert.equal(registrations.body.data.bookings[0].user.email, attendee.email);

  const updated = await request(app)
    .patch(`/api/v1/events/${eventId}`)
    .set("Authorization", `Bearer ${organizer.token}`)
    .send({ location: "New venue" });
  assert.equal(updated.status, 200);
  const notified = await Notification.countDocuments({ type: "event_updated" });
  assert.equal(notified, 1);

  const blocked = await request(app)
    .delete(`/api/v1/events/${eventId}`)
    .set("Authorization", `Bearer ${organizer.token}`);
  assert.equal(blocked.status, 409);
});

test("bookings enforce capacity, support history, and release seats on cancellation", async () => {
  const firstUser = await register();
  const secondUser = await register();
  const event = await createPublishedEvent({ capacity: 1 });

  const firstBooking = await request(app)
    .post("/api/v1/bookings")
    .set("Authorization", `Bearer ${firstUser.token}`)
    .send({ event: event.id });
  assert.equal(firstBooking.status, 201);

  const soldOut = await request(app)
    .post("/api/v1/bookings")
    .set("Authorization", `Bearer ${secondUser.token}`)
    .send({ event: event.id });
  assert.equal(soldOut.status, 409);

  const history = await request(app)
    .get("/api/v1/bookings")
    .set("Authorization", `Bearer ${firstUser.token}`);
  assert.equal(history.status, 200);
  assert.equal(history.body.results, 1);

  const cancelled = await request(app)
    .patch(`/api/v1/bookings/${firstBooking.body.data.booking._id}/cancel`)
    .set("Authorization", `Bearer ${firstUser.token}`);
  assert.equal(cancelled.status, 200);

  const replacement = await request(app)
    .post("/api/v1/bookings")
    .set("Authorization", `Bearer ${secondUser.token}`)
    .send({ event: event.id });
  assert.equal(replacement.status, 201);
});

test("feedback requires a confirmed past-event booking and prevents duplicates", async () => {
  const user = await register();
  const event = await createPublishedEvent({
    date: new Date(Date.now() - 86_400_000),
  });
  const userDocument = await User.findOne({ email: user.email });
  await Booking.create({
    event: event.id,
    user: userDocument.id,
    status: "confirmed",
  });

  const submitted = await request(app)
    .post("/api/v1/feedback")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ event: event.id, rating: 5, comment: "Excellent event" });
  assert.equal(submitted.status, 201);

  const duplicate = await request(app)
    .post("/api/v1/feedback")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ event: event.id, rating: 4 });
  assert.equal(duplicate.status, 409);

  const listed = await request(app).get(`/api/v1/feedback/event/${event.id}`);
  assert.equal(listed.status, 200);
  assert.equal(listed.body.data.summary.averageRating, 5);
});

test("notifications can be listed and marked as read", async () => {
  const user = await register();
  const userDocument = await User.findOne({ email: user.email });
  await Notification.create({
    recipient: userDocument.id,
    type: "booking_confirmed",
    title: "Booking confirmed",
    message: "Your booking is confirmed",
  });

  const listed = await request(app)
    .get("/api/v1/notifications?unread=true")
    .set("Authorization", `Bearer ${user.token}`);
  assert.equal(listed.status, 200);
  assert.equal(listed.body.data.unread, 1);

  const notificationId = listed.body.data.notifications[0]._id;
  const read = await request(app)
    .patch(`/api/v1/notifications/${notificationId}/read`)
    .set("Authorization", `Bearer ${user.token}`);
  assert.equal(read.status, 200);
  assert.ok(read.body.data.notification.readAt);
});

test("authenticated users can register valid device tokens", async () => {
  const user = await register();
  const token = "fcm-device-token-12345678901234567890";

  const registered = await request(app)
    .post("/api/v1/notifications/devices")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ token });
  assert.equal(registered.status, 204);

  const invalid = await request(app)
    .post("/api/v1/notifications/devices")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ token: "short" });
  assert.equal(invalid.status, 400);

  const stored = await User.findOne({ email: user.email });
  assert.deepEqual(stored.fcmTokens, [token]);
});

test("admin overview, user management, and complaint resolution work", async () => {
  const user = await register();
  const admin = await makeAdmin();
  const complaint = await request(app)
    .post("/api/v1/complaints")
    .set("Authorization", `Bearer ${user.token}`)
    .send({
      subject: "Support request",
      description: "Please investigate this issue.",
    });
  assert.equal(complaint.status, 201);

  const mine = await request(app)
    .get("/api/v1/complaints")
    .set("Authorization", `Bearer ${user.token}`);
  assert.equal(mine.status, 200);
  assert.equal(mine.body.results, 1);

  const overview = await request(app)
    .get("/api/v1/admin/overview")
    .set("Authorization", `Bearer ${admin.token}`);
  assert.equal(overview.status, 200);
  assert.equal(overview.body.data.openComplaints, 1);

  const resolved = await request(app)
    .patch(
      `/api/v1/admin/complaints/${complaint.body.data.complaint._id}/resolve`,
    )
    .set("Authorization", `Bearer ${admin.token}`)
    .send({ resolution: "Issue reviewed and resolved." });
  assert.equal(resolved.status, 200);
  assert.equal(resolved.body.data.complaint.status, "resolved");

  const users = await request(app)
    .get("/api/v1/users")
    .set("Authorization", `Bearer ${admin.token}`);
  assert.equal(users.status, 200);
  assert.equal(users.body.results, 2);
});

test("payment webhook rejects unconfigured provider requests", async () => {
  const response = await request(app)
    .post("/api/v1/payments/webhook")
    .set("Content-Type", "application/json")
    .set("stripe-signature", "invalid")
    .send(JSON.stringify({ type: "payment_intent.succeeded" }));
  assert.equal(response.status, 503);
});

test("free event bookings are confirmed immediately without payment", async () => {
  const user = await register();
  const event = await createPublishedEvent({ price: 0 });

  const booking = await request(app)
    .post("/api/v1/bookings")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ event: event.id });
  assert.equal(booking.status, 201);
  assert.equal(booking.body.data.booking.status, "confirmed");

  const notifications = await Notification.countDocuments();
  assert.equal(notifications, 1);

  const payment = await request(app)
    .post("/api/v1/payments/intent")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ booking: booking.body.data.booking._id });
  assert.equal(payment.status, 400);
});

test("concurrent payment intent requests reuse one payment", async (t) => {
  const user = await register();
  const event = await createPublishedEvent({ price: 30 });
  const booking = await request(app)
    .post("/api/v1/bookings")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ event: event.id });

  let created = 0;
  t.mock.method(paymentService, "createPaymentIntent", async () => {
    created += 1;
    return { id: `pi_race_${created}`, client_secret: `secret_${created}` };
  });
  t.mock.method(paymentService, "confirmPayment", async (id) => ({
    id,
    client_secret: `secret_for_${id}`,
    status: "requires_payment_method",
  }));
  t.mock.method(paymentService, "cancelPaymentIntent", async () => ({ status: "canceled" }));

  const intent = () =>
    request(app)
      .post("/api/v1/payments/intent")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ booking: booking.body.data.booking._id });

  const [first, second] = await Promise.all([intent(), intent()]);
  assert.ok(first.status < 400 && second.status < 400, "neither request should error");
  assert.equal(first.body.data.paymentId, second.body.data.paymentId);
  assert.equal(await Payment.countDocuments({ booking: booking.body.data.booking._id }), 1);
});

test("failed payment webhooks cancel the booking and release capacity", async (t) => {
  const user = await register();
  const userDocument = await User.findOne({ email: user.email });
  const event = await createPublishedEvent({ capacity: 1 });
  await Event.updateOne({ _id: event.id }, { bookedSeats: 1 });
  const booking = await Booking.create({
    event: event.id,
    user: userDocument.id,
  });
  const payment = await Payment.create({
    booking: booking.id,
    user: userDocument.id,
    providerPaymentId: "pi_failed_test",
    amount: event.price,
  });

  t.mock.method(paymentService, "constructWebhookEvent", () => ({
    type: "payment_intent.payment_failed",
    data: { object: { id: payment.providerPaymentId } },
  }));

  const response = await request(app)
    .post("/api/v1/payments/webhook")
    .set("Content-Type", "application/json")
    .set("stripe-signature", "test-signature")
    .send(JSON.stringify({ type: "payment_intent.payment_failed" }));
  assert.equal(response.status, 200);

  const [updatedPayment, updatedBooking, updatedEvent] = await Promise.all([
    Payment.findById(payment.id),
    Booking.findById(booking.id),
    Event.findById(event.id),
  ]);
  assert.equal(updatedPayment.status, "failed");
  assert.equal(updatedBooking.status, "cancelled");
  assert.equal(updatedEvent.bookedSeats, 0);
});

test("paid booking cancellation refunds before releasing capacity", async (t) => {
  const user = await register();
  const userDocument = await User.findOne({ email: user.email });
  const event = await createPublishedEvent({ capacity: 1 });
  await Event.updateOne({ _id: event.id }, { bookedSeats: 1 });
  const booking = await Booking.create({
    event: event.id,
    user: userDocument.id,
    status: "confirmed",
  });
  const payment = await Payment.create({
    booking: booking.id,
    user: userDocument.id,
    providerPaymentId: "pi_paid_test",
    amount: event.price,
    status: "succeeded",
  });

  t.mock.method(paymentService, "refundPayment", async () => ({
    id: "re_test",
    status: "succeeded",
  }));

  const response = await request(app)
    .patch(`/api/v1/bookings/${booking.id}/cancel`)
    .set("Authorization", `Bearer ${user.token}`);
  assert.equal(response.status, 200);

  const [updatedPayment, updatedBooking, updatedEvent] = await Promise.all([
    Payment.findById(payment.id),
    Booking.findById(booking.id),
    Event.findById(event.id),
  ]);
  assert.equal(updatedPayment.status, "refunded");
  assert.equal(updatedPayment.providerRefundId, "re_test");
  assert.equal(updatedBooking.status, "cancelled");
  assert.equal(updatedEvent.bookedSeats, 0);
});

test("write routes reject malformed payloads with a validation error", async () => {
  const registration = await request(app)
    .post("/api/v1/auth/register")
    .send({ name: "", email: "not-an-email", password: "short" });
  assert.equal(registration.status, 400);

  const user = await register();
  const booking = await request(app)
    .post("/api/v1/bookings")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ event: "invalid-id" });
  assert.equal(booking.status, 400);
});

test("password reset does not reveal unknown accounts and rejects invalid tokens", async () => {
  const requestReset = await request(app)
    .post("/api/v1/auth/forgot-password")
    .send({ email: "missing@example.com" });
  assert.equal(requestReset.status, 200);
  assert.match(requestReset.body.message, /reset link has been sent/i);

  const reset = await request(app)
    .patch(`/api/v1/auth/reset-password/${"a".repeat(64)}`)
    .send({ newPassword: "newpassword123" });
  assert.equal(reset.status, 400);
});
