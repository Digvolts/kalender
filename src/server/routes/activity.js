// src/server/routes/activities.js

const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');

// Get all activities for a user on a specific date
router.get('/', auth, [
  query('date').isDate().withMessage('Valid date is required'),
  query('userId').isInt().withMessage('Valid user ID is required')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { date, userId } = req.query;

  // Ensure the authenticated user is requesting their own data
  if (parseInt(userId) !== req.user.id) {
    return res.status(403).json({ message: 'Unauthorized to access this data' });
  }

  try {
    // Convert date to YYYY-MM-DD format for MySQL comparison
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    // Query activities for the specified date
    const [activities] = await db.query(
      'SELECT * FROM activities WHERE DATE(date) = ? AND userId = ?',
      [formattedDate, userId]
    );

    res.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Server error fetching activities' });
  }
});

// Get all dates with activities for a user
router.get('/dates', auth, [
  query('userId').isInt().withMessage('Valid user ID is required')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId } = req.query;

  // Ensure the authenticated user is requesting their own data
  if (parseInt(userId) !== req.user.id) {
    return res.status(403).json({ message: 'Unauthorized to access this data' });
  }

  try {
    // Query all distinct dates with activities
    const [results] = await db.query(
      'SELECT DISTINCT DATE(date) as activityDate FROM activities WHERE userId = ?',
      [userId]
    );

    // Format dates as YYYY-MM-DD strings
    const dates = results.map(result => result.activityDate.toISOString().split('T')[0]);

    res.json({ dates });
  } catch (error) {
    console.error('Error fetching activity dates:', error);
    res.status(500).json({ message: 'Server error fetching activity dates' });
  }
});

// Create a new activity
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('date').isISO8601().withMessage('Valid ISO date is required'),
  body('userId').isInt().withMessage('Valid user ID is required')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, date, userId } = req.body;

  // Ensure the authenticated user is creating data for themselves
  if (parseInt(userId) !== req.user.id) {
    return res.status(403).json({ message: 'Unauthorized to create data for another user' });
  }

  try {
    // Insert the new activity
    const [result] = await db.query(
      'INSERT INTO activities (title, description, date, userId) VALUES (?, ?, ?, ?)',
      [title, description || '', date, userId]
    );

    // Return the created activity
    const activity = {
      id: result.insertId,
      title,
      description: description || '',
      date,
      userId
    };

    res.status(201).json({ activity });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ message: 'Server error creating activity' });
  }
});

// Update an activity
router.put('/:id', auth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('date').isISO8601().withMessage('Valid ISO date is required')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { title, description, date } = req.body;

  try {
    // First, check if the activity exists and belongs to the user
    const [activities] = await db.query(
      'SELECT * FROM activities WHERE id = ?',
      [id]
    );

    if (activities.length === 0) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Check ownership
    if (activities[0].userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this activity' });
    }

    // Update the activity
    await db.query(
      'UPDATE activities SET title = ?, description = ?, date = ? WHERE id = ?',
      [title, description || '', date, id]
    );

    // Return the updated activity
    const updatedActivity = {
      id: parseInt(id),
      title,
      description: description || '',
      date,
      userId: req.user.id
    };

    res.json({ activity: updatedActivity });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Server error updating activity' });
  }
});

// Delete an activity
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    // First, check if the activity exists and belongs to the user
    const [activities] = await db.query(
      'SELECT * FROM activities WHERE id = ?',
      [id]
    );

    if (activities.length === 0) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Check ownership
    if (activities[0].userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this activity' });
    }

    // Delete the activity
    await db.query('DELETE FROM activities WHERE id = ?', [id]);

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'Server error deleting activity' });
  }
});

module.exports = router;