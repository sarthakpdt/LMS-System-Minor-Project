const mongoose = require('mongoose');

const ttLectureSlotSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
  }, // e.g. "09:00 - 09:50"
  startTime: {
    type: String,
    required: true,
    trim: true
  }, // e.g. "09:00"
  endTime: {
    type: String,
    required: true,
    trim: true
  }, // e.g. "09:50"
  slotNumber: {
    type: Number,
    required: true,
    min: 1
  }, // Ordering of slots in a day
  duration: {
    type: Number,
    required: true,
    min: 1
  }, // Duration in minutes
  isBreak: {
    type: Boolean,
    default: false
  },
  breakType: {
    type: String,
    enum: ['lunch', 'short', 'tea', null],
    default: null
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtAcademicYear',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// A slot number must be unique per academic year
ttLectureSlotSchema.index({ slotNumber: 1, academicYearId: 1 }, { unique: true });

module.exports = mongoose.model('TtLectureSlot', ttLectureSlotSchema);
