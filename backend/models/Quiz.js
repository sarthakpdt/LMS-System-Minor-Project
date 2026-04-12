const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'short'], default: 'mcq' },
  options: [String],
  correctAnswer: { type: String, required: true },
  marks: { type: Number, default: 1 },

  // ── NEW: Per-question difficulty level (drives star rating) ───────────────
  // Beginner = 1 star, Medium = 3 stars, Hard = 5 stars
  level: {
    type: String,
    enum: ['Beginner', 'Medium', 'Hard', null],
    default: null,
  },
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

  // ── Difficulty / Bucket targeting ─────────────────────────────────────────
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', null],
    default: null,
  },

  // ── NEW: Negative Marking ─────────────────────────────────────────────────
  negativeMarking: {
    enabled: { type: Boolean, default: false },
    marksPerQuestion: { type: Number, default: 0 },
  },
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
