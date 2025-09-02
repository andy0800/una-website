const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Content = require('../models/Content');
const PageContent = require('../models/PageContent');
const verifyAdminToken = require('../middleware/verifyAdminToken');

const router = express.Router();

/* ========== Admin Login ========== */
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

    res.json({ token });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ message: 'Login failed' });
  }
});

/* ========== User Management ========== */
router.post('/users', verifyAdminToken, async (req, res) => {
  try {
    const { name, phone, civilId, passportNumber, dateOfBirth, password, courses = [], level = '' } = req.body;
    if (!name || !phone || !password) return res.status(400).json({ message: 'Name, phone, and password are required.' });

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
    res.status(500).json({ message: 'Server error while creating user.' });
  }
});

router.get('/users', verifyAdminToken, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

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

router.put('/users/:id/level', verifyAdminToken, async (req, res) => {
  try {
    const { level } = req.body;
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { level }, { new: true });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update level' });
  }
});

router.delete('/users/:id', verifyAdminToken, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

/* ========== Certificate Upload ========== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const certPath = path.resolve(__dirname, '../../frontend/certs');
    cb(null, certPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/users/:id/certificate', verifyAdminToken, upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!req.file) return res.status(400).json({ message: 'No certificate file uploaded' });

    user.certificates.push({ name, image: req.file.filename });
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload certificate' });
  }
});

router.delete('/users/:userId/certificates/:certIndex', verifyAdminToken, async (req, res) => {
  try {
    const { userId, certIndex } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.certificates.splice(certIndex, 1);
    await user.save();
    res.json({ message: 'Certificate deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete certificate' });
  }
});

/* ========== Course Management ========== */
router.get('/courses', verifyAdminToken, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

router.post('/courses', verifyAdminToken, async (req, res) => {
  try {
    const { name, description, duration } = req.body;
    const newCourse = new Course({ name, description, duration });
    await newCourse.save();
    res.json(newCourse);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create course' });
  }
});

router.put('/courses/:id', verifyAdminToken, async (req, res) => {
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

router.delete('/courses/:id', verifyAdminToken, async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete course' });
  }
});

/* ========== Enrollment Forms ========== */
router.get('/forms', verifyAdminToken, async (req, res) => {
  try {
    const forms = await Enrollment.find();
    res.json(forms);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch forms' });
  }
});

/* ========== Content Editor (HTML-based Quill) ========== */
router.get('/content/:page/:lang', verifyAdminToken, async (req, res) => {
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

/* ========== PageContent (Structured) - Optional ========== */
// Uncomment only if needed
/*
router.get('/content/:lang/:page', verifyAdminToken, async (req, res) => {
  try {
    const { lang, page } = req.params;
    const content = await PageContent.findOne({ lang, page });
    res.json(content || { page, lang, sections: {} });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load content' });
  }
});

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
*/

/* ========== Dashboard Stats ========== */
router.get('/stats', verifyAdminToken, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const formCount = await Enrollment.countDocuments();

    const certCountAgg = await User.aggregate([
      { $unwind: '$certificates' },
      { $count: 'totalCerts' }
    ]);
    const certCount = certCountAgg[0]?.totalCerts || 0;

    res.json({ users: userCount, courses: courseCount, forms: formCount, certificates: certCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

/* ========== Export to Excel ========== */
router.get('/export/users/excel', verifyAdminToken, async (req, res) => {
  try {
    const users = await User.find();

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Users');

    sheet.columns = [
      { header: 'Name', key: 'name' },
      { header: 'Phone', key: 'phone' },
      { header: 'Civil ID', key: 'civilId' },
      { header: 'Passport', key: 'passportNumber' },
      { header: 'Date of Birth', key: 'dateOfBirth' },
      { header: 'Level', key: 'level' },
      { header: 'Courses', key: 'courses' },
    ];

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
    res.status(500).json({ message: 'Failed to export users' });
  }
});

module.exports = router;