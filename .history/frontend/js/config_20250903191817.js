// frontend/js/config.js
// Centralized configuration for the UNA Institute website
const config = {
  // Environment detection
  ENV: window.location.hostname === 'localhost' ? 'development' : 'production',
  
  // API endpoints - use production URL
  API_BASE_URL: 'https://una-backend-c207.onrender.com/api',
  SOCKET_URL: 'https://una-backend-c207.onrender.com',
  UPLOAD_URL: 'https://una-backend-c207.onrender.com/uploads',
  
  // Specific API endpoints
  USER_API: {
    LOGIN: 'https://una-backend-c207.onrender.com/api/users/login',
    REGISTER: 'https://una-backend-c207.onrender.com/api/users/register',
    PROFILE: 'https://una-backend-c207.onrender.com/api/users/me',
    COURSES: 'https://una-backend-c207.onrender.com/api/courses',
    ENROLL: 'https://una-backend-c207.onrender.com/api/users/enroll'
  },
  
  ADMIN_API: {
    LOGIN: '/api/admin/login',
    USERS: '/api/admin/users',
    COURSES: '/api/admin/courses',
    STATS: '/api/admin/stats',
    FORMS: '/api/admin/forms'
  },
  
  LECTURE_API: {
    USER_LECTURES: '/api/lectures/user/lectures',
    ADMIN_LECTURES: '/api/lectures/admin/lectures',
    UPLOAD_VIDEO: '/api/lectures/admin/lectures',
    STREAM_VIDEO: '/api/lectures/user/lectures'
  },
  
  // File paths
  ASSETS: {
    CERTIFICATES: '/certs',
    IMAGES: '/images',
    CSS: '/css',
    JS: '/js'
  },
  
  // Authentication
  AUTH: {
    TOKEN_KEY: 'userToken',
    ADMIN_TOKEN_KEY: 'adminToken',
    TOKEN_EXPIRY: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  },

  // Production settings
  PRODUCTION: {
    DEBUG: false,
    LOG_LEVEL: 'warn',
    ERROR_REPORTING: true
  },

  // Development settings
  DEVELOPMENT: {
    DEBUG: true,
    LOG_LEVEL: 'info',
    ERROR_REPORTING: false
  }
};

// Make config available globally
window.config = config;
