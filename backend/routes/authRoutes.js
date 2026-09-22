const express = require("express");
const controller = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const schemas = require("../utils/schemas");

const router = express.Router();

router.post("/register", validate(schemas.register), controller.register);
router.post("/login", validate(schemas.login), controller.login);
router.post(
  "/forgot-password",
  validate(schemas.forgotPassword),
  controller.forgotPassword,
);
router.patch(
  "/reset-password/:token",
  validate(schemas.resetPassword),
  controller.resetPassword,
);
router.post("/logout", controller.logout);
router.get("/me", protect, controller.getMe);
router.patch(
  "/password",
  protect,
  validate(schemas.changePassword),
  controller.changePassword,
);

module.exports = router;
