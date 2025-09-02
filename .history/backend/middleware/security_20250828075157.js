// backend/middleware/security.js
// Security middleware for the UNA Institute website

const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      message: 'Too many requests from this IP, please try again later.',
      type: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        message: 'Too many requests from this IP, please try again later.',
        type: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Different rate limiters for different endpoints
const authRateLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes for auth
const apiRateLimiter = createRateLimiter(15 * 60 * 1000, 500); // 500 requests per 15 minutes for API (reduced from 1000)
const uploadRateLimiter = createRateLimiter(15 * 60 * 1000, 10); // 10 uploads per 15 minutes

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Additional production security headers
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://webrtc.github.io https://cdn.socket.io https://www.google-analytics.com/analytics.js https://cdn.quilljs.com https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.quilljs.com",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: https:",
    "media-src 'self' blob: https:",
    "connect-src 'self' ws: wss: https:",
    "frame-src 'self' https:",
    "frame-ancestors 'none'"
  ].join('; '));
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      // Development origins
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      // Production domains
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      // Network access for testing (HTTP)
      'http://192.168.8.137:3000',
      'http://192.168.8.137:3001',
      // Network access for testing (HTTPS)
      'https://192.168.8.137:3000',
      'https://192.168.8.137:3001'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log blocked origins for debugging
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-auth-token']
};

// File upload security
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  // Check file size (500MB limit)
  const maxSize = 500 * 1024 * 1024;
  if (req.file.size > maxSize) {
    return res.status(400).json({
      message: 'File too large. Maximum size is 500MB.',
      type: 'FILE_TOO_LARGE'
    });
  }
  
  // Check file type
  const allowedTypes = [
    'video/webm',
    'video/mp4',
    'video/avi',
    'video/mov',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf'
  ];
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      message: 'File type not allowed.',
      type: 'INVALID_FILE_TYPE'
    });
  }
  
  next();
};

// Request logging for security monitoring
const securityLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    // Log suspicious activities
    if (res.statusCode >= 400) {
      console.warn('⚠️ Security Warning:', logData);
    }
    
    // Log all requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Request Log:', logData);
    }
  });
  
  next();
};

module.exports = {
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  securityHeaders,
  corsOptions,
  validateFileUpload,
  securityLogger
};
