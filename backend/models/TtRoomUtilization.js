const mongoose = require('mongoose');

const ttRoomUtilizationSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtRoom',
    required: true
  },
  timetableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtGenerated',
    required: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtAcademicYear',
    required: true
  },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtLectureSlot',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtSubject',
    default: null
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtSection',
    default: null
  },
  utilizationPct: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  snapshotDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for quick queries of room utilization by timetable/room/day/slot
ttRoomUtilizationSchema.index({ roomId: 1, timetableId: 1, day: 1, slotId: 1 });

module.exports = mongoose.model('TtRoomUtilization', ttRoomUtilizationSchema);
