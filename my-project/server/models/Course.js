// server/models/Course.js
const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  semester: { type: Number, required: true },   // ✅ which semester
  credits: { type: Number, default: 3 },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  progress: { type: Number, default: 0 },
  startDate: Date,
  category: String,
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);