// 🚀 UNA INSTITUTE WEBSITE - PRODUCTION SERVER
// Comprehensive rebuild based on project analysis

// 1. Environment Configuration
if (process.env.NODE_ENV !== 'production') {
require('dotenv').config();
}

// 2. Core Dependencies
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// 3. Middleware Dependencies
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// 4. Security & Rate Limiting
const rateLimit = require('express-rate-limit');

// 5. Models
const User = require('./models/User');
const Admin = require('./models/Admin');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const RecordedLecture = require('./models/RecordedLecture');

// 6. Routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lectureRoutes = require('./routes/lectureRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');

// 7. Middleware
const { securityHeaders, apiRateLimiter, securityLogger } = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');

// 8. Initialize Express App
const app = express();
const server = http.createServer(app);

// 9. Socket.IO Configuration
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 10. Environment Variables
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/una_website';
const NODE_ENV = process.env.NODE_ENV || 'development';

// 11. CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://cute-churros-f9f049.netlify.app',
    'https://una-website.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Worker-ID']
};

// 12. Middleware Setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.socket.io"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "blob:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:"],
      frameSrc: ["'self'", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(morgan('combined'));
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 13. Security Middleware
app.use(securityHeaders);
app.use(securityLogger);

// 14. Rate Limiting
app.use('/api/', apiRateLimiter);

// 15. Static File Serving (API assets only)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 16. API Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// 17. Health Check Endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
      memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API is operational',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// 18. Frontend Routes (Static HTML)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/ar/index.html'));
});

app.get('/en', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/en/index.html'));
});

app.get('/ar', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/ar/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin/login.html'));
});

// 19. Socket.IO Events
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`👤 User ${socket.id} joined room ${roomId}`);
  });
  
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`👤 User ${socket.id} left room ${roomId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// 20. Error Handling
app.use(errorHandler);

// 21. 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// 22. Database Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// 23. Graceful Shutdown
        const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
          
          server.close(() => {
    console.log('✅ HTTP server closed');
            
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
              process.exit(0);
            });
          });
          
  // Force close after 10 seconds
          setTimeout(() => {
    console.log('⚠️ Forced shutdown after timeout');
            process.exit(1);
  }, 10000);
        };
        
// 24. Process Event Handlers
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 25. Server Startup
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 UNA Institute Server Started');
      console.log(`📍 Environment: ${NODE_ENV}`);
      console.log(`🌐 Server: http://0.0.0.0:${PORT}`);
      console.log(`🏥 Health: http://0.0.0.0:${PORT}/health`);
      console.log(`📊 API Health: http://0.0.0.0:${PORT}/api/health`);
      console.log(`🔌 Socket.IO: Enabled`);
      console.log(`📁 Static Files: Served from frontend/`);
      console.log(`🗄️ Database: ${MONGO_URI.split('@')[1] || 'localhost'}`);
    });
      } catch (error) {
    console.error('❌ Server startup failed:', error);
        process.exit(1);
      }
    };
    
// 26. Start the server
startServer();

module.exports = { app, server, io };