const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText:  { type: String, required: true },
  type:          { type: String, enum: ['mcq', 'short', 'long'], default: 'short' },
  options:       [String],
  correctAnswer: { type: String, default: '' },
  marks:         { type: Number, default: 5 },
  difficulty:    { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  source:        { type: String, enum: ['manual', 'ai', 'uploaded'], default: 'manual' },
});

const answerSchema = new mongoose.Schema({
  questionId:    { type: mongoose.Schema.Types.ObjectId },
  studentAnswer: { type: String, default: '' },
  fileUrl:       { type: String, default: '' },
  isCorrect:     { type: Boolean, default: false },
  marksAwarded:  { type: Number, default: 0 },
  aiFeedback:    { type: String, default: '' },
});

const submissionSchema = new mongoose.Schema({
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, default: '' },
  courseId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  answers:     [answerSchema],
  totalScore:  { type: Number, default: 0 },
  totalMarks:  { type: Number, default: 0 },
  percentage:  { type: Number, default: 0 },
  grade:       { type: String, default: 'F' },
  status:      { type: String, enum: ['submitted', 'graded', 'reviewed'], default: 'submitted' },
  mode:        { type: String, enum: ['quiz', 'solve'], default: 'solve' },
  plagiarismFlagged: { type: Boolean, default: false },
  plagiarismScore:   { type: Number, default: 0 },
  overallFeedback:   { type: String, default: '' },
  strengths:         [String],
  improvementAreas:  [String],
  teacherComment:    { type: String, default: '' },
  teacherScore:      { type: Number, default: null },
  submittedAt:       { type: Date, default: Date.now },
}, { timestamps: true });

const assignmentSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  courseId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course',  required: true },
  teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  teacherName: { type: String, default: '' },
  questions:   [questionSchema],
  totalMarks:  { type: Number, default: 0 },
  dueDate:     { type: Date, required: true },
  easyCount:   { type: Number, default: 0 },
  mediumCount: { type: Number, default: 0 },
  hardCount:   { type: Number, default: 0 },
  isPublished:    { type: Boolean, default: false },
  targetBucket:   { type: String, enum: ['Easy', 'Medium', 'Hard', 'All'], default: 'All' },
  allowQuizMode:  { type: Boolean, default: true },
  allowSolveMode: { type: Boolean, default: true },
  creationMethod: {
    type: String,
    enum: ['manual', 'ai', 'upload', 'mixed'],
    default: 'manual',
  },
  submissions: [submissionSchema],
}, { timestamps: true });

// ── Pre-save: auto-compute totals ─────────────────────────────
assignmentSchema.pre('save', async function () {
  if (this.isModified('questions') || this.isNew) {
    this.totalMarks  = this.questions.reduce((s, q) => s + (q.marks || 0), 0);
    this.easyCount   = this.questions.filter(q => q.difficulty === 'easy').length;
    this.mediumCount = this.questions.filter(q => q.difficulty === 'medium').length;
    this.hardCount   = this.questions.filter(q => q.difficulty === 'hard').length;
  }
});

module.exports = mongoose.model('Assignment', assignmentSchema);