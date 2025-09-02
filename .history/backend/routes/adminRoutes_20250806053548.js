const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const Content = require('../models/Content');

const router = express.Router();

// ✅ Create a new user (admin only)
router.post('/users', verifyAdminToken, async (req, res) => {
  try {
    const { name, phone, civilId, passportNumber, dateOfBirth, password, courses = [], level = '' } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Name, phone, and password are required.' });
    }

    const newUser = new User({
      name,
      phone,
      civilId,
      passportNumber,
      dateOfBirth,
      password,
      courses,
      level,
      certificates: []
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully.' });
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ message: 'Server error while creating user.' });
  }
});

// ✅ Admin Auth Middleware
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

const token = authHeader.split(' ')[1];

try {
  console.log('🔑 Token:', token);
  console.log('🔐 JWT_SECRET:', process.env.JWT_SECRET); // check if it's undefined

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  req.admin = decoded;
  next();
} catch (err) {
  console.error('❌ JWT error:', err.message);
  return res.status(400).json({ message: 'Invalid token.' });
}
};

// ✅ Admin Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    router.put('/users/:id/info', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  const { name, phone, civilId, passportNumber, dateOfBirth } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(id, {
      name, phone, civilId, passportNumber, dateOfBirth
    }, { new: true });

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User info updated', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user info' });
  }
});


    res.json({ token });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ message: 'Login failed' });
  }
});

// ✅ Get All Users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// ✅ Get All Enrollments
router.get('/forms', adminAuth, async (req, res) => {
  try {
    const forms = await Enrollment.find();
    res.json(forms);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch forms' });
  }
});

// ✅ Get All Courses
router.get('/courses', adminAuth, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

// ✅ Create New Course
router.post('/courses', adminAuth, async (req, res) => {
  try {
    const { name, description, duration } = req.body;
    const newCourse = new Course({ name, description, duration });
    await newCourse.save();
    res.json(newCourse);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create course' });
  }
});

// ✅ Delete Course
router.delete('/courses/:id', adminAuth, async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete course' });
  }
});

// ✅ Update User Level
router.put('/users/:id/level', adminAuth, async (req, res) => {
  try {
    const { level } = req.body;
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { level }, { new: true });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update level' });
  }
});

// ✅ Certificate Upload Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const certPath = path.resolve(__dirname, '../../frontend/certs');
    cb(null, certPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ✅ Upload Certificate for User
router.post('/users/:id/certificate', adminAuth, upload.single('image'), async (req, res) => {
  try {
    console.log('🔐 Incoming certificate upload...');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    const { name } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!req.file) return res.status(400).json({ message: 'No certificate file uploaded' });

    user.certificates.push({ name, image: req.file.filename });
    await user.save();

    res.json(user);
  } catch (err) {
    console.error('❌ Upload cert error:', err.message);
    res.status(500).json({ message: 'Failed to upload certificate' });
  }
});

// Delete a certificate from user
router.delete('/users/:userId/certificates/:certIndex', adminAuth, async (req, res) => {
  try {
    const { userId, certIndex } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Remove certificate at index
    user.certificates.splice(certIndex, 1);
    await user.save();
    res.json({ message: 'Certificate deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete certificate' });
  }
});

// ✅ Delete User
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Update Course
router.put('/courses/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, duration } = req.body;
    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      { name, description, duration },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update course' });
  }
});

// ✅ Export Users as Excel
router.get('/export/users/excel', adminAuth, async (req, res) => {
  try {
    const users = await User.find();

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Users');

    // Header
    sheet.columns = [
      { header: 'Name', key: 'name' },
      { header: 'Phone', key: 'phone' },
      { header: 'Civil ID', key: 'civilId' },
      { header: 'Passport', key: 'passportNumber' },
      { header: 'Date of Birth', key: 'dateOfBirth' },
      { header: 'Level', key: 'level' },
      { header: 'Courses', key: 'courses' },
    ];

    // Rows
    users.forEach(user => {
      sheet.addRow({
        name: user.name,
        phone: user.phone,
        civilId: user.civilId || '',
        passportNumber: user.passportNumber || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '',
        level: user.level || '',
        courses: user.courses?.join(', ') || ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('❌ Excel export error:', err.message);
    res.status(500).json({ message: 'Failed to export users' });
  }
});

// 📊 GET /api/admin/stats - Admin Dashboard Stats
router.get('/stats', verifyAdminToken, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const formCount = await Enrollment.countDocuments();

    // Optional: count total certificates issued
    const certCountAgg = await User.aggregate([
      { $unwind: '$certificates' },
      { $count: 'totalCerts' }
    ]);
    const certCount = certCountAgg[0]?.totalCerts || 0;

    res.json({
      users: userCount,
      courses: courseCount,
      forms: formCount,
      certificates: certCount
    });
  } catch (err) {
    console.error('Error fetching stats:', err.message);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});
const PageContent = require('../models/PageContent');

// GET content by page and lang
router.get('/content/:lang/:page', verifyAdminToken, async (req, res) => {
  try {
    const { lang, page } = req.params;
    const content = await PageContent.findOne({ lang, page });
    res.json(content || { page, lang, sections: {} });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load content' });
  }
});

// UPDATE content
router.put('/content/:lang/:page', verifyAdminToken, async (req, res) => {
  try {
    const { lang, page } = req.params;
    const { sections } = req.body;

    const updated = await PageContent.findOneAndUpdate(
      { lang, page },
      { sections },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save content' });
  }
});
router.get('/content/:page/:lang', verifyAdmin, async (req, res) => {
  try {
    const { page, lang } = req.params;
    const contentDoc = await Content.findOne({ page, lang });
    res.json(contentDoc || { content: '' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch content' });
  }
});
router.put('/content/:page/:lang', verifyAdminToken, async (req, res) => {
      try {
    const { page, lang } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const updated = await Content.findOneAndUpdate(
      { page, lang },
      { content },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Content saved successfully', content: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save content' });
  }
});
module.exports = router;