const mongoose = require('mongoose');

// Tracks which difficulty bucket a student belongs to per subject (course)
const studentBucketSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  // Easy | Medium | Hard
  bucket: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy',
  },
  // History of promotions for this student in this course
  promotionHistory: [
    {
      from: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
      to:   { type: String, enum: ['Easy', 'Medium', 'Hard'] },
      promotedAt: { type: Date, default: Date.now },
      triggeredByScore: Number,   // the score % that triggered the promotion
      quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    }
  ],
}, { timestamps: true });

// Compound unique index — one bucket record per student per course
studentBucketSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('StudentBucket', studentBucketSchema);
