const mongoose = require('mongoose');

const ttTimetableNotificationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['info', 'warning', 'success', 'error'], 
    default: 'info' 
  },
  category: {
    type: String,
    enum: ['schedule_change', 'conflict', 'publish', 'general'],
    default: 'general'
  },
  targetRole: { 
    type: String, 
    enum: ['all', 'student', 'teacher', 'admin'], 
    default: 'all' 
  },
  targetUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  relatedTimetableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtGenerated',
    default: null
  },
  relatedAcademicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtAcademicYear',
    default: null
  },
  readBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('TtTimetableNotification', ttTimetableNotificationSchema);
