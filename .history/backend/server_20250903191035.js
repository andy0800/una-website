// 1. Load environment variables (skip .env file in production)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
} else {
  console.log('🔍 DEBUG: Production mode - skipping .env file loading');
}

// Debug logging for deployment troubleshooting
console.log('🔍 DEBUG: Starting server initialization...');
console.log('🔍 DEBUG: NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 DEBUG: PORT:', process.env.PORT);
console.log('🔍 DEBUG: MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('🔍 DEBUG: JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('🔍 DEBUG: JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined');
console.log('🔍 DEBUG: JWT_SECRET first 8 chars:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 8) + '...' : 'undefined');
console.log('🔍 DEBUG: All environment variables with JWT:', Object.keys(process.env).filter(key => key.includes('JWT')));
console.log('🔍 DEBUG: All environment variables with SECRET:', Object.keys(process.env).filter(key => key.includes('SECRET')));

// 2. Module imports
console.log('🔍 DEBUG: Loading core modules...');
const express    = require('express');
const path       = require('path');
const cors       = require('cors');
const mongoose   = require('mongoose');
const http       = require('http');
const { Server } = require('socket.io');
console.log('🔍 DEBUG: Core modules loaded successfully');

console.log('🔍 DEBUG: Loading middleware...');
const { securityHeaders, corsOptions, apiRateLimiter, securityLogger } = require('./middleware/security');
console.log('🔍 DEBUG: Middleware loaded successfully');

// NEW: Production monitoring and logging
console.log('🔍 DEBUG: Loading production modules...');
const winston = require('winston');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
console.log('🔍 DEBUG: Production modules loaded successfully');

// NEW: Load balancing and clustering support
const cluster = require('cluster');
const os = require('os');

// Redis imports for load balancing
console.log('🔍 DEBUG: Loading Redis modules...');
let createAdapter, createClient;
try {
  const { createAdapter: redisCreateAdapter } = require('@socket.io/redis-adapter');
  const { createClient: redisCreateClient } = require('redis');
  createAdapter = redisCreateAdapter;
  createClient = redisCreateClient;
  console.log('🔍 DEBUG: Redis modules loaded successfully');
} catch (error) {
  console.warn('Redis packages not installed. Load balancing will work without Redis adapter.');
  createAdapter = null;
  createClient = null;
}

// Performance optimization system
console.log('🔍 DEBUG: Loading Performance Optimizer...');
const PerformanceOptimizer = require('./optimization/performanceOptimizer');
console.log('🔍 DEBUG: Performance Optimizer loaded successfully');

// Load balancing configuration
const loadBalancerConfig = {
  enabled: process.env.ENABLE_CLUSTERING === 'true',
  maxWorkers: process.env.MAX_WORKERS || os.cpus().length,
  healthCheckInterval: 5000,
  stickySessions: true,
  sessionAffinity: 'ip-hash'
};

// 3. Initialize Express app
console.log('🔍 DEBUG: Initializing Express app...');
const app = express();
console.log('🔍 DEBUG: Express app initialized successfully');

// NEW: Production logging configuration
console.log('🔍 DEBUG: Initializing Winston logger...');

// Check if logs directory exists, create if not
const fs = require('fs');
const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
  console.log('🔍 DEBUG: Creating logs directory...');
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('🔍 DEBUG: Logs directory created successfully');
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
      defaultMeta: { service: 'una-institute-server' },
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
console.log('🔍 DEBUG: Winston logger initialized successfully');

// 🚀 ENHANCED: Production deployment testing and metrics
const metrics = {
  startTime: Date.now(),
  requests: 0,
  errors: 0,
  activeConnections: 0,
  streams: 0,
  memoryUsage: process.memoryUsage(),
  uptime: 0,
  
  // 🚀 NEW: Production deployment testing metrics
  deploymentTests: {
    loadTestResults: [],
    failoverTests: [],
    edgeCaseTests: [],
    compatibilityTests: []
  },
  
  // 🚀 NEW: Real-world scenario metrics
  realWorldScenarios: {
    highLoadSimulation: false,
    networkFailureSimulation: false,
    browserCompatibilityTest: false,
    crossPlatformTest: false
  }
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

// Initialize performance optimizer with error handling
let performanceOptimizer;
const shouldEnableOptimization = process.env.ENABLE_PERFORMANCE_OPTIMIZATION === 'true';

if (shouldEnableOptimization) {
  try {
    performanceOptimizer = new PerformanceOptimizer({
      enableOptimization: true,
      optimizationInterval: parseInt(process.env.OPTIMIZATION_INTERVAL) || 30000,
      memoryThreshold: parseFloat(process.env.MEMORY_THRESHOLD) || 0.8,
      cpuThreshold: parseFloat(process.env.CPU_THRESHOLD) || 0.9,
      enableGarbageCollection: process.env.ENABLE_GC === 'true',
      enableConnectionPooling: process.env.ENABLE_CONNECTION_POOLING !== 'false',
      enableCaching: process.env.ENABLE_CACHING !== 'false'
    });
    console.log('✅ Performance Optimizer initialized successfully');
  } catch (error) {
    console.error('❌ Performance Optimizer initialization failed:', error);
    console.log('⚠️ Continuing without performance optimization...');
    performanceOptimizer = null;
  }
} else {
  console.log('⚠️ Performance optimization disabled via ENABLE_PERFORMANCE_OPTIMIZATION=false');
  performanceOptimizer = null;
}

// Performance optimization event listeners (only if optimizer is available)
if (performanceOptimizer) {
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
}

// NEW: Production middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for inline scripts in HTML
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
        "https:"
      ],
      mediaSrc: [
        "'self'",
        "data:"
      ],
      connectSrc: [
        "'self'",
        "ws:",   // WebSocket connections
        "wss:"   // Secure WebSocket connections
      ],
      frameSrc: [
        "'self'"
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Additional security middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Cross-origin headers
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

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
    'http://localhost:3000', 
    'http://localhost:5000',
    'https://cute-churros-f9f049.netlify.app',
    'https://una-website-hz2f6q1gr-unas-projects-6283d97d.vercel.app',
    'https://una-website.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Worker-ID']
}));

// Static file serving
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve root-level test files
app.use(express.static(path.join(__dirname, '..'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
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
    if (!performanceOptimizer) {
      return res.json({
        workerId: process.pid,
        timestamp: new Date().toISOString(),
        performance: {
          isEnabled: false,
          message: 'Performance optimizer not available'
        },
        currentMetrics: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          uptime: process.uptime()
        }
      });
    }

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
    if (!performanceOptimizer) {
      return res.status(503).json({
        error: 'Performance optimizer not available',
        worker: process.pid,
        timestamp: new Date().toISOString()
      });
    }

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
console.log('🔍 DEBUG: Creating HTTP server...');
const server = http.createServer(app);
console.log('🔍 DEBUG: HTTP server created successfully');

console.log('🔍 DEBUG: Creating Socket.IO server...');
const io = new Server(server);
console.log('🔍 DEBUG: Socket.IO server created successfully');

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
  console.log('🔍 DEBUG: Inside connectWithRetry function');
  const maxRetries = 5;
  let retries = 0;
  
  // Check if MONGO_URI is provided
  if (!process.env.MONGO_URI) {
    console.log('🔍 DEBUG: MONGO_URI not provided');
    logger.warn('⚠️ MONGO_URI not provided. Server will start without database connection.');
    return;
  }
  
  console.log('🔍 DEBUG: MONGO_URI provided, attempting connection...');
  
  while (retries < maxRetries) {
    try {
      console.log(`🔍 DEBUG: MongoDB connection attempt ${retries + 1}/${maxRetries}`);
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2
      });
      
      console.log('🔍 DEBUG: MongoDB connected successfully');
      logger.info('✅ MongoDB connected successfully');
      break;
    } catch (err) {
      retries++;
      console.log(`🔍 DEBUG: MongoDB connection attempt ${retries} failed:`, err.message);
      logger.error(`❌ MongoDB connection attempt ${retries} failed:`, err.message);
      
      if (retries === maxRetries) {
        console.log('🔍 DEBUG: Max retries reached, giving up');
        logger.error('❌ Max MongoDB connection attempts reached. Server will continue without database.');
        // Don't exit the process, just log the error and continue
        return;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retries - 1), 30000);
      console.log(`🔍 DEBUG: Retrying MongoDB connection in ${delay}ms...`);
      logger.info(`Retrying MongoDB connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Initialize MongoDB connection (non-blocking)
console.log('🔍 DEBUG: Starting MongoDB connection...');
connectWithRetry().catch(error => {
  console.error('🔍 DEBUG: MongoDB connection failed:', error.message);
  console.log('🔍 DEBUG: Continuing without MongoDB connection...');
});

console.log('🔍 DEBUG: MongoDB connection attempt initiated, continuing with server setup...');

// NEW: MongoDB connection event handlers
console.log('🔍 DEBUG: Setting up MongoDB event handlers...');
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

console.log('🔍 DEBUG: MongoDB event handlers set up successfully');

// 5.5. Production environment validation
console.log('🔍 DEBUG: Starting production environment validation...');
if (process.env.NODE_ENV === 'production') {
  console.log('🔍 DEBUG: Running in production mode, validating environment...');
  // Validate required environment variables
  const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('🔍 DEBUG: Missing environment variables:', missingVars);
    logger.error('❌ Missing required environment variables:', missingVars);
    process.exit(1);
  }
  
  // Validate JWT secret strength
  if (process.env.JWT_SECRET.length < 32) {
    console.log('🔍 DEBUG: JWT_SECRET too short:', process.env.JWT_SECRET.length);
    logger.error('❌ JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }
  
  console.log('🔍 DEBUG: Production environment validation passed');
  logger.info('✅ Production environment validation passed');
} else {
  console.log('🔍 DEBUG: Not in production mode, skipping validation');
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

// 8. Root route - API Information
app.get('/', (req, res) => {
  res.json({
    message: '🚀 UNA Institute Backend API',
    version: '1.0.0',
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      healthDetailed: '/health/detailed',
      users: '/api/users',
      courses: '/api/courses',
      enrollments: '/api/enrollments',
      admin: '/api/admin',
      lectures: '/api/lectures'
    },
    documentation: 'Visit /health for server status and /api/* for API endpoints'
  });
});

// 8.1. API route handlers
app.use('/api/users',       require('./routes/userRoutes'));
app.use('/api/courses',     require('./routes/courseRoutes'));
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/admin',       require('./routes/adminRoutes'));
app.use('/api/lectures',    require('./routes/lectureRoutes')); // NEW: Lecture management routes


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
    
    // Check if system is healthy (database connection is optional for basic functionality)
    const isHealthy = healthStatus.memory.heapUsed < 500 * 1024 * 1024 && // Less than 500MB
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
    
    // Check database (optional for basic functionality)
    if (mongoose.connection.readyState !== 1) {
      healthChecks.database = 'DISCONNECTED';
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
    message: 'UNA Institute API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      courses: '/api/courses',
      enrollments: '/api/enrollments',
      admin: '/api/admin',
      lectures: '/api/lectures'
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
console.log('🔍 DEBUG: Loading Socket.IO event routing...');
require('./socket/streamSocket')(io);
console.log('🔍 DEBUG: Socket.IO event routing loaded successfully');

// 12. Start listening
const PORT = process.env.PORT || 3000;
console.log('🔍 DEBUG: Starting HTTP server on port', PORT);

try {
  server.listen(PORT, '0.0.0.0', () => {
    console.log('🔍 DEBUG: HTTP server started successfully');
    logger.info(`✅ HTTP server running on port ${PORT}`);
    logger.info(`🌐 Network accessible at: http://192.168.187.16:${PORT}`);
    logger.info(`🏠 Server listening on port ${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
        logger.info(`🔗 Local access: http://localhost:${PORT}`);
        logger.info(`🌐 Network access: http://192.168.187.16:${PORT}`);
        logger.info(`📱 Other devices can access: http://192.168.187.16:${PORT}`);
    }
    logger.info(`🔧 Browser detection enabled - microphone access guidance provided`);
    logger.info(`📊 Health check available at /health`);
    logger.info(`📈 Metrics available at /metrics`);
  });
} catch (error) {
  console.error('🔍 DEBUG: Server startup error:', error);
  process.exit(1);
}

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
        
        // Enhanced security headers
        app.use(helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Required for inline scripts in HTML
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
                "https:"
              ],
              mediaSrc: [
                "'self'",
                "data:"
              ],
              connectSrc: [
                "'self'",
                "ws:",   // WebSocket connections
                "wss:"   // Secure WebSocket connections
              ],
              frameSrc: [
                "'self'"
              ],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: []
            }
          },
          crossOriginEmbedderPolicy: false,
          crossOriginResourcePolicy: { policy: "cross-origin" },
          crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
          referrerPolicy: { policy: "strict-origin-when-cross-origin" },
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
          }
        }));
        
        // Additional security middleware
        app.use((req, res, next) => {
          // Security headers
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'SAMEORIGIN');
          res.setHeader('X-XSS-Protection', '1; mode=block');
          res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
          
          // Cross-origin headers
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
        
        // CORS configuration
        app.use(cors({
          origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
            process.env.NODE_ENV === 'production' ? process.env.DOMAIN : 'http://localhost:3000',
            process.env.NODE_ENV === 'production' ? `https://${process.env.DOMAIN}` : 'http://localhost:5000'
          ],
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Worker-ID']
        }));
        
        // Static file serving
        app.use(express.static(path.join(__dirname, '../frontend')));
        
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
        
        // Root route - API Information
        app.get('/', (req, res) => {
          res.json({
            message: '🚀 UNA Institute Backend API (Worker)',
            version: '1.0.0',
            status: 'online',
            environment: process.env.NODE_ENV || 'development',
            worker: process.pid,
            timestamp: new Date().toISOString(),
            endpoints: {
              health: '/health',
              healthDetailed: '/health/detailed',
              users: '/api/users',
              courses: '/api/courses',
              enrollments: '/api/enrollments',
              admin: '/api/admin',
              lectures: '/api/lectures'
            },
            documentation: 'Visit /health for server status and /api/* for API endpoints'
          });
        });

        // Register API routes
        app.use('/api/users', require('./routes/userRoutes'));
        app.use('/api/courses', require('./routes/courseRoutes'));
        app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
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
            origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
              process.env.NODE_ENV === 'production' ? process.env.DOMAIN : 'http://localhost:3000',
              process.env.NODE_ENV === 'production' ? `https://${process.env.DOMAIN}` : 'http://localhost:5000'
            ],
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
      if (performanceOptimizer) {
        try {
          await performanceOptimizer.shutdown();
          logger.info('✅ Performance optimizer shutdown completed');
        } catch (error) {
          logger.error('❌ Performance optimizer shutdown failed:', error);
        }
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
    // Don't shutdown immediately in production, log and continue
    if (process.env.NODE_ENV === 'production') {
      logger.error('Continuing despite uncaught exception in production');
    } else {
      gracefulShutdown('uncaughtException');
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't shutdown immediately in production, log and continue
    if (process.env.NODE_ENV === 'production') {
      logger.error('Continuing despite unhandled rejection in production');
    } else {
      gracefulShutdown('unhandledRejection');
    }
  });