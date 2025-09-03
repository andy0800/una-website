// Performance Optimization System for WebRTC Livestreaming
const { EventEmitter } = require('events');
const os = require('os');

class PerformanceOptimizer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableOptimization: options.enableOptimization !== false,
      optimizationInterval: options.optimizationInterval || 30000, // 30 seconds
      memoryThreshold: options.memoryThreshold || 0.8, // 80%
      cpuThreshold: options.cpuThreshold || 0.9, // 90%
      gcThreshold: options.gcThreshold || 0.7, // 70%
      enableGarbageCollection: options.enableGarbageCollection !== false,
      enableConnectionPooling: options.enableConnectionPooling !== false,
      enableCompression: options.enableCompression !== false,
      enableCaching: options.enableCaching !== false,
      ...options
    };
    
    this.optimizationHistory = [];
    this.lastOptimization = null;
    this.isOptimizing = false;
    this.performanceMetrics = {
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0,
      responseTime: 0,
      throughput: 0,
      errorRate: 0
    };
    
    this.optimizationStrategies = new Map();
    this.cache = new Map();
    
    this.initializeOptimizationStrategies();
    this.startPerformanceMonitoring();
  }

  // Initialize optimization strategies
  initializeOptimizationStrategies() {
    // Memory optimization
    this.optimizationStrategies.set('memory', {
      name: 'Memory Optimization',
      description: 'Optimize memory usage and trigger garbage collection',
      execute: () => this.optimizeMemory(),
      priority: 'high',
      threshold: this.options.memoryThreshold
    });

    // CPU optimization
    this.optimizationStrategies.set('cpu', {
      name: 'CPU Optimization',
      description: 'Optimize CPU usage and reduce load',
      execute: () => this.optimizeCPU(),
      priority: 'high',
      threshold: this.options.cpuThreshold
    });

    // Connection optimization
    this.optimizationStrategies.set('connections', {
      name: 'Connection Optimization',
      description: 'Optimize WebRTC connections and reduce overhead',
      execute: () => this.optimizeConnections(),
      priority: 'medium',
      threshold: 0.6
    });

    // Cache optimization
    this.optimizationStrategies.set('cache', {
      name: 'Cache Optimization',
      description: 'Optimize cache usage and memory',
      execute: () => this.optimizeCache(),
      priority: 'medium',
      threshold: 0.5
    });

    // Database optimization
    this.optimizationStrategies.set('database', {
      name: 'Database Optimization',
      description: 'Optimize database connections and queries',
      execute: () => this.optimizeDatabase(),
      priority: 'medium',
      threshold: 0.7
    });
  }

  // Start performance monitoring
  startPerformanceMonitoring() {
    if (!this.options.enableOptimization) {
      console.log('⚠️ Performance optimization disabled');
      return;
    }

    console.log('🚀 Starting Performance Optimizer...');
    
    setInterval(() => {
      this.monitorPerformance();
    }, this.options.optimizationInterval);
    
    // Initial optimization check
    setTimeout(() => {
      this.monitorPerformance();
    }, 5000);
  }

  // Monitor system performance
  async monitorPerformance() {
    try {
      // Collect current metrics
      const currentMetrics = await this.collectPerformanceMetrics();
      
      // Update stored metrics
      this.performanceMetrics = { ...currentMetrics };
      
      // Check if optimization is needed
      const optimizationNeeded = this.checkOptimizationNeeded(currentMetrics);
      
      if (optimizationNeeded.length > 0) {
        console.log(`🔍 Performance optimization needed: ${optimizationNeeded.map(s => s.name).join(', ')}`);
        await this.executeOptimizations(optimizationNeeded);
      }
      
      // Emit metrics for external monitoring
      this.emit('metrics-updated', currentMetrics);
      
    } catch (error) {
      console.error('❌ Performance monitoring failed:', error);
    }
  }

  // Collect current performance metrics
  async collectPerformanceMetrics() {
    const metrics = {
      timestamp: Date.now(),
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: await this.getCPUUsage(),
      activeConnections: this.getActiveConnections(),
      responseTime: this.getAverageResponseTime(),
      throughput: this.getCurrentThroughput(),
      errorRate: this.getErrorRate(),
      systemLoad: os.loadavg(),
      uptime: process.uptime()
    };
    
    return metrics;
  }

  // Get memory usage percentage
  getMemoryUsage() {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const usedMemory = memUsage.heapUsed + memUsage.external;
    
    return usedMemory / totalMemory;
  }

  // Get CPU usage percentage
  async getCPUUsage() {
    try {
      const startUsage = process.cpuUsage();
      await new Promise(resolve => setTimeout(resolve, 100));
      const endUsage = process.cpuUsage();
      
      const userCpu = endUsage.user - startUsage.user;
      const systemCpu = endUsage.system - startUsage.system;
      const totalCpu = userCpu + systemCpu;
      
      // Convert to percentage (microseconds to percentage)
      return Math.min(totalCpu / 1000000, 1.0); // Cap at 100%
    } catch (error) {
      console.warn('⚠️ CPU usage calculation failed:', error.message);
      return 0;
    }
  }

  // Get active connections count
  getActiveConnections() {
    // This would integrate with your connection tracking system
    // For now, return a placeholder
    return (typeof global !== 'undefined' && global.activeConnections) || 0;
  }

  // Get average response time
  getAverageResponseTime() {
    // This would integrate with your response time tracking
    // For now, return a placeholder
    return (typeof global !== 'undefined' && global.averageResponseTime) || 0;
  }

  // Get current throughput
  getCurrentThroughput() {
    // This would integrate with your throughput tracking
    // For now, return a placeholder
    return (typeof global !== 'undefined' && global.currentThroughput) || 0;
  }

  // Get error rate
  getErrorRate() {
    // This would integrate with your error tracking
    // For now, return a placeholder
    return (typeof global !== 'undefined' && global.errorRate) || 0;
  }

  // Check if optimization is needed
  checkOptimizationNeeded(metrics) {
    const needed = [];
    
    for (const [key, strategy] of this.optimizationStrategies) {
      if (metrics[key + 'Usage'] > strategy.threshold) {
        needed.push(strategy);
      }
    }
    
    // Sort by priority
    needed.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    return needed;
  }

  // Execute optimizations
  async executeOptimizations(strategies) {
    if (this.isOptimizing) {
      console.log('⚠️ Optimization already in progress, skipping...');
      return;
    }
    
    this.isOptimizing = true;
    
    try {
      console.log(`🚀 Executing ${strategies.length} optimizations...`);
      
      for (const strategy of strategies) {
        try {
          console.log(`🔧 Executing: ${strategy.name}`);
          const startTime = Date.now();
          
          await strategy.execute();
          
          const duration = Date.now() - startTime;
          
          // Record optimization
          this.optimizationHistory.push({
            strategy: strategy.name,
            timestamp: Date.now(),
            duration,
            success: true,
            metrics: { ...this.performanceMetrics }
          });
          
          console.log(`✅ ${strategy.name} completed in ${duration}ms`);
          
        } catch (error) {
          console.error(`❌ ${strategy.name} failed:`, error.message);
          
          this.optimizationHistory.push({
            strategy: strategy.name,
            timestamp: Date.now(),
            duration: 0,
            success: false,
            error: error.message,
            metrics: { ...this.performanceMetrics }
          });
        }
      }
      
      this.lastOptimization = Date.now();
      this.emit('optimization-completed', strategies);
      
    } finally {
      this.isOptimizing = false;
    }
  }

  // Memory optimization
  async optimizeMemory() {
    console.log('🧠 Optimizing memory usage...');
    
    // Clear unnecessary caches
    this.clearUnnecessaryCaches();
    
    // Trigger garbage collection if available
    if (this.options.enableGarbageCollection && global.gc) {
      console.log('🗑️ Triggering garbage collection...');
      global.gc();
    }
    
    // Clear old optimization history
    this.cleanupOptimizationHistory();
    
    // Clear old cache entries
    this.cleanupCache();
    
    console.log('✅ Memory optimization completed');
  }

  // CPU optimization
  async optimizeCPU() {
    console.log('⚡ Optimizing CPU usage...');
    
    // Reduce monitoring frequency temporarily
    this.reduceMonitoringFrequency();
    
    // Optimize event loop
    this.optimizeEventLoop();
    
    // Clear heavy computations
    this.clearHeavyComputations();
    
    console.log('✅ CPU optimization completed');
  }

  // Connection optimization
  async optimizeConnections() {
    console.log('🔗 Optimizing WebRTC connections...');
    
    // Close idle connections
    this.closeIdleConnections();
    
    // Optimize connection pooling
    if (this.options.enableConnectionPooling) {
      this.optimizeConnectionPool();
    }
    
    // Reduce connection overhead
    this.reduceConnectionOverhead();
    
    console.log('✅ Connection optimization completed');
  }

  // Cache optimization
  async optimizeCache() {
    console.log('💾 Optimizing cache usage...');
    
    // Clear expired cache entries
    this.clearExpiredCache();
    
    // Optimize cache size
    this.optimizeCacheSize();
    
    // Update cache policies
    this.updateCachePolicies();
    
    console.log('✅ Cache optimization completed');
  }

  // Database optimization
  async optimizeDatabase() {
    console.log('🗄️ Optimizing database...');
    
    // Optimize connection pool
    this.optimizeDatabaseConnections();
    
    // Clear query cache
    this.clearQueryCache();
    
    // Optimize indexes
    this.optimizeDatabaseIndexes();
    
    console.log('✅ Database optimization completed');
  }

  // Clear unnecessary caches
  clearUnnecessaryCaches() {
    const cacheKeys = Array.from(this.cache.keys());
    const now = Date.now();
    
    for (const key of cacheKeys) {
      const entry = this.cache.get(key);
      if (entry && entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  // Cleanup optimization history
  cleanupOptimizationHistory() {
    const maxHistory = 100;
    if (this.optimizationHistory.length > maxHistory) {
      this.optimizationHistory = this.optimizationHistory.slice(-maxHistory);
    }
  }

  // Cleanup cache
  cleanupCache() {
    const maxCacheSize = 1000;
    if (this.cache.size > maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = entries.slice(0, entries.length - maxCacheSize);
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }

  // Reduce monitoring frequency
  reduceMonitoringFrequency() {
    // Temporarily increase optimization interval
    this.options.optimizationInterval = Math.min(
      this.options.optimizationInterval * 2,
      300000 // Max 5 minutes
    );
    
    // Restore after some time
    setTimeout(() => {
      this.options.optimizationInterval = 30000; // Restore to 30 seconds
    }, 60000); // After 1 minute
  }

  // Optimize event loop
  optimizeEventLoop() {
    // Clear any pending timers that might be causing issues
    // This is a basic optimization - in production you'd want more sophisticated logic
    if (typeof global !== 'undefined' && global.pendingTimers) {
      global.pendingTimers.forEach(timer => clearTimeout(timer));
      global.pendingTimers = [];
    }
  }

  // Clear heavy computations
  clearHeavyComputations() {
    // Clear any heavy computation caches
    if (typeof global !== 'undefined' && global.heavyComputationCache) {
      global.heavyComputationCache.clear();
    }
  }

  // Close idle connections
  closeIdleConnections() {
    // This would integrate with your connection management system
    // For now, just log the action
    console.log('🔌 Closing idle connections...');
  }

  // Optimize connection pool
  optimizeConnectionPool() {
    // This would integrate with your connection pooling system
    console.log('🏊 Optimizing connection pool...');
  }

  // Reduce connection overhead
  reduceConnectionOverhead() {
    // Optimize WebRTC connection parameters
    console.log('📡 Reducing connection overhead...');
  }

  // Clear expired cache
  clearExpiredCache() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
  }

  // Optimize cache size
  optimizeCacheSize() {
    const targetSize = 500;
    if (this.cache.size > targetSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = entries.slice(0, entries.length - targetSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Update cache policies
  updateCachePolicies() {
    // Update cache TTL based on current performance
    const memoryUsage = this.performanceMetrics.memoryUsage;
    
    if (memoryUsage > 0.8) {
      // Reduce cache TTL when memory usage is high
      this.options.cacheTTL = Math.max(this.options.cacheTTL * 0.5, 300000); // Min 5 minutes
    } else if (memoryUsage < 0.5) {
      // Increase cache TTL when memory usage is low
      this.options.cacheTTL = Math.min(this.options.cacheTTL * 1.5, 3600000); // Max 1 hour
    }
  }

  // Optimize database connections
  optimizeDatabaseConnections() {
    // This would integrate with your database connection management
    console.log('🔌 Optimizing database connections...');
  }

  // Clear query cache
  clearQueryCache() {
    // This would integrate with your query caching system
    console.log('🗑️ Clearing query cache...');
  }

  // Optimize database indexes
  optimizeDatabaseIndexes() {
    // This would integrate with your database optimization system
    console.log('📊 Optimizing database indexes...');
  }

  // Set cache entry
  setCache(key, value, ttl = 300000) { // Default 5 minutes
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now()
    });
  }

  // Get cache entry
  getCache(key) {
    const entry = this.cache.get(key);
    if (entry && (!entry.expiresAt || entry.expiresAt > Date.now())) {
      entry.lastAccessed = Date.now();
      return entry.value;
    }
    
    if (entry) {
      this.cache.delete(key);
    }
    
    return null;
  }

  // Get optimization statistics
  getOptimizationStats() {
    return {
      isEnabled: this.options.enableOptimization,
      isOptimizing: this.isOptimizing,
      lastOptimization: this.lastOptimization,
      optimizationCount: this.optimizationHistory.length,
      successRate: this.getOptimizationSuccessRate(),
      averageDuration: this.getAverageOptimizationDuration(),
      recentOptimizations: this.optimizationHistory.slice(-10)
    };
  }

  // Get optimization success rate
  getOptimizationSuccessRate() {
    if (this.optimizationHistory.length === 0) return 0;
    
    const successful = this.optimizationHistory.filter(opt => opt.success).length;
    return successful / this.optimizationHistory.length;
  }

  // Get average optimization duration
  getAverageOptimizationDuration() {
    if (this.optimizationHistory.length === 0) return 0;
    
    const totalDuration = this.optimizationHistory.reduce((sum, opt) => sum + opt.duration, 0);
    return totalDuration / this.optimizationHistory.length;
  }

  // Manual optimization trigger
  async triggerOptimization(strategyName = null) {
    if (strategyName) {
      const strategy = this.optimizationStrategies.get(strategyName);
      if (strategy) {
        await this.executeOptimizations([strategy]);
      } else {
        throw new Error(`Unknown optimization strategy: ${strategyName}`);
      }
    } else {
      // Trigger all optimizations
      const allStrategies = Array.from(this.optimizationStrategies.values());
      await this.executeOptimizations(allStrategies);
    }
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down Performance Optimizer...');
    
    // Wait for current optimization to complete
    while (this.isOptimizing) {
      console.log('⏳ Waiting for optimization to complete...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Clear caches
    this.cache.clear();
    
    console.log('✅ Performance Optimizer shutdown completed');
  }
}

// Export the performance optimizer
module.exports = PerformanceOptimizer;
