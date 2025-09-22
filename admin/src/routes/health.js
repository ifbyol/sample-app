const express = require('express');
const logger = require('../utils/logger');
const { getPool } = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    logger.info('Health check requested', {}, req);

    // Check database connection
    const pool = getPool();
    const [rows] = await pool.execute('SELECT 1 as health_check');

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'admin',
      version: '1.0.0',
      database: 'connected'
    };

    logger.info('Health check successful', { healthStatus }, req);
    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed', { error: error.message }, req);

    const healthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'admin',
      version: '1.0.0',
      database: 'disconnected',
      error: error.message
    };

    res.status(503).json(healthStatus);
  }
});

module.exports = router;