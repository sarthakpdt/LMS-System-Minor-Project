const mongoose = require('mongoose');

const ttLunchBreakSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    trim: true
  }, // e.g. "13:00"
  endTime: {
    type: String,
    required: true,
    trim: true
  }, // e.g. "14:00"
  duration: {
    type: Number,
    required: true,
    min: 1
  }, // duration in minutes
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtAcademicYear',
    required: true,
    unique: true // one lunch break definition per academic year
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('TtLunchBreak', ttLunchBreakSchema);
