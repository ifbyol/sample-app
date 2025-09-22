const express = require('express');
const logger = require('../utils/logger');
const { getPool } = require('../config/database');

const router = express.Router();

// GET /admin/employee - Retrieve all employees
router.get('/', async (req, res) => {
  try {
    logger.info('Fetching all employees', {}, req);

    const pool = getPool();
    const [rows] = await pool.execute(`
      SELECT id, name, last_name, date_of_hiring, date_of_birthday, position, created_at, updated_at
      FROM employees
      ORDER BY created_at DESC
    `);

    logger.info('Successfully fetched employees', { count: rows.length }, req);
    res.status(200).json({
      success: true,
      count: rows.length,
      employees: rows
    });
  } catch (error) {
    logger.error('Failed to fetch employees', { error: error.message }, req);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve employees'
    });
  }
});

// POST /admin/employee - Create a new employee
router.post('/', async (req, res) => {
  try {
    const { name, last_name, date_of_hiring, date_of_birthday, position } = req.body;

    // Validate required fields
    if (!name || !last_name || !date_of_hiring || !date_of_birthday || !position) {
      logger.warn('Missing required fields for employee creation', { body: req.body }, req);
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Missing required fields: name, last_name, date_of_hiring, date_of_birthday, position'
      });
    }

    // Validate date formats (basic validation)
    const hiringDate = new Date(date_of_hiring);
    const birthdayDate = new Date(date_of_birthday);

    if (isNaN(hiringDate.getTime()) || isNaN(birthdayDate.getTime())) {
      logger.warn('Invalid date format in employee creation', { date_of_hiring, date_of_birthday }, req);
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Invalid date format. Use YYYY-MM-DD format'
      });
    }

    // Validate that hiring date is not before birthday (reasonable business rule)
    if (hiringDate <= birthdayDate) {
      logger.warn('Invalid date logic in employee creation', { date_of_hiring, date_of_birthday }, req);
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Date of hiring must be after date of birthday'
      });
    }

    logger.info('Creating new employee', { name, last_name, position }, req);

    const pool = getPool();
    const [result] = await pool.execute(`
      INSERT INTO employees (name, last_name, date_of_hiring, date_of_birthday, position)
      VALUES (?, ?, ?, ?, ?)
    `, [name, last_name, date_of_hiring, date_of_birthday, position]);

    // Fetch the created employee
    const [newEmployee] = await pool.execute(`
      SELECT id, name, last_name, date_of_hiring, date_of_birthday, position, created_at, updated_at
      FROM employees
      WHERE id = ?
    `, [result.insertId]);

    logger.info('Successfully created employee', { employeeId: result.insertId }, req);
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: newEmployee[0]
    });
  } catch (error) {
    logger.error('Failed to create employee', { error: error.message }, req);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create employee'
    });
  }
});

module.exports = router;