const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// Public endpoint to get all courses (for profile page)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().select('_id name color');
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

module.exports = router;