#!/usr/bin/env node
// Start UNA Institute Server locally for testing
// This serves both frontend and backend on localhost:3000

// Set environment variables for local development
process.env.NODE_ENV = 'development';
process.env.SERVE_FRONTEND = 'true';
process.env.PORT = '4000';

// Set MongoDB URI for local development (if not already set)
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = 'mongodb://localhost:27017/una_website';
}

// Set JWT secret for local development (if not already set)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'local-development-jwt-secret-key-for-testing-only';
}

console.log('🚀 Starting UNA Institute Server locally...');
console.log('📍 Environment: development');
console.log('🌐 Combined Server: http://localhost:4000');
console.log('🌍 Frontend + Backend: Both served from port 4000');
console.log('🔧 Mode: Development (Combined Frontend + Backend)');
console.log('');

// Start the server
require('./backend/server.js');
