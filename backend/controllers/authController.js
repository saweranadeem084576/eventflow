const authService = require("../services/authService");

exports.register = async (request, response, next) => {
  try {
    const result = await authService.register(request.body);
    response.status(201).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

exports.login = async (request, response, next) => {
  try {
    const result = await authService.login(request.body);
    response.status(200).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

exports.logout = (request, response) => {
  response.status(204).send();
};

exports.getMe = (request, response) => {
  response
    .status(200)
    .json({ status: "success", data: { user: request.user } });
};

exports.changePassword = async (request, response, next) => {
  try {
    const result = await authService.changePassword(
      request.user.id,
      request.body.currentPassword,
      request.body.newPassword,
    );
    response.status(200).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (request, response, next) => {
  try {
    await authService.requestPasswordReset(request.body.email);
    response.status(200).json({
      status: "success",
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (request, response, next) => {
  try {
    await authService.resetPassword(
      request.params.token,
      request.body.newPassword,
    );
    response.status(200).json({
      status: "success",
      message: "Password reset successfully. Please log in again.",
    });
  } catch (error) {
    next(error);
  }
};
