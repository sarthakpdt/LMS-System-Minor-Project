const express  = require('express');
const cors     = require('cors');
const dotenv   = require('dotenv');
const mongoose = require('mongoose');
const path     = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ── Route imports ──────────────────────────────────────────────────────────
const authRoutes         = require('./routes/authRoutes');
const quizRoutes         = require('./routes/quizRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const materialRoutes     = require('./routes/materials');
const attendanceRoutes   = require('./routes/attendance1');
const notificationRoutes = require('./routes/notifications');
const timetableRoutes    = require('./routes/timetable');
const bucketRoutes       = require('./routes/bucketRoutes');
const courseRoutes       = require('./routes/courseRoutes');   // ✅ FIX: was missing
const teacherRoutes      = require('./routes/teacherRoutes'); // ✅ FIX: new route

// ── Route registration ─────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/quizzes',       quizRoutes);        // ✅ FIX: was /api/quiz — frontend uses /api/quizzes
app.use('/api/admin',         adminRoutes);
app.use('/api/materials',     materialRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/timetable',     timetableRoutes);
app.use('/api/buckets',       bucketRoutes);
app.use('/api/courses',       courseRoutes);      // ✅ FIX: was missing entirely
app.use('/api/teachers',      teacherRoutes);     // ✅ FIX: new — teacher self-profile

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.send('EduTrack API is running...'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));