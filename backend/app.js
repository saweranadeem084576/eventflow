const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const apiRoutes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const app = express();

// Uploaded images are served to the separate frontend origin, so relax CORP for static files.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: "*", credentials: true }));
app.use('/uploads', express.static(config.uploadsDir, { maxAge: '7d', immutable: true }));
app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), require('./controllers/paymentController').webhook);
app.use(express.json({ limit: '10kb' }));
app.use(requestLogger);
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(rateLimit({ windowMs: config.rateLimitWindowMs, limit: config.rateLimitMax }));

app.get('/health', (request, response) => response.status(200).json({ status: 'success' }));
app.use('/api/v1', apiRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
