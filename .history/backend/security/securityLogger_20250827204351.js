const fs = require('fs');
const path = require('path');

class SecurityLogger {
  constructor() {
    this.isEnabled = process.env.ENABLE_SECURITY_LOGGING !== 'false';
    this.logLevel = process.env.SECURITY_LOG_LEVEL || 'warn';
    this.maxLogSize = parseInt(process.env.SECURITY_MAX_LOG_SIZE) || 10 * 1024 * 1024; // 10MB
    this.maxFiles = parseInt(process.env.SECURITY_MAX_FILES) || 5;
    
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    this.securityLogPath = path.join(logsDir, 'security.log');
    this.threatLogPath = path.join(logsDir, 'threats.log');
    
    // Security event counters
    this.eventCounters = {
      failed_logins: 0,
      suspicious_activity: 0,
      rate_limit_violations: 0,
      unauthorized_access: 0,
      sql_injection_attempts: 0,
      xss_attempts: 0,
      csrf_attempts: 0
    };
    
    // Threat detection patterns
    this.threatPatterns = {
      sql_injection: /(\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(from|into|where|table|database)\b)/i,
      xss: /<script[^>]*>.*?<\/script>|<.*?javascript:.*?>|<.*?on\w+\s*=/i,
      csrf: /csrf|xsrf|cross.*?site.*?request.*?forgery/i,
      path_traversal: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i,
      command_injection: /(\b(cmd|command|exec|system|eval|shell)\b)/i
    };
    
    console.log('🔒 Security Logger initialized');
  }
  
  // Log security event
  logSecurityEvent(eventType, data = {}) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      severity: this.getEventSeverity(eventType),
      data,
      ip: data.ip || 'unknown',
      userAgent: data.userAgent || 'unknown',
      userId: data.userId || 'anonymous',
      endpoint: data.endpoint || 'unknown',
      method: data.method || 'unknown'
    };
    
    // Update event counter
    if (this.eventCounters[eventType]) {
      this.eventCounters[eventType]++;
    }
    
    // Write to security log
    this.writeToLog(this.securityLogPath, logEntry);
    
    // Check if this is a threat
    if (this.isThreat(eventType, data)) {
      this.logThreat(logEntry);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔒 Security Event [${eventType}]:`, logEntry);
    }
  }
  
  // Get event severity
  getEventSeverity(eventType) {
    const severityMap = {
      failed_logins: 'medium',
      suspicious_activity: 'high',
      rate_limit_violations: 'medium',
      unauthorized_access: 'high',
      sql_injection_attempts: 'critical',
      xss_attempts: 'critical',
      csrf_attempts: 'high'
    };
    
    return severityMap[eventType] || 'low';
  }
  
  // Check if event is a threat
  isThreat(eventType, data) {
    // Check for known threat patterns
    if (data.payload) {
      for (const [threatType, pattern] of Object.entries(this.threatPatterns)) {
        if (pattern.test(data.payload)) {
          return true;
        }
      }
    }
    
    // Check for suspicious patterns
    if (eventType === 'failed_logins' && this.eventCounters.failed_logins > 5) {
      return true;
    }
    
    if (eventType === 'rate_limit_violations' && this.eventCounters.rate_limit_violations > 10) {
      return true;
    }
    
    return false;
  }
  
  // Log threat
  logThreat(logEntry) {
    const threatEntry = {
      ...logEntry,
      threatLevel: 'high',
      detectedAt: new Date().toISOString(),
      mitigation: this.getMitigationStrategy(logEntry.eventType)
    };
    
    this.writeToLog(this.threatLogPath, threatEntry);
    
    // In production, this would trigger alerts
    if (process.env.NODE_ENV === 'production') {
      this.triggerThreatAlert(threatEntry);
    }
  }
  
  // Get mitigation strategy
  getMitigationStrategy(eventType) {
    const strategies = {
      sql_injection_attempts: 'Block IP, log attempt, notify admin',
      xss_attempts: 'Sanitize input, block malicious payloads',
      csrf_attempts: 'Validate CSRF tokens, check referrer',
      failed_logins: 'Implement account lockout, notify user',
      rate_limit_violations: 'Temporary IP ban, increase monitoring'
    };
    
    return strategies[eventType] || 'Monitor and log';
  }
  
  // Write to log file
  writeToLog(logPath, entry) {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(logPath, logLine);
      
      // Check log file size and rotate if needed
      this.rotateLogIfNeeded(logPath);
      
    } catch (error) {
      console.error('Failed to write to security log:', error);
    }
  }
  
  // Rotate log if needed
  rotateLogIfNeeded(logPath) {
    try {
      const stats = fs.statSync(logPath);
      if (stats.size > this.maxLogSize) {
        this.rotateLog(logPath);
      }
    } catch (error) {
      // File doesn't exist or can't be accessed
    }
  }
  
  // Rotate log file
  rotateLog(logPath) {
    try {
      const dir = path.dirname(logPath);
      const base = path.basename(logPath, '.log');
      
      // Remove oldest log file if we have max files
      for (let i = this.maxFiles - 1; i >= 0; i--) {
        const oldFile = path.join(dir, `${base}.${i}.log`);
        if (i === 0) {
          // Rename current log to .1
          fs.renameSync(logPath, oldFile);
        } else {
          // Shift other logs
          const nextFile = path.join(dir, `${base}.${i - 1}.log`);
          if (fs.existsSync(nextFile)) {
            fs.renameSync(nextFile, oldFile);
          }
        }
      }
      
      console.log(`🔄 Security log rotated: ${logPath}`);
      
    } catch (error) {
      console.error('Failed to rotate security log:', error);
    }
  }
  
  // Trigger threat alert
  triggerThreatAlert(threatEntry) {
    // In production, this would send notifications
    console.log(`🚨 THREAT DETECTED: ${threatEntry.eventType}`);
    console.log(`IP: ${threatEntry.ip}, User: ${threatEntry.userId}`);
    console.log(`Endpoint: ${threatEntry.method} ${threatEntry.endpoint}`);
    console.log(`Mitigation: ${threatEntry.mitigation}`);
  }
  
  // Get security statistics
  getSecurityStats() {
    return {
      eventCounters: this.eventCounters,
      totalEvents: Object.values(this.eventCounters).reduce((a, b) => a + b, 0),
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Get recent security events
  getRecentEvents(limit = 100) {
    try {
      if (!fs.existsSync(this.securityLogPath)) {
        return [];
      }
      
      const content = fs.readFileSync(this.securityLogPath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      const events = lines
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (error) {
            return null;
          }
        })
        .filter(event => event !== null);
      
      return events.reverse(); // Most recent first
      
    } catch (error) {
      console.error('Failed to read recent security events:', error);
      return [];
    }
  }
  
  // Get recent threats
  getRecentThreats(limit = 50) {
    try {
      if (!fs.existsSync(this.threatLogPath)) {
        return [];
      }
      
      const content = fs.readFileSync(this.threatLogPath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      const threats = lines
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (error) {
            return null;
          }
        })
        .filter(threat => threat !== null);
      
      return threats.reverse(); // Most recent first
      
    } catch (error) {
      console.error('Failed to read recent threats:', error);
      return [];
    }
  }
  
  // Clear old logs
  clearOldLogs(daysToKeep = 30) {
    try {
      const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      
      [this.securityLogPath, this.threatLogPath].forEach(logPath => {
        if (fs.existsSync(logPath)) {
          const content = fs.readFileSync(logPath, 'utf8');
          const lines = content.trim().split('\n').filter(line => line.trim());
          
          const recentLines = lines.filter(line => {
            try {
              const entry = JSON.parse(line);
              return new Date(entry.timestamp).getTime() > cutoff;
            } catch (error) {
              return false;
            }
          });
          
          fs.writeFileSync(logPath, recentLines.join('\n') + '\n');
        }
      });
      
      console.log(`🧹 Cleared security logs older than ${daysToKeep} days`);
      
    } catch (error) {
      console.error('Failed to clear old security logs:', error);
    }
  }
  
  // Test security logging
  test() {
    console.log('🧪 Testing Security Logger...');
    
    // Test various security events
    this.logSecurityEvent('failed_logins', {
      ip: '192.168.1.100',
      userId: 'test-user',
      endpoint: '/api/auth/login',
      method: 'POST'
    });
    
    this.logSecurityEvent('suspicious_activity', {
      ip: '10.0.0.50',
      userId: 'admin',
      endpoint: '/api/admin/users',
      method: 'GET',
      payload: 'admin=true&role=super'
    });
    
    // Test threat detection
    this.logSecurityEvent('sql_injection_attempts', {
      ip: '172.16.0.25',
      userId: 'anonymous',
      endpoint: '/api/search',
      method: 'GET',
      payload: "'; DROP TABLE users; --"
    });
    
    console.log('✅ Security Logger test completed');
  }
}

module.exports = SecurityLogger;
