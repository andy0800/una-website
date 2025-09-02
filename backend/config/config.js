// Configuration Management System
const path = require('path');
const fs = require('fs');

// Environment detection
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isDevelopment = NODE_ENV === 'development';
const isTest = NODE_ENV === 'test';

// Base configuration
const baseConfig = {
  // Server settings
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Worker-ID']
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    }
  },

  // Database settings
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/una_website',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      maxPoolSize: isProduction ? 20 : 10,
      minPoolSize: isProduction ? 5 : 2,
      retryWrites: true,
      w: isProduction ? 'majority' : 1
    },
    retryAttempts: 5,
    retryDelay: 1000
  },

  // WebRTC settings
  webrtc: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    maxBitrate: process.env.MAX_BITRATE || 2500000, // 2.5 Mbps
    maxFramerate: process.env.MAX_FRAMERATE || 30,
    resolution: process.env.RESOLUTION || '1280x720',
    enableScreenShare: true,
    enableRecording: true,
    maxConcurrentStreams: process.env.MAX_CONCURRENT_STREAMS || 5,
    connectionTimeout: 30000, // 30 seconds
    reconnectionAttempts: 3,
    reconnectionDelay: 1000
  },

  // Security settings
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: 12,
    sessionSecret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production',
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          mediaSrc: ["'self'", "blob:", "data:"],
          connectSrc: ["'self'", "ws:", "wss:"],
          frameSrc: ["'self'", "blob:"],
          objectSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
    }
  },

  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || (isProduction ? 'warn' : 'info'),
    format: isProduction ? 'json' : 'simple',
    transports: {
      file: {
        enabled: true,
        filename: 'logs/app.log',
        maxSize: '20m',
        maxFiles: '14d'
      },
      console: {
        enabled: !isProduction
      }
    }
  },

  // Load balancing settings
  loadBalancing: {
    enabled: process.env.ENABLE_CLUSTERING === 'true',
    maxWorkers: process.env.MAX_WORKERS || require('os').cpus().length,
    healthCheckInterval: 5000,
    stickySessions: true,
    sessionAffinity: 'ip-hash'
  },

  // Redis settings (for load balancing)
  redis: {
    enabled: !!process.env.REDIS_URL,
    url: process.env.REDIS_URL,
    options: {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      maxLoadingTimeout: 10000
    }
  },

  // File upload settings
  uploads: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
    uploadDir: 'uploads',
    tempDir: 'temp'
  },

  // Email settings
  email: {
    enabled: !!process.env.SMTP_HOST,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },

  // Monitoring settings
  monitoring: {
    enabled: true,
    metrics: {
      enabled: true,
      interval: 30000 // 30 seconds
    },
    healthChecks: {
      enabled: true,
      interval: 10000 // 10 seconds
    },
    alerts: {
      enabled: isProduction,
      memoryThreshold: 80, // 80% memory usage
      cpuThreshold: 90, // 90% CPU usage
      diskThreshold: 85 // 85% disk usage
    }
  }
};

// Environment-specific configurations
const envConfigs = {
  development: {
    server: {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000']
      }
    },
    logging: {
      level: 'debug',
      format: 'simple'
    },
    monitoring: {
      alerts: {
        enabled: false
      }
    }
  },

  production: {
    server: {
      cors: {
        origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []
      }
    },
    security: {
      jwtSecret: process.env.JWT_SECRET,
      sessionSecret: process.env.SESSION_SECRET
    },
    logging: {
      level: 'warn',
      format: 'json'
    },
    monitoring: {
      alerts: {
        enabled: true
      }
    }
  },

  test: {
    server: {
      port: 0, // Random port for testing
      cors: {
        origin: ['http://localhost:3000']
      }
    },
    database: {
      uri: process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/una_website_test'
    },
    logging: {
      level: 'error',
      transports: {
        file: { enabled: false },
        console: { enabled: false }
      }
    }
  }
};

// Merge configurations
const config = {
  ...baseConfig,
  ...envConfigs[NODE_ENV],
  env: NODE_ENV,
  isProduction,
  isDevelopment,
  isTest
};

// Configuration validation
const validateConfig = () => {
  const errors = [];

  // Required environment variables for production
  if (isProduction) {
    if (!process.env.MONGO_URI) {
      errors.push('MONGO_URI is required in production');
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long in production');
    }
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters long in production');
    }
  }

  // Validate WebRTC settings
  if (config.webrtc.maxBitrate < 100000) {
    errors.push('MAX_BITRATE must be at least 100,000 bps');
  }
  if (config.webrtc.maxFramerate < 1 || config.webrtc.maxFramerate > 60) {
    errors.push('MAX_FRAMERATE must be between 1 and 60');
  }

  // Validate database URI
  if (!config.database.uri || !config.database.uri.startsWith('mongodb://')) {
    errors.push('Invalid MONGO_URI format');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
};

// Configuration reload function
const reloadConfig = () => {
  try {
    // Clear require cache for config files
    delete require.cache[require.resolve(__filename)];
    
    // Reload environment variables
    require('dotenv').config();
    
    // Re-validate configuration
    validateConfig();
    
    console.log('✅ Configuration reloaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Configuration reload failed:', error.message);
    return false;
  }
};

// Configuration export
module.exports = {
  config,
  validateConfig,
  reloadConfig,
  NODE_ENV,
  isProduction,
  isDevelopment,
  isTest
};
