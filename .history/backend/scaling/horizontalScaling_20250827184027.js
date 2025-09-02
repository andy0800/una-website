// Horizontal Scaling System for Multi-Instance Deployment
const cluster = require('cluster');
const os = require('os');
const { EventEmitter } = require('events');

class HorizontalScalingManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxWorkers: options.maxWorkers || os.cpus().length,
      minWorkers: options.minWorkers || 2,
      healthCheckInterval: options.healthCheckInterval || 5000,
      autoScaling: options.autoScaling !== false,
      loadThreshold: options.loadThreshold || 0.8,
      memoryThreshold: options.memoryThreshold || 0.85,
      scalingCooldown: options.scalingCooldown || 30000, // 30 seconds
      ...options
    };
    
    this.workers = new Map();
    this.workerStats = new Map();
    this.scalingHistory = [];
    this.lastScalingTime = 0;
    this.isScaling = false;
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      activeConnections: 0,
      averageResponseTime: 0,
      errorRate: 0,
      cpuUsage: 0,
      memoryUsage: 0
    };
    
    this.startMonitoring();
  }

  // Start the scaling manager
  start() {
    if (cluster.isMaster) {
      console.log('🚀 Starting Horizontal Scaling Manager...');
      console.log(`📊 Target workers: ${this.options.minWorkers}-${this.options.maxWorkers}`);
      
      // Initialize minimum workers
      for (let i = 0; i < this.options.minWorkers; i++) {
        this.spawnWorker();
      }
      
      // Start monitoring
      this.startHealthChecks();
      
      if (this.options.autoScaling) {
        this.startAutoScaling();
      }
      
      console.log('✅ Horizontal Scaling Manager started');
    }
  }

  // Spawn a new worker
  spawnWorker() {
    if (this.workers.size >= this.options.maxWorkers) {
      console.warn('⚠️ Maximum workers reached, cannot spawn more');
      return null;
    }
    
    const worker = cluster.fork();
    const workerId = worker.id;
    
    this.workers.set(workerId, worker);
    this.workerStats.set(workerId, {
      id: workerId,
      pid: worker.process.pid,
      startTime: Date.now(),
      requests: 0,
      errors: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      lastHeartbeat: Date.now(),
      status: 'starting'
    });
    
    // Handle worker events
    worker.on('online', () => {
      console.log(`✅ Worker ${workerId} (PID: ${worker.process.pid}) is online`);
      this.workerStats.get(workerId).status = 'online';
      this.emit('worker-online', workerId);
    });
    
    worker.on('message', (message) => {
      this.handleWorkerMessage(workerId, message);
    });
    
    worker.on('exit', (code, signal) => {
      console.log(`💀 Worker ${workerId} (PID: ${worker.process.pid}) died. Code: ${code}, Signal: ${signal}`);
      this.handleWorkerExit(workerId, code, signal);
    });
    
    worker.on('error', (error) => {
      console.error(`❌ Worker ${workerId} error:`, error);
      this.workerStats.get(workerId).status = 'error';
      this.emit('worker-error', workerId, error);
    });
    
    return worker;
  }

  // Handle worker messages
  handleWorkerMessage(workerId, message) {
    if (!this.workerStats.has(workerId)) return;
    
    const stats = this.workerStats.get(workerId);
    
    switch (message.type) {
      case 'heartbeat':
        stats.lastHeartbeat = Date.now();
        stats.memoryUsage = message.memoryUsage || 0;
        stats.cpuUsage = message.cpuUsage || 0;
        stats.requests = message.requests || 0;
        stats.errors = message.errors || 0;
        break;
        
      case 'metrics':
        stats.memoryUsage = message.memoryUsage || 0;
        stats.cpuUsage = message.cpuUsage || 0;
        stats.requests = message.requests || 0;
        stats.errors = message.errors || 0;
        break;
        
      case 'status':
        stats.status = message.status || 'unknown';
        break;
    }
  }

  // Handle worker exit
  handleWorkerExit(workerId, code, signal) {
    this.workers.delete(workerId);
    this.workerStats.delete(workerId);
    
    // Auto-restart if not intentional shutdown
    if (code !== 0 && this.workers.size < this.options.minWorkers) {
      console.log(`🔄 Auto-restarting worker ${workerId} to maintain minimum workers`);
      setTimeout(() => this.spawnWorker(), 1000);
    }
    
    this.emit('worker-exit', workerId, code, signal);
  }

  // Start health checks
  startHealthChecks() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.options.healthCheckInterval);
  }

  // Perform health checks on all workers
  performHealthChecks() {
    const now = Date.now();
    const healthTimeout = this.options.healthCheckInterval * 2;
    
    for (const [workerId, stats] of this.workerStats) {
      const worker = this.workers.get(workerId);
      
      // Check if worker is responsive
      if (now - stats.lastHeartbeat > healthTimeout) {
        console.warn(`⚠️ Worker ${workerId} not responding, marking as unhealthy`);
        stats.status = 'unhealthy';
        
        // Terminate unresponsive worker
        if (worker) {
          worker.kill('SIGTERM');
        }
      }
      
      // Check memory usage
      if (stats.memoryUsage > this.options.memoryThreshold) {
        console.warn(`⚠️ Worker ${workerId} memory usage high: ${Math.round(stats.memoryUsage * 100)}%`);
        stats.status = 'memory-warning';
      }
    }
  }

  // Start auto-scaling
  startAutoScaling() {
    setInterval(() => {
      this.evaluateScaling();
    }, 10000); // Check every 10 seconds
  }

  // Evaluate if scaling is needed
  evaluateScaling() {
    if (this.isScaling || Date.now() - this.lastScalingTime < this.options.scalingCooldown) {
      return;
    }
    
    const currentLoad = this.calculateCurrentLoad();
    const currentWorkers = this.workers.size;
    
    console.log(`📊 Current load: ${(currentLoad * 100).toFixed(1)}%, Workers: ${currentWorkers}`);
    
    // Scale up if load is high
    if (currentLoad > this.options.loadThreshold && currentWorkers < this.options.maxWorkers) {
      console.log(`📈 High load detected, scaling up...`);
      this.scaleUp();
    }
    // Scale down if load is low
    else if (currentLoad < this.options.loadThreshold * 0.5 && currentWorkers > this.options.minWorkers) {
      console.log(`📉 Low load detected, scaling down...`);
      this.scaleDown();
    }
  }

  // Calculate current system load
  calculateCurrentLoad() {
    if (this.workerStats.size === 0) return 0;
    
    let totalCpu = 0;
    let totalMemory = 0;
    let totalRequests = 0;
    
    for (const stats of this.workerStats.values()) {
      totalCpu += stats.cpuUsage || 0;
      totalMemory += stats.memoryUsage || 0;
      totalRequests += stats.requests || 0;
    }
    
    const avgCpu = totalCpu / this.workerStats.size;
    const avgMemory = totalMemory / this.workerStats.size;
    
    // Weighted load calculation
    return (avgCpu * 0.6) + (avgMemory * 0.4);
  }

  // Scale up by adding workers
  scaleUp() {
    if (this.isScaling) return;
    
    this.isScaling = true;
    const currentWorkers = this.workers.size;
    const targetWorkers = Math.min(currentWorkers + 1, this.options.maxWorkers);
    
    console.log(`📈 Scaling up from ${currentWorkers} to ${targetWorkers} workers`);
    
    try {
      const newWorker = this.spawnWorker();
      if (newWorker) {
        this.scalingHistory.push({
          type: 'scale-up',
          timestamp: Date.now(),
          from: currentWorkers,
          to: targetWorkers,
          reason: 'high-load'
        });
        
        this.lastScalingTime = Date.now();
        this.emit('scaled-up', targetWorkers);
      }
    } catch (error) {
      console.error('❌ Scale up failed:', error);
    } finally {
      this.isScaling = false;
    }
  }

  // Scale down by removing workers
  scaleDown() {
    if (this.isScaling) return;
    
    this.isScaling = true;
    const currentWorkers = this.workers.size;
    const targetWorkers = Math.max(currentWorkers - 1, this.options.minWorkers);
    
    console.log(`📉 Scaling down from ${currentWorkers} to ${targetWorkers} workers`);
    
    try {
      // Find the least busy worker
      let leastBusyWorker = null;
      let lowestLoad = Infinity;
      
      for (const [workerId, stats] of this.workerStats) {
        const load = (stats.cpuUsage * 0.6) + (stats.memoryUsage * 0.4);
        if (load < lowestLoad) {
          lowestLoad = load;
          leastBusyWorker = workerId;
        }
      }
      
      if (leastBusyWorker) {
        const worker = this.workers.get(leastBusyWorker);
        if (worker) {
          // Gracefully shutdown worker
          worker.send({ type: 'shutdown' });
          
          setTimeout(() => {
            if (worker.isConnected()) {
              worker.kill('SIGTERM');
            }
          }, 5000);
          
          this.scalingHistory.push({
            type: 'scale-down',
            timestamp: Date.now(),
            from: currentWorkers,
            to: targetWorkers,
            reason: 'low-load'
          });
          
          this.lastScalingTime = Date.now();
          this.emit('scaled-down', targetWorkers);
        }
      }
    } catch (error) {
      console.error('❌ Scale down failed:', error);
    } finally {
      this.isScaling = false;
    }
  }

  // Get scaling statistics
  getScalingStats() {
    return {
      currentWorkers: this.workers.size,
      maxWorkers: this.options.maxWorkers,
      minWorkers: this.options.minWorkers,
      autoScaling: this.options.autoScaling,
      currentLoad: this.calculateCurrentLoad(),
      scalingHistory: this.scalingHistory,
      workerStats: Array.from(this.workerStats.values()),
      metrics: this.metrics
    };
  }

  // Manual scaling
  scaleTo(targetWorkers) {
    if (targetWorkers < this.options.minWorkers || targetWorkers > this.options.maxWorkers) {
      throw new Error(`Target workers must be between ${this.options.minWorkers} and ${this.options.maxWorkers}`);
    }
    
    const currentWorkers = this.workers.size;
    
    if (targetWorkers > currentWorkers) {
      // Scale up
      for (let i = currentWorkers; i < targetWorkers; i++) {
        this.spawnWorker();
      }
    } else if (targetWorkers < currentWorkers) {
      // Scale down
      const workersToRemove = currentWorkers - targetWorkers;
      for (let i = 0; i < workersToRemove; i++) {
        this.scaleDown();
      }
    }
  }

  // Start monitoring
  startMonitoring() {
    setInterval(() => {
      this.updateMetrics();
    }, 30000); // Update every 30 seconds
  }

  // Update system metrics
  updateMetrics() {
    let totalRequests = 0;
    let totalErrors = 0;
    let totalCpu = 0;
    let totalMemory = 0;
    
    for (const stats of this.workerStats.values()) {
      totalRequests += stats.requests || 0;
      totalErrors += stats.errors || 0;
      totalCpu += stats.cpuUsage || 0;
      totalMemory += stats.memoryUsage || 0;
    }
    
    this.metrics.totalRequests = totalRequests;
    this.metrics.errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    this.metrics.cpuUsage = this.workerStats.size > 0 ? totalCpu / this.workerStats.size : 0;
    this.metrics.memoryUsage = this.workerStats.size > 0 ? totalMemory / this.workerStats.size : 0;
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down Horizontal Scaling Manager...');
    
    // Stop auto-scaling
    this.options.autoScaling = false;
    
    // Gracefully shutdown all workers
    const shutdownPromises = [];
    
    for (const [workerId, worker] of this.workers) {
      console.log(`🛑 Shutting down worker ${workerId}...`);
      
      const shutdownPromise = new Promise((resolve) => {
        worker.send({ type: 'shutdown' });
        
        setTimeout(() => {
          if (worker.isConnected()) {
            worker.kill('SIGTERM');
          }
          resolve();
        }, 5000);
      });
      
      shutdownPromises.push(shutdownPromise);
    }
    
    // Wait for all workers to shutdown
    await Promise.all(shutdownPromises);
    
    console.log('✅ Horizontal Scaling Manager shutdown completed');
  }
}

// Export the scaling manager
module.exports = HorizontalScalingManager;
