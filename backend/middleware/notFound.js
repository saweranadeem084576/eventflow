const ApiError = require('../utils/apiError');

module.exports = (request, response, next) => {
  next(new ApiError(404, `Route not found: ${request.method} ${request.originalUrl}`));
};
