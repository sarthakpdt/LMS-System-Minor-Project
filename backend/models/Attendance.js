const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: {
    type: String, // "YYYY-MM-DD"
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  // Reference to the timetable slot this attendance belongs to
  timetableSlotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimetableSlot',
    default: null
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherName: String,
  records: [
    {
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      studentName: String,
      status: { type: String, enum: ['present', 'absent', 'late'], default: 'absent' }
    }
  ]
}, { timestamps: true });

attendanceSchema.index({ date: 1, subject: 1, teacherId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);