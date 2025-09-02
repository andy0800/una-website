const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const RecordedLecture = require('../models/RecordedLecture');
const User = require('../models/User');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const verifyUserToken = require('../middleware/verifyUserToken');

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
    const { userId, action, isPublic } = req.body;
    const lecture = await RecordedLecture.findById(req.params.id);
    
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    if (lecture.adminId.toString() !== req.admin.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Handle public access
    if (typeof isPublic === 'boolean') {
      lecture.isPublic = isPublic;
    }

    // Handle individual user access
    if (userId && action) {
      if (action === 'grant') {
        if (!lecture.accessUsers.includes(userId)) {
          lecture.accessUsers.push(userId);
        }
      } else if (action === 'revoke') {
        lecture.accessUsers = lecture.accessUsers.filter(id => id.toString() !== userId);
      }
    }

    await lecture.save();
    res.json({ message: 'Access updated successfully', lecture });
  } catch (err) {
    console.error('Error updating access:', err);
    res.status(500).json({ message: 'Failed to update access' });
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
    }).select('title description streamDate duration thumbnail category quality')
      .sort({ streamDate: -1 });

    res.json(lectures);
  } catch (err) {
    console.error('Error fetching user lectures:', err);
    res.status(500).json({ message: 'Failed to fetch lectures' });
  }
});

// Stream video (with access control)
router.get('/user/lectures/:id/stream', verifyUserToken, async (req, res) => {
  try {
    const lecture = await RecordedLecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check access
    if (!lecture.isPublic && !lecture.accessUsers.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!lecture.filePath) {
      return res.status(404).json({ message: 'Video file not found' });
    }

    const videoPath = path.join(__dirname, '../../uploads/lectures', lecture.filePath);
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: 'Video file not found' });
    }

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
