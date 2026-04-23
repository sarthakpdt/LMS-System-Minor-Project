const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId:    { type: mongoose.Schema.Types.ObjectId },
  questionText:  { type: String, default: '' },
  studentAnswer: { type: String, default: '' },
  correctAnswer: { type: String, default: '' },
  marksAwarded:  { type: Number, default: 0 },
  maxMarks:      { type: Number, default: 0 },
  isCorrect:     { type: Boolean, default: false },
  aiFeedback:    { type: String, default: '' },
  fileUrl:       { type: String, default: '' },
});

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  courseId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName:  { type: String, default: '' },

  answers:     [answerSchema],
  mode:        { type: String, enum: ['quiz','solve'], default: 'solve' },

  totalScore:  { type: Number, default: 0 },
  totalMarks:  { type: Number, default: 0 },
  percentage:  { type: Number, default: 0 },
  grade:       { type: String, default: 'F' },

  overallFeedback:  { type: String, default: '' },
  improvementAreas: [String],
  strengths:        [String],

  plagiarismScore:   { type: Number, default: 0 },
  plagiarismFlagged: { type: Boolean, default: false },

  teacherComment: { type: String, default: '' },
  teacherScore:   { type: Number, default: null },
  reviewedAt:     { type: Date },

  status:      { type: String, enum: ['submitted','graded','reviewed'], default: 'submitted' },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('AssignmentSubmission', submissionSchema);