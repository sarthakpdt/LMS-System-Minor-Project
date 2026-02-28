// server/models/Teacher.js
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
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

  // Teacher Info
  employeeId: { 
    type: String, 
    required: true,
    unique: true
  },
  department: { 
    type: String, 
    required: true,
    enum: ['CS', 'EE', 'ME', 'CE', 'Other']
  },
  specialization: {
    type: String
  },
  qualification: {
    type: String
  },

  // Approval Status
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

  // Teaching Info
  assignedCourses: [{
    courseId: mongoose.Schema.Types.ObjectId,
    courseCode: String,
    courseName: String,
    semester: String
  }],
  
  assignedStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }
  ],

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

module.exports = mongoose.model('Teacher', teacherSchema);
