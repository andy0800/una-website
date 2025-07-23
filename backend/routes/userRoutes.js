const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { name, phone, civilId, passportNumber, dateOfBirth, password } = req.body;

  try {
    const exists = await User.findOne({ phone });
    if (exists) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      phone,
      civilId,
      passportNumber,
      dateOfBirth,
      password: hashedPassword
    });

    res.status(201).json({ msg: 'User registered successfully', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ msg: 'Invalid phone or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid phone or password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: { id: user._id, name: user.name, phone: user.phone } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
// Enroll user in course
router.post('/enroll', auth, async (req, res) => {
  const { courseName } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user.courses.includes(courseName)) {
      user.courses.push(courseName);
      await user.save();
    }
    res.json({ msg: 'Enrolled successfully', courses: user.courses });
  } catch (err) {
    res.status(500).json({ msg: 'Enrollment failed' });
  }
});