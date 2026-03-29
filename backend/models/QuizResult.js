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
  score:      { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  timeTaken:  { type: Number },
  submittedAt:{ type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('QuizResult', quizResultSchema);
 