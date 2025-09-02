class ResourceManager {
  constructor() {
    this.isEnabled = process.env.ENABLE_RESOURCE_MANAGEMENT !== 'false';
    this.cleanupInterval = parseInt(process.env.RESOURCE_CLEANUP_INTERVAL) || 60000;
    this.maxInactiveTime = parseInt(process.env.MAX_INACTIVE_TIME) || 300000;
    
    this.resources = {
      connections: new Map(),
      streams: new Map(),
      sessions: new Map()
    };
    
    this.cleanupStats = {
      connections: 0,
      streams: 0,
      sessions: 0,
      lastCleanup: null
    };
    
    this.limits = {
      maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 1000,
      maxStreams: parseInt(process.env.MAX_STREAMS) || 100,
      maxSessions: parseInt(process.env.MAX_SESSIONS) || 500
    };
    
    if (this.isEnabled) {
      this.startCleanup();
      console.log('🔧 Resource Manager initialized');
    }
  }
  
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.cleanupInterval);
  }
  
  trackConnection(connectionId, data = {}) {
    if (!this.isEnabled) return;
    
    const connection = {
      id: connectionId,
      timestamp: Date.now(),
      lastActivity: Date.now(),
      type: data.type || 'unknown',
      userId: data.userId,
      ip: data.ip
    };
    
    this.resources.connections.set(connectionId, connection);
  }
  
  trackStream(streamId, data = {}) {
    if (!this.isEnabled) return;
    
    const stream = {
      id: streamId,
      timestamp: Date.now(),
      lastActivity: Date.now(),
      type: data.type || 'livestream',
      adminId: data.adminId,
      viewerCount: data.viewerCount || 0,
      status: data.status || 'active'
    };
    
    this.resources.streams.set(streamId, stream);
  }
  
  trackSession(sessionId, data = {}) {
    if (!this.isEnabled) return;
    
    const session = {
      id: sessionId,
      timestamp: Date.now(),
      lastActivity: Date.now(),
      userId: data.userId,
      type: data.type || 'user'
    };
    
    this.resources.sessions.set(sessionId, session);
  }
  
  updateActivity(resourceType, resourceId) {
    if (!this.isEnabled) return;
    
    const resourceMap = this.resources[resourceType];
    if (!resourceMap || !resourceMap.has(resourceId)) return;
    
    const resource = resourceMap.get(resourceId);
    resource.lastActivity = Date.now();
  }
  
  removeResource(resourceType, resourceId) {
    if (!this.isEnabled) return;
    
    const resourceMap = this.resources[resourceType];
    if (!resourceMap || !resourceMap.has(resourceId)) return;
    
    const resource = resourceMap.get(resourceId);
    resourceMap.delete(resourceId);
    
    return resource;
  }
  
  performCleanup() {
    if (!this.isEnabled) return;
    
    const now = Date.now();
    const cutoff = now - this.maxInactiveTime;
    
    console.log('🧹 Performing resource cleanup...');
    
    this.cleanupResourceType('connections', cutoff);
    this.cleanupResourceType('streams', cutoff);
    this.cleanupResourceType('sessions', cutoff);
    
    this.cleanupStats.lastCleanup = now;
    console.log('✅ Resource cleanup completed');
  }
  
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
    
    toRemove.forEach(id => {
      this.removeResource(resourceType, id);
    });
    
    this.cleanupStats[resourceType] += cleanedCount;
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} inactive ${resourceType}`);
    }
  }
  
  getResourceStats() {
    return {
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
      cleanup: this.cleanupStats
    };
  }
  
  stop() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
  
  cleanup() {
    this.stop();
    Object.keys(this.resources).forEach(resourceType => {
      this.resources[resourceType].clear();
    });
    this.cleanupStats = {
      connections: 0,
      streams: 0,
      sessions: 0,
      lastCleanup: null
    };
  }
}

module.exports = ResourceManager;
