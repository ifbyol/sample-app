require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const config = require('./config/config');
const { initializeDatabase, closeDatabase } = require('./config/database');
const { baggageMiddleware } = require('./middleware/baggage');
const logger = require('./utils/logger');

// Import routes
const healthRoutes = require('./routes/health');
const indexRoutes = require('./routes/index');
const employeeRoutes = require('./routes/employees');
const complaintRoutes = require('./routes/complaints');

const app = express();

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(baggageMiddleware);

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent')
  }, req);
  next();
});

// Routes
app.use('/', indexRoutes);
app.use('/health', healthRoutes);
app.use('/admin/employee', employeeRoutes);
app.use('/admin/complaint', complaintRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack
  }, req);

  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path
  }, req);

  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await closeDatabase();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    app.listen(config.port, () => {
      logger.info('Admin service started', {
        port: config.port,
        nodeEnv: config.nodeEnv,
        logLevel: config.logLevel
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

startServer();