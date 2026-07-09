const mongoose = require('mongoose');

const ttCourseAssignmentSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtSubject',
    required: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtSection',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtBranch',
    required: true
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtSemester',
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

// A section can only have a subject assigned once for a given academic year
ttCourseAssignmentSchema.index({ subjectId: 1, sectionId: 1, academicYearId: 1 }, { unique: true });

module.exports = mongoose.model('TtCourseAssignment', ttCourseAssignmentSchema);
