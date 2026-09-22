const crypto = require('node:crypto');

module.exports = (request, response, next) => {
  const requestId = request.get('x-request-id') || crypto.randomUUID();
  request.requestId = requestId;
  response.setHeader('x-request-id', requestId);
  const startedAt = Date.now();

  response.on('finish', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify({
        requestId,
        method: request.method,
        path: request.originalUrl,
        status: response.statusCode,
        durationMs: Date.now() - startedAt,
      }));
    }
  });
  next();
};