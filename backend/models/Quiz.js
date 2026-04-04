const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'short'], default: 'mcq' },
  options: [String],
  correctAnswer: { type: String, required: true },
  marks: { type: Number, default: 1 }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  questions: [questionSchema],
  timeLimit: { type: Number, default: 30 },
  totalMarks: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  dueDate: { type: Date },

  // ── NEW: Difficulty / Bucket targeting ────────────────────────────────────
  // Which bucket is this quiz targeted at? If null → available to all buckets
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', null],
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
