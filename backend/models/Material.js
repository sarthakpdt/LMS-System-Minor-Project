const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  subject: {
    type: String,
    default: ''
  },
  // Which course this material belongs to
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  courseName: {
    type: String,
    default: ''
  },
  // Category of material
  category: {
    type: String,
    enum: [
      'Lecture Notes', 'Practice Sheet', 'Assignment', 'Video Lecture',
      'Reference Material', 'Lab Manual', 'Previous Year Paper',
      'Visual Aids', 'Guidelines', 'Other'
    ],
    default: 'Other'
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'mp4', 'other'],
    default: 'other'
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedByName: {
    type: String,
    default: ''
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Material', materialSchema);