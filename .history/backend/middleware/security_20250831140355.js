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
  
  // Enhanced anti-download protection
  res.setHeader('X-Content-Disposition', 'inline');
  res.setHeader('X-No-Download', 'true');
  res.setHeader('X-Content-Protection', 'no-download');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://webrtc.github.io https://cdn.socket.io https://www.google-analytics.com/analytics.js https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/",
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

// Enhanced anti-download protection middleware for video content
const antiDownloadProtection = (req, res, next) => {
  // Check if this is a video streaming request
  if (req.path.includes('/stream') && req.path.includes('/lectures/')) {
    console.log('🔒 Anti-download protection activated for:', req.path);
    console.log('🔍 User Agent:', req.headers['user-agent']);
    console.log('🔍 Accept Header:', req.headers['accept']);
    console.log('🔍 Referer:', req.headers['referer']);
    
    // Set strict anti-download headers for video content
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Content-Protection', 'no-download');
    res.setHeader('X-No-Download', 'true');
    res.setHeader('X-Content-Transfer-Encoding', 'binary');
    res.setHeader('X-Content-Encoding', 'identity');
    
    // Enhanced anti-download headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Accel-Buffering', 'no');
    
    // Check if IP is blocked
    const clientIP = req.ip || req.connection.remoteAddress;
    if (global.blockedIPs && global.blockedIPs.has(clientIP)) {
      console.log('🚫 Blocked request from blocked IP:', clientIP);
      return res.status(403).json({ 
        message: 'Access denied - IP address blocked',
        error: 'IP_BLOCKED'
      });
    }
    
    // Block common download tools and user agents
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const blockedTools = [
      'curl', 'wget', 'aria2', 'axel', 'httrack', 'wget', 'python', 'perl', 'ruby',
      'idm', 'internet download manager', 'download manager', 'downloader',
      'freedownloadmanager', 'fdm', 'orbit', 'orbit downloader', 'getright',
      'flashget', 'nettransport', 'thunder', 'qqdl', 'bitcomet', 'utorrent',
      'bittorrent', 'emule', 'amule', 'kget', 'gget', 'aria2c', 'youtube-dl',
      'yt-dlp', 'ffmpeg', 'vlc', 'media player', 'quicktime', 'realplayer',
      'chrome', 'firefox', 'safari', 'edge', 'opera' // Block browser-based tools
    ];
    
    for (const tool of blockedTools) {
      if (userAgent.includes(tool)) {
        console.log('❌ Blocked download tool:', tool);
        
        // Track blocked attempts
        if (!global.blockedAttempts) global.blockedAttempts = [];
        global.blockedAttempts.push({
          timestamp: new Date(),
          ip: clientIP,
          userAgent: req.headers['user-agent'],
          tool: tool,
          path: req.path,
          referer: req.headers['referer']
        });
        
        // Keep only last 1000 attempts
        if (global.blockedAttempts.length > 1000) {
          global.blockedAttempts = global.blockedAttempts.slice(-1000);
        }
        
        return res.status(403).json({ 
          message: 'Download tools are not allowed',
          error: 'DOWNLOAD_TOOL_BLOCKED',
          blockedTool: tool
        });
      }
    }
    
    // Block requests with download-specific headers
    if (req.headers['accept'] && req.headers['accept'].includes('application/octet-stream')) {
      console.log('❌ Blocked octet-stream request');
      return res.status(403).json({ 
        message: 'Direct download not allowed',
        error: 'DOWNLOAD_ATTEMPT_BLOCKED'
      });
    }
    
    // Block requests without proper referer (helps prevent direct URL access)
    if (!req.headers['referer'] || !req.headers['referer'].includes(req.get('host'))) {
      console.log('❌ Blocked request without proper referer');
      return res.status(403).json({ 
        message: 'Invalid referer - direct access not allowed',
        error: 'INVALID_REFERER'
      });
    }
    
    // Block requests with suspicious headers
    const suspiciousHeaders = [
      'x-requested-with', 'x-forwarded-for', 'x-real-ip', 'x-forwarded-proto',
      'x-original-url', 'x-rewrite-url', 'x-custom-header'
    ];
    
    for (const header of suspiciousHeaders) {
      if (req.headers[header]) {
        console.log('❌ Blocked suspicious header:', header);
        return res.status(403).json({ 
          message: 'Suspicious request detected',
          error: 'SUSPICIOUS_HEADER'
        });
      }
    }
    
    // Rate limiting for video streaming (prevent abuse)
    const streamKey = `stream:${clientIP}:${req.params.id}`;
    
    // Check if this IP has exceeded streaming limits
    if (global.streamRateLimit && global.streamRateLimit[streamKey] > 10) {
      console.log('❌ Rate limit exceeded for IP:', clientIP);
      return res.status(429).json({ 
        message: 'Too many streaming requests',
        error: 'STREAM_RATE_LIMIT_EXCEEDED'
      });
    }
    
    // Initialize rate limiting
    if (!global.streamRateLimit) global.streamRateLimit = {};
    if (!global.streamRateLimit[streamKey]) global.streamRateLimit[streamKey] = 0;
    global.streamRateLimit[streamKey]++;
    
    // Reset rate limit after 1 hour
    setTimeout(() => {
      if (global.streamRateLimit[streamKey]) {
        global.streamRateLimit[streamKey] = Math.max(0, global.streamRateLimit[streamKey] - 1);
      }
    }, 60 * 60 * 1000);
    
    console.log('✅ Anti-download protection passed for IP:', clientIP);
  }
  
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
      // 🌐 NETWORK SHARING: Your local network IP
      'http://192.168.187.16:3000',
      'http://192.168.187.16:3001',
      'https://192.168.187.16:3000',
      'https://192.168.187.16:3001',
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
  antiDownloadProtection,
  corsOptions,
  validateFileUpload,
  securityLogger
};
