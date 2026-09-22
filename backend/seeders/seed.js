require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const config = require("../config");
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const Feedback = require("../models/Feedback");
const Notification = require("../models/Notification");
const Payment = require("../models/Payment");
const User = require("../models/User");
const imageService = require("../services/imageService");
const demoUsers = require("./users");
const { upcoming, past } = require("./events");

const demoPassword = process.env.SEED_DEMO_PASSWORD || "EventFlowDemo123!";
const demoEmails = demoUsers.map((user) => user.email);

// Event data is fully replaced on every run; demo accounts are upserted.
const clearEventData = () =>
  Promise.all([
    Event.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Feedback.deleteMany({}),
    Notification.deleteMany({}),
  ]);

// Downloads a portrait and stores it exactly as a user upload would be.
async function attachPortrait(user, url) {
  if (user.avatar) return false;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    user.avatar = await imageService.saveAvatar(Buffer.from(await response.arrayBuffer()), user.id);
    await user.save();
    return true;
  } catch (error) {
    console.warn(`  portrait skipped for ${user.email}: ${error.message}`);
    return false;
  }
}

async function seed() {
  await mongoose.connect(config.mongoUri);

  if (process.argv.includes("--clear")) {
    await clearEventData();
    const users = await User.find({ email: { $in: demoEmails } }).select("avatar");
    await Promise.all(users.map((user) => imageService.removeUpload(user.avatar)));
    await User.deleteMany({ email: { $in: demoEmails } });
    console.log("Demo data cleared");
    return;
  }

  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const users = [];
  let portraits = 0;
  for (const { portrait, ...data } of demoUsers) {
    const user = await User.findOneAndUpdate(
      { email: data.email },
      { ...data, passwordHash },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (await attachPortrait(user, portrait)) portraits += 1;
    users.push(user);
  }
  const attendees = users.filter((user) => user.role === "user");
  const organizer = users.find((user) => user.role === "organizer");

  await clearEventData();
  await Event.insertMany(
    upcoming.map((event) => ({ ...event, organizer: organizer.id, status: "published" })),
  );

  // Past events come with confirmed bookings and reviews so ratings and stories are populated.
  let reviewCount = 0;
  for (const { reviews, ...event } of past) {
    const saved = await Event.create({
      ...event,
      organizer: organizer.id,
      status: "published",
      bookedSeats: reviews.length,
    });
    for (const review of reviews) {
      const user = attendees[review.user];
      await Booking.create({ event: saved.id, user: user.id, status: "confirmed" });
      await Feedback.create({ event: saved.id, user: user.id, rating: review.rating, comment: review.comment });
      reviewCount += 1;
    }
  }

  console.log(`Seeded users: ${users.length} (${portraits} new portraits downloaded)`);
  console.log(`Demo password: ${demoPassword}`);
  console.log(`Seeded events: ${upcoming.length} upcoming, ${past.length} past with ${reviewCount} reviews`);
}

seed()
  .catch((error) => {
    console.error(`Seeding failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
