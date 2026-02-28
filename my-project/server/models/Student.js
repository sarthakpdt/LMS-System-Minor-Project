// server/models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // Basic Info
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String,
    required: true 
  },
  dateOfBirth: { 
    type: Date 
  },

  // Student Info
  studentId: { 
    type: String, 
    required: true,
    unique: true
  },
  department: { 
    type: String, 
    required: true,
    enum: ['CS', 'EE', 'ME', 'CE', 'Other']
  },
  semester: { 
    type: String, 
    required: true,
    enum: ['1', '2', '3', '4', '5', '6', '7', '8']
  },
  enrollmentYear: {
    type: Number
  },

  // Approval Status (IMPORTANT FOR ADMIN)
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  approvalDate: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },

  // Academic Info
  gpa: {
    type: Number,
    min: 0,
    max: 4.0,
    default: 0
  },
  courses: [{
    courseId: mongoose.Schema.Types.ObjectId,
    courseCode: String,
    courseName: String,
    marks: Number,
    grade: String
  }],

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', studentSchema);
