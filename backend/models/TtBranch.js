const mongoose = require('mongoose');

const ttBranchSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    uppercase: true, 
    trim: true 
  }, // e.g. "CS", "ECE"
  name: { 
    type: String, 
    required: true, 
    trim: true 
  }, // e.g. "Computer Science & Engineering"
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtAcademicYear',
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtDepartment',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Ensure branch code is unique for a given academic year
ttBranchSchema.index({ code: 1, academicYearId: 1 }, { unique: true });

module.exports = mongoose.model('TtBranch', ttBranchSchema);
