const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// ✅ CORS setup (very important for frontend integration)
app.use(cors({
  origin: 'http://localhost:3000', // frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ✅ Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/certs', express.static(path.join(__dirname, '../frontend/certs'))); // corrected path

// ✅ Middleware for JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Routes
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/admin', adminRoutes);

// ✅ Create HTTP server and integrate socket
const http = require('http');
const server = http.createServer(app);

// ✅ Initialize socket
const { initSocket } = require('./socket/streamSocket');
initSocket(server);

// ✅ Start server using `server.listen` (not app.listen!)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running with WebSocket at http://localhost:${PORT}`);
});
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});