// frontend/js/errorHandler.js
// Centralized error handling for the frontend

class ErrorHandler {
  static errorTypes = {
    AUTH_ERROR: 'AUTH_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
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
