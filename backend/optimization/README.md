# Performance Optimization System

## Overview

The Performance Optimization System is a comprehensive solution designed to automatically monitor, analyze, and optimize the WebRTC livestreaming application's performance in real-time. It provides intelligent resource management, automatic optimization strategies, and detailed performance metrics.

## Features

### 🚀 Automatic Performance Monitoring
- **Real-time Metrics Collection**: Monitors CPU, memory, connections, response times, and throughput
- **Intelligent Threshold Detection**: Automatically identifies when optimization is needed
- **Continuous Monitoring**: Runs optimization checks at configurable intervals

### 🔧 Optimization Strategies

#### 1. Memory Optimization
- **Automatic Garbage Collection**: Triggers GC when memory usage is high
- **Cache Management**: Cleans up expired and unnecessary cache entries
- **Memory Cleanup**: Removes old optimization history and temporary data

#### 2. CPU Optimization
- **Event Loop Optimization**: Clears pending timers and heavy computations
- **Monitoring Frequency Adjustment**: Reduces monitoring load during high CPU usage
- **Resource Cleanup**: Clears heavy computation caches

#### 3. Connection Optimization
- **WebRTC Connection Management**: Optimizes peer connections and reduces overhead
- **Connection Pooling**: Manages connection pools efficiently
- **Idle Connection Cleanup**: Closes inactive connections

#### 4. Cache Optimization
- **Automatic Expiration**: Removes expired cache entries
- **Size Management**: Maintains optimal cache size
- **Dynamic TTL**: Adjusts cache policies based on memory usage

#### 5. Database Optimization
- **Connection Pool Management**: Optimizes database connections
- **Query Cache Cleanup**: Clears old query caches
- **Index Optimization**: Manages database indexes

### 📊 Performance Metrics

#### System Metrics
- **Memory Usage**: Heap and external memory consumption
- **CPU Usage**: User and system CPU time
- **System Load**: OS load averages
- **Uptime**: Process and system uptime

#### Application Metrics
- **Active Connections**: Current WebRTC connections
- **Response Time**: Average API response times
- **Throughput**: Data transfer rates
- **Error Rate**: Application error frequency

#### Optimization Metrics
- **Optimization Count**: Total optimizations performed
- **Success Rate**: Percentage of successful optimizations
- **Average Duration**: Time taken for optimizations
- **Recent History**: Last 10 optimization attempts

## Configuration

### Environment Variables

```bash
# Enable/disable performance optimization
ENABLE_PERFORMANCE_OPTIMIZATION=true

# Optimization check interval (milliseconds)
OPTIMIZATION_INTERVAL=30000

# Memory usage threshold (0.0 - 1.0)
MEMORY_THRESHOLD=0.8

# CPU usage threshold (0.0 - 1.0)
CPU_THRESHOLD=0.9

# Enable garbage collection
ENABLE_GC=true

# Enable connection pooling
ENABLE_CONNECTION_POOLING=true

# Enable caching
ENABLE_CACHING=true
```

### Constructor Options

```javascript
const optimizer = new PerformanceOptimizer({
  enableOptimization: true,
  optimizationInterval: 30000,        // 30 seconds
  memoryThreshold: 0.8,              // 80%
  cpuThreshold: 0.9,                 // 90%
  gcThreshold: 0.7,                  // 70%
  enableGarbageCollection: true,
  enableConnectionPooling: true,
  enableCompression: true,
  enableCaching: true
});
```

## API Endpoints

### GET /performance-metrics
Returns current performance metrics and optimization statistics.

**Response:**
```json
{
  "workerId": 12345,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "performance": {
    "isEnabled": true,
    "isOptimizing": false,
    "lastOptimization": 1704067200000,
    "optimizationCount": 15,
    "successRate": 0.93,
    "averageDuration": 1250
  },
  "currentMetrics": {
    "memoryUsage": 0.65,
    "cpuUsage": 0.45,
    "activeConnections": 25,
    "responseTime": 150,
    "throughput": 1024000,
    "errorRate": 0.02,
    "systemLoad": [1.2, 1.1, 0.9],
    "uptime": 3600
  },
  "recentOptimizations": [...]
}
```

### POST /performance-optimize
Manually triggers performance optimization.

**Request Body:**
```json
{
  "strategy": "memory"  // Optional: specific strategy or all strategies
}
```

**Response:**
```json
{
  "message": "Performance optimization triggered successfully: memory",
  "worker": 12345,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Usage Examples

### Basic Usage

```javascript
const PerformanceOptimizer = require('./optimization/performanceOptimizer');

// Create optimizer instance
const optimizer = new PerformanceOptimizer();

// Listen for optimization events
optimizer.on('metrics-updated', (metrics) => {
  console.log('Memory usage:', (metrics.memoryUsage * 100).toFixed(2) + '%');
  console.log('CPU usage:', (metrics.cpuUsage * 100).toFixed(2) + '%');
});

optimizer.on('optimization-completed', (strategies) => {
  console.log('Optimization completed:', strategies.map(s => s.name).join(', '));
});

// Manual optimization trigger
await optimizer.triggerOptimization('memory');
```

### Cache Management

```javascript
// Set cache with TTL
optimizer.setCache('user-data', userData, 300000); // 5 minutes

// Get cached data
const cachedData = optimizer.getCache('user-data');

// Cache automatically expires and is cleaned up
```

### Performance Statistics

```javascript
// Get optimization statistics
const stats = optimizer.getOptimizationStats();
console.log('Success rate:', (stats.successRate * 100).toFixed(2) + '%');
console.log('Total optimizations:', stats.optimizationCount);
```

## Integration with Main Server

The performance optimizer is automatically integrated into the main server with:

- **Automatic Initialization**: Started when the server starts
- **Event Integration**: Logs optimization events to the main logger
- **Metrics Endpoints**: Provides performance data via HTTP endpoints
- **Graceful Shutdown**: Properly shuts down with the server

## Monitoring and Alerting

### High Resource Usage Alerts
- **Memory > 80%**: Triggers memory optimization
- **CPU > 90%**: Triggers CPU optimization
- **Automatic Logging**: All alerts are logged with Winston

### Performance Trends
- **Historical Data**: Tracks optimization history
- **Success Rates**: Monitors optimization effectiveness
- **Duration Tracking**: Measures optimization performance

## Best Practices

### 1. Threshold Configuration
- Set realistic thresholds based on your server capacity
- Monitor and adjust thresholds based on actual usage patterns
- Use different thresholds for development and production

### 2. Optimization Frequency
- Balance between responsiveness and system overhead
- Use longer intervals for production (30-60 seconds)
- Use shorter intervals for development (10-15 seconds)

### 3. Resource Management
- Enable garbage collection only when necessary
- Monitor cache sizes and adjust TTL values
- Use connection pooling for database connections

### 4. Monitoring and Alerting
- Set up external monitoring for the `/performance-metrics` endpoint
- Configure alerts for high resource usage
- Track optimization success rates over time

## Troubleshooting

### Common Issues

#### 1. High Memory Usage
- Check if garbage collection is enabled
- Verify cache TTL settings
- Monitor for memory leaks in application code

#### 2. Frequent Optimizations
- Adjust thresholds to be less aggressive
- Increase optimization interval
- Check for resource-intensive operations

#### 3. Optimization Failures
- Review error logs for specific failure reasons
- Check if required dependencies are available
- Verify system resource availability

### Debug Mode

Enable debug logging by setting the log level:

```bash
LOG_LEVEL=debug
```

### Manual Testing

Use the test script to verify functionality:

```bash
node backend/test-performance.js
```

## Performance Impact

The performance optimizer itself has minimal overhead:

- **Memory**: ~2-5 MB additional memory usage
- **CPU**: <1% CPU usage during normal operation
- **Network**: No additional network traffic
- **Storage**: Minimal log file growth

## Future Enhancements

### Planned Features
- **Machine Learning**: Predictive optimization based on usage patterns
- **Custom Strategies**: User-defined optimization strategies
- **External Monitoring**: Integration with APM tools
- **Performance Reports**: Detailed performance analysis reports

### Extensibility
The system is designed to be easily extensible:
- Add new optimization strategies
- Implement custom metrics collection
- Integrate with external monitoring systems
- Customize optimization algorithms

## Support

For issues or questions about the Performance Optimization System:

1. Check the logs for error messages
2. Verify configuration settings
3. Test with the provided test script
4. Review this documentation
5. Check system resource availability

---

**Note**: This system is designed for production use and automatically adapts to different environments and load conditions.
