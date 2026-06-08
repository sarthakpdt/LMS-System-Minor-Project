const mongoose = require('mongoose');

const timetableSlotSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  startTime: { type: String, required: true }, // e.g. "09:00"
  endTime: { type: String, required: true },   // e.g. "10:00"
  semester: { type: Number, required: true },
  department: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherName: { type: String },
  room: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// A subject can only be in one slot per day/semester/department/teacher combo
timetableSlotSchema.index({ subject: 1, day: 1, semester: 1, department: 1, teacherId: 1 }, { unique: true });

module.exports = mongoose.model('TimetableSlot', timetableSlotSchema);