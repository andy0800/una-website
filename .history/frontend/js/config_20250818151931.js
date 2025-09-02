// frontend/js/config.js
// Centralized configuration for the UNA Institute website
const config = {
  // API endpoints - use relative URLs for production compatibility
  API_BASE_URL: '/api',
  SOCKET_URL: window.location.origin,
  UPLOAD_URL: '/uploads',
  
  // Specific API endpoints
  USER_API: {
    LOGIN: '/api/users/login',
    REGISTER: '/api/users/register',
    PROFILE: '/api/users/me',
    COURSES: '/api/courses',
    ENROLL: '/api/users/enroll'
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
  }
};

// Export for ES6 modules, fallback for regular scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  window.config = config;
}
