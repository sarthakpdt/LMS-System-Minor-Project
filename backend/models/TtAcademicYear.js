const mongoose = require('mongoose');

const ttAcademicYearSchema = new mongoose.Schema({
  label: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  }, // e.g. "2024-25"
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  isCurrent: { 
    type: Boolean, 
    default: false 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Ensure only one Academic Year is marked isCurrent at any time (enforced in controller, but helper index added)
ttAcademicYearSchema.index({ isCurrent: 1 });

module.exports = mongoose.model('TtAcademicYear', ttAcademicYearSchema);
