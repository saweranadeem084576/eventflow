const ApiError = require('../utils/apiError');
const authService = require('../services/authService');

exports.protect = async (request, response, next) => {
  try {
    const authorization = request.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication is required');
    }

    request.user = await authService.getUserFromToken(authorization.slice(7).trim());
    next();
  } catch (error) {
    next(error);
  }
};

exports.restrictTo = (...roles) => (request, response, next) => {
  if (!request.user || !roles.includes(request.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};
