const mongoose = require('mongoose');

const ttWorkingDaySchema = new mongoose.Schema({
  dayName: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  dayOrder: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  }, // Ordering representation
  isHalfDay: {
    type: Boolean,
    default: false
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

// Day name must be unique per academic year
ttWorkingDaySchema.index({ dayName: 1, academicYearId: 1 }, { unique: true });

module.exports = mongoose.model('TtWorkingDay', ttWorkingDaySchema);
