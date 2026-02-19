// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
 name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  studentId: { type: String }, // Optional for teachers, required for students
  phoneNumber: { type: String },
  department: { type: String },
  semester: { type: String },
  academicYear: { type: String },
  course: { type: String },
  dob: { type: Date },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' }
});

module.exports = mongoose.model('User', UserSchema);