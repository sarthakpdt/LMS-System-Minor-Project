// server/models/Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
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

  // Admin Info
  employeeId: { 
    type: String, 
    required: true,
    unique: true
  },
  adminType: {
    type: String,
    enum: ['super-admin', 'department-admin', 'academic-admin'],
    default: 'department-admin'
  },
  department: {
    type: String,
    enum: ['CS', 'EE', 'ME', 'CE', 'All'],
    default: 'All'
  },

  // Permissions
  permissions: [{
    type: String,
    enum: [
      'approve-students',
      'approve-teachers',
      'manage-courses',
      'manage-assessments',
      'view-analytics',
      'manage-users',
      'delete-accounts'
    ]
  }],

  // Activity Tracking
  approvedStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }
  ],
  approvedTeachers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    }
  ],

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
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

module.exports = mongoose.model('Admin', adminSchema);
