const fs = require('fs');
const path = require('path');

class SecurityLogger {
  constructor() {
    this.isEnabled = process.env.ENABLE_SECURITY_LOGGING !== 'false';
    this.logLevel = process.env.SECURITY_LOG_LEVEL || 'warn';
    
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    this.securityLogPath = path.join(logsDir, 'security.log');
    
    this.eventCounters = {
      failed_logins: 0,
      suspicious_activity: 0,
      rate_limit_violations: 0,
      unauthorized_access: 0
    };
    
    console.log('🔒 Security Logger initialized');
  }
  
  logSecurityEvent(eventType, data = {}) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      severity: this.getEventSeverity(eventType),
      data,
      ip: data.ip || 'unknown',
      userId: data.userId || 'anonymous',
      endpoint: data.endpoint || 'unknown'
    };
    
    if (this.eventCounters[eventType]) {
      this.eventCounters[eventType]++;
    }
    
    this.writeToLog(logEntry);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔒 Security Event [${eventType}]:`, logEntry);
    }
  }
  
  getEventSeverity(eventType) {
    const severityMap = {
      failed_logins: 'medium',
      suspicious_activity: 'high',
      rate_limit_violations: 'medium',
      unauthorized_access: 'high'
    };
    
    return severityMap[eventType] || 'low';
  }
  
  writeToLog(entry) {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.securityLogPath, logLine);
    } catch (error) {
      console.error('Failed to write to security log:', error);
    }
  }
  
  getSecurityStats() {
    return {
      eventCounters: this.eventCounters,
      totalEvents: Object.values(this.eventCounters).reduce((a, b) => a + b, 0)
    };
  }
  
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
      
      return events.reverse();
      
    } catch (error) {
      return [];
    }
  }
}

module.exports = SecurityLogger;
