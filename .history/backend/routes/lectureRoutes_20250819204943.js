const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const RecordedLecture = require('../models/RecordedLecture');
const User = require('../models/User');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const verifyUserToken = require('../middleware/verifyUserToken');
const jwt = require('jsonwebtoken'); // Added for manual token verification

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/lectures');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'lecture-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit for video files
  },
  fileFilter: (req, file, cb) => {
    // Allow only video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

/* ========== ADMIN ROUTES ========== */

// Test endpoint to verify route is accessible
router.get('/admin/test', verifyAdminToken, (req, res) => {
  console.log('✅ Test endpoint hit - route is accessible');
  res.json({ message: 'Lecture routes are working', adminId: req.admin.id });
});

// Get all recorded lectures (admin)
router.get('/admin/lectures', verifyAdminToken, async (req, res) => {
  try {
    console.log('🔍 Admin requesting lectures. Admin ID:', req.admin.id);
    console.log('🔍 Admin object:', req.admin);
    
    const lectures = await RecordedLecture.find({ adminId: req.admin.id })
      .populate('accessUsers', 'name phone')
      .sort({ streamDate: -1 });
    
    console.log('✅ Found lectures:', lectures.length);
    res.json(lectures);
  } catch (err) {
    console.error('❌ Error fetching lectures:', err);
    res.status(500).json({ message: 'Failed to fetch lectures', error: err.message });
  }
});

// Get specific lecture by ID (admin)
router.get('/admin/lectures/:id', verifyAdminToken, async (req, res) => {
  try {
    console.log('🔍 Admin requesting specific lecture. Admin ID:', req.admin.id, 'Lecture ID:', req.params.id);
    
    const lecture = await RecordedLecture.findById(req.params.id);
    
    if (!lecture) {
      console.log('❌ Lecture not found:', req.params.id);
      return res.status(404).json({ message: 'Lecture not found' });
    }
    
    // Check if admin owns this lecture
    if (lecture.adminId.toString() !== req.admin.id) {
      console.log('❌ Access denied. Admin does not own this lecture');
      return res.status(403).json({ message: 'Access denied. You can only access your own lectures.' });
    }
    
    console.log('✅ Lecture found and access granted:', lecture.title);
    res.json(lecture);
  } catch (err) {
    console.error('❌ Error fetching specific lecture:', err);
    res.status(500).json({ message: 'Failed to fetch lecture', error: err.message });
  }
});

// Create new recorded lecture entry (admin)
router.post('/admin/lectures', verifyAdminToken, async (req, res) => {
  try {
    console.log('🎬 Admin creating new lecture. Admin ID:', req.admin.id);
    console.log('📝 Request body:', req.body);
    
    const { title, description, category, tags, quality, duration } = req.body;
    
    const newLecture = new RecordedLecture({
      title,
      description,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      quality: quality || '1080p',
      duration,
      adminId: req.admin.id,
      filePath: '', // Will be updated when video is uploaded
      isPublic: false
    });

    console.log('📝 New lecture object:', newLecture);

    await newLecture.save();
    console.log('✅ Lecture saved successfully. ID:', newLecture._id);
    res.status(201).json(newLecture);
  } catch (err) {
    console.error('❌ Error creating lecture:', err);
    res.status(500).json({ message: 'Failed to create lecture', error: err.message });
  }
});

// Update lecture metadata (admin)
router.put('/admin/lectures/:id', verifyAdminToken, async (req, res) => {
  try {
    const { title, description, category, tags, quality, duration, fileSize } = req.body;
    const lecture = await RecordedLecture.findById(req.params.id);
    
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    if (lecture.adminId.toString() !== req.admin.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update fields if provided
    if (title !== undefined) lecture.title = title;
    if (description !== undefined) lecture.description = description;
    if (category !== undefined) lecture.category = category;
    if (tags !== undefined) lecture.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];
    if (quality !== undefined) lecture.quality = quality;
    if (duration !== undefined) lecture.duration = duration;
    if (fileSize !== undefined) lecture.fileSize = fileSize;

    await lecture.save();
    res.json({ message: 'Lecture updated successfully', lecture });
  } catch (err) {
    console.error('Error updating lecture:', err);
    res.status(500).json({ message: 'Failed to update lecture' });
  }
});

// Upload video file for lecture (admin)
router.post('/admin/lectures/:id/video', verifyAdminToken, upload.single('video'), async (req, res) => {
  try {
    const lecture = await RecordedLecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    if (lecture.adminId.toString() !== req.admin.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    // Update lecture with file information
    lecture.filePath = req.file.filename;
    lecture.fileSize = req.file.size;
    
    // Generate thumbnail path (you can implement thumbnail generation later)
    lecture.thumbnail = `thumbnail-${req.file.filename.replace(path.extname(req.file.filename), '.jpg')}`;
    
    await lecture.save();
    
    res.json({ 
      message: 'Video uploaded successfully', 
      lecture: {
        id: lecture._id,
        title: lecture.title,
        filePath: lecture.filePath,
        fileSize: lecture.fileSize
      }
    });
  } catch (err) {
    console.error('Error uploading video:', err);
    res.status(500).json({ message: 'Failed to upload video' });
  }
});

// Update lecture access control (admin)
router.put('/admin/lectures/:id/access', verifyAdminToken, async (req, res) => {
  try {
    console.log('🔐 Updating lecture access. Admin ID:', req.admin.id, 'Lecture ID:', req.params.id);
    console.log('📋 Request body:', req.body);
    
    const { isPublic, accessUsers } = req.body;
    const lecture = await RecordedLecture.findById(req.params.id);
    
    if (!lecture) {
      console.log('❌ Lecture not found:', req.params.id);
      return res.status(404).json({ message: 'Lecture not found' });
    }

    if (lecture.adminId.toString() !== req.admin.id) {
      console.log('❌ Access denied. Admin does not own this lecture');
      return res.status(403).json({ message: 'Access denied' });
    }

    // Handle public access
    if (typeof isPublic === 'boolean') {
      lecture.isPublic = isPublic;
      console.log('📋 Public access set to:', isPublic);
    }

    // Handle access users array (new format)
    if (Array.isArray(accessUsers)) {
      lecture.accessUsers = accessUsers;
      console.log('👥 Access users updated:', accessUsers.length, 'users');
    }

    await lecture.save();
    console.log('✅ Lecture access updated successfully');
    res.json({ message: 'Access updated successfully', lecture });
  } catch (err) {
    console.error('❌ Error updating lecture access:', err);
    res.status(500).json({ message: 'Failed to update access', error: err.message });
  }
});

// Delete lecture (admin)
router.delete('/admin/lectures/:id', verifyAdminToken, async (req, res) => {
  try {
    const lecture = await RecordedLecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    if (lecture.adminId.toString() !== req.admin.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete video file if it exists
    if (lecture.filePath) {
      const filePath = path.join(__dirname, '../../uploads/lectures', lecture.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Remove from all users' recordedLectures arrays
    await User.updateMany(
      { recordedLectures: lecture._id },
      { $pull: { recordedLectures: lecture._id } }
    );

    await RecordedLecture.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lecture deleted successfully' });
  } catch (err) {
    console.error('Error deleting lecture:', err);
    res.status(500).json({ message: 'Failed to delete lecture' });
  }
});

/* ========== USER ROUTES ========== */

// Get accessible lectures for user
router.get('/user/lectures', verifyUserToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get lectures user has access to (either public or explicitly granted)
    const lectures = await RecordedLecture.find({
      $or: [
        { isPublic: true },
        { accessUsers: req.user.id }
      ]
    }).select('_id title description streamDate duration thumbnail category quality')
      .sort({ streamDate: -1 });

    res.json(lectures);
  } catch (err) {
    console.error('Error fetching user lectures:', err);
    res.status(500).json({ message: 'Failed to fetch lectures' });
  }
});

// Stream video for admin (with access control)
router.get('/admin/lectures/:id/stream', async (req, res) => {
  try {
    console.log('🎥 Admin video stream request for lecture:', req.params.id);
    
    // Get token from query parameter (since video elements can't send Authorization header)
    const token = req.query.token;
    
    if (!token) {
      console.log('❌ No token provided in query parameter');
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    // Verify token manually
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for admin:', decoded.id);
    } catch (err) {
      console.log('❌ Invalid token:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if admin exists
    if (decoded.role !== 'admin') {
      console.log('❌ Token role is not admin:', decoded.role);
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const lecture = await RecordedLecture.findById(req.params.id);
    if (!lecture) {
      console.log('❌ Lecture not found:', req.params.id);
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check if admin owns this lecture
    if (lecture.adminId.toString() !== decoded.id) {
      console.log('❌ Access denied. Admin does not own this lecture');
      return res.status(403).json({ message: 'Access denied. You can only access your own lectures.' });
    }

    console.log('✅ Access granted for admin:', decoded.id, 'Lecture:', lecture.title);

    if (!lecture.filePath) {
      console.log('❌ No file path for lecture:', lecture.title);
      return res.status(404).json({ message: 'Video file not found' });
    }

    const videoPath = path.join(__dirname, '../../uploads/lectures', lecture.filePath);
    
    if (!fs.existsSync(videoPath)) {
      console.log('❌ Video file not found at path:', videoPath);
      return res.status(404).json({ message: 'Video file not found' });
    }

    console.log('✅ Streaming video from:', videoPath);

    // Stream video with proper headers to prevent download
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/webm',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/webm',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (err) {
    console.error('Error streaming admin video:', err);
    res.status(500).json({ message: 'Failed to stream video' });
  }
});

// Stream video (with access control)
router.get('/user/lectures/:id/stream', async (req, res) => {
  try {
    console.log('🎥 Video stream request for lecture:', req.params.id);
    
    // Get token from query parameter (since video elements can't send Authorization header)
    const token = req.query.token;
    
    if (!token) {
      console.log('❌ No token provided in query parameter');
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    // Verify token manually
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.id);
    } catch (err) {
      console.log('❌ Invalid token:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('❌ User not found:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }

    const lecture = await RecordedLecture.findById(req.params.id);
    if (!lecture) {
      console.log('❌ Lecture not found:', req.params.id);
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check access
    if (!lecture.isPublic && !lecture.accessUsers.includes(decoded.id)) {
      console.log('❌ Access denied for user:', decoded.id, 'Lecture:', lecture.title);
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('✅ Access granted for user:', decoded.id, 'Lecture:', lecture.title);

    if (!lecture.filePath) {
      console.log('❌ No file path for lecture:', lecture.title);
      return res.status(404).json({ message: 'Video file not found' });
    }

    const videoPath = path.join(__dirname, '../../uploads/lectures', lecture.filePath);
    
    if (!fs.existsSync(videoPath)) {
      console.log('❌ Video file not found at path:', videoPath);
      return res.status(404).json({ message: 'Video file not found' });
    }

    console.log('✅ Streaming video from:', videoPath);
    // Stream video with proper headers to prevent download
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/webm',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/webm',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (err) {
    console.error('Error streaming video:', err);
    res.status(500).json({ message: 'Failed to stream video' });
  }
});

// Get lecture details (for user)
router.get('/user/lectures/:id', verifyUserToken, async (req, res) => {
  try {
    const lecture = await RecordedLecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check access
    if (!lecture.isPublic && !lecture.accessUsers.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Return limited information (no file paths)
    res.json({
      id: lecture._id,
      title: lecture.title,
      description: lecture.description,
      streamDate: lecture.streamDate,
      duration: lecture.duration,
      thumbnail: lecture.thumbnail,
      category: lecture.category,
      tags: lecture.tags,
      quality: lecture.quality
    });
  } catch (err) {
    console.error('Error fetching lecture details:', err);
    res.status(500).json({ message: 'Failed to fetch lecture details' });
  }
});

module.exports = router;
