const express = require('express');
require('express-async-errors'); // Handle async errors automatically

const { baggageMiddleware } = require('./middleware/baggage');
const { createContextLogger } = require('./utils/logger');
const paymentsRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply baggage middleware to all routes
app.use(baggageMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  const log = createContextLogger(req);
  log.info('Incoming request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type')
  });
  next();
});

// Routes
app.use('/', paymentsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  const log = createContextLogger(req);
  log.info('Root endpoint accessed');

  res.json({
    service: 'payments-service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      processPayment: 'POST /process-payment'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const log = createContextLogger(req);
  log.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  const log = createContextLogger(req);
  log.warn('Route not found', {
    url: req.originalUrl,
    method: req.method
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  const log = createContextLogger();
  log.info('Payments service started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
  console.log(`Payments service listening on port ${PORT}`);
});

module.exports = app;