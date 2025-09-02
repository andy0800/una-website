// 1. Load environment variables
require('dotenv').config();

// 2. Module imports
const express    = require('express');
const path       = require('path');
const cors       = require('cors');
const mongoose   = require('mongoose');
const http       = require('http');
const { Server } = require('socket.io');
const { securityHeaders, corsOptions, apiRateLimiter, securityLogger } = require('./middleware/security');

// 3. Initialize Express app
const app = express();

// 4. Create HTTP server and bind Socket.IO
const server = http.createServer(app);
const io = new Server(server);

// 5. MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// 5.5. Production environment validation
if (process.env.NODE_ENV === 'production') {
  // Validate required environment variables
  const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    process.exit(1);
  }
  
  // Validate JWT secret strength
  if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }
  
  console.log('✅ Production environment validation passed');
}

// 6. Global middleware
app.use(cors(corsOptions));
app.use(securityHeaders);
app.use(securityLogger);
app.use(apiRateLimiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 7. Serve frontend static files with proper MIME types
app.use(express.static(path.join(__dirname, '../frontend'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));
app.use('/certs', express.static(path.join(__dirname, '../frontend/certs')));

// 8. API route handlers
app.use('/api/users',       require('./routes/userRoutes'));
app.use('/api/courses',     require('./routes/courseRoutes'));
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/admin',       require('./routes/adminRoutes'));
app.use('/api/lectures',    require('./routes/lectureRoutes')); // NEW: Lecture management routes

// 8.5. Health check endpoint for production monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// 9. Global error handler (must be last)
app.use(require('./middleware/errorHandler'));

// 10. Favicon shortcut
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// 11. Socket.IO event routing
require('./socket/streamSocket')(io);

// 12. Start listening
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Unified server running on port ${PORT}`);
});