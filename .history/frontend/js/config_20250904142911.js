// frontend/js/config.js
// Centralized configuration for the UNA Institute website
const config = {
  // Environment detection
  ENV: window.location.hostname === 'localhost' ? 'development' : 'production',
  
  // API endpoints - dynamic based on environment
  API_BASE_URL: window.location.hostname === 'localhost' ? 'http://localhost:4000/api' : 'https://una-backend-c207.onrender.com/api',
  SOCKET_URL: window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://una-backend-c207.onrender.com',
  UPLOAD_URL: window.location.hostname === 'localhost' ? 'http://localhost:4000/uploads' : 'https://una-backend-c207.onrender.com/uploads',
  
  // Specific API endpoints
  USER_API: {
    LOGIN: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/users/login' : 'https://una-backend-c207.onrender.com/api/users/login',
    REGISTER: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/users/register' : 'https://una-backend-c207.onrender.com/api/users/register',
    PROFILE: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/users/me' : 'https://una-backend-c207.onrender.com/api/users/me',
    COURSES: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/courses' : 'https://una-backend-c207.onrender.com/api/courses',
    ENROLL: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/users/enroll' : 'https://una-backend-c207.onrender.com/api/users/enroll'
  },
  
  ADMIN_API: {
    LOGIN: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/admin/login' : 'https://una-backend-c207.onrender.com/api/admin/login',
    USERS: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/admin/users' : 'https://una-backend-c207.onrender.com/api/admin/users',
    COURSES: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/admin/courses' : 'https://una-backend-c207.onrender.com/api/admin/courses',
    STATS: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/admin/stats' : 'https://una-backend-c207.onrender.com/api/admin/stats',
    FORMS: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/admin/forms' : 'https://una-backend-c207.onrender.com/api/admin/forms'
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
