const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const RecordedLecture = require('../models/RecordedLecture');
const User = require('../models/User');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const verifyUserToken = require('../middleware/verifyUserToken');
const { antiDownloadProtection } = require('../middleware/security');
const jwt = require('jsonwebtoken'); // Added for manual token verification

const router = express.Router();

// 🚀 LIVESTREAM RECORDING ROUTES
// Start recording a livestream
router.post('/admin/record-livestream', verifyAdminToken, async (req, res) => {
  try {
    const { title, description, category, isPublic = false } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required for recording' });
    }
    
    // Create new recorded lecture entry
    const newLecture = new RecordedLecture({
      title,
      description,
      adminId: req.admin.id,
      streamDate: new Date(),
      isPublic,
      category,
      quality: '1080p' // Default quality
    });
    
    await newLecture.save();
    
    res.status(201).json({
      success: true,
      lecture: newLecture,
      message: 'Livestream recording started'
    });
    
  } catch (error) {
    console.error('❌ Error starting livestream recording:', error);
    res.status(500).json({ error: 'Failed to start recording' });
  }
});

// Stop recording and update lecture
router.put('/admin/stop-recording/:lectureId', verifyAdminToken, async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { duration, filePath, thumbnail, fileSize } = req.body;
    
    const lecture = await RecordedLecture.findById(lectureId);
    
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    
    if (lecture.adminId.toString() !== req.admin.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update lecture with recording data
    lecture.duration = duration;
    if (filePath) lecture.filePath = filePath;
    if (thumbnail) lecture.thumbnail = thumbnail;
    if (fileSize) lecture.fileSize = fileSize;
    
    await lecture.save();
    
    res.json({
      success: true,
      lecture,
      message: 'Recording stopped and lecture updated'
    });
    
  } catch (error) {
    console.error('❌ Error stopping recording:', error);
    res.status(500).json({ error: 'Failed to stop recording' });
  }
});

// Get livestream recording history
router.get('/admin/recordings', verifyAdminToken, async (req, res) => {
  try {
    const recordings = await RecordedLecture.find({ adminId: req.admin.id })
      .sort({ streamDate: -1 })
      .select('title description streamDate duration quality isPublic');
    
    res.json(recordings);
    
  } catch (error) {
    console.error('❌ Error fetching recordings:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

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
    console.log('📝 Admin token verified:', !!req.admin);
    
    const { title, description, category, tags, quality, duration, isPublic, allowedUsers } = req.body;
    
    const newLecture = new RecordedLecture({
      title,
      description,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      quality: quality || '1080p',
      duration,
      adminId: req.admin.id,
      filePath: '', // Will be updated when video is uploaded
      isPublic: isPublic || false,
      accessUsers: allowedUsers || [] // Map allowedUsers to accessUsers
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
    const { title, description, category, tags, quality, duration, fileSize, isPublic, allowedUsers } = req.body;
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
    if (isPublic !== undefined) lecture.isPublic = isPublic;
    if (allowedUsers !== undefined) lecture.accessUsers = allowedUsers; // Map allowedUsers to accessUsers

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
    console.log('🎬 Video upload request received');
    console.log('📝 Lecture ID from params:', req.params.id);
    console.log('👤 Admin ID from token:', req.admin.id);
    console.log('📁 File info:', req.file);
    
    const lecture = await RecordedLecture.findById(req.params.id);
    console.log('🔍 Lecture found in database:', !!lecture);
    
    if (!lecture) {
      console.log('❌ Lecture not found in database:', req.params.id);
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
    console.log('🔍 User requesting lectures. User ID:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('❌ User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User found:', user.name);

    // Get lectures user has access to (either public or explicitly granted)
    const lectures = await RecordedLecture.find({
      $or: [
        { isPublic: true },
        { accessUsers: req.user.id }
      ]
    }).select('_id title description streamDate duration thumbnail category quality')
      .sort({ streamDate: -1 });

    console.log('📚 Found lectures for user:', lectures.length);
    console.log('📚 Lectures:', lectures.map(l => ({ id: l._id, title: l.title, isPublic: l.isPublic })));

    res.json(lectures);
  } catch (err) {
    console.error('❌ Error fetching user lectures:', err);
    res.status(500).json({ message: 'Failed to fetch lectures' });
  }
});

// Stream video for admin (with access control)
router.get('/admin/lectures/:id/stream', antiDownloadProtection, async (req, res) => {
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
    console.log('🎬 User requesting video stream:', req.params.id);

    // Get token from query parameter (since HTML5 video elements can't send Authorization header)
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
      console.log('❌ Lecture not found for streaming:', req.params.id);
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check access
    if (!lecture.isPublic && !lecture.accessUsers.includes(decoded.id)) {
      console.log('❌ Access denied for streaming:', decoded.id, 'Lecture:', lecture.title);
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!lecture.filePath) {
      console.log('❌ No video file for lecture:', lecture.title);
      return res.status(404).json({ message: 'Video file not found' });
    }

    console.log('✅ Streaming video for user:', decoded.id, 'Lecture:', lecture.title);
    console.log('📁 Video file:', lecture.filePath);

    const videoPath = path.join(__dirname, '../../uploads/lectures', lecture.filePath);
    
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      console.log('❌ Video file not found on disk:', videoPath);
      return res.status(404).json({ message: 'Video file not found' });
    }

    // Get file stats
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Handle full file requests
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (err) {
    console.error('❌ Error streaming video:', err);
    res.status(500).json({ message: 'Failed to stream video' });
  }
});

// Get lecture details (for user)
router.get('/user/lectures/:id', verifyUserToken, async (req, res) => {
  try {
    console.log('🔍 User requesting lecture details:', req.params.id);
    
    const lecture = await RecordedLecture.findById(req.params.id);
    if (!lecture) {
      console.log('❌ Lecture not found:', req.params.id);
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check access
    if (!lecture.isPublic && !lecture.accessUsers.includes(req.user.id)) {
      console.log('❌ Access denied for user:', req.user.id, 'Lecture:', lecture.title);
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('✅ Access granted for user:', req.user.id, 'Lecture:', lecture.title);
    console.log('📁 Lecture filePath:', lecture.filePath);

    // Return information including filePath for video streaming
    res.json({
      id: lecture._id,
      title: lecture.title,
      description: lecture.description,
      streamDate: lecture.streamDate,
      duration: lecture.duration,
      thumbnail: lecture.thumbnail,
      category: lecture.category,
      tags: lecture.tags,
      quality: lecture.quality,
      filePath: lecture.filePath, // Include filePath for video streaming
      fileSize: lecture.fileSize
    });
  } catch (err) {
    console.error('❌ Error fetching lecture details:', err);
    res.status(500).json({ message: 'Failed to fetch lecture details' });
  }
});

// Search lectures
router.get('/search', async (req, res) => {
  try {
    const { query, category, tags, quality } = req.query;
    
    let searchQuery = {};
    
    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ];
    }
    
    if (category) {
      searchQuery.category = category;
    }
    
    if (tags) {
      searchQuery.tags = { $in: tags.split(',') };
    }
    
    if (quality) {
      searchQuery.quality = quality;
    }
    
    const lectures = await RecordedLecture.find(searchQuery)
      .select('title description category tags quality duration createdAt')
      .sort({ createdAt: -1 });
    
    res.json(lectures);
  } catch (err) {
    console.error('Error searching lectures:', err);
    res.status(500).json({ message: 'Search failed' });
  }
});

// Get lecture categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await RecordedLecture.distinct('category');
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Get lecture tags
router.get('/tags', async (req, res) => {
  try {
    const tags = await RecordedLecture.distinct('tags');
    res.json(tags);
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.status(500).json({ message: 'Failed to fetch tags' });
  }
});

// Get lecture analytics
router.get('/analytics', verifyAdminToken, async (req, res) => {
  try {
    const totalLectures = await RecordedLecture.countDocuments();
    const publicLectures = await RecordedLecture.countDocuments({ isPublic: true });
    const privateLectures = await RecordedLecture.countDocuments({ isPublic: false });
    
    const categoryStats = await RecordedLecture.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const qualityStats = await RecordedLecture.aggregate([
      { $group: { _id: '$quality', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      total: totalLectures,
      public: publicLectures,
      private: privateLectures,
      categories: categoryStats,
      qualities: qualityStats
    });
  } catch (err) {
    console.error('Error fetching lecture analytics:', err);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Get lecture metadata
router.get('/:id/metadata', async (req, res) => {
  try {
    const lecture = await RecordedLecture.findById(req.params.id)
      .select('title description category tags quality duration createdAt updatedAt');
    
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }
    
    res.json(lecture);
  } catch (err) {
    console.error('Error fetching lecture metadata:', err);
    res.status(500).json({ message: 'Failed to fetch metadata' });
  }
});

// Utility endpoint to fix lectures without filePath (admin)
router.post('/admin/lectures/:id/fix-filepath', verifyAdminToken, async (req, res) => {
  try {
    console.log('🔧 Fixing filePath for lecture:', req.params.id);
    
    const lecture = await RecordedLecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    if (lecture.adminId.toString() !== req.admin.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if uploads directory exists and has files
    const uploadsDir = path.join(__dirname, '../../uploads/lectures');
    if (!fs.existsSync(uploadsDir)) {
      return res.status(404).json({ message: 'Uploads directory not found' });
    }

    const files = fs.readdirSync(uploadsDir);
    console.log('📁 Files in uploads directory:', files);

    // Look for video files that might belong to this lecture
    const videoFiles = files.filter(file => 
      file.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i)
    );

    if (videoFiles.length === 0) {
      return res.status(404).json({ message: 'No video files found in uploads directory' });
    }

    // For now, assign the first video file (you can implement better logic later)
    const videoFile = videoFiles[0];
    const filePath = path.join(uploadsDir, videoFile);
    const stats = fs.statSync(filePath);

    // Update lecture with file information
    lecture.filePath = videoFile;
    lecture.fileSize = stats.size;
    lecture.thumbnail = `thumbnail-${videoFile.replace(path.extname(videoFile), '.jpg')}`;

    await lecture.save();
    console.log('✅ Lecture filePath fixed:', videoFile);

    res.json({
      message: 'Lecture filePath fixed successfully',
      lecture: {
        id: lecture._id,
        title: lecture.title,
        filePath: lecture.filePath,
        fileSize: lecture.fileSize,
        thumbnail: lecture.thumbnail
      }
    });
  } catch (err) {
    console.error('❌ Error fixing filePath:', err);
    res.status(500).json({ message: 'Failed to fix filePath', error: err.message });
  }
});

// Debug endpoint to check lecture details (admin)
router.get('/admin/lectures/:id/debug', verifyAdminToken, async (req, res) => {
  try {
    console.log('🔍 Debug request for lecture:', req.params.id);
    
    const lecture = await RecordedLecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    if (lecture.adminId.toString() !== req.admin.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let fileExists = false;
    let filePath = '';
    if (lecture.filePath) {
      filePath = path.join(__dirname, '../../uploads/lectures', lecture.filePath);
      fileExists = fs.existsSync(filePath);
    }

    res.json({
      lecture: {
        id: lecture._id,
        title: lecture.title,
        description: lecture.description,
        filePath: lecture.filePath,
        fileSize: lecture.fileSize,
        thumbnail: lecture.thumbnail,
        isPublic: lecture.isPublic,
        accessUsers: lecture.accessUsers,
        streamDate: lecture.streamDate,
        duration: lecture.duration,
        quality: lecture.quality
      },
      fileStatus: {
        filePath: filePath,
        exists: fileExists,
        size: fileExists ? fs.statSync(filePath).size : 0
      }
    });
  } catch (err) {
    console.error('❌ Error in debug endpoint:', err);
    res.status(500).json({ message: 'Debug failed', error: err.message });
  }
});

// Fix lecture isPublic field (admin)
router.post('/admin/lectures/:id/fix-public', verifyAdminToken, async (req, res) => {
  try {
    console.log('🔧 Fixing isPublic field for lecture:', req.params.id);
    
    const lecture = await RecordedLecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    if (lecture.adminId.toString() !== req.admin.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Set isPublic to true if it's undefined or false
    if (!lecture.isPublic) {
      lecture.isPublic = true;
      await lecture.save();
      console.log('✅ Fixed isPublic field for lecture:', lecture.title);
    } else {
      console.log('✅ Lecture already has isPublic set to:', lecture.isPublic);
    }

    res.json({
      message: 'Lecture isPublic field fixed',
      lecture: {
        id: lecture._id,
        title: lecture.title,
        isPublic: lecture.isPublic
      }
    });
  } catch (err) {
    console.error('❌ Error fixing isPublic field:', err);
    res.status(500).json({ message: 'Failed to fix isPublic field', error: err.message });
  }
});

module.exports = router;
