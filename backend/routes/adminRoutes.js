const express = require("express");
const controller = require("../controllers/adminController");
const { protect, restrictTo } = require("../middleware/auth");
const validate = require("../middleware/validate");
const schemas = require("../utils/schemas");

const router = express.Router();

router.use(protect, restrictTo("admin"));
router.get("/overview", controller.overview);
router.get("/events", controller.listEvents);
router.patch("/events/:id/approve", controller.approveEvent);
router.get("/bookings", controller.listBookings);
router.get("/complaints", controller.listComplaints);
router.patch(
  "/complaints/:id/resolve",
  validate(schemas.complaintResolve),
  controller.resolveComplaint,
);

module.exports = router;
