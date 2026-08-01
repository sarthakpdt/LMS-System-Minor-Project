const mongoose = require('mongoose');

const ttSemesterSchema = new mongoose.Schema({
  semesterNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  }, // e.g. 1, 2, 3... 8
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }, // e.g. 1, 2, 3, 4 (derived)
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtBranch',
    required: true
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

// Ensure unique semester number per branch per academic year
ttSemesterSchema.index({ branchId: 1, semesterNumber: 1, academicYearId: 1 }, { unique: true });

module.exports = mongoose.model('TtSemester', ttSemesterSchema);
