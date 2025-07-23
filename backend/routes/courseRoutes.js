const express = require('express');
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all courses
router.get('/', async (req, res) => {
  const courses = await Course.find();
  res.json(courses);
});

// Add new course (Admin only - you can restrict later)
router.post('/add', async (req, res) => {
  const { name, description, image, level } = req.body;
  try {
    const newCourse = await Course.create({ name, description, image, level });
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(400).json({ msg: 'Error adding course', error: err });
  }
});

module.exports = router;