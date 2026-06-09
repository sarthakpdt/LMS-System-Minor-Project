const mongoose = require('mongoose');

const unavailableSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: { type: String, required: true }, // e.g. "14:00"
  endTime: { type: String, required: true }, // e.g. "16:00"
  reason: { type: String, default: 'Unavailable' }
});

const ttFacultyConstraintSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, unique: true },
  facultyName: { type: String, required: true },
  unavailableSlots: [unavailableSlotSchema],
  maxHoursPerDay: { type: Number, default: 6 },
  maxHoursPerWeek: { type: Number, default: 24 }
}, { timestamps: true });

module.exports = mongoose.model('TtFacultyConstraint', ttFacultyConstraintSchema);
