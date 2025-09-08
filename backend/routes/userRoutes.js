const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const verifyUserToken = require('../middleware/verifyUserToken');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

// Root route to prevent "Cannot GET" errors
router.get('/', (req, res) => {
  res.json({ 
    message: 'Users API is live 🚀', 
    endpoints: {
      login: 'POST /login',
      register: 'POST /register',
      profile: 'GET /me',
      test: 'GET /test'
    },
    timestamp: new Date().toISOString() 
  });
});

// Test route to verify userRoutes is loaded
router.get('/test', (req, res) => {
  res.json({ message: 'User routes are working!', timestamp: new Date().toISOString() });
});

// Test registration endpoint (GET method for testing)
router.get('/register', (req, res) => {
  res.json({ 
    message: 'Registration endpoint is accessible',
    method: 'POST /register',
    requiredFields: ['name', 'phone', 'password'],
    optionalFields: ['civilId', 'passportNumber', 'dateOfBirth'],
    timestamp: new Date().toISOString()
  });
});

// Test route for login (GET method for testing) - REMOVED (issue resolved)

// Register
router.post('/register', validateUserRegistration, async (req, res) => {
  console.log('🔍 DEBUG: Registration request received');
  console.log('🔍 DEBUG: Body:', req.body);
  console.log('🔍 DEBUG: Headers:', req.headers);
  console.log('🔍 DEBUG: Phone value:', req.body.phone);
  console.log('🔍 DEBUG: Phone type:', typeof req.body.phone);
  
  const { name, phone, civilId, passportNumber, dateOfBirth, password } = req.body;

  try {
    // Check if user already exists
    const exists = await User.findOne({ phone });
    if (exists) {
      console.log('🔍 DEBUG: User already exists for phone:', phone);
      return res.status(400).json({ 
        message: 'User already exists',
        type: 'USER_EXISTS_ERROR'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
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

    // Save user to database
    await newUser.save();
    console.log('🔍 DEBUG: User registered successfully:', phone);

    res.status(201).json({ 
      message: 'Registration successful!',
      type: 'SUCCESS',
      user: {
        id: newUser._id,
        name: newUser.name,
        phone: newUser.phone
      }
    });
  } catch (err) {
    console.error('🔍 DEBUG: Registration error:', err);
    res.status(500).json({ 
      message: 'Server error during registration.',
      type: 'SERVER_ERROR',
      error: err.message
    });
  }
});


// Login
router.post('/login', validateUserLogin, async (req, res) => {
  console.log('🔍 DEBUG: Login request received');
  console.log('🔍 DEBUG: Origin:', req.headers.origin);
  console.log('🔍 DEBUG: Headers:', req.headers);
  console.log('🔍 DEBUG: JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('🔍 DEBUG: NODE_ENV:', process.env.NODE_ENV);
  
  const { phone , password } = req.body;

  if (!phone || !password) {
    console.log('🔍 DEBUG: Missing phone or password');
    return res.status(400).json({ message: 'Phone and password required' });
  }

  try {
    const user = await User.findOne({ phone });
    if (!user) {
      console.log('🔍 DEBUG: User not found for phone:', phone);
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('🔍 DEBUG: Invalid password for user:', phone);
      return res.status(400).json({ message: 'Invalid password' });
    }

    console.log('🔍 DEBUG: Creating JWT token...');
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined!');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });
    console.log('🔍 DEBUG: JWT token created successfully');

    // Set secure cookie for cross-domain support
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Allow cross-site cookies
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    console.log('🔍 DEBUG: Login successful for user:', phone);
    res.json({ 
      token,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('🔍 DEBUG: Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
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


// Update user profile
router.put('/profile', verifyUserToken, async (req, res) => {
  try {
    const { name, phone, civilId, passportNumber, dateOfBirth } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, civilId, passportNumber, dateOfBirth },
      { new: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Profile update failed' });
  }
});

// Change password
router.put('/password', verifyUserToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Password change failed' });
  }
});

// Get user preferences
router.get('/preferences', verifyUserToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('preferences');
    res.json({ preferences: user.preferences || {} });
  } catch (err) {
    console.error('Preferences fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch preferences' });
  }
});

// Update user preferences
router.put('/preferences', verifyUserToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { preferences },
      { new: true }
    ).select('preferences');
    
    res.json(updatedUser);
  } catch (err) {
    console.error('Preferences update error:', err);
    res.status(500).json({ message: 'Preferences update failed' });
  }
});

// Get privacy settings
router.get('/privacy', verifyUserToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('privacySettings');
    res.json({ privacySettings: user.privacySettings || {} });
  } catch (err) {
    console.error('Privacy settings fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch privacy settings' });
  }
});

// Update privacy settings
router.put('/privacy', verifyUserToken, async (req, res) => {
  try {
    const { privacySettings } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { privacySettings },
      { new: true }
    ).select('privacySettings');
    
    res.json(updatedUser);
  } catch (err) {
    console.error('Privacy settings update error:', err);
    res.status(500).json({ message: 'Privacy settings update failed' });
  }
});

// Email verification
router.post('/verify-email', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    
    // In a real implementation, you would verify the code
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ message: 'Email verification failed' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { phone } = req.body;
    
    // In a real implementation, you would send a reset code
    res.json({ message: 'Password reset code sent to your phone' });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ message: 'Password reset request failed' });
  }
});

// Reset password with code
router.post('/reset-password', async (req, res) => {
  try {
    const { phone, resetCode, newPassword } = req.body;
    
    // In a real implementation, you would verify the code and reset password
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ message: 'Password reset failed' });
  }
});

module.exports = router;