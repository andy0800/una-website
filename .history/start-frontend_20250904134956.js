#!/usr/bin/env node
// Start UNA Institute Frontend Server on port 3000
// This serves only the frontend static files

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// CORS configuration for frontend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:4000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Serve static files
app.use('/certs', express.static(path.join(__dirname, 'frontend/certs')));
app.use('/images', express.static(path.join(__dirname, 'frontend/images')));
app.use('/css', express.static(path.join(__dirname, 'frontend/css')));
app.use('/js', express.static(path.join(__dirname, 'frontend/js')));
app.use('/socket.io', express.static(path.join(__dirname, 'frontend/socket.io')));

// Serve Arabic homepage as default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/ar/index.html'));
});

// Serve English homepage
app.get('/en', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/en/index.html'));
});

// Serve Arabic homepage
app.get('/ar', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/ar/index.html'));
});

// Serve admin login
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/admin/login.html'));
});

// Serve admin dashboard
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/admin/dashboard.html'));
});

// Serve all other frontend pages
app.get('/en/*', (req, res) => {
  const filePath = path.join(__dirname, 'frontend/en', req.params[0]);
  res.sendFile(filePath);
});

app.get('/ar/*', (req, res) => {
  const filePath = path.join(__dirname, 'frontend/ar', req.params[0]);
  res.sendFile(filePath);
});

app.get('/admin/*', (req, res) => {
  const filePath = path.join(__dirname, 'frontend/admin', req.params[0]);
  res.sendFile(filePath);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Frontend server is running',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested frontend resource was not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, 'localhost', () => {
  console.log('🌍 UNA Institute Frontend Server Started');
  console.log(`📍 Environment: development`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`🔧 Mode: Frontend only`);
  console.log(`📁 Static Files: Served from frontend/`);
  console.log('');
  console.log('💡 Backend API should be running on http://localhost:4000');
  console.log('💡 Run "npm run local" in another terminal to start the backend');
});
