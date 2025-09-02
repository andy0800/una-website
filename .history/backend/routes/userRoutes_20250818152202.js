const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();
const verifyUserToken = require('../middleware/verifyUserToken');

// Register
router.post('/register', async (req, res) => {
  const { name, phone, civilId, passportNumber, dateOfBirth, password } = req.body;

  try {
    const exists = await User.findOne({ phone });
    if (exists) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);


    const newUser = new User({
      name,
      phone,
      civilId,
      passportNumber,
      dateOfBirth,
      password: hashedPassword,
      level: '',
      courses: [],
      certificates: []
    });

    await newUser.save();

    res.status(201).json({ message: 'Registration successful!' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});


// Login
router.post('/login', async (req, res) => {
  const { phone , password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Phone and password required' });
  }

  const user = await User.findOne({ phone });
  if (!user) return res.status(400).json({ message: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });

  res.json({ token });
});

// Get current user info
router.get('/me', verifyUserToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enroll user in course
router.post('/enroll', verifyUserToken, async (req, res) => {
  const { courseName } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user.courses.includes(courseName)) {
      user.courses.push(courseName);
      await user.save();
    }
    res.json({ msg: 'Enrolled successfully', courses: user.courses });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ msg: 'Enrollment failed' });
  }
});
const path = require('path');
// Protect English livestream
router.get('/frontend/en/livestream.html', verifyUserToken, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/en/livestream.html'));
});

// Protect Arabic livestream
router.get('/frontend/ar/livestream.html', verifyUserToken, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/en/livestream.html'));
});

module.exports = router;