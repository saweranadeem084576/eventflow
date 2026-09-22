const ApiError = require('../utils/apiError');

module.exports = (schema) => (request, response, next) => {
  const result = schema.safeParse({ body: request.body, params: request.params, query: request.query });
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.') || 'request');
    return next(new ApiError(400, `Invalid request: ${fields.join(', ')}`));
  }

  request.body = result.data.body;
  request.params = result.data.params;
  request.query = result.data.query;
  next();
};