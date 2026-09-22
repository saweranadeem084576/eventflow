const app = require('./app');
const config = require('./config');
const connectDatabase = require('./utils/db');
const mongoose = require('mongoose');

let server;

const start = async () => {
  try {
    await connectDatabase();
    server = app.listen(config.port, () => console.log(`EventFlow API running on port ${config.port}`));
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    process.exitCode = 1;
  }
};

const shutdown = (signal) => {
  if (!server) return process.exit(0);
  server.close(() => {
    console.log(`${signal}: server closed`);
    mongoose.disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
