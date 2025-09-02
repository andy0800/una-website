// backend/middleware/errorHandler.js
// Global error handling middleware for consistent error responses

const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

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
