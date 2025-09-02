// frontend/js/errorHandler.js
// Centralized error handling for the frontend

class ErrorHandler {
  static errorTypes = {
    AUTH_ERROR: 'AUTH_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    WEBRTC_ERROR: 'WEBRTC_ERROR',
    MEDIA_ERROR: 'MEDIA_ERROR',
    STREAM_ERROR: 'STREAM_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  };

  // Handle different types of errors
  static handle(error, context = 'Unknown') {
    console.error(`Error in ${context}:`, error);
    
    // Determine error type
    const errorType = this.classifyError(error);
    
    // Handle specific error types
    switch (errorType) {
      case this.errorTypes.AUTH_ERROR:
        this.handleAuthError(error);
        break;
      case this.errorTypes.NETWORK_ERROR:
        this.handleNetworkError(error);
        break;
      case this.errorTypes.VALIDATION_ERROR:
        this.handleValidationError(error);
        break;
      case this.errorTypes.SERVER_ERROR:
        this.handleServerError(error);
        break;
      case this.errorTypes.WEBRTC_ERROR:
        this.handleWebRTCError(error);
        break;
      case this.errorTypes.MEDIA_ERROR:
        this.handleMediaError(error);
        break;
      case this.errorTypes.STREAM_ERROR:
        this.handleStreamError(error);
        break;
      default:
        this.handleUnknownError(error);
    }
  }

  // Classify error based on message or status
  static classifyError(error) {
    if (error.message && error.message.includes('401')) {
      return this.errorTypes.AUTH_ERROR;
    }
    
    if (error.message && error.message.includes('403')) {
      return this.errorTypes.AUTH_ERROR;
    }
    
    if (error.message && error.message.includes('400')) {
      return this.errorTypes.VALIDATION_ERROR;
    }
    
    if (error.message && error.message.includes('500')) {
      return this.errorTypes.SERVER_ERROR;
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.errorTypes.NETWORK_ERROR;
    }
    
    // WebRTC error detection
    if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
      return this.errorTypes.MEDIA_ERROR;
    }
    
    if (error.name === 'NotFoundError' || error.message.includes('getUserMedia')) {
      return this.errorTypes.MEDIA_ERROR;
    }
    
    if (error.message.includes('WebRTC') || error.message.includes('RTCPeerConnection')) {
      return this.errorTypes.WEBRTC_ERROR;
    }
    
    if (error.message.includes('stream') || error.message.includes('livestream')) {
      return this.errorTypes.STREAM_ERROR;
    }
    
    return this.errorTypes.UNKNOWN_ERROR;
  }

  // Handle authentication errors
  static handleAuthError(error) {
    console.log('Authentication error detected, redirecting to login...');
    
    // Clear stored tokens
    localStorage.removeItem('userToken');
    localStorage.removeItem('adminToken');
    
    // Redirect to appropriate login page
    const currentPath = window.location.pathname;
    if (currentPath.includes('/admin/')) {
      window.location.href = '/admin/login.html';
    } else {
      window.location.href = '/en/login.html';
    }
  }

  // Handle network errors
  static handleNetworkError(error) {
    this.showNotification(
      'Network Error',
      'Unable to connect to server. Please check your internet connection.',
      'error'
    );
  }

  // Handle validation errors
  static handleValidationError(error) {
    this.showNotification(
      'Validation Error',
      error.message || 'Please check your input and try again.',
      'warning'
    );
  }

  // Handle server errors
  static handleServerError(error) {
    this.showNotification(
      'Server Error',
      'A server error occurred. Please try again later.',
      'error'
    );
  }
  
  // 🚀 ENHANCED: Handle WebRTC errors with production-grade recovery
  static handleWebRTCError(error) {
    console.error('WebRTC Error:', error);
    
    let userMessage = 'WebRTC connection failed.';
    let errorCode = 'UNKNOWN';
    let recoveryAction = null;
    
    // 🚀 NEW: Enhanced error classification for production
    if (error.name === 'NotAllowedError') {
      userMessage = 'Camera and microphone access denied. Please allow access and try again.';
      errorCode = 'PERMISSION_DENIED';
      recoveryAction = () => this.requestMediaPermissions();
    } else if (error.name === 'NotFoundError') {
      userMessage = 'Camera or microphone not found. Please check your device.';
      errorCode = 'DEVICE_NOT_FOUND';
      recoveryAction = () => this.checkDeviceAvailability();
    } else if (error.name === 'NotReadableError') {
      userMessage = 'Camera or microphone is already in use by another application.';
      errorCode = 'DEVICE_IN_USE';
      recoveryAction = () => this.releaseDeviceResources();
    } else if (error.name === 'OverconstrainedError') {
      userMessage = 'Camera or microphone does not meet the required specifications.';
      errorCode = 'CONSTRAINTS_NOT_SATISFIED';
      recoveryAction = () => this.adjustMediaConstraints();
    } else if (error.name === 'TypeError') {
      userMessage = 'WebRTC is not supported in this browser. Please use a modern browser.';
      errorCode = 'BROWSER_NOT_SUPPORTED';
      recoveryAction = () => this.checkBrowserCompatibility();
    } else if (error.message && error.message.includes('ICE')) {
      userMessage = 'Network connection failed. Please check your internet connection.';
      errorCode = 'ICE_CONNECTION_FAILED';
      recoveryAction = () => this.retryIceConnection();
    } else if (error.message && error.message.includes('offer')) {
      userMessage = 'Stream negotiation failed. Please try starting the stream again.';
      errorCode = 'OFFER_FAILED';
      recoveryAction = () => this.retryStreamNegotiation();
    }
    
    // 🚀 NEW: Log error for production monitoring
    this.logProductionError('WebRTC', errorCode, error.message, error.stack);
    
    // 🚀 NEW: Show enhanced error message with recovery options
    this.showErrorMessage(userMessage, {
      showRetry: true,
      retryAction: () => {
        if (recoveryAction) {
          recoveryAction();
        } else {
          this.attemptWebRTCRecovery(error);
        }
      },
      showDetails: true,
      errorDetails: {
        code: errorCode,
        name: error.name,
        message: error.message
      }
    });
  }

  // NEW: Enhanced WebRTC recovery
  static async attemptWebRTCRecovery(error) {
    try {
      // Step 1: Cleanup existing connections
      if (window.webrtcManager) {
        await window.webrtcManager.cleanup();
        console.log('✅ WebRTC manager cleaned up');
      }
      
      // Step 2: Wait for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Attempt to reinitialize
      if (typeof initializeWebRTCManager === 'function') {
        await initializeWebRTCManager();
        console.log('✅ WebRTC manager reinitialized');
        
        // Show success message
        this.showSuccessMessage('WebRTC connection recovered successfully!');
        return;
      }
      
      // Step 4: Fallback - show manual recovery message
      this.showErrorMessage('WebRTC connection error. Please refresh the page to reconnect.', {
        showRetry: true,
        retryAction: () => location.reload()
      });
      
    } catch (recoveryError) {
      console.error('WebRTC recovery failed:', recoveryError);
      this.showErrorMessage('Failed to recover WebRTC connection. Please refresh the page.');
    }
  }
  
  // Handle media errors
  static handleMediaError(error) {
    this.showNotification(
      'Media Access Error',
      'Camera or microphone access denied. Please allow access and refresh.',
      'warning'
    );
  }
  
  // Handle stream errors
  static handleStreamError(error) {
    this.showNotification(
      'Stream Error',
      'Livestream issue detected. Please try again or contact support.',
      'error'
    );
  }
    this.showNotification(
      'Server Error',
      'Something went wrong on our end. Please try again later.',
      'error'
    );
  }

  // Handle unknown errors
  static handleUnknownError(error) {
    this.showNotification(
      'Error',
      error.message || 'An unexpected error occurred.',
      'error'
    );
  }

  // NEW: Show success message
  static showSuccessMessage(message, options = {}) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 400px;
      animation: slideInRight 0.3s ease;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-check-circle" style="font-size: 18px;"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; margin-left: auto;">
          ×
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // NEW: Enhanced error message with retry option
  static showErrorMessage(message, options = {}) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 400px;
      animation: slideInRight 0.3s ease;
    `;
    
    let content = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 18px;"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; margin-left: auto;">
          ×
        </button>
      </div>
    `;
    
    if (options.showRetry && options.retryAction) {
      content += `
        <div style="margin-top: 10px; text-align: center;">
          <button onclick="this.parentElement.parentElement.remove(); ${options.retryAction.toString()}()" style="background: rgba(255,255,255,0.2); border: 1px solid white; color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
            Retry
          </button>
        </button>
      </div>
    `;
    
    notification.innerHTML = content;
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  // Show user-friendly notification
  static showNotification(title, message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${this.getNotificationColor(type)};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 400px;
      font-family: Arial, sans-serif;
      animation: slideInRight 0.3s ease;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
      <div style="font-size: 14px;">${message}</div>
      <button onclick="this.parentElement.remove()" style="
        position: absolute;
        top: 5px;
        right: 5px;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 18px;
      ">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // Get notification color based on type
  static getNotificationColor(type) {
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };
    return colors[type] || colors.info;
  }

  // Handle fetch errors consistently
  static async handleFetchResponse(response, context = 'API call') {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.context = context;
      
      this.handle(error, context);
      throw error;
    }
    
    return response.json();
  }

  // Retry mechanism for failed requests
  static async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  // Get error details for debugging
  static getErrorDetails(error) {
    return {
      message: error.message || 'Unknown error occurred',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  // Production error reporting
  static reportError(error, context = {}) {
    const errorDetails = this.getErrorDetails(error);
    const reportData = {
      ...errorDetails,
      context,
      environment: window.location.hostname === 'localhost' ? 'development' : 'production'
    };

    // In production, you might want to send this to an error reporting service
    if (window.location.hostname !== 'localhost') {
      // Production error reporting (example - replace with your service)
      console.error('Production Error Report:', reportData);
      
      // You could send to Sentry, LogRocket, or your own endpoint
      // fetch('/api/errors', { method: 'POST', body: JSON.stringify(reportData) });
    } else {
      // Development logging
      console.error('Development Error:', reportData);
    }
  }
}

// Make ErrorHandler available globally
window.ErrorHandler = ErrorHandler;

// NEW: Add CSS animations if not present
if (!document.getElementById('errorHandlerAnimations')) {
  const style = document.createElement('style');
  style.id = 'errorHandlerAnimations';
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .notification {
      animation: slideInRight 0.3s ease;
    }
    
    .notification.removing {
      animation: slideOutRight 0.3s ease;
    }
  `;
  document.head.appendChild(style);
}
