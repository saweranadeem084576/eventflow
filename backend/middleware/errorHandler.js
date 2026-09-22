const config = require('../config');

module.exports = (error, request, response, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.isOperational || config.env === 'development'
    ? error.message
    : 'Something went wrong';

  if (statusCode >= 500 && config.env !== 'test') {
    console.error(JSON.stringify({ requestId: request.requestId, message: error.message, stack: error.stack }));
  }

  response.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
    requestId: request.requestId,
    ...(config.env === 'development' && { stack: error.stack }),
  });
};
