// Performance Optimization System for WebRTC Livestreaming
const os = require('os');
const cluster = require('cluster');

class PerformanceOptimizer {
  constructor() {
    this.isEnabled = process.env.ENABLE_PERFORMANCE_OPTIMIZATION !== 'false';
    this.monitoringInterval = parseInt(process.env.PERFORMANCE_MONITORING_INTERVAL) || 30000;
    this.thresholds = {
      cpu: parseFloat(process.env.CPU_THRESHOLD) || 80.0,
      memory: parseFloat(process.env.MEMORY_THRESHOLD) || 85.0,
      connections: parseInt(process.env.CONNECTION_THRESHOLD) || 1000
    };
    
    this.metrics = { cpu: [], memory: [], connections: [] };
    this.alerts = [];
    
    if (this.isEnabled) {
      this.startMonitoring();
      console.log('🚀 Performance Optimizer initialized');
    }
  }
  
  startMonitoring() {
    this.monitoringTimer = setInterval(() => {
      this.collectMetrics();
    }, this.monitoringInterval);
  }
  
  collectMetrics() {
    try {
      const metrics = {
        timestamp: Date.now(),
        cpu: this.getCPUUsage(),
        memory: this.getMemoryUsage(),
        connections: this.getConnectionCount()
      };
      
      this.storeMetrics(metrics);
      this.checkThresholds(metrics);
      
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }
  
  getCPUUsage() {
    try {
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });
      
      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - (100 * idle / total);
      
      return Math.round(usage * 100) / 100;
    } catch (error) {
      return 0;
    }
  }
  
  getMemoryUsage() {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const usagePercentage = (usedMem / totalMem) * 100;
      
      return Math.round(usagePercentage * 100) / 100;
    } catch (error) {
      return 0;
    }
  }
  
  getConnectionCount() {
    return global.connectionCount || 0;
  }
  
  storeMetrics(metrics) {
    this.metrics.cpu.push(metrics.cpu);
    this.metrics.memory.push(metrics.memory);
    this.metrics.connections.push(metrics.connections);
    
    if (this.metrics.cpu.length > 1000) {
      this.metrics.cpu.shift();
      this.metrics.memory.shift();
      this.metrics.connections.shift();
    }
  }
  
  checkThresholds(metrics) {
    if (metrics.cpu > this.thresholds.cpu) {
      this.addAlert('cpu_high', `CPU usage is high: ${metrics.cpu}%`);
    }
    
    if (metrics.memory > this.thresholds.memory) {
      this.addAlert('memory_high', `Memory usage is high: ${metrics.memory}%`);
    }
    
    if (metrics.connections > this.thresholds.connections) {
      this.addAlert('connections_high', `Connection count is high: ${metrics.connections}`);
    }
  }
  
  addAlert(type, message) {
    const alert = {
      type,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.alerts.push(alert);
    
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
    
    console.log(`⚠️ Performance Alert: ${message}`);
  }
  
  analyzeSlowRequest(duration, endpoint, method) {
    if (duration > 2000) {
      this.addAlert('slow_request', `Slow request: ${endpoint} (${duration}ms)`);
    }
  }
  
  getPerformanceSummary() {
    return {
      current: {
        cpu: this.metrics.cpu[this.metrics.cpu.length - 1] || 0,
        memory: this.metrics.memory[this.metrics.memory.length - 1] || 0,
        connections: this.metrics.connections[this.metrics.connections.length - 1] || 0
      },
      alerts: this.alerts.slice(-10),
      uptime: process.uptime(),
      thresholds: this.thresholds
    };
  }
  
  stop() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }
  
  cleanup() {
    this.stop();
    this.metrics = { cpu: [], memory: [], connections: [] };
    this.alerts = [];
  }
}

module.exports = PerformanceOptimizer;
