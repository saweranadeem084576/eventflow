exports.getHealth = (request, response) => {
  response.status(200).json({
    status: 'success',
    data: {
      service: 'event-flow-api',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    },
  });
};

exports.getReadiness = (request, response) => {
  const mongoose = require('mongoose');
  const ready = mongoose.connection.readyState === 1;
  response.status(ready ? 200 : 503).json({
    status: ready ? 'success' : 'fail',
    data: { database: ready ? 'connected' : 'disconnected' },
  });
};
