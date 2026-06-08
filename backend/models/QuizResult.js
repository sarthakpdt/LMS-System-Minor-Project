const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  quizId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz',    required: true },
  courseId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course',  required: true },
  answers: [{
    questionId:     mongoose.Schema.Types.ObjectId,
    selectedAnswer: String,
    isCorrect:      Boolean,
    marksAwarded:   Number
  }],
  plagiarismEvents: [{
    type: {
      type: String,
      enum: ['multiple_faces', 'no_face', 'phone_detected', 'tab_switch', 'face_away', 'camera_blocked'],
    },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    timestamp: { type: Date, default: Date.now },
  }],
  score:      { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  teacherReview: {
    action: {
      type: String,
      enum: ['none', 'warning', 'zero_marks', 'custom_marks'],
      default: 'none'
    },
    customMarks: { type: Number, min: 0 },
    note: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    reviewedAt: { type: Date },
  },
  timeTaken:  { type: Number },
  submittedAt:{ type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('QuizResult', quizResultSchema);
 