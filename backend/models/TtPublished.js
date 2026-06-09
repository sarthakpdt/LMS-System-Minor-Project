const mongoose = require('mongoose');

const ttPublishedEntrySchema = new mongoose.Schema({
  branch: { type: String, required: true },
  year: { type: Number, required: true },
  section: { type: String, required: true },
  day: { type: String, required: true },
  timeSlot: {
    label: { type: String, required: true },
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

const ttPublishedSchema = new mongoose.Schema({
  generatedId: { type: mongoose.Schema.Types.ObjectId, ref: 'TtGenerated', required: true },
  publishedAt: { type: Date, default: Date.now },
  academicYear: { type: String, required: true },
  entries: [ttPublishedEntrySchema]
}, { timestamps: true });

// We can have a quick index to retrieve published timetables by branch, year, section, and academic year
ttPublishedSchema.index({ academicYear: 1 });

module.exports = mongoose.model('TtPublished', ttPublishedSchema);
