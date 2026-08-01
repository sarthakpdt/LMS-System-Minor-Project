const mongoose = require('mongoose');

const ttSectionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  }, // e.g. "A", "B"
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtSemester',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtBranch',
    required: true
  },
  studentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Ensure section label is unique per semester
ttSectionSchema.index({ semesterId: 1, label: 1 }, { unique: true });

module.exports = mongoose.model('TtSection', ttSectionSchema);
