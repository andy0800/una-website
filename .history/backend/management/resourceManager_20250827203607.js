const EventEmitter = require('events');

class ResourceManager extends EventEmitter {
  constructor() {
    super();
    
    this.isEnabled = process.env.ENABLE_RESOURCE_MANAGEMENT !== 'false';
    this.cleanupInterval = parseInt(process.env.RESOURCE_CLEANUP_INTERVAL) || 60000; // 1 minute
    this.maxInactiveTime = parseInt(process.env.MAX_INACTIVE_TIME) || 300000; // 5 minutes
    
    // Resource tracking
    this.resources = {
      connections: new Map(),
      streams: new Map(),
      sessions: new Map(),
      files: new Map(),
      caches: new Map()
    };
    
    // Cleanup counters
    this.cleanupStats = {
      connections: 0,
      streams: 0,
      sessions: 0,
      files: 0,
      caches: 0,
      lastCleanup: null
    };
    
    // Resource limits
    this.limits = {
      maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 1000,
      maxStreams: parseInt(process.env.MAX_STREAMS) || 100,
      maxSessions: parseInt(process.env.MAX_SESSIONS) || 500,
      maxFiles: parseInt(process.env.MAX_FILES) || 1000,
      maxCacheSize: parseInt(process.env.MAX_CACHE_SIZE) || 100 * 1024 * 1024 // 100MB
    };
    
    if (this.isEnabled) {
      this.startCleanup();
      console.log('🔧 Resource Manager initialized');
    }
  }
  
  // Start automatic cleanup
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.cleanupInterval);
    
    console.log(`🧹 Resource cleanup started (${this.cleanupInterval}ms interval)`);
  }
  
  // Track a new connection
  trackConnection(connectionId, data = {}) {
    if (!this.isEnabled) return;
    
    const connection = {
      id: connectionId,
      timestamp: Date.now(),
      lastActivity: Date.now(),
      type: data.type || 'unknown',
      userId: data.userId,
      ip: data.ip,
      userAgent: data.userAgent,
      metadata: data.metadata || {}
    };
    
    this.resources.connections.set(connectionId, connection);
    
    // Check if we're approaching limits
    if (this.resources.connections.size > this.limits.maxConnections * 0.9) {
      this.emit('resource_warning', {
        type: 'connections',
        current: this.resources.connections.size,
        limit: this.limits.maxConnections,
        message: 'Approaching connection limit'
      });
    }
    
    this.emit('connection_tracked', connection);
  }
  
  // Track a new stream
  trackStream(streamId, data = {}) {
    if (!this.isEnabled) return;
    
    const stream = {
      id: streamId,
      timestamp: Date.now(),
      lastActivity: Date.now(),
      type: data.type || 'livestream',
      adminId: data.adminId,
      viewerCount: data.viewerCount || 0,
      status: data.status || 'active',
      metadata: data.metadata || {}
    };
    
    this.resources.streams.set(streamId, stream);
    
    // Check limits
    if (this.resources.streams.size > this.limits.maxStreams * 0.9) {
      this.emit('resource_warning', {
        type: 'streams',
        current: this.resources.streams.size,
        limit: this.limits.maxStreams,
        message: 'Approaching stream limit'
      });
    }
    
    this.emit('stream_tracked', stream);
  }
  
  // Track a new session
  trackSession(sessionId, data = {}) {
    if (!this.isEnabled) return;
    
    const session = {
      id: sessionId,
      timestamp: Date.now(),
      lastActivity: Date.now(),
      userId: data.userId,
      type: data.type || 'user',
      permissions: data.permissions || [],
      metadata: data.metadata || {}
    };
    
    this.resources.sessions.set(sessionId, session);
    
    // Check limits
    if (this.resources.sessions.size > this.limits.maxSessions * 0.9) {
      this.emit('resource_warning', {
        type: 'sessions',
        current: this.resources.sessions.size,
        limit: this.limits.maxSessions,
        message: 'Approaching session limit'
      });
    }
    
    this.emit('session_tracked', session);
  }
  
  // Track a file
  trackFile(fileId, data = {}) {
    if (!this.isEnabled) return;
    
    const file = {
      id: fileId,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      path: data.path,
      size: data.size || 0,
      type: data.type || 'unknown',
      metadata: data.metadata || {}
    };
    
    this.resources.files.set(fileId, file);
    
    // Check limits
    if (this.resources.files.size > this.limits.maxFiles * 0.9) {
      this.emit('resource_warning', {
        type: 'files',
        current: this.resources.files.size,
        limit: this.limits.maxFiles,
        message: 'Approaching file limit'
      });
    }
    
    this.emit('file_tracked', file);
  }
  
  // Track cache usage
  trackCache(cacheKey, data = {}) {
    if (!this.isEnabled) return;
    
    const cache = {
      key: cacheKey,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      size: data.size || 0,
      hits: data.hits || 0,
      metadata: data.metadata || {}
    };
    
    this.resources.caches.set(cacheKey, cache);
    
    // Check cache size limit
    const totalCacheSize = Array.from(this.resources.caches.values())
      .reduce((total, cache) => total + cache.size, 0);
    
    if (totalCacheSize > this.limits.maxCacheSize * 0.9) {
      this.emit('resource_warning', {
        type: 'cache',
        current: totalCacheSize,
        limit: this.limits.maxCacheSize,
        message: 'Approaching cache size limit'
      });
    }
    
    this.emit('cache_tracked', cache);
  }
  
  // Update resource activity
  updateActivity(resourceType, resourceId) {
    if (!this.isEnabled) return;
    
    const resourceMap = this.resources[resourceType];
    if (!resourceMap || !resourceMap.has(resourceId)) return;
    
    const resource = resourceMap.get(resourceId);
    resource.lastActivity = Date.now();
    
    this.emit('activity_updated', {
      type: resourceType,
      id: resourceId,
      timestamp: Date.now()
    });
  }
  
  // Remove a resource
  removeResource(resourceType, resourceId) {
    if (!this.isEnabled) return;
    
    const resourceMap = this.resources[resourceType];
    if (!resourceMap || !resourceMap.has(resourceId)) return;
    
    const resource = resourceMap.get(resourceId);
    resourceMap.delete(resourceId);
    
    this.emit('resource_removed', {
      type: resourceType,
      id: resourceId,
      resource,
      timestamp: Date.now()
    });
    
    return resource;
  }
  
  // Perform cleanup of inactive resources
  performCleanup() {
    if (!this.isEnabled) return;
    
    const now = Date.now();
    const cutoff = now - this.maxInactiveTime;
    
    console.log('🧹 Performing resource cleanup...');
    
    // Cleanup connections
    this.cleanupResourceType('connections', cutoff);
    
    // Cleanup streams
    this.cleanupResourceType('streams', cutoff);
    
    // Cleanup sessions
    this.cleanupResourceType('sessions', cutoff);
    
    // Cleanup files
    this.cleanupResourceType('files', cutoff);
    
    // Cleanup caches
    this.cleanupResourceType('caches', cutoff);
    
    // Update cleanup stats
    this.cleanupStats.lastCleanup = now;
    
    // Emit cleanup completed event
    this.emit('cleanup_completed', {
      timestamp: now,
      stats: this.cleanupStats
    });
    
    console.log('✅ Resource cleanup completed');
  }
  
  // Cleanup specific resource type
  cleanupResourceType(resourceType, cutoff) {
    const resourceMap = this.resources[resourceType];
    if (!resourceMap) return;
    
    let cleanedCount = 0;
    const toRemove = [];
    
    for (const [id, resource] of resourceMap.entries()) {
      if (resource.lastActivity < cutoff) {
        toRemove.push(id);
        cleanedCount++;
      }
    }
    
    // Remove inactive resources
    toRemove.forEach(id => {
      this.removeResource(resourceType, id);
    });
    
    // Update cleanup stats
    this.cleanupStats[resourceType] += cleanedCount;
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} inactive ${resourceType}`);
    }
  }
  
  // Get resource statistics
  getResourceStats() {
    const stats = {
      connections: {
        current: this.resources.connections.size,
        limit: this.limits.maxConnections,
        percentage: Math.round((this.resources.connections.size / this.limits.maxConnections) * 100)
      },
      streams: {
        current: this.resources.streams.size,
        limit: this.limits.maxStreams,
        percentage: Math.round((this.resources.streams.size / this.limits.maxStreams) * 100)
      },
      sessions: {
        current: this.resources.sessions.size,
        limit: this.limits.maxSessions,
        percentage: Math.round((this.resources.sessions.size / this.limits.maxSessions) * 100)
      },
      files: {
        current: this.resources.files.size,
        limit: this.limits.maxFiles,
        percentage: Math.round((this.resources.files.size / this.limits.maxFiles) * 100)
      },
      caches: {
        current: this.resources.caches.size,
        size: Array.from(this.resources.caches.values()).reduce((total, cache) => total + cache.size, 0),
        limit: this.limits.maxCacheSize,
        percentage: Math.round((Array.from(this.resources.caches.values()).reduce((total, cache) => total + cache.size, 0) / this.limits.maxCacheSize) * 100)
      },
      cleanup: this.cleanupStats
    };
    
    return stats;
  }
  
  // Get specific resource details
  getResourceDetails(resourceType, resourceId) {
    const resourceMap = this.resources[resourceType];
    if (!resourceMap || !resourceMap.has(resourceId)) return null;
    
    return resourceMap.get(resourceId);
  }
  
  // Get all resources of a type
  getResourcesByType(resourceType) {
    const resourceMap = this.resources[resourceType];
    if (!resourceMap) return [];
    
    return Array.from(resourceMap.values());
  }
  
  // Search resources
  searchResources(query, options = {}) {
    const results = {
      connections: [],
      streams: [],
      sessions: [],
      files: [],
      caches: []
    };
    
    const searchTerm = query.toLowerCase();
    
    // Search in each resource type
    Object.keys(this.resources).forEach(resourceType => {
      const resourceMap = this.resources[resourceType];
      if (!resourceMap) return;
      
      for (const resource of resourceMap.values()) {
        let match = false;
        
        // Search in basic fields
        if (resource.id && resource.id.toLowerCase().includes(searchTerm)) match = true;
        if (resource.type && resource.type.toLowerCase().includes(searchTerm)) match = true;
        
        // Search in metadata
        if (resource.metadata) {
          for (const [key, value] of Object.entries(resource.metadata)) {
            if (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
              match = true;
              break;
            }
          }
        }
        
        if (match) {
          results[resourceType].push(resource);
        }
      }
    });
    
    // Apply filters
    if (options.activeOnly) {
      Object.keys(results).forEach(resourceType => {
        results[resourceType] = results[resourceType].filter(resource => 
          resource.lastActivity > (Date.now() - this.maxInactiveTime)
        );
      });
    }
    
    return results;
  }
  
  // Force cleanup of specific resource
  forceCleanup(resourceType, resourceId) {
    if (!this.isEnabled) return false;
    
    const resource = this.removeResource(resourceType, resourceId);
    if (resource) {
      console.log(`🧹 Force cleaned up ${resourceType}: ${resourceId}`);
      return true;
    }
    
    return false;
  }
  
  // Update resource limits
  updateLimits(newLimits) {
    Object.assign(this.limits, newLimits);
    
    console.log('✅ Resource limits updated:', newLimits);
    
    this.emit('limits_updated', this.limits);
  }
  
  // Stop resource management
  stop() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    console.log('🛑 Resource management stopped');
  }
  
  // Cleanup all resources
  cleanup() {
    try {
      this.stop();
      
      // Clear all resource maps
      Object.keys(this.resources).forEach(resourceType => {
        this.resources[resourceType].clear();
      });
      
      // Reset cleanup stats
      this.cleanupStats = {
        connections: 0,
        streams: 0,
        sessions: 0,
        files: 0,
        caches: 0,
        lastCleanup: null
      };
      
      console.log('🧹 Resource Manager cleaned up');
      
    } catch (error) {
      console.error('Failed to cleanup Resource Manager:', error);
    }
  }
  
  // Test resource management
  test() {
    console.log('🧪 Testing Resource Manager...');
    
    // Test resource tracking
    this.trackConnection('test-conn-1', { type: 'test', userId: 'test-user' });
    this.trackStream('test-stream-1', { type: 'test', adminId: 'test-admin' });
    this.trackSession('test-session-1', { userId: 'test-user', type: 'test' });
    
    // Test activity update
    this.updateActivity('connections', 'test-conn-1');
    
    // Test resource stats
    const stats = this.getResourceStats();
    console.log('✅ Resource stats:', stats);
    
    // Test cleanup
    this.performCleanup();
    
    // Cleanup test resources
    this.removeResource('connections', 'test-conn-1');
    this.removeResource('streams', 'test-stream-1');
    this.removeResource('sessions', 'test-session-1');
    
    console.log('✅ Resource Manager test completed');
  }
}

module.exports = ResourceManager;
