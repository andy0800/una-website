const winston = require('winston');
const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor() {
    this.isEnabled = process.env.ENABLE_AUDIT_LOGGING !== 'false';
    this.logLevel = process.env.AUDIT_LOG_LEVEL || 'info';
    this.maxLogSize = parseInt(process.env.AUDIT_MAX_LOG_SIZE) || 10 * 1024 * 1024; // 10MB
    this.maxFiles = parseInt(process.env.AUDIT_MAX_FILES) || 5;
    
    // Ensure logs directory exists
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Initialize Winston logger for audit logs
    this.logger = winston.createLogger({
      level: this.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { 
        service: 'una-audit-logger',
        version: '1.0.0'
      },
      transports: [
        new winston.transports.File({ 
          filename: path.join(logsDir, 'audit.log'),
          maxsize: this.maxLogSize,
          maxFiles: this.maxFiles,
          tailable: true
        }),
        new winston.transports.File({ 
          filename: path.join(logsDir, 'security.log'),
          level: 'warn',
          maxsize: this.maxLogSize,
          maxFiles: this.maxFiles,
          tailable: true
        })
      ]
    });
    
    // Add console transport in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
    
    // In-memory storage for recent logs (for API endpoints)
    this.recentLogs = [];
    this.recentSecurityEvents = [];
    this.maxStoredLogs = 1000;
    
    console.log('🔐 Audit Logger initialized');
  }
  
  // Middleware for logging all requests
  middleware() {
    return (req, res, next) => {
      if (!this.isEnabled) return next();
      
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        this.logRequest({
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId,
          userId: req.user?.id || 'anonymous',
          contentLength: req.get('Content-Length') || 0
        });
      });
      
      next();
    };
  }
  
  // Log HTTP request
  logRequest(data) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      type: 'HTTP_REQUEST',
      ...data,
      severity: this.getSeverity(data.statusCode)
    };
    
    this.logger.info('HTTP Request', logEntry);
    this.addToRecentLogs(logEntry);
  }
  
  // Log performance metrics
  logPerformance(data) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      type: 'PERFORMANCE',
      timestamp: new Date().toISOString(),
      ...data,
      severity: this.getSeverity(data.statusCode)
    };
    
    this.logger.info('Performance Metric', logEntry);
    this.addToRecentLogs(logEntry);
  }
  
  // Log security events
  logSecurityEvent(eventType, data) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      type: 'SECURITY_EVENT',
      eventType,
      timestamp: new Date().toISOString(),
      severity: 'high',
      ...data
    };
    
    this.logger.warn('Security Event', logEntry);
    this.addToRecentSecurityEvents(logEntry);
    this.addToRecentLogs(logEntry);
    
    // Alert for critical security events
    if (this.isCriticalSecurityEvent(eventType)) {
      this.alertSecurityEvent(logEntry);
    }
  }
  
  // Log connection events
  logConnection(connectionType, data) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      type: 'CONNECTION',
      connectionType,
      timestamp: new Date().toISOString(),
      severity: 'info',
      ...data
    };
    
    this.logger.info('Connection Event', logEntry);
    this.addToRecentLogs(logEntry);
  }
  
  // Log health checks
  logHealthCheck(data) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      type: 'HEALTH_CHECK',
      timestamp: new Date().toISOString(),
      severity: data.status === 'OK' ? 'info' : 'warn',
      ...data
    };
    
    this.logger.info('Health Check', logEntry);
    this.addToRecentLogs(logEntry);
  }
  
  // Log server start
  logServerStart(data) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      type: 'SERVER_START',
      timestamp: new Date().toISOString(),
      severity: 'info',
      ...data
    };
    
    this.logger.info('Server Started', logEntry);
    this.addToRecentLogs(logEntry);
  }
  
  // Log database operations
  logDatabaseOperation(operation, data) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      type: 'DATABASE_OPERATION',
      operation,
      timestamp: new Date().toISOString(),
      severity: 'info',
      ...data
    };
    
    this.logger.info('Database Operation', logEntry);
    this.addToRecentLogs(logEntry);
  }
  
  // Log authentication events
  logAuthentication(eventType, data) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      type: 'AUTHENTICATION',
      eventType,
      timestamp: new Date().toISOString(),
      severity: eventType === 'LOGIN_SUCCESS' ? 'info' : 'warn',
      ...data
    };
    
    this.logger.info('Authentication Event', logEntry);
    this.addToRecentLogs(logEntry);
    
    // Log failed authentication attempts
    if (eventType === 'LOGIN_FAILED') {
      this.logger.warn('Failed Authentication Attempt', logEntry);
      this.addToRecentSecurityEvents(logEntry);
    }
  }
  
  // Log WebRTC events
  logWebRTCEvent(eventType, data) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      type: 'WEBRTC_EVENT',
      eventType,
      timestamp: new Date().toISOString(),
      severity: 'info',
      ...data
    };
    
    this.logger.info('WebRTC Event', logEntry);
    this.addToRecentLogs(logEntry);
  }
  
  // Log file operations
  logFileOperation(operation, data) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      type: 'FILE_OPERATION',
      operation,
      timestamp: new Date().toISOString(),
      severity: 'info',
      ...data
    };
    
    this.logger.info('File Operation', logEntry);
    this.addToRecentLogs(logEntry);
  }
  
  // Get logs for API endpoint
  getLogs(limit = 100, type = null, severity = null) {
    let filteredLogs = this.recentLogs;
    
    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }
    
    if (severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === severity);
    }
    
    return filteredLogs.slice(-limit);
  }
  
  // Get security events for API endpoint
  getSecurityEvents(limit = 100) {
    return this.recentSecurityEvents.slice(-limit);
  }
  
  // Add log to recent logs
  addToRecentLogs(logEntry) {
    this.recentLogs.push(logEntry);
    
    // Maintain max size
    if (this.recentLogs.length > this.maxStoredLogs) {
      this.recentLogs = this.recentLogs.slice(-this.maxStoredLogs);
    }
  }
  
  // Add security event to recent security events
  addToRecentSecurityEvents(logEntry) {
    this.recentSecurityEvents.push(logEntry);
    
    // Maintain max size
    if (this.recentSecurityEvents.length > this.maxStoredLogs) {
      this.recentSecurityEvents = this.recentSecurityEvents.slice(-this.maxStoredLogs);
    }
  }
  
  // Determine severity based on status code
  getSeverity(statusCode) {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    if (statusCode >= 300) return 'info';
    return 'info';
  }
  
  // Check if security event is critical
  isCriticalSecurityEvent(eventType) {
    const criticalEvents = [
      'BRUTE_FORCE_ATTEMPT',
      'SQL_INJECTION_ATTEMPT',
      'XSS_ATTEMPT',
      'UNAUTHORIZED_ACCESS',
      'PRIVILEGE_ESCALATION',
      'DATA_BREACH_ATTEMPT'
    ];
    
    return criticalEvents.includes(eventType);
  }
  
  // Alert for critical security events
  alertSecurityEvent(logEntry) {
    // In production, this could send emails, Slack notifications, etc.
    console.error('🚨 CRITICAL SECURITY EVENT:', logEntry);
    
    // Log to security log with high priority
    this.logger.error('Critical Security Alert', {
      ...logEntry,
      alert: true,
      timestamp: new Date().toISOString()
    });
  }
  
  // Search logs
  searchLogs(query, options = {}) {
    const { type, severity, startDate, endDate, limit = 100 } = options;
    
    let filteredLogs = this.recentLogs;
    
    // Filter by type
    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }
    
    // Filter by severity
    if (severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === severity);
    }
    
    // Filter by date range
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
    }
    
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
    }
    
    // Search in text fields
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      filteredLogs = filteredLogs.filter(log => 
        JSON.stringify(log).match(searchRegex)
      );
    }
    
    return filteredLogs.slice(-limit);
  }
  
  // Get log statistics
  getLogStatistics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentLogs = this.recentLogs.filter(log => 
      new Date(log.timestamp) >= oneHourAgo
    );
    
    const dailyLogs = this.recentLogs.filter(log => 
      new Date(log.timestamp) >= oneDayAgo
    );
    
    const stats = {
      total: this.recentLogs.length,
      lastHour: recentLogs.length,
      last24Hours: dailyLogs.length,
      byType: {},
      bySeverity: {},
      byHour: {}
    };
    
    // Count by type
    this.recentLogs.forEach(log => {
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
      
      const hour = new Date(log.timestamp).getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    });
    
    return stats;
  }
  
  // Export logs to file
  exportLogs(format = 'json', options = {}) {
    const { type, severity, startDate, endDate } = options;
    
    let logsToExport = this.recentLogs;
    
    // Apply filters
    if (type) logsToExport = logsToExport.filter(log => log.type === type);
    if (severity) logsToExport = logsToExport.filter(log => log.severity === severity);
    if (startDate) logsToExport = logsToExport.filter(log => new Date(log.timestamp) >= new Date(startDate));
    if (endDate) logsToExport = logsToExport.filter(log => new Date(log.timestamp) <= new Date(endDate));
    
    if (format === 'csv') {
      return this.convertToCSV(logsToExport);
    }
    
    return logsToExport;
  }
  
  // Convert logs to CSV
  convertToCSV(logs) {
    if (logs.length === 0) return '';
    
    const headers = Object.keys(logs[0]);
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const values = headers.map(header => {
        const value = log[header];
        if (typeof value === 'object') {
          return JSON.stringify(value).replace(/"/g, '""');
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }
  
  // Cleanup old logs
  async cleanup() {
    try {
      // Clear in-memory logs
      this.recentLogs = [];
      this.recentSecurityEvents = [];
      
      console.log('✅ Audit logger cleanup completed');
    } catch (error) {
      console.error('❌ Audit logger cleanup failed:', error);
    }
  }
  
  // Test the logger
  test() {
    console.log('🧪 Testing audit logger...');
    
    this.logRequest({
      method: 'GET',
      path: '/test',
      statusCode: 200,
      duration: 50,
      ip: '127.0.0.1',
      userAgent: 'Test Agent',
      requestId: 'test-123'
    });
    
    this.logSecurityEvent('TEST_EVENT', {
      ip: '127.0.0.1',
      userAgent: 'Test Agent'
    });
    
    console.log('✅ Audit logger test completed');
  }
}

module.exports = AuditLogger;
