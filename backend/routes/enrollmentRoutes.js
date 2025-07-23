const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Enrollment = require('../models/Enrollment');

router.post('/', auth, async (req, res) => {
  const { courseName } = req.body;
  try {
    const enrollment = new Enrollment({
      user: req.user.id,
      courseName,
    });
    await enrollment.save();
    res.status(201).json({ message: 'Enrolled successfully', enrollment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;