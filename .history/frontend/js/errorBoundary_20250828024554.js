/**
 * Error Boundary System for Frontend Error Handling and Recovery
 * Provides robust error handling, recovery mechanisms, and user feedback
 */

class ErrorBoundary {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.recoveryAttempts = new Map();
    this.maxRecoveryAttempts = 3;
    this.isEnabled = true;
    
    this.initializeGlobalHandlers();
    console.log('🛡️ Error Boundary initialized');
  }
  
  // Initialize global error handlers
  initializeGlobalHandlers() {
    if (!this.isEnabled) return;
    
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError(event.error || event.message, {
        type: 'runtime',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'promise',
        stack: event.reason?.stack
      });
    });
    
    // WebRTC specific error handler
    if (window.RTCPeerConnection) {
      this.setupWebRTCErrorHandling();
    }
    
    // Socket.IO error handler
    if (window.io) {
      this.setupSocketErrorHandling();
    }
  }
  
  // Setup WebRTC error handling
  setupWebRTCErrorHandling() {
    const originalRTCPeerConnection = window.RTCPeerConnection;
    
    window.RTCPeerConnection = function(...args) {
      const pc = new originalRTCPeerConnection(...args);
      
      // Override error handling methods
      pc.addEventListener('connectionstatechange', () => {
        if (pc.connectionState === 'failed') {
          window.errorBoundary?.handleError('WebRTC connection failed', {
            type: 'webrtc',
            connectionState: pc.connectionState,
            iceConnectionState: pc.iceConnectionState,
            iceGatheringState: pc.iceGatheringState
          });
        }
      });
      
      pc.addEventListener('iceconnectionstatechange', () => {
        if (pc.iceConnectionState === 'failed') {
          window.errorBoundary?.handleError('WebRTC ICE connection failed', {
            type: 'webrtc',
            connectionState: pc.connectionState,
            iceConnectionState: pc.iceConnectionState
          });
        }
      });
      
      return pc;
    };
    
    // Copy static methods
    Object.setPrototypeOf(window.RTCPeerConnection, originalRTCPeerConnection);
    Object.setPrototypeOf(window.RTCPeerConnection.prototype, originalRTCPeerConnection.prototype);
  }
  
  // Setup Socket.IO error handling
  setupSocketErrorHandling() {
    const originalSocket = window.io.Socket;
    
    window.io.Socket = function(...args) {
      const socket = new originalSocket(...args);
      
      socket.on('connect_error', (error) => {
        window.errorBoundary?.handleError('Socket connection error', {
          type: 'socket',
          error: error.message,
          code: error.code
        });
      });
      
      socket.on('error', (error) => {
        window.errorBoundary?.handleError('Socket error', {
          type: 'socket',
          error: error.message
        });
      });
      
      return socket;
    };
    
    Object.setPrototypeOf(window.io.Socket, originalSocket);
    Object.setPrototypeOf(window.io.Socket.prototype, originalSocket.prototype);
  }
  
  // Handle errors
  handleError(error, context = {}) {
    if (!this.isEnabled) return;
    
    const errorInfo = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: typeof error === 'string' ? error : error.message || 'Unknown error',
      stack: error.stack || context.stack,
      type: context.type || 'unknown',
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        ...context
      },
      severity: this.calculateSeverity(error, context)
    };
    
    // Add to errors array
    this.errors.push(errorInfo);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    // Log error
    this.logError(errorInfo);
    
    // Attempt recovery
    this.attemptRecovery(errorInfo);
    
    // Show user notification
    this.showErrorNotification(errorInfo);
    
    // Emit error event
    this.emitErrorEvent(errorInfo);
    
    return errorInfo;
  }
  
  // Generate unique error ID
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Calculate error severity
  calculateSeverity(error, context) {
    if (context.type === 'webrtc' && context.connectionState === 'failed') {
      return 'critical';
    }
    
    if (context.type === 'socket' && context.code === 'ECONNREFUSED') {
      return 'critical';
    }
    
    if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
      return 'high';
    }
    
    if (context.type === 'promise') {
      return 'medium';
    }
    
    return 'low';
  }
  
  // Log error
  logError(errorInfo) {
    const logMessage = `🚨 Error [${errorInfo.severity.toUpperCase()}]: ${errorInfo.message}`;
    
    switch (errorInfo.severity) {
      case 'critical':
        console.error(logMessage, errorInfo);
        break;
      case 'high':
        console.warn(logMessage, errorInfo);
        break;
      default:
        console.log(logMessage, errorInfo);
    }
  }
  
  // Attempt error recovery
  attemptRecovery(errorInfo) {
    const recoveryKey = `${errorInfo.type}_${errorInfo.context.url}`;
    const attempts = this.recoveryAttempts.get(recoveryKey) || 0;
    
    if (attempts >= this.maxRecoveryAttempts) {
      console.log(`🔄 Max recovery attempts reached for ${recoveryKey}`);
      return;
    }
    
    this.recoveryAttempts.set(recoveryKey, attempts + 1);
    
    switch (errorInfo.type) {
      case 'webrtc':
        this.recoverWebRTC(errorInfo);
        break;
      case 'socket':
        this.recoverSocket(errorInfo);
        break;
      case 'network':
        this.recoverNetwork(errorInfo);
        break;
      default:
        this.recoverGeneric(errorInfo);
    }
  }
  
  // Recover WebRTC errors
  recoverWebRTC(errorInfo) {
    console.log('🔄 Attempting WebRTC recovery...');
    
    // Try to restart WebRTC connections
    if (window.customWebRTCManager) {
      try {
        window.customWebRTCManager.restartConnection();
        console.log('✅ WebRTC recovery successful');
      } catch (error) {
        console.error('❌ WebRTC recovery failed:', error);
      }
    }
  }
  
  // Recover Socket errors
  recoverSocket(errorInfo) {
    console.log('🔄 Attempting Socket recovery...');
    
    // Try to reconnect socket
    if (window.socket && window.socket.disconnected) {
      try {
        window.socket.connect();
        console.log('✅ Socket recovery successful');
      } catch (error) {
        console.error('❌ Socket recovery failed:', error);
      }
    }
  }
  
  // Recover Network errors
  recoverNetwork(errorInfo) {
    console.log('🔄 Attempting Network recovery...');
    
    // Wait and retry
    setTimeout(() => {
      if (navigator.onLine) {
        console.log('✅ Network recovery successful');
        this.emitRecoveryEvent('network');
      }
    }, 5000);
  }
  
  // Recover Generic errors
  recoverGeneric(errorInfo) {
    console.log('🔄 Attempting Generic recovery...');
    
    // Try to refresh the page if it's a critical error
    if (errorInfo.severity === 'critical') {
      setTimeout(() => {
        if (confirm('A critical error occurred. Would you like to refresh the page?')) {
          window.location.reload();
        }
      }, 1000);
    }
  }
  
  // Show error notification to user
  showErrorNotification(errorInfo) {
    if (!this.shouldShowNotification(errorInfo)) return;
    
    const notification = this.createErrorNotification(errorInfo);
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }
  
  // Check if notification should be shown
  shouldShowNotification(errorInfo) {
    // Don't show notifications for low severity errors
    if (errorInfo.severity === 'low') return false;
    
    // Don't show too many notifications
    const recentErrors = this.errors.filter(error => 
      Date.now() - new Date(error.timestamp).getTime() < 60000
    );
    
    return recentErrors.length <= 3;
  }
  
  // Create error notification element
  createErrorNotification(errorInfo) {
    const notification = document.createElement('div');
    notification.className = `error-notification error-${errorInfo.severity}`;
    notification.innerHTML = `
      <div class="error-header">
        <span class="error-icon">🚨</span>
        <span class="error-title">${this.getErrorTitle(errorInfo.severity)}</span>
        <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="error-message">${errorInfo.message}</div>
      <div class="error-actions">
        <button onclick="window.errorBoundary.retryOperation('${errorInfo.id}')">Retry</button>
        <button onclick="window.errorBoundary.showErrorDetails('${errorInfo.id}')">Details</button>
      </div>
    `;
    
    // Add styles
    this.addNotificationStyles();
    
    return notification;
  }
  
  // Add notification styles
  addNotificationStyles() {
    if (document.getElementById('error-notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'error-notification-styles';
    style.textContent = `
      .error-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: Arial, sans-serif;
        animation: slideIn 0.3s ease-out;
      }
      
      .error-notification.error-critical {
        border-left: 4px solid #dc3545;
      }
      
      .error-notification.error-high {
        border-left: 4px solid #fd7e14;
      }
      
      .error-notification.error-medium {
        border-left: 4px solid #ffc107;
      }
      
      .error-header {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #eee;
      }
      
      .error-icon {
        margin-right: 8px;
        font-size: 18px;
      }
      
      .error-title {
        flex: 1;
        font-weight: bold;
        color: #333;
      }
      
      .error-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .error-close:hover {
        color: #333;
      }
      
      .error-message {
        padding: 12px 16px;
        color: #666;
        line-height: 1.4;
      }
      
      .error-actions {
        padding: 12px 16px;
        border-top: 1px solid #eee;
        display: flex;
        gap: 8px;
      }
      
      .error-actions button {
        padding: 6px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
      }
      
      .error-actions button:hover {
        background: #f8f9fa;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Get error title based on severity
  getErrorTitle(severity) {
    const titles = {
      critical: 'Critical Error',
      high: 'High Priority Error',
      medium: 'Medium Priority Error',
      low: 'Low Priority Error'
    };
    
    return titles[severity] || 'Error';
  }
  
  // Retry operation
  retryOperation(errorId) {
    const error = this.errors.find(e => e.id === errorId);
    if (!error) return;
    
    console.log('🔄 Retrying operation for error:', errorId);
    
    // Attempt recovery again
    this.attemptRecovery(error);
    
    // Remove notification
    const notification = document.querySelector(`[data-error-id="${errorId}"]`);
    if (notification) {
      notification.remove();
    }
  }
  
  // Show error details
  showErrorDetails(errorId) {
    const error = this.errors.find(e => e.id === errorId);
    if (!error) return;
    
    const details = `
Error Details:
- ID: ${error.id}
- Type: ${error.type}
- Severity: ${error.severity}
- Timestamp: ${error.timestamp}
- URL: ${error.context.url}
- Stack: ${error.stack || 'No stack trace available'}
- Context: ${JSON.stringify(error.context, null, 2)}
    `;
    
    alert(details);
  }
  
  // Emit error event
  emitErrorEvent(errorInfo) {
    const event = new CustomEvent('errorBoundary:error', {
      detail: errorInfo
    });
    
    window.dispatchEvent(event);
  }
  
  // Emit recovery event
  emitRecoveryEvent(type) {
    const event = new CustomEvent('errorBoundary:recovery', {
      detail: { type, timestamp: new Date().toISOString() }
    });
    
    window.dispatchEvent(event);
  }
  
  // Get error statistics
  getErrorStats() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentErrors = this.errors.filter(error => 
      new Date(error.timestamp).getTime() > oneHourAgo
    );
    
    const dailyErrors = this.errors.filter(error => 
      new Date(error.timestamp).getTime() > oneDayAgo
    );
    
    const severityCounts = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total: this.errors.length,
      recent: recentErrors.length,
      daily: dailyErrors.length,
      severityCounts,
      recoveryAttempts: this.recoveryAttempts.size
    };
  }
  
  // Clear old errors
  clearOldErrors(daysToKeep = 7) {
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    this.errors = this.errors.filter(error => 
      new Date(error.timestamp).getTime() > cutoff
    );
    
    console.log(`🧹 Cleared errors older than ${daysToKeep} days`);
  }
  
  // Disable error boundary
  disable() {
    this.isEnabled = false;
    console.log('🛑 Error Boundary disabled');
  }
  
  // Enable error boundary
  enable() {
    this.isEnabled = true;
    this.initializeGlobalHandlers();
    console.log('✅ Error Boundary enabled');
  }
  
  // Test error boundary
  test() {
    console.log('🧪 Testing Error Boundary...');
    
    // Test error handling
    this.handleError('Test error', { type: 'test' });
    
    // Test recovery
    this.attemptRecovery({
      id: 'test',
      type: 'test',
      severity: 'medium'
    });
    
    console.log('✅ Error Boundary test completed');
  }
}

// Create global instance
window.errorBoundary = new ErrorBoundary();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorBoundary;
}
