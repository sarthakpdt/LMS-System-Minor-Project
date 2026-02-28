// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'teacher', 'student'], 
    default: 'student' 
  },
  // REMOVE 'required: true' from these:
  studentId: { type: String }, 
  department: { type: String },
  semester: { type: String },
  phone: { type: String }
});

module.exports = mongoose.model('User', userSchema);