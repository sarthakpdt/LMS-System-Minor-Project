const mongoose = require('mongoose');

const ttDepartmentSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  }, // e.g. "CS", "ECE", "ME"
  name: {
    type: String,
    required: true,
    trim: true
  }, // e.g. "Computer Science"
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('TtDepartment', ttDepartmentSchema);
