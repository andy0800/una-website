// backend/middleware/security.js
// Security middleware for the UNA Institute website

const rateLimit = require('express-rate-limit');

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "img-src 'self' data: https:",
    "font-src 'self' https://cdn.jsdelivr.net",
    "connect-src 'self' ws: wss:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));
  
  next();
};

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000'
    ];
    
    // Add your production domains here
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins.push(
        process.env.FRONTEND_URL || 'https://yourdomain.com'
      );
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-GDPR-Consent'
  ]
};

// API rate limiter
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Security logger middleware
const securityLogger = (req, res, next) => {
  // Log suspicious requests
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /on\w+\s*=/i // Event handler injection
  ];
  
  const userAgent = req.get('User-Agent') || '';
  const url = req.url;
  const method = req.method;
  
  // Check for suspicious patterns
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(userAgent)
  );
  
  if (isSuspicious) {
    console.log(`🚨 Suspicious request detected: ${method} ${url}`);
    console.log(`User-Agent: ${userAgent}`);
    console.log(`IP: ${req.ip}`);
  }
  
  // Log authentication attempts
  if (url.includes('/auth') || url.includes('/login')) {
    console.log(`🔐 Authentication attempt: ${method} ${url} from ${req.ip}`);
  }
  
  // Log admin access
  if (url.includes('/admin')) {
    console.log(`👑 Admin access attempt: ${method} ${url} from ${req.ip}`);
  }
  
  next();
};

module.exports = {
  securityHeaders,
  corsOptions,
  apiRateLimiter,
  securityLogger
};
