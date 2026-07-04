const mongoose = require('mongoose');

const ttLabSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }, // e.g. "Advanced Computing Lab"
  labType: {
    type: String,
    required: true,
    trim: true
  }, // e.g. "Computer", "Hardware", "Physics"
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  building: {
    type: String,
    trim: true
  },
  floor: {
    type: String,
    trim: true
  },
  equipment: [{
    type: String,
    trim: true
  }],
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

module.exports = mongoose.model('TtLab', ttLabSchema);
