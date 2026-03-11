// frontend/js/config.js
// Centralized configuration for the UNA Institute website
const config = {
  // Environment detection
  ENV: window.location.hostname === 'localhost' ? 'development' : 'production',
  
  // API endpoints - dynamic based on environment
  API_BASE_URL: window.location.hostname === 'localhost' ? 'http://localhost:4000/api' : 'https://api.una.institute/api',
  SOCKET_URL: window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://api.una.institute',
  UPLOAD_URL: window.location.hostname === 'localhost' ? 'http://localhost:4000/uploads' : 'https://api.una.institute/uploads',
  
  // Specific API endpoints
  USER_API: {
    LOGIN: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/users/login' : 'https://api.una.institute/api/users/login',
    REGISTER: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/users/register' : 'https://api.una.institute/api/users/register',
    PROFILE: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/users/me' : 'https://api.una.institute/api/users/me',
    COURSES: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/courses' : 'https://api.una.institute/api/courses',
    ENROLL: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/users/enroll' : 'https://api.una.institute/api/users/enroll'
  },
  
  ADMIN_API: {
    LOGIN: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/admin/login' : 'https://api.una.institute/api/admin/login',
    USERS: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/admin/users' : 'https://api.una.institute/api/admin/users',
    COURSES: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/admin/courses' : 'https://api.una.institute/api/admin/courses',
    STATS: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/admin/stats' : 'https://api.una.institute/api/admin/stats',
    FORMS: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/admin/forms' : 'https://api.una.institute/api/admin/forms'
  },
  
  LECTURE_API: {
    USER_LECTURES: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/lectures/user/lectures' : 'https://api.una.institute/api/lectures/user/lectures',
    ADMIN_LECTURES: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/lectures/admin/lectures' : 'https://api.una.institute/api/lectures/admin/lectures',
    UPLOAD_VIDEO: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/lectures/admin/lectures' : 'https://api.una.institute/api/lectures/admin/lectures',
    STREAM_VIDEO: window.location.hostname === 'localhost' ? 'http://localhost:4000/api/lectures/user/lectures' : 'https://api.una.institute/api/lectures/user/lectures'
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
