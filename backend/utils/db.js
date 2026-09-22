const mongoose = require('mongoose');
const config = require('../config');

module.exports = async function connectDatabase() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');
};
