const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true }, // e.g. "BTECH", "BBA", "BDES"
  name: { type: String, required: true }, // e.g. "Bachelor of Technology"
  semesters: [{
    semesterNumber: { type: Number, required: true }, // 1 to 8
    label: { type: String, required: true }, // e.g. "Semester 1"
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
  schedulingRules: {
    maxClassesPerDay: { type: Number, default: 6 },
    maxConsecutiveLectures: { type: Number, default: 3 },
    maxLabsPerDay: { type: Number, default: 2 },
    lectureDuration: { type: Number, default: 50 },
    dayStartTime: { type: String, default: '09:00' },
    dayEndTime: { type: String, default: '17:00' },
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TtConfig', ttConfigSchema);
