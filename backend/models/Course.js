const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  courseName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    required: true,
    enum: ['CS', 'IT', 'ECE', 'EE', 'ME', 'CE', 'CH', 'BT', 'MBA', 'MCA', 'Other'],
  },
  semester: {
    type: String,
    required: true,
    enum: ['1', '2', '3', '4', '5', '6', '7', '8'],
  },
  /** Optional timetable linkage */
  timetableBranch: { type: String, default: null },
  academicYear: { type: Number, default: null },
  section: { type: String, default: null },
  ttSubjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'TtSubject', default: null },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null,
  },
  enrolledStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    }
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Course', courseSchema);