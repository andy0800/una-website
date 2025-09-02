// 1. Load environment variables
require('dotenv').config();

// 2. Module imports
const express    = require('express');
const path       = require('path');
const cors       = require('cors');
const mongoose   = require('mongoose');
const http       = require('http');
const { Server } = require('socket.io');

// 3. Initialize Express app
const app = express();

// 4. Create HTTP server and bind Socket.IO
const server = http.createServer(app);
const io = new Server(server);

// 5. MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser:    true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// 6. Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 7. Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/certs', express.static(path.join(__dirname, '../frontend/certs')));

// 8. API route handlers
app.use('/api/users',       require('./routes/userRoutes'));
app.use('/api/courses',     require('./routes/courseRoutes'));
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/admin',       require('./routes/adminRoutes'));
app.use('/api/lectures',    require('./routes/lectureRoutes')); // NEW: Lecture management routes

// 9. Global error handler (must be last)
app.use(require('./middleware/errorHandler'));

// 10. Favicon shortcut
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// 11. Socket.IO event routing
require('./socket/streamSocket')(io);

// 11. Start listening
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Unified server running at http://localhost:${PORT}`);
});