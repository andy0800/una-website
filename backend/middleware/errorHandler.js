// backend/middleware/errorHandler.js
// Global error handling middleware for consistent error responses

const errorHandler = (err, req, res, next) => {
  // Set CORS headers for error responses
  const origin = req.get('Origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim().replace(/^["']|["']$/g, '')) : [
    'http://localhost:3000',
    'http://localhost:4000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4000',
    'https://cute-churros-f9f049.netlify.app',
    'https://una.institute',
    'https://www.una.institute'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Worker-ID');
  }

  // Enhanced logging for production
  const errorLog = {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    environment: process.env.NODE_ENV || 'development'
  };

  // Log to console in development, structured logging in production
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', errorLog);
  } else {
    // Production logging - structured and clean
    console.error('Production Error:', {
      message: err.message,
      url: req.url,
      method: req.method,
      timestamp: errorLog.timestamp,
      ip: errorLog.ip
    });
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      details: err.message,
      type: 'VALIDATION_ERROR'
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format',
      details: 'The provided ID is not valid',
      type: 'CAST_ERROR'
    });
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Authentication failed',
      details: 'Invalid or expired token',
      type: 'AUTH_ERROR'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired',
      details: 'Please login again',
      type: 'TOKEN_EXPIRED'
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate entry',
      details: 'This record already exists',
      type: 'DUPLICATE_ERROR'
    });
  }

  // Default error response
  res.status(500).json({
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    type: 'INTERNAL_ERROR'
  });
};

module.exports = errorHandler;
