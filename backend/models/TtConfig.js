const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true }, // e.g. "BTECH", "BBA", "BDES"
  name: { type: String, required: true }, // e.g. "Bachelor of Technology"
  years: [{
    yearNumber: { type: Number, required: true }, // 1, 2, 3, 4
    label: { type: String, required: true }, // e.g. "First Year"
    sections: [{ type: String, required: true }] // ["A", "B", "C"]
  }]
});

const timeSlotSchema = new mongoose.Schema({
  label: { type: String, required: true }, // e.g. "09:00 - 09:50"
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true }, // "09:50"
  isBreak: { type: Boolean, default: false },
  breakType: { type: String, enum: ['lunch', 'short', null], default: null }
});

const ttConfigSchema = new mongoose.Schema({
  academicYear: { type: String, required: true }, // e.g. "2024-25"
  branches: [branchSchema],
  workingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  }],
  timeSlots: [timeSlotSchema],
  lunchBreak: {
    startTime: { type: String, required: true }, // "13:00"
    endTime: { type: String, required: true } // "14:00"
  },
  lectureDuration: { type: Number, required: true, default: 50 }, // in minutes
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TtConfig', ttConfigSchema);
