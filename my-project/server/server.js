const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courseRoutes = require('./routes/courseRoutes'); // ✅ LINE 1 — add this

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Connection Error:", err));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes); // ✅ LINE 2 — add this

app.get('/', (req, res) => {
  res.send('EduTrack API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));