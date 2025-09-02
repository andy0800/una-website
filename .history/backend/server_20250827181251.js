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

// NEW: Production monitoring and logging
const winston = require('winston');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

// 3. Initialize Express app
const app = express();

// NEW: Production logging configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'una-webrtc-server' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// NEW: Production metrics
const metrics = {
  startTime: Date.now(),
  requests: 0,
  errors: 0,
  activeConnections: 0,
  streams: 0,
  memoryUsage: process.memoryUsage(),
  uptime: 0
};

// Update metrics every 30 seconds
setInterval(() => {
  metrics.uptime = process.uptime();
  metrics.memoryUsage = process.memoryUsage();
}, 30000);

// NEW: Production middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      mediaSrc: ["'self'", "blob:"],
      imgSrc: ["'self'", "data:", "blob:"]
    }
  }
}));

app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// 4. Create HTTP server and bind Socket.IO
const server = http.createServer(app);
const io = new Server(server);

// NEW: Socket.IO production configuration
io.engine.on('connection_error', (err) => {
  logger.error('Socket.IO connection error:', err);
});

// NEW: Socket.IO metrics
io.on('connection', (socket) => {
  metrics.activeConnections++;
  logger.info('New socket connection', { socketId: socket.id, totalConnections: metrics.activeConnections });
  
  socket.on('disconnect', () => {
    metrics.activeConnections = Math.max(0, metrics.activeConnections - 1);
    logger.info('Socket disconnected', { socketId: socket.id, totalConnections: metrics.activeConnections });
  });
});

// 5. MongoDB connection with production resilience
const connectWithRetry = async () => {
  const maxRetries = 5;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        maxPoolSize: 10,
        minPoolSize: 2
      });
      
      logger.info('✅ MongoDB connected successfully');
      break;
    } catch (err) {
      retries++;
      logger.error(`❌ MongoDB connection attempt ${retries} failed:`, err.message);
      
      if (retries === maxRetries) {
        logger.error('❌ Max MongoDB connection attempts reached. Exiting...');
        process.exit(1);
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retries - 1), 30000);
      logger.info(`Retrying MongoDB connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Initialize MongoDB connection
connectWithRetry();

// NEW: MongoDB connection event handlers
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
  metrics.errors++;
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectWithRetry, 5000);
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected successfully');
});

// 5.5. Production environment validation
if (process.env.NODE_ENV === 'production') {
  // Validate required environment variables
  const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error('❌ Missing required environment variables:', missingVars);
    process.exit(1);
  }
  
  // Validate JWT secret strength
  if (process.env.JWT_SECRET.length < 32) {
    logger.error('❌ JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }
  
  logger.info('✅ Production environment validation passed');
}

// 6. Global middleware
app.use(cors(corsOptions));
app.use(securityHeaders);
app.use(securityLogger);
app.use(apiRateLimiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// NEW: Request logging middleware
app.use((req, res, next) => {
  metrics.requests++;
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

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

// 7.1. Serve root-level files
app.use(express.static(path.join(__dirname, '..'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
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
app.use('/api/webrtc',      require('./routes/webrtcRoutes')); // 🚀 Custom WebRTC livestreaming routes

// 8.5. Health check endpoint for production monitoring
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    // NEW: Enhanced health metrics
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    activeConnections: metrics.activeConnections,
    totalRequests: metrics.requests,
    totalErrors: metrics.errors
  };
  
  res.status(200).json(healthStatus);
});

// NEW: Metrics endpoint for monitoring
app.get('/metrics', (req, res) => {
  res.json({
    ...metrics,
    timestamp: new Date().toISOString(),
    database: {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    }
  });
});

// NEW: Detailed health check for load balancers
app.get('/health/detailed', async (req, res) => {
  try {
    const healthChecks = {
      server: 'OK',
      database: 'OK',
      memory: 'OK',
      uptime: 'OK'
    };
    
    // Check database
    if (mongoose.connection.readyState !== 1) {
      healthChecks.database = 'FAILED';
    }
    
    // Check memory
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
      healthChecks.memory = 'WARNING';
    }
    
    // Check uptime
    if (process.uptime() < 60) { // Less than 1 minute
      healthChecks.uptime = 'WARNING';
    }
    
    const overallStatus = Object.values(healthChecks).every(status => status === 'OK') ? 'OK' : 'DEGRADED';
    
    res.json({
      status: overallStatus,
      checks: healthChecks,
      timestamp: new Date().toISOString(),
      details: {
        uptime: process.uptime(),
        memory: memUsage,
        database: mongoose.connection.readyState,
        activeConnections: metrics.activeConnections
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'FAILED',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 8.6. Admin route handler - redirect to dashboard
app.get('/admin', (req, res) => {
  res.redirect('/admin/dashboard.html');
});

// 8.7. Root route handler
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// 8.8. API documentation route
app.get('/api', (req, res) => {
  res.json({
    message: 'UNA WebRTC Livestreaming API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      courses: '/api/courses',
      enrollments: '/api/enrollments',
      admin: '/api/admin',
      lectures: '/api/lectures',
      webrtc: '/api/webrtc'
    }
  });
});

// 8.9. Server status route
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 9. Global error handler (must be last)
app.use(require('./middleware/errorHandler'));

// NEW: Global error logging
app.use((err, req, res, next) => {
  metrics.errors++;
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 10. Favicon shortcut
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// 11. Socket.IO event routing
require('./socket/streamSocket')(io);

  // 12. Start listening
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`✅ HTTP server running on port ${PORT}`);
    logger.info(`🌐 Network accessible at: http://192.168.8.137:${PORT}`);
    logger.info(`🏠 Local access: http://localhost:${PORT}`);
    logger.info(`🔧 Browser detection enabled - microphone access guidance provided`);
    logger.info(`📊 Health check available at /health`);
    logger.info(`📈 Metrics available at /metrics`);
  });

  // 13. Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    logger.info(`🔄 ${signal} received, shutting down gracefully...`);
    
    // Stop accepting new connections
    server.close(() => {
      logger.info('✅ HTTP server closed');
      
      // Close MongoDB connection
      mongoose.connection.close(() => {
        logger.info('✅ MongoDB connection closed');
        
        // Clear health check interval
        if (metrics.healthCheckInterval) {
          clearInterval(metrics.healthCheckInterval);
        }
        
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      });
    });
    
    // Force exit after 30 seconds
    setTimeout(() => {
      logger.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // NEW: Uncaught exception handling
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });