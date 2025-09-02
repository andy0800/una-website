const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app); // Create HTTP server for Socket.IO
const { Server } = require('socket.io');
const io = new Server(server); // No need for CORS if all on same origin

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Middleware
app.use(cors()); // Optional since frontend and backend on same origin
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static frontend files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/certs', express.static(path.join(__dirname, '../frontend/certs')));

// ✅ API Routes
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/admin', adminRoutes);

// ✅ Handle favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ✅ Socket.IO handling
require('./socket/streamSocket')(io); // Pass io instance

// ✅ Start server on port 3000 (unified)
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Unified server running at: http://localhost:${PORT}`);
});