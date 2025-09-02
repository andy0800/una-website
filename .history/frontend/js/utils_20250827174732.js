// frontend/js/utils.js
// Shared utility functions for the UNA Institute website

const Utils = {
  // ===== DOM UTILITIES =====
  
  // Safe element selection with error handling
  getElement: (selector, context = document) => {
    try {
      const element = context.querySelector(selector);
      if (!element) {
        console.warn(`Element not found: ${selector}`);
      }
      return element;
    } catch (error) {
      console.error(`Error selecting element ${selector}:`, error);
      return null;
    }
  },

  // Safe element selection for multiple elements
  getElements: (selector, context = document) => {
    try {
      const elements = context.querySelectorAll(selector);
      return Array.from(elements);
    } catch (error) {
      console.error(`Error selecting elements ${selector}:`, error);
      return [];
    }
  },

  // ===== STRING UTILITIES =====
  
  // Capitalize first letter
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Truncate text with ellipsis
  truncate: (str, length = 50) => {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + '...';
  },

  // Format phone number
  formatPhone: (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 8) {
      return cleaned.replace(/(\d{4})(\d{4})/, '$1-$2');
    }
    return phone;
  },

  // ===== DATE UTILITIES =====
  
  // Format date for display
  formatDate: (date, locale = 'en-US') => {
    if (!date) return '';
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  },

  // Get relative time (e.g., "2 hours ago")
  getRelativeTime: (date) => {
    if (!date) return '';
    try {
      const now = new Date();
      const past = new Date(date);
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return this.formatDate(date);
    } catch (error) {
      console.error('Error getting relative time:', error);
      return '';
    }
  },

  // ===== VALIDATION UTILITIES =====
  
  // Validate email format
  isValidEmail: (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone number
  isValidPhone: (phone) => {
    if (!phone) return false;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  },
  
  // ===== WEBRTC UTILITIES =====
  
  // Check WebRTC support
  checkWebRTCSupport: () => {
    return {
      peerConnection: !!window.RTCPeerConnection,
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      getDisplayMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
      dataChannel: !!window.RTCDataChannel
    };
  },
  
  // Validate media constraints
  validateMediaConstraints: (constraints) => {
    const validConstraints = {};
    
    if (constraints.video) {
      validConstraints.video = {
        width: { ideal: constraints.video.width || 1280 },
        height: { ideal: constraints.video.height || 720 },
        frameRate: { ideal: constraints.video.frameRate || 30 }
      };
    }
    
    if (constraints.audio) {
      validConstraints.audio = {
        echoCancellation: constraints.video.echoCancellation !== false,
        noiseSuppression: constraints.video.noiseSuppression !== false,
        autoGainControl: constraints.video.autoGainControl !== false
      };
    }
    
    return validConstraints;
  },
  
  // Format bitrate for display
  formatBitrate: (bitsPerSecond) => {
    if (bitsPerSecond < 1000) return `${bitsPerSecond} bps`;
    if (bitsPerSecond < 1000000) return `${(bitsPerSecond / 1000).toFixed(1)} Kbps`;
    return `${(bitsPerSecond / 1000000).toFixed(1)} Mbps`;
  },
  
  // Format latency for display
  formatLatency: (milliseconds) => {
    if (milliseconds < 100) return `${milliseconds}ms`;
    if (milliseconds < 1000) return `${(milliseconds / 1000).toFixed(1)}s`;
    return `${(milliseconds / 1000).toFixed(1)}s`;
  },
  
  // Get optimal video quality based on connection
  getOptimalVideoQuality: (connectionType) => {
    const qualityMap = {
      '4g': '1080p',
      '3g': '720p',
      '2g': '480p',
      'slow-2g': '360p'
      };
    return qualityMap[connectionType] || '720p';
  },

  // Validate password strength
  validatePassword: (password) => {
    if (!password) return { valid: false, message: 'Password is required' };
    if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
    if (password.length > 50) return { valid: false, message: 'Password must be less than 50 characters' };
    return { valid: true, message: 'Password is valid' };
  },

  // ===== STORAGE UTILITIES =====
  
  // Safe localStorage operations
  setStorageItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error setting localStorage item:', error);
      return false;
    }
  },

  getStorageItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error getting localStorage item:', error);
      return defaultValue;
    }
  },

  removeStorageItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing localStorage item:', error);
      return false;
    }
  },

  // ===== UI UTILITIES =====
  
  // Show loading state
  showLoading: (element, text = 'Loading...') => {
    if (!element) return;
    element.classList.add('loading');
    element.disabled = true;
    element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
  },

  // Hide loading state
  hideLoading: (element, originalText) => {
    if (!element) return;
    element.classList.remove('loading');
    element.disabled = false;
    if (originalText) element.innerHTML = originalText;
  },

  // Toggle element visibility
  toggleElement: (element, show = null) => {
    if (!element) return;
    if (show === null) {
      element.style.display = element.style.display === 'none' ? 'block' : 'none';
    } else {
      element.style.display = show ? 'block' : 'none';
    }
  },

  // ===== NETWORK UTILITIES =====
  
  // Debounce function for performance optimization
  debounce: function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for performance optimization
  throttle: function(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // ===== ERROR HANDLING =====
  
  // Safe function execution with error handling
  safeExecute: (func, context = null, ...args) => {
    try {
      return func.apply(context, args);
    } catch (error) {
      console.error('Error executing function:', error);
      return null;
    }
  },

  // Format error messages for user display
  formatErrorMessage: (error) => {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.error) return error.error;
    return 'An unexpected error occurred';
  }
};

// Make Utils available globally
window.Utils = Utils;
