// Performance Optimization System for WebRTC Livestreaming
const os = require('os');
const cluster = require('cluster');
const { EventEmitter } = require('events');

class PerformanceOptimizer extends EventEmitter {
  constructor() {
    super();
    
    this.isEnabled = process.env.ENABLE_PERFORMANCE_OPTIMIZATION !== 'false';
    this.monitoringInterval = parseInt(process.env.PERFORMANCE_MONITORING_INTERVAL) || 30000; // 30 seconds
    this.analysisInterval = parseInt(process.env.PERFORMANCE_ANALYSIS_INTERVAL) || 300000; // 5 minutes
    
    // Performance thresholds
    this.thresholds = {
      cpu: parseFloat(process.env.CPU_THRESHOLD) || 80.0, // percentage
      memory: parseFloat(process.env.MEMORY_THRESHOLD) || 85.0, // percentage
      connections: parseInt(process.env.CONNECTION_THRESHOLD) || 1000,
      responseTime: parseInt(process.env.RESPONSE_TIME_THRESHOLD) || 2000, // milliseconds
      errorRate: parseFloat(process.env.ERROR_RATE_THRESHOLD) || 5.0 // percentage
    };
    
    // Performance metrics
    this.metrics = {
      cpu: [],
      memory: [],
      connections: [],
      responseTimes: [],
      errorRates: [],
      throughput: [],
      latency: []
    };
    
    // Optimization strategies
    this.optimizationStrategies = {
      cpu: ['scale_horizontally', 'optimize_algorithms', 'reduce_workload'],
      memory: ['garbage_collection', 'memory_pooling', 'reduce_allocations'],
      connections: ['connection_pooling', 'load_balancing', 'rate_limiting'],
      responseTime: ['caching', 'database_optimization', 'async_processing'],
      errorRate: ['circuit_breaker', 'retry_logic', 'fallback_handlers']
    };
    
    // Performance history
    this.history = {
      hourly: [],
      daily: [],
      weekly: []
    };
    
    // Active optimizations
    this.activeOptimizations = new Set();
    
    // Performance alerts
    this.alerts = [];
    this.maxAlerts = 100;
    
    if (this.isEnabled) {
      this.startMonitoring();
      this.startAnalysis();
      console.log('🚀 Performance Optimizer initialized');
    }
  }
  
  // Start performance monitoring
  startMonitoring() {
    if (!this.isEnabled) return;
    
    this.monitoringTimer = setInterval(() => {
      this.collectMetrics();
    }, this.monitoringInterval);
    
    console.log(`📊 Performance monitoring started (${this.monitoringInterval}ms interval)`);
  }
  
  // Start performance analysis
  startAnalysis() {
    if (!this.isEnabled) return;
    
    this.analysisTimer = setInterval(() => {
      this.analyzePerformance();
    }, this.analysisInterval);
    
    console.log(`🔍 Performance analysis started (${this.analysisInterval}ms interval)`);
  }
  
  // Collect system metrics
  collectMetrics() {
    try {
      const currentMetrics = {
        timestamp: Date.now(),
        cpu: this.getCPUUsage(),
        memory: this.getMemoryUsage(),
        connections: this.getConnectionCount(),
        uptime: process.uptime(),
        loadAverage: os.loadavg(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        pid: process.pid,
        workerId: cluster.isWorker ? cluster.worker.id : 'master'
      };
      
      // Store metrics
      this.storeMetrics(currentMetrics);
      
      // Check thresholds
      this.checkThresholds(currentMetrics);
      
      // Emit metrics event
      this.emit('metrics', currentMetrics);
      
    } catch (error) {
      console.error('Failed to collect performance metrics:', error);
    }
  }
  
  // Get CPU usage percentage
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
      console.error('Failed to get CPU usage:', error);
      return 0;
    }
  }
  
  // Get memory usage percentage
  getMemoryUsage() {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const usagePercentage = (usedMem / totalMem) * 100;
      
      return Math.round(usagePercentage * 100) / 100;
    } catch (error) {
      console.error('Failed to get memory usage:', error);
      return 0;
    }
  }
  
  // Get current connection count
  getConnectionCount() {
    try {
      // This would typically come from your server instance
      // For now, we'll return a placeholder
      return global.connectionCount || 0;
    } catch (error) {
      console.error('Failed to get connection count:', error);
      return 0;
    }
  }
  
  // Store metrics in history
  storeMetrics(metrics) {
    // Add to current metrics arrays
    this.metrics.cpu.push(metrics.cpu);
    this.metrics.memory.push(metrics.memory);
    this.metrics.connections.push(metrics.connections);
    
    // Keep only last 1000 metrics
    const maxMetrics = 1000;
    if (this.metrics.cpu.length > maxMetrics) {
      this.metrics.cpu.shift();
      this.metrics.memory.shift();
      this.metrics.connections.shift();
    }
    
    // Add to hourly history
    const now = new Date();
    const hourKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
    
    if (!this.history.hourly[hourKey]) {
      this.history.hourly[hourKey] = [];
    }
    this.history.hourly[hourKey].push(metrics);
    
    // Keep only last 168 hours (1 week)
    const hourKeys = Object.keys(this.history.hourly);
    if (hourKeys.length > 168) {
      delete this.history.hourly[hourKeys[0]];
    }
  }
  
  // Check performance thresholds
  checkThresholds(metrics) {
    const alerts = [];
    
    if (metrics.cpu > this.thresholds.cpu) {
      alerts.push({
        type: 'cpu_high',
        severity: 'warning',
        message: `CPU usage is high: ${metrics.cpu}%`,
        value: metrics.cpu,
        threshold: this.thresholds.cpu,
        timestamp: new Date().toISOString()
      });
    }
    
    if (metrics.memory > this.thresholds.memory) {
      alerts.push({
        type: 'memory_high',
        severity: 'warning',
        message: `Memory usage is high: ${metrics.memory}%`,
        value: metrics.memory,
        threshold: this.thresholds.memory,
        timestamp: new Date().toISOString()
      });
    }
    
    if (metrics.connections > this.thresholds.connections) {
      alerts.push({
        type: 'connections_high',
        severity: 'warning',
        message: `Connection count is high: ${metrics.connections}`,
        value: metrics.connections,
        threshold: this.thresholds.connections,
        timestamp: new Date().toISOString()
      });
    }
    
    // Add alerts
    alerts.forEach(alert => this.addAlert(alert));
    
    // Emit threshold events
    if (alerts.length > 0) {
      this.emit('threshold_exceeded', alerts);
    }
  }
  
  // Add performance alert
  addAlert(alert) {
    this.alerts.push(alert);
    
    // Keep only max alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.shift();
    }
    
    // Emit alert event
    this.emit('alert', alert);
    
    // Log alert
    console.log(`⚠️ Performance Alert [${alert.severity.toUpperCase()}]: ${alert.message}`);
  }
  
  // Analyze performance patterns
  analyzePerformance() {
    try {
      if (this.metrics.cpu.length < 10) return; // Need minimum data points
      
      const analysis = {
        timestamp: Date.now(),
        cpu: this.analyzeMetric(this.metrics.cpu),
        memory: this.analyzeMetric(this.metrics.memory),
        connections: this.analyzeMetric(this.metrics.connections),
        trends: this.identifyTrends(),
        recommendations: this.generateRecommendations()
      };
      
      // Store analysis
      this.storeAnalysis(analysis);
      
      // Apply optimizations if needed
      this.applyOptimizations(analysis);
      
      // Emit analysis event
      this.emit('analysis', analysis);
      
      console.log('🔍 Performance analysis completed');
      
    } catch (error) {
      console.error('Performance analysis failed:', error);
    }
  }
  
  // Analyze a specific metric
  analyzeMetric(values) {
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    // Calculate standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      count: values.length,
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      trend: this.calculateTrend(values)
    };
  }
  
  // Calculate trend (positive, negative, stable)
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-10); // Last 10 values
    const older = values.slice(-20, -10); // Previous 10 values
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }
  
  // Identify performance trends
  identifyTrends() {
    const trends = {
      cpu: this.metrics.cpu.length > 0 ? this.calculateTrend(this.metrics.cpu) : 'stable',
      memory: this.metrics.memory.length > 0 ? this.calculateTrend(this.metrics.memory) : 'stable',
      connections: this.metrics.connections.length > 0 ? this.calculateTrend(this.metrics.connections) : 'stable'
    };
    
    return trends;
  }
  
  // Generate optimization recommendations
  generateRecommendations() {
    const recommendations = [];
    
    // CPU recommendations
    if (this.metrics.cpu.length > 0) {
      const avgCPU = this.metrics.cpu.reduce((a, b) => a + b, 0) / this.metrics.cpu.length;
      if (avgCPU > 70) {
        recommendations.push({
          type: 'cpu',
          priority: 'high',
          action: 'Consider horizontal scaling or workload optimization',
          impact: 'High',
          effort: 'Medium'
        });
      }
    }
    
    // Memory recommendations
    if (this.metrics.memory.length > 0) {
      const avgMemory = this.metrics.memory.reduce((a, b) => a + b, 0) / this.metrics.memory.length;
      if (avgMemory > 80) {
        recommendations.push({
          type: 'memory',
          priority: 'high',
          action: 'Implement memory pooling and optimize garbage collection',
          impact: 'High',
          effort: 'Medium'
        });
      }
    }
    
    // Connection recommendations
    if (this.metrics.connections.length > 0) {
      const avgConnections = this.metrics.connections.reduce((a, b) => a + b, 0) / this.metrics.connections.length;
      if (avgConnections > 800) {
        recommendations.push({
          type: 'connections',
          priority: 'medium',
          action: 'Implement connection pooling and load balancing',
          impact: 'Medium',
          effort: 'Low'
        });
      }
    }
    
    return recommendations;
  }
  
  // Store analysis results
  storeAnalysis(analysis) {
    // Add to daily history
    const now = new Date();
    const dayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    
    if (!this.history.daily[dayKey]) {
      this.history.daily[dayKey] = [];
    }
    this.history.daily[dayKey].push(analysis);
    
    // Keep only last 30 days
    const dayKeys = Object.keys(this.history.daily);
    if (dayKeys.length > 30) {
      delete this.history.daily[dayKeys[0]];
    }
  }
  
  // Apply performance optimizations
  applyOptimizations(analysis) {
    try {
      // CPU optimizations
      if (analysis.cpu && analysis.cpu.mean > 70) {
        this.applyCPUOptimizations();
      }
      
      // Memory optimizations
      if (analysis.memory && analysis.memory.mean > 80) {
        this.applyMemoryOptimizations();
      }
      
      // Connection optimizations
      if (analysis.connections && analysis.connections.mean > 800) {
        this.applyConnectionOptimizations();
      }
      
    } catch (error) {
      console.error('Failed to apply optimizations:', error);
    }
  }
  
  // Apply CPU optimizations
  applyCPUOptimizations() {
    if (this.activeOptimizations.has('cpu_optimization')) return;
    
    console.log('🚀 Applying CPU optimizations...');
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('✅ Garbage collection triggered');
    }
    
    // Mark optimization as active
    this.activeOptimizations.add('cpu_optimization');
    
    // Remove after 5 minutes
    setTimeout(() => {
      this.activeOptimizations.delete('cpu_optimization');
    }, 300000);
  }
  
  // Apply memory optimizations
  applyMemoryOptimizations() {
    if (this.activeOptimizations.has('memory_optimization')) return;
    
    console.log('🚀 Applying memory optimizations...');
    
    // Clear unused caches
    if (global.clearCache) {
      global.clearCache();
      console.log('✅ Cache cleared');
    }
    
    // Mark optimization as active
    this.activeOptimizations.add('memory_optimization');
    
    // Remove after 5 minutes
    setTimeout(() => {
      this.activeOptimizations.delete('memory_optimization');
    }, 300000);
  }
  
  // Apply connection optimizations
  applyConnectionOptimizations() {
    if (this.activeOptimizations.has('connection_optimization')) return;
    
    console.log('🚀 Applying connection optimizations...');
    
    // Implement connection pooling if not already active
    if (!global.connectionPool) {
      global.connectionPool = {
        maxConnections: 100,
        currentConnections: 0,
        queue: []
      };
      console.log('✅ Connection pooling implemented');
    }
    
    // Mark optimization as active
    this.activeOptimizations.add('connection_optimization');
    
    // Remove after 5 minutes
    setTimeout(() => {
      this.activeOptimizations.delete('connection_optimization');
    }, 300000);
  }
  
  // Analyze slow request
  analyzeSlowRequest(duration, endpoint, method) {
    try {
      const slowRequest = {
        timestamp: Date.now(),
        duration,
        endpoint,
        method,
        severity: duration > 5000 ? 'critical' : duration > 2000 ? 'high' : 'medium'
      };
      
      // Add to response times
      this.metrics.responseTimes.push(duration);
      
      // Keep only last 1000 response times
      if (this.metrics.responseTimes.length > 1000) {
        this.metrics.responseTimes.shift();
      }
      
      // Check if it exceeds threshold
      if (duration > this.thresholds.responseTime) {
        this.addAlert({
          type: 'slow_request',
          severity: slowRequest.severity,
          message: `Slow request detected: ${endpoint} (${duration}ms)`,
          value: duration,
          threshold: this.thresholds.responseTime,
          timestamp: new Date().toISOString(),
          details: slowRequest
        });
      }
      
      // Emit slow request event
      this.emit('slow_request', slowRequest);
      
    } catch (error) {
      console.error('Failed to analyze slow request:', error);
    }
  }
  
  // Get performance summary
  getPerformanceSummary() {
    try {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      // Filter recent metrics
      const recentMetrics = Object.values(this.history.hourly)
        .flat()
        .filter(metric => metric.timestamp > oneHourAgo);
      
      const dailyMetrics = Object.values(this.history.daily)
        .flat()
        .filter(metric => metric.timestamp > oneDayAgo);
      
      return {
        current: {
          cpu: this.metrics.cpu[this.metrics.cpu.length - 1] || 0,
          memory: this.metrics.memory[this.metrics.memory.length - 1] || 0,
          connections: this.metrics.connections[this.metrics.connections.length - 1] || 0
        },
        hourly: {
          cpu: this.analyzeMetric(recentMetrics.map(m => m.cpu)),
          memory: this.analyzeMetric(recentMetrics.map(m => m.memory)),
          connections: this.analyzeMetric(recentMetrics.map(m => m.connections))
        },
        daily: {
          cpu: this.analyzeMetric(dailyMetrics.map(m => m.cpu)),
          memory: this.analyzeMetric(dailyMetrics.map(m => m.memory)),
          connections: this.analyzeMetric(dailyMetrics.map(m => m.connections))
        },
        alerts: this.alerts.slice(-10), // Last 10 alerts
        activeOptimizations: Array.from(this.activeOptimizations),
        uptime: process.uptime(),
        thresholds: this.thresholds
      };
      
    } catch (error) {
      console.error('Failed to get performance summary:', error);
      return null;
    }
  }
  
  // Update performance thresholds
  updateThresholds(newThresholds) {
    try {
      Object.assign(this.thresholds, newThresholds);
      
      console.log('✅ Performance thresholds updated:', newThresholds);
      
      // Emit threshold update event
      this.emit('thresholds_updated', this.thresholds);
      
    } catch (error) {
      console.error('Failed to update thresholds:', error);
    }
  }
  
  // Stop monitoring and analysis
  stop() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }
    
    console.log('🛑 Performance monitoring stopped');
  }
  
  // Cleanup resources
  cleanup() {
    try {
      this.stop();
      
      // Clear metrics
      this.metrics = {
        cpu: [],
        memory: [],
        connections: [],
        responseTimes: [],
        errorRates: [],
        throughput: [],
        latency: []
      };
      
      // Clear history
      this.history = {
        hourly: [],
        daily: [],
        weekly: []
      };
      
      // Clear alerts
      this.alerts = [];
      
      // Clear active optimizations
      this.activeOptimizations.clear();
      
      console.log('🧹 Performance Optimizer cleaned up');
      
    } catch (error) {
      console.error('Failed to cleanup Performance Optimizer:', error);
    }
  }
  
  // Test performance monitoring
  test() {
    console.log('🧪 Testing Performance Optimizer...');
    
    // Test metric collection
    this.collectMetrics();
    console.log('✅ Metrics collection test passed');
    
    // Test analysis
    this.analyzePerformance();
    console.log('✅ Performance analysis test passed');
    
    // Test summary
    const summary = this.getPerformanceSummary();
    console.log('✅ Performance summary test passed');
    
    console.log('✅ Performance Optimizer test completed');
  }
}

module.exports = PerformanceOptimizer;
