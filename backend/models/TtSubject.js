const mongoose = require('mongoose');

const ttSubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  type: { type: String, enum: ['theory', 'lab'], required: true },
  branch: { type: String, required: true }, // uppercase code, e.g. "BTECH"
  semester: { type: Number, required: true }, // e.g. 1, 2, 3, 4, 5, 6, 7, 8
  credits: { type: Number, required: true }, // e.g. 4
  weeklyHours: { type: Number, required: true }, // theory slots/week OR lab sessions/week
  labDuration: { type: Number, default: 2 }, // consecutive hours per lab session
  lectureDuration: { type: Number, default: null }, // optional override (minutes)
  hasLab: { type: Boolean, default: false }, // theory subject with linked lab component
  labSessionsPerWeek: { type: Number, default: 1 },
  linkedCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  facultyName: { type: String, default: '' },
  preferredDays: { type: [String], default: [] },
  preferredSlots: { type: [String], default: [] },
  roomType: { type: String, enum: ['classroom', 'lab', 'any'], default: 'any' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique code within branch/semester combo
ttSubjectSchema.index({ code: 1, branch: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('TtSubject', ttSubjectSchema);

