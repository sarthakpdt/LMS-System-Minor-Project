const express  = require('express');
const cors     = require('cors');
const dotenv   = require('dotenv');
const mongoose = require('mongoose');
const path     = require('path');

// ── Load env vars FIRST ───────────────────────────────────────
dotenv.config();

// ── Create app SECOND ─────────────────────────────────────────
const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Route imports ─────────────────────────────────────────────
const authRoutes         = require('./routes/authRoutes');
const quizRoutes         = require('./routes/quizRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const materialRoutes     = require('./routes/materials');
const attendanceRoutes   = require('./routes/attendance1');
const notificationRoutes = require('./routes/notifications');
const timetableRoutes    = require('./routes/timetable');

// ── Route registration ────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/quiz',          quizRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/materials',     materialRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/timetable',     timetableRoutes);

// ── Static file serving for uploaded materials ────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ──────────────────────────────────────────────
app.get('/', (req, res) => res.send('EduTrack API is running...'));

// ── MongoDB connection ────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ Connection Error:', err));

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));