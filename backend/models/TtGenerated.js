const mongoose = require('mongoose');

const ttEntrySchema = new mongoose.Schema({
  branch: { type: String, required: true },
  year: { type: Number, required: true },
  section: { type: String, required: true },
  day: { type: String, required: true },
  timeSlot: {
    label: { type: String, required: true }, // "09:00 - 09:50"
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'TtSubject', default: null },
  subjectName: { type: String, default: '' },
  subjectType: { type: String, enum: ['theory', 'lab', 'free', 'lunch'], default: 'free' },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  facultyName: { type: String, default: '' },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'TtRoom', default: null },
  roomName: { type: String, default: '' },
  isLunch: { type: Boolean, default: false },
  isFree: { type: Boolean, default: false }
});

const ttConflictSchema = new mongoose.Schema({
  type: { type: String, enum: ['teacher', 'room', 'section', 'lab', 'missing', 'unassigned'], required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['error', 'warning'], required: true }
});

const ttGeneratedSchema = new mongoose.Schema({
  configId: { type: mongoose.Schema.Types.ObjectId, ref: 'TtConfig', required: true },
  label: { type: String, default: 'Working Draft' },
  generatedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  isWorkingDraft: { type: Boolean, default: false },
  aiOptimized: { type: Boolean, default: false },
  validationSummary: {
    errorCount: { type: Number, default: 0 },
    warningCount: { type: Number, default: 0 },
    missingFaculty: { type: Number, default: 0 },
    missingRoom: { type: Number, default: 0 },
    missingLab: { type: Number, default: 0 },
    constraintViolations: { type: Number, default: 0 },
  },
  conflicts: [ttConflictSchema],
  entries: [ttEntrySchema]
}, { timestamps: true });

module.exports = mongoose.model('TtGenerated', ttGeneratedSchema);
