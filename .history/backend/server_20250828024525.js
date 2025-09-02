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

// NEW: Enterprise security and compliance
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// NEW: Load balancing and clustering support
const cluster = require('cluster');
const os = require('os');

// Redis imports for load balancing
let createAdapter, createClient;
try {
  const redisAdapter = require('@socket.io/redis-adapter');
  const redis = require('redis');
  createAdapter = redisAdapter.createAdapter;
  createClient = redis.createClient;
} catch (error) {
  console.warn('Redis packages not installed. Load balancing will work without Redis adapter.');
  createAdapter = null;
  createClient = null;
}

// Performance optimization system
const PerformanceOptimizer = require('./optimization/performanceOptimizer');

// NEW: Enterprise audit logging
const AuditLogger = require('./logging/auditLogger');
const auditLogger = new AuditLogger();

// NEW: GDPR compliance
const GDPRCompliance = require('./compliance/gdprCompliance');
const gdprCompliance = new GDPRCompliance();

// Load balancing configuration
const loadBalancerConfig = {
  enabled: process.env.ENABLE_CLUSTERING === 'true',
  maxWorkers: process.env.MAX_WORKERS || os.cpus().length,
  healthCheckInterval: 5000,
  stickySessions: true,
  sessionAffinity: 'ip-hash'
};

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
const metricsInterval = setInterval(() => {
  metrics.uptime = process.uptime();
  metrics.memoryUsage = process.memoryUsage();
}, 30000);

// NEW: Cleanup metrics interval on shutdown
process.on('SIGTERM', () => {
  clearInterval(metricsInterval);
});

process.on('SIGINT', () => {
  clearInterval(metricsInterval);
});

// Initialize performance optimizer
const performanceOptimizer = new PerformanceOptimizer({
  cpuThreshold: process.env.CPU_THRESHOLD || 80,
  memoryThreshold: process.env.MEMORY_THRESHOLD || 85,
  connectionThreshold: process.env.CONNECTION_THRESHOLD || 1000
});

// NEW: Enterprise security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// NEW: Rate limiting and security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditLogger.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil(15 * 60 / 1000)
    });
  }
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 50
});

// NEW: Apply security middleware
app.use(limiter);
app.use(speedLimiter);
app.use(hpp()); // Protect against HTTP Parameter Pollution attacks
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks

// NEW: GDPR compliance middleware
app.use(gdprCompliance.middleware());

// NEW: Audit logging middleware
app.use(auditLogger.middleware());

// 4. Apply security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(apiRateLimiter);
app.use(securityLogger);

// 5. Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      auditLogger.logSecurityEvent('INVALID_JSON', {
        ip: req.ip,
        path: req.path,
        error: e.message
      });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000
}));

// NEW: Request validation middleware
app.use((req, res, next) => {
  // Validate request size
  const contentLength = parseInt(req.get('Content-Length') || '0');
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    auditLogger.logSecurityEvent('REQUEST_TOO_LARGE', {
      ip: req.ip,
      path: req.path,
      size: contentLength
    });
    return res.status(413).json({ error: 'Request entity too large' });
  }
  
  // Validate content type for POST/PUT requests
  if ((req.method === 'POST' || req.method === 'PUT') && 
      req.get('Content-Type') && 
      !req.get('Content-Type').includes('application/json') &&
      !req.get('Content-Type').includes('multipart/form-data')) {
    auditLogger.logSecurityEvent('INVALID_CONTENT_TYPE', {
      ip: req.ip,
      path: req.path,
      contentType: req.get('Content-Type')
    });
    return res.status(400).json({ error: 'Invalid content type' });
  }
  
  next();
});

// 6. Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

// NEW: Request ID tracking
app.use((req, res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  req.logger = logger.child({ requestId: req.requestId });
  
  // Log request
  auditLogger.logRequest(req);
  
  next();
});

// NEW: Performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, path, requestId } = req;
    const { statusCode } = res;
    
    // Log performance metrics
    auditLogger.logPerformance({
      method,
      path,
      statusCode,
      duration,
      requestId
    });
    
    // Update global metrics
    metrics.requests++;
    if (statusCode >= 400) {
      metrics.errors++;
    }
    
    // Performance optimization check
    if (duration > 1000) { // 1 second threshold
      performanceOptimizer.analyzeSlowRequest(req, duration);
    }
  });
  
  next();
});

// 7. Static file serving with security headers
app.use(express.static(path.join(__dirname, '../frontend'), {
  setHeaders: (res, path) => {
    // Security headers for static files
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Cache control for different file types
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (path.endsWith('.css') || path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    } else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
  }
}));

// NEW: Health check endpoint with enhanced metrics
app.get('/health', (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      requestId: req.requestId,
      workerId: cluster.isWorker ? cluster.worker.id : 'master',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      cpu: {
        usage: process.cpuUsage(),
        loadAverage: os.loadavg()
      },
      connections: {
        active: metrics.activeConnections,
        total: metrics.requests
      },
      errors: {
        total: metrics.errors,
        rate: metrics.requests > 0 ? (metrics.errors / metrics.requests * 100).toFixed(2) : 0
      },
      streams: {
        active: metrics.streams,
        total: metrics.streams
      }
    };
    
    // Determine health status
    const isHealthy = healthStatus.database === 'connected' && 
                     healthStatus.memory.heapUsed < 500 && 
                     healthStatus.errors.rate < 10;
    
    if (!isHealthy) {
      healthStatus.status = 'DEGRADED';
      res.status(503);
    }
    
    res.json(healthStatus);
    
    // Log health check
    auditLogger.logHealthCheck(healthStatus);
    
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: GDPR compliance endpoints
app.get('/gdpr/data-export/:userId', gdprCompliance.exportUserData);
app.delete('/gdpr/data-deletion/:userId', gdprCompliance.deleteUserData);
app.get('/gdpr/privacy-policy', gdprCompliance.getPrivacyPolicy);

// NEW: Audit log endpoints (admin only)
app.get('/admin/audit-logs', gdprCompliance.requireAdmin, auditLogger.getLogs);
app.get('/admin/security-events', gdprCompliance.requireAdmin, auditLogger.getSecurityEvents);

// 8. API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/forms', require('./routes/formRoutes'));
app.use('/api/lectures', require('./routes/lectureRoutes'));
app.use('/api/webrtc', require('./routes/webrtcRoutes'));

// NEW: Error handling middleware with enhanced logging
app.use((err, req, res, next) => {
  const errorLog = {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    workerId: cluster.isWorker ? cluster.worker.id : 'master',
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  // Log error with context
  logger.error('Unhandled error occurred', errorLog);
  
  // Log security event if it's a security-related error
  if (err.status === 401 || err.status === 403 || err.status === 429) {
    auditLogger.logSecurityEvent('ERROR_HANDLER', errorLog);
  }
  
  // Send appropriate error response
  if (process.env.NODE_ENV === 'production') {
    res.status(err.status || 500).json({
      error: 'Internal server error',
      requestId: req.requestId
    });
  } else {
    res.status(err.status || 500).json({
      error: err.message,
      stack: err.stack,
      requestId: req.requestId
    });
  }
});

// NEW: 404 handler with logging
app.use('*', (req, res) => {
  auditLogger.logSecurityEvent('NOT_FOUND', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    error: 'Route not found',
    requestId: req.requestId
  });
});

// 9. Create HTTP server
const server = http.createServer(app);

// NEW: Server security headers
server.on('connection', (socket) => {
  // Set TCP keep-alive
  socket.setKeepAlive(true, 60000);
  
  // Set TCP no delay
  socket.setNoDelay(true);
  
  // Log connection
  auditLogger.logConnection('TCP_CONNECTION', {
    remoteAddress: socket.remoteAddress,
    remotePort: socket.remotePort
  });
});

// 10. Socket.IO setup with enhanced security
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: false, // Disable Engine.IO v3 for security
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6, // 1MB limit
  allowRequest: (req, callback) => {
    // Validate origin
    const origin = req.headers.origin;
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ["http://localhost:3000"];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      auditLogger.logSecurityEvent('SOCKET_ORIGIN_BLOCKED', {
        origin,
        ip: req.connection.remoteAddress
      });
      callback(null, false);
    }
  }
});

// NEW: Socket.IO security middleware
io.use((socket, next) => {
  // Rate limiting for socket connections
  const clientId = socket.handshake.address;
  const connectionCount = io.sockets.adapter.rooms.get(clientId)?.size || 0;
  
  if (connectionCount > 5) { // Max 5 connections per IP
    auditLogger.logSecurityEvent('SOCKET_RATE_LIMIT', {
      ip: clientId,
      connectionCount
    });
    return next(new Error('Too many connections'));
  }
  
  // Validate authentication token if present
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      // Validate token (implement your token validation logic)
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // socket.userId = decoded.userId;
      next();
    } catch (error) {
      auditLogger.logSecurityEvent('SOCKET_INVALID_TOKEN', {
        ip: clientId,
        error: error.message
      });
      next(new Error('Invalid token'));
    }
  } else {
    next();
  }
});

// NEW: Socket.IO connection logging
io.on('connection', (socket) => {
  auditLogger.logConnection('SOCKET_CONNECTION', {
    socketId: socket.id,
    ip: socket.handshake.address,
    userAgent: socket.handshake.headers['user-agent']
  });
  
  // Update metrics
  metrics.activeConnections++;
  
  socket.on('disconnect', (reason) => {
    auditLogger.logConnection('SOCKET_DISCONNECTION', {
      socketId: socket.id,
      reason,
      ip: socket.handshake.address
    });
    
    // Update metrics
    metrics.activeConnections = Math.max(0, metrics.activeConnections - 1);
  });
});

// 11. Load Socket.IO handlers
require('./socket/streamSocket')(io);

// NEW: Graceful shutdown with enhanced cleanup
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Stop accepting new connections
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
    
    // Close Socket.IO server
    if (io) {
      io.close(() => {
        console.log('✅ Socket.IO server closed');
      });
    }
    
    // Clear intervals
    if (metricsInterval) {
      clearInterval(metricsInterval);
      console.log('✅ Metrics interval cleared');
    }
    
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
    }
    
    // Final cleanup
    await auditLogger.cleanup();
    await gdprCompliance.cleanup();
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// NEW: Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  auditLogger.logSecurityEvent('UNCAUGHT_EXCEPTION', {
    error: error.message,
    stack: error.stack
  });
  
  // Graceful shutdown
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// NEW: Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason: reason,
    promise: promise,
    timestamp: new Date().toISOString()
  });
  
  auditLogger.logSecurityEvent('UNHANDLED_REJECTION', {
    reason: reason,
    promise: promise
  });
  
  // Don't exit the process, just log the error
});

// 12. Start server
const PORT = process.env.PORT || 3000;

if (cluster.isMaster && loadBalancerConfig.enabled) {
  console.log(`🚀 Master process ${process.pid} is running`);
  console.log(`📊 Starting ${loadBalancerConfig.maxWorkers} worker processes...`);
  
  // Fork workers
  for (let i = 0; i < loadBalancerConfig.maxWorkers; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
  
  // Monitor workers
  setInterval(() => {
    const workers = Object.values(cluster.workers);
    const activeWorkers = workers.filter(worker => worker && !worker.isDead());
    
    console.log(`📊 Active workers: ${activeWorkers.length}/${loadBalancerConfig.maxWorkers}`);
    
    // Restart dead workers
    workers.forEach(worker => {
      if (worker && worker.isDead()) {
        console.log(`🔄 Restarting dead worker ${worker.process.pid}`);
        cluster.fork();
      }
    });
  }, loadBalancerConfig.healthCheckInterval);
  
} else {
  // Worker process
  server.listen(PORT, () => {
    const workerInfo = cluster.isWorker ? ` (Worker ${cluster.worker.id})` : '';
    console.log(`🚀 Server running on port ${PORT}${workerInfo}`);
    console.log(`🔒 Security features: ${Object.keys(securityHeaders).length} headers enabled`);
    console.log(`📊 Performance monitoring: ${performanceOptimizer.isEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`📝 Audit logging: ${auditLogger.isEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`🔐 GDPR compliance: ${gdprCompliance.isEnabled ? 'Enabled' : 'Disabled'}`);
    
    // Log server start
    auditLogger.logServerStart({
      port: PORT,
      workerId: cluster.isWorker ? cluster.worker.id : 'master',
      environment: process.env.NODE_ENV || 'development'
    });
  });
}

// Export for testing
module.exports = { app, server, io };