const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', (req, res) => {
  logger.info('Root endpoint accessed', {}, req);

  const serviceInfo = {
    service: 'Admin Service',
    version: '1.0.0',
    description: 'Admin service for booking management system',
    endpoints: {
      health: '/health',
      root: '/'
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(serviceInfo);
});

module.exports = router;