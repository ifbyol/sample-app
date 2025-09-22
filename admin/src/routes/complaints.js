const express = require('express');
const logger = require('../utils/logger');
const { getPool } = require('../config/database');

const router = express.Router();

// GET /admin/complaint - Retrieve all complaints
router.get('/', async (req, res) => {
  try {
    logger.info('Fetching all complaints', {}, req);

    const pool = getPool();
    const [rows] = await pool.execute(`
      SELECT id, customer, date, text, created_at, updated_at
      FROM complaints
      ORDER BY date DESC, created_at DESC
    `);

    logger.info('Successfully fetched complaints', { count: rows.length }, req);
    res.status(200).json({
      success: true,
      count: rows.length,
      complaints: rows
    });
  } catch (error) {
    logger.error('Failed to fetch complaints', { error: error.message }, req);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve complaints'
    });
  }
});

// POST /admin/complaint - Create a new complaint
router.post('/', async (req, res) => {
  try {
    const { customer, date, text } = req.body;

    // Validate required fields
    if (!customer || !date || !text) {
      logger.warn('Missing required fields for complaint creation', { body: req.body }, req);
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Missing required fields: customer, date, text'
      });
    }

    // Validate date format
    const complaintDate = new Date(date);
    if (isNaN(complaintDate.getTime())) {
      logger.warn('Invalid date format in complaint creation', { date }, req);
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Invalid date format. Use YYYY-MM-DD format'
      });
    }

    // Validate that complaint date is not in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    if (complaintDate > today) {
      logger.warn('Future date in complaint creation', { date }, req);
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Complaint date cannot be in the future'
      });
    }

    // Validate text length
    if (text.length < 10) {
      logger.warn('Complaint text too short', { textLength: text.length }, req);
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Complaint text must be at least 10 characters long'
      });
    }

    if (text.length > 5000) {
      logger.warn('Complaint text too long', { textLength: text.length }, req);
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Complaint text cannot exceed 5000 characters'
      });
    }

    // Validate customer name length
    if (customer.length < 2 || customer.length > 255) {
      logger.warn('Invalid customer name length', { customerLength: customer.length }, req);
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Customer name must be between 2 and 255 characters'
      });
    }

    logger.info('Creating new complaint', { customer, date }, req);

    const pool = getPool();
    const [result] = await pool.execute(`
      INSERT INTO complaints (customer, date, text)
      VALUES (?, ?, ?)
    `, [customer, date, text]);

    // Fetch the created complaint
    const [newComplaint] = await pool.execute(`
      SELECT id, customer, date, text, created_at, updated_at
      FROM complaints
      WHERE id = ?
    `, [result.insertId]);

    logger.info('Successfully created complaint', { complaintId: result.insertId }, req);
    res.status(201).json({
      success: true,
      message: 'Complaint created successfully',
      complaint: newComplaint[0]
    });
  } catch (error) {
    logger.error('Failed to create complaint', { error: error.message }, req);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create complaint'
    });
  }
});

module.exports = router;