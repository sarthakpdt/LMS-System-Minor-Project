const mongoose = require('mongoose');

// Phase 5 extended schema — supports both ObjectId references and string-based fallbacks
// The original strict schema required sectionId/branchId ObjectIds which weren't always available.
// This version uses flexible fields that work with the existing TtGenerated entry format.
const ttAttendanceSlotSchema = new mongoose.Schema({
  // Reference back to the TtGenerated timetable draft
  timetableEntryRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TtGenerated',
    default: null,
  },

  // Date this slot falls on (YYYY-MM-DD)
  date: { type: String, required: true },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },

  // Subject info
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'TtSubject', default: null },
  subjectName: { type: String, default: '' },

  // Faculty info
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  facultyName: { type: String, default: '' },

  // Section info — stored as both ObjectId (when available) and string label
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TtSection', default: null },
  sectionLabel: { type: String, default: '' }, // e.g. "CS-2-A"
  branch: { type: String, default: '' },
  year: { type: Number, default: null },
  section: { type: String, default: 'A' },

  // Room
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'TtRoom', default: null },
  room: { type: String, default: '' },

  // Lecture type
  lectureType: {
    type: String,
    enum: ['theory', 'lab', 'tutorial', 'exam', 'free', 'lunch'],
    default: 'theory',
  },

  // Attendance lifecycle status
  attendanceStatus: {
    type: String,
    enum: ['pending', 'completed', 'missed', 'late_submission'],
    default: 'pending',
  },

  // Link to the Attendance record once submitted
  attendanceRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance', default: null },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Unique per teacher+date+startTime+sectionLabel (prevents duplicates on re-publish)
ttAttendanceSlotSchema.index(
  { facultyId: 1, date: 1, startTime: 1, sectionLabel: 1 },
  { unique: true }
);

// Common query indexes
ttAttendanceSlotSchema.index({ facultyId: 1, date: 1 });
ttAttendanceSlotSchema.index({ branch: 1, year: 1, section: 1, date: 1 });
ttAttendanceSlotSchema.index({ attendanceStatus: 1, date: 1 });

module.exports = mongoose.model('TtAttendanceSlot', ttAttendanceSlotSchema);
