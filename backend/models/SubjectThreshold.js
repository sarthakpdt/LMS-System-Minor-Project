const mongoose = require('mongoose');

// Faculty sets promotion thresholds per course (subject)
// e.g. "in CS101, a student moves Easy→Medium at 70%, Medium→Hard at 85%"
const subjectThresholdSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    unique: true,      // one threshold config per course
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  // Score percentage required to move Easy → Medium
  easyToMedium: {
    type: Number,
    default: 70,
    min: 0,
    max: 100,
  },
  // Score percentage required to move Medium → Hard
  mediumToHard: {
    type: Number,
    default: 85,
    min: 0,
    max: 100,
  },
}, { timestamps: true });

module.exports = mongoose.model('SubjectThreshold', subjectThresholdSchema);
