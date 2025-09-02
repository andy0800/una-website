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

// NEW: Load balancing and clustering support
const cluster = require('cluster');
const os = require('os');

// Redis imports for load balancing
let createAdapter, createClient;
try {
  const redisAdapter = require('socket.io-redis-adapter');
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
  enableOptimization: process.env.ENABLE_PERFORMANCE_OPTIMIZATION !== 'false',
  optimizationInterval: parseInt(process.env.OPTIMIZATION_INTERVAL) || 30000,
  memoryThreshold: parseFloat(process.env.MEMORY_THRESHOLD) || 0.8,
  cpuThreshold: parseFloat(process.env.CPU_THRESHOLD) || 0.9,
  enableGarbageCollection: process.env.ENABLE_GC === 'true',
  enableConnectionPooling: process.env.ENABLE_CONNECTION_POOLING !== 'false',
  enableCaching: process.env.ENABLE_CACHING !== 'false'
});

// Performance optimization event listeners
performanceOptimizer.on('metrics-updated', (currentMetrics) => {
  // Update global metrics for external monitoring
  global.currentPerformanceMetrics = currentMetrics;
  
  // Log performance metrics
  if (currentMetrics.memoryUsage > 0.8 || currentMetrics.cpuUsage > 0.9) {
    logger.warn('High resource usage detected', currentMetrics);
  }
});

performanceOptimizer.on('optimization-completed', (strategies) => {
  logger.info(`Performance optimization completed: ${strategies.map(s => s.name).join(', ')}`);
  
  // Update metrics after optimization
  metrics.lastOptimization = Date.now();
  metrics.optimizationCount = (metrics.optimizationCount || 0) + strategies.length;
});

// NEW: Production middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for inline scripts in HTML
        "'unsafe-eval'",   // Required for some WebRTC libraries
        "https://webrtc.github.io",
        "https://cdn.socket.io"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for inline styles
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:", // Required for WebRTC video streams
        "https:"
      ],
      mediaSrc: [
        "'self'",
        "blob:", // Required for WebRTC media streams
        "data:"
      ],
      connectSrc: [
        "'self'",
        "ws:",   // WebSocket connections
        "wss:",  // Secure WebSocket connections
        "https://webrtc.github.io"
      ],
      frameSrc: [
        "'self'",
        "blob:"  // Required for WebRTC iframe support
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false, // Required for WebRTC
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Required for WebRTC
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Required for WebRTC
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Additional security middleware for WebRTC
app.use((req, res, next) => {
  // Security headers for WebRTC
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // WebRTC specific headers
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Rate limiting headers
  res.setHeader('X-RateLimit-Limit', '100');
  res.setHeader('X-RateLimit-Remaining', '99');
  res.setHeader('X-RateLimit-Reset', Date.now() + 60000);
  
  // Worker identification header
  res.setHeader('X-Worker-ID', process.pid);
  
  next();
});

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration for WebRTC
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Worker-ID']
}));

// Static file serving with WebRTC support
app.use(express.static(path.join(__dirname, '../frontend'), {
  setHeaders: (res, path) => {
    // WebRTC specific headers for media files
    if (path.endsWith('.webm') || path.endsWith('.mp4') || path.endsWith('.ogg')) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));

// Health check endpoint for load balancer
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    worker: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
  res.json(health);
});

// Worker-specific metrics
app.get('/worker-metrics', (req, res) => {
  const metrics = {
    workerId: process.pid,
    cpuUsage: process.cpuUsage(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    loadAverage: os.loadavg(),
    timestamp: new Date().toISOString()
  };
  res.json(metrics);
});

// Performance optimization metrics
app.get('/performance-metrics', (req, res) => {
  try {
    const performanceStats = performanceOptimizer.getOptimizationStats();
    const currentMetrics = global.currentPerformanceMetrics || {};
    
    const response = {
      workerId: process.pid,
      timestamp: new Date().toISOString(),
      performance: {
        isEnabled: performanceStats.isEnabled,
        isOptimizing: performanceStats.isOptimizing,
        lastOptimization: performanceStats.lastOptimization,
        optimizationCount: performanceStats.optimizationCount,
        successRate: performanceStats.successRate,
        averageDuration: performanceStats.averageDuration
      },
      currentMetrics: {
        memoryUsage: currentMetrics.memoryUsage || 0,
        cpuUsage: currentMetrics.cpuUsage || 0,
        activeConnections: currentMetrics.activeConnections || 0,
        responseTime: currentMetrics.responseTime || 0,
        throughput: currentMetrics.throughput || 0,
        errorRate: currentMetrics.errorRate || 0,
        systemLoad: currentMetrics.systemLoad || [0, 0, 0],
        uptime: currentMetrics.uptime || 0
      },
      recentOptimizations: performanceStats.recentOptimizations || []
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Performance metrics endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to get performance metrics',
      worker: process.pid,
      timestamp: new Date().toISOString()
    });
  }
});

// Manual performance optimization trigger
app.post('/performance-optimize', async (req, res) => {
  try {
    const { strategy } = req.body;
    
    if (strategy && !performanceOptimizer.optimizationStrategies.has(strategy)) {
      return res.status(400).json({
        error: `Unknown optimization strategy: ${strategy}`,
        availableStrategies: Array.from(performanceOptimizer.optimizationStrategies.keys()),
        worker: process.pid,
        timestamp: new Date().toISOString()
      });
    }
    
    logger.info(`Manual performance optimization triggered: ${strategy || 'all strategies'}`);
    
    await performanceOptimizer.triggerOptimization(strategy);
    
    res.json({
      message: `Performance optimization triggered successfully: ${strategy || 'all strategies'}`,
      worker: process.pid,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Manual optimization trigger error:', error);
    res.status(500).json({ 
      error: 'Failed to trigger performance optimization',
      details: error.message,
      worker: process.pid,
      timestamp: new Date().toISOString()
    });
  }
});

// Register API routes
app.use('/api/webrtc', require('./routes/webrtcRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/lectures', require('./routes/lectureRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Worker error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    worker: process.pid,
    timestamp: new Date().toISOString()
  });
});

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
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
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

// NEW: Request logging middleware with request ID tracking
app.use((req, res, next) => {
  // Generate unique request ID
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);
  
  metrics.requests++;
  const start = Date.now();
  
  // Add request ID to logger context
  req.logger = logger.child({ requestId: req.requestId });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      workerId: process.pid
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
  try {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      requestId: req.requestId,
      workerId: process.pid,
      // NEW: Enhanced health metrics
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      memory: process.memoryUsage(),
      activeConnections: metrics.activeConnections,
      totalRequests: metrics.requests,
      totalErrors: metrics.errors,
      // NEW: Performance metrics
      performance: {
        optimizationEnabled: performanceOptimizer ? true : false,
        lastOptimization: performanceOptimizer ? performanceOptimizer.getOptimizationStats().lastOptimization : null,
        optimizationCount: performanceOptimizer ? performanceOptimizer.getOptimizationStats().optimizationCount : 0
      }
    };
    
    // Check if system is healthy
    const isHealthy = healthStatus.database === 'connected' && 
                     healthStatus.memory.heapUsed < 500 * 1024 * 1024 && // Less than 500MB
                     healthStatus.totalErrors < 100; // Less than 100 errors
    
    if (!isHealthy) {
      healthStatus.status = 'DEGRADED';
      res.status(503);
    }
    
    res.json(healthStatus);
    
  } catch (error) {
    logger.error('Health check failed', { error: error.message, requestId: req.requestId });
    res.status(500).json({
      status: 'FAILED',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
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

// NEW: Global error logging with structured logging
app.use((err, req, res, next) => {
  metrics.errors++;
  
  // Structured error logging
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      message: err.message,
      name: err.name,
      stack: err.stack,
      code: err.code || 'UNKNOWN'
    },
    request: {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      headers: req.headers,
      body: req.body
    },
    context: {
      workerId: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    }
  };
  
  logger.error('Unhandled error occurred', errorLog);
  
  // Send appropriate error response
  res.status(500).json({
    error: 'Internal server error',
    timestamp: errorLog.timestamp,
    requestId: req.headers['x-request-id'] || 'unknown'
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

  // NEW: Load balancing and clustering support
  if (cluster.isMaster && loadBalancerConfig.enabled) {
    console.log(`🚀 Master process ${process.pid} is running`);
    console.log(`📊 Starting ${loadBalancerConfig.maxWorkers} worker processes...`);
    
    // Fork workers
    for (let i = 0; i < loadBalancerConfig.maxWorkers; i++) {
      cluster.fork();
    }
    
    // Handle worker events
    cluster.on('exit', (worker, code, signal) => {
      console.log(`💀 Worker ${worker.process.pid} died. Restarting...`);
      cluster.fork();
    });
    
    cluster.on('online', (worker) => {
      console.log(`✅ Worker ${worker.process.pid} is online`);
    });
    
    // Load balancing health checks
    setInterval(() => {
      const workers = Object.values(cluster.workers);
      const activeWorkers = workers.filter(worker => worker.isConnected());
      
      console.log(`📊 Load balancer status: ${activeWorkers.length}/${workers.length} workers active`);
      
      // Restart dead workers
      workers.forEach(worker => {
        if (!worker.isConnected()) {
          console.log(`🔄 Restarting dead worker ${worker.process.pid}`);
          worker.kill();
          cluster.fork();
        }
      });
    }, loadBalancerConfig.healthCheckInterval);
    
  } else {
    // Worker process
    console.log(`👷 Worker process ${process.pid} started`);
    
    // Enhanced server initialization for workers
    const startWorkerServer = async () => {
      try {
        // Initialize Express app
        const app = express();
        
        // Enhanced security headers for WebRTC and livestreaming
        app.use(helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Required for inline scripts in HTML
                "'unsafe-eval'",   // Required for some WebRTC libraries
                "https://webrtc.github.io",
                "https://cdn.socket.io"
              ],
              styleSrc: [
                "'self'",
                "'unsafe-inline'", // Required for inline styles
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com"
              ],
              fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com"
              ],
              imgSrc: [
                "'self'",
                "data:",
                "blob:", // Required for WebRTC video streams
                "https:"
              ],
              mediaSrc: [
                "'self'",
                "blob:", // Required for WebRTC media streams
                "data:"
              ],
              connectSrc: [
                "'self'",
                "ws:",   // WebSocket connections
                "wss:",  // Secure WebSocket connections
                "https://webrtc.github.io"
              ],
              frameSrc: [
                "'self'",
                "blob:"  // Required for WebRTC iframe support
              ],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: []
            }
          },
          crossOriginEmbedderPolicy: false, // Required for WebRTC
          crossOriginResourcePolicy: { policy: "cross-origin" }, // Required for WebRTC
          crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Required for WebRTC
          referrerPolicy: { policy: "strict-origin-when-cross-origin" },
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
          }
        }));
        
        // Additional security middleware for WebRTC
        app.use((req, res, next) => {
          // Security headers for WebRTC
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'SAMEORIGIN');
          res.setHeader('X-XSS-Protection', '1; mode=block');
          res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
          
          // WebRTC specific headers
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
          res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
          
          // Rate limiting headers
          res.setHeader('X-RateLimit-Limit', '100');
          res.setHeader('X-RateLimit-Remaining', '99');
          res.setHeader('X-RateLimit-Reset', Date.now() + 60000);
          
          // Worker identification header
          res.setHeader('X-Worker-ID', process.pid);
          
          next();
        });
        
        // Compression middleware
        app.use(compression());
        
        // Body parsing middleware
        app.use(express.json({ limit: '50mb' }));
        app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // CORS configuration for WebRTC
        app.use(cors({
          origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
            process.env.NODE_ENV === 'production' ? process.env.DOMAIN : 'http://localhost:3000',
            process.env.NODE_ENV === 'production' ? `https://${process.env.DOMAIN}` : 'http://localhost:5000'
          ],
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Worker-ID']
        }));
        
        // Static file serving with WebRTC support
        app.use(express.static(path.join(__dirname, '../frontend'), {
          setHeaders: (res, path) => {
            // WebRTC specific headers for media files
            if (path.endsWith('.webm') || path.endsWith('.mp4') || path.endsWith('.ogg')) {
              res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
              res.setHeader('Access-Control-Allow-Origin', '*');
            }
          }
        }));
        
        // Health check endpoint for load balancer
        app.get('/health', (req, res) => {
          const health = {
            status: 'healthy',
            worker: process.pid,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
          };
          res.json(health);
        });
        
        // Worker-specific metrics
        app.get('/worker-metrics', (req, res) => {
          const metrics = {
            workerId: process.pid,
            cpuUsage: process.cpuUsage(),
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            loadAverage: os.loadavg(),
            timestamp: new Date().toISOString()
          };
          res.json(metrics);
        });

        // Performance optimization metrics for worker
        app.get('/performance-metrics', (req, res) => {
          try {
            const response = {
              workerId: process.pid,
              timestamp: new Date().toISOString(),
              performance: {
                isEnabled: false, // Workers don't have performance optimizer
                message: 'Performance optimization is managed by master process'
              },
              currentMetrics: {
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
                uptime: process.uptime(),
                systemLoad: os.loadavg()
              }
            };
            
            res.json(response);
          } catch (error) {
            console.error('Worker performance metrics error:', error);
            res.status(500).json({ 
              error: 'Failed to get performance metrics',
              worker: process.pid,
              timestamp: new Date().toISOString()
            });
          }
        });
        
        // Register API routes
        app.use('/api/webrtc', require('./routes/webrtcRoutes'));
        app.use('/api/admin', require('./routes/adminRoutes'));
        app.use('/api/lectures', require('./routes/lectureRoutes'));
        
        // Error handling middleware
        app.use((err, req, res, next) => {
          console.error('Worker error:', err);
          res.status(500).json({ 
            error: 'Internal server error',
            worker: process.pid,
            timestamp: new Date().toISOString()
          });
        });
        
        // Start server
        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, () => {
          console.log(`👷 Worker ${process.pid} listening on port ${PORT}`);
        });
        
        // Initialize Socket.IO with Redis adapter for load balancing
        const io = require('socket.io')(server, {
          cors: {
            origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5000'],
            credentials: true
          },
          transports: ['websocket', 'polling'],
          allowEIO3: true
        });
        
                 // Redis adapter for session sharing across workers
         if (process.env.REDIS_URL && createAdapter && createClient) {
           const pubClient = createClient({ url: process.env.REDIS_URL });
           const subClient = pubClient.duplicate();
           
           Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
             io.adapter(createAdapter(pubClient, subClient));
             console.log(`🔗 Worker ${process.pid} connected to Redis for session sharing`);
           }).catch(err => {
             console.error(`❌ Worker ${process.pid} Redis connection failed:`, err);
           });
         } else if (process.env.REDIS_URL) {
           console.warn(`⚠️ Worker ${process.pid} Redis URL provided but Redis packages not available`);
         }
        
        // Initialize socket handlers
        require('./socket/streamSocket')(io);
        
        // Graceful shutdown for worker
        const gracefulShutdown = (signal) => {
          console.log(`🛑 Worker ${process.pid} received ${signal}, shutting down gracefully...`);
          
          server.close(() => {
            console.log(`✅ Worker ${process.pid} HTTP server closed`);
            
            io.close(() => {
              console.log(`✅ Worker ${process.pid} Socket.IO server closed`);
              process.exit(0);
            });
          });
          
          // Force exit after 30 seconds
          setTimeout(() => {
            console.error(`💀 Worker ${process.pid} forced to exit`);
            process.exit(1);
          }, 30000);
        };
        
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
      } catch (error) {
        console.error(`❌ Worker ${process.pid} failed to start:`, error);
        process.exit(1);
      }
    };
    
    // Start worker server
    startWorkerServer();
  }

  // 13. Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    logger.info(`🔄 ${signal} received, shutting down gracefully...`);
    
    // Stop accepting new connections
    server.close(async () => {
      logger.info('✅ HTTP server closed');
      
      // Shutdown performance optimizer
      try {
        await performanceOptimizer.shutdown();
        logger.info('✅ Performance optimizer shutdown completed');
      } catch (error) {
        logger.error('❌ Performance optimizer shutdown failed:', error);
      }
      
      // NEW: Cleanup metrics interval
      if (metricsInterval) {
        clearInterval(metricsInterval);
        logger.info('✅ Metrics interval cleared');
      }
      
      // NEW: Close Socket.IO server gracefully
      if (io) {
        io.close(() => {
          logger.info('✅ Socket.IO server closed');
        });
      }
      
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