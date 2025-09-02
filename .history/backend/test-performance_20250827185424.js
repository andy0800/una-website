// Test script for Performance Optimizer
const PerformanceOptimizer = require('./optimization/performanceOptimizer');

console.log('🧪 Testing Performance Optimizer...\n');

// Create performance optimizer instance
const optimizer = new PerformanceOptimizer({
  enableOptimization: true,
  optimizationInterval: 10000, // 10 seconds for testing
  memoryThreshold: 0.5, // 50% for testing
  cpuThreshold: 0.7, // 70% for testing
  enableGarbageCollection: true,
  enableConnectionPooling: true,
  enableCaching: true
});

// Test cache functionality
console.log('📦 Testing cache functionality...');
optimizer.setCache('test-key', 'test-value', 5000); // 5 seconds TTL
const cachedValue = optimizer.getCache('test-key');
console.log(`Cache test: ${cachedValue === 'test-value' ? '✅ PASSED' : '❌ FAILED'}`);

// Test optimization strategies
console.log('\n🔧 Testing optimization strategies...');
console.log('Available strategies:', Array.from(optimizer.optimizationStrategies.keys()));

// Test manual optimization trigger
console.log('\n🚀 Testing manual optimization trigger...');
setTimeout(async () => {
  try {
    await optimizer.triggerOptimization('memory');
    console.log('✅ Memory optimization completed');
  } catch (error) {
    console.error('❌ Memory optimization failed:', error.message);
  }
}, 2000);

// Test performance metrics
console.log('\n📊 Testing performance metrics...');
setTimeout(() => {
  const stats = optimizer.getOptimizationStats();
  console.log('Optimization stats:', {
    isEnabled: stats.isEnabled,
    isOptimizing: stats.isOptimizing,
    optimizationCount: stats.optimizationCount,
    successRate: stats.successRate,
    averageDuration: stats.averageDuration
  });
}, 5000);

// Test event listeners
optimizer.on('metrics-updated', (metrics) => {
  console.log('\n📈 Metrics updated:', {
    memoryUsage: `${(metrics.memoryUsage * 100).toFixed(2)}%`,
    cpuUsage: `${(metrics.cpuUsage * 100).toFixed(2)}%`,
    activeConnections: metrics.activeConnections,
    timestamp: new Date(metrics.timestamp).toLocaleTimeString()
  });
});

optimizer.on('optimization-completed', (strategies) => {
  console.log('\n✅ Optimization completed:', strategies.map(s => s.name).join(', '));
});

// Test shutdown
console.log('\n🛑 Testing graceful shutdown...');
setTimeout(async () => {
  console.log('Shutting down performance optimizer...');
  await optimizer.shutdown();
  console.log('✅ Performance optimizer shutdown completed');
  process.exit(0);
}, 15000);

console.log('\n⏳ Test will run for 15 seconds...');
console.log('Press Ctrl+C to stop early\n');
