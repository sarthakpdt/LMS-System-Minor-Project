const StudentBucket  = require('../models/StudentBucket');
const SubjectThreshold = require('../models/SubjectThreshold');
const Quiz           = require('../models/Quiz');
const QuizResult     = require('../models/QuizResult');
const Student        = require('../models/Student');
const Course         = require('../models/Course');

// ─── helpers ────────────────────────────────────────────────────────────────

const BUCKET_ORDER = ['Easy', 'Medium', 'Hard'];

function nextBucket(current) {
  const idx = BUCKET_ORDER.indexOf(current);
  return idx < BUCKET_ORDER.length - 1 ? BUCKET_ORDER[idx + 1] : null;
}

/** Ensure a StudentBucket document exists; return it */
async function getOrCreateBucket(studentId, courseId) {
  let bucket = await StudentBucket.findOne({ studentId, courseId });
  if (!bucket) {
    bucket = await StudentBucket.create({ studentId, courseId, bucket: 'Easy' });
  }
  return bucket;
}

// ─── Faculty: set / update threshold for a course ──────────────────────────

exports.setThreshold = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { teacherId, easyToMedium, mediumToHard } = req.body;

    const threshold = await SubjectThreshold.findOneAndUpdate(
      { courseId },
      { courseId, teacherId, easyToMedium, mediumToHard },
      { upsert: true, new: true }
    );
    res.json({ message: 'Threshold saved', threshold });
  } catch (err) {
    res.status(500).json({ message: 'Error saving threshold', error: err.message });
  }
};

exports.getThreshold = async (req, res) => {
  try {
    const threshold = await SubjectThreshold.findOne({ courseId: req.params.courseId });
    res.json(threshold || { easyToMedium: 70, mediumToHard: 85 });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching threshold', error: err.message });
  }
};

// ─── Get bucket for a student in a course ──────────────────────────────────

exports.getStudentBucket = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const bucket = await getOrCreateBucket(studentId, courseId);
    res.json(bucket);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bucket', error: err.message });
  }
};

// ─── Get ALL buckets for a student (across all enrolled courses) ────────────

exports.getAllBucketsForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).select('enrolledCourses');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const buckets = await StudentBucket.find({ studentId })
      .populate('courseId', 'courseName courseCode');

    // Also ensure a bucket exists for each enrolled course
    const existing = new Set(buckets.map(b => String(b.courseId._id || b.courseId)));
    const missing = student.enrolledCourses.filter(
      ec => !existing.has(String(ec.courseId))
    );
    for (const ec of missing) {
      await getOrCreateBucket(studentId, ec.courseId);
    }

    const allBuckets = await StudentBucket.find({ studentId })
      .populate('courseId', 'courseName courseCode');
    res.json(allBuckets);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching student buckets', error: err.message });
  }
};

// ─── Faculty: Get all student buckets for a course ─────────────────────────

exports.getBucketsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const buckets = await StudentBucket.find({ courseId })
      .populate('studentId', 'name email studentId');
    res.json(buckets);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching course buckets', error: err.message });
  }
};

// ─── Faculty: manually override a student's bucket ─────────────────────────

exports.updateStudentBucket = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const { bucket } = req.body;
    if (!['Easy', 'Medium', 'Hard'].includes(bucket)) {
      return res.status(400).json({ message: 'Invalid bucket value' });
    }
    const doc = await StudentBucket.findOneAndUpdate(
      { studentId, courseId },
      { bucket },
      { upsert: true, new: true }
    );
    res.json({ message: 'Bucket updated', doc });
  } catch (err) {
    res.status(500).json({ message: 'Error updating bucket', error: err.message });
  }
};

// ─── Auto-promotion: called after a quiz is submitted ─────────────────────
// Returns { promoted: bool, from, to } if a promotion happened

exports.checkAndPromote = async (studentId, courseId, quizId) => {
  try {
    const threshold = await SubjectThreshold.findOne({ courseId });
    if (!threshold) return { promoted: false }; // no threshold set → no auto-promotion

    const bucket = await getOrCreateBucket(studentId, courseId);
    const next = nextBucket(bucket.bucket);
    if (!next) return { promoted: false }; // already at Hard

    // Use the relevant threshold
    const requiredPct =
      bucket.bucket === 'Easy' ? threshold.easyToMedium :
      bucket.bucket === 'Medium' ? threshold.mediumToHard : null;

    if (requiredPct === null) return { promoted: false };

    // Get the latest quiz result for this quiz
    const result = await QuizResult.findOne({ studentId, quizId });
    if (!result) return { promoted: false };

    if (result.percentage >= requiredPct) {
      const from = bucket.bucket;
      bucket.bucket = next;
      bucket.promotionHistory.push({
        from,
        to: next,
        promotedAt: new Date(),
        triggeredByScore: result.percentage,
        quizId,
      });
      await bucket.save();
      return { promoted: true, from, to: next, score: result.percentage };
    }

    return { promoted: false };
  } catch (err) {
    console.error('checkAndPromote error:', err);
    return { promoted: false };
  }
};

// ─── Expose promotion check as HTTP endpoint (faculty manual trigger) ──────

exports.triggerPromotion = async (req, res) => {
  try {
    const { studentId, courseId, quizId } = req.body;
    const result = await exports.checkAndPromote(studentId, courseId, quizId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error triggering promotion', error: err.message });
  }
};

// ─── Faculty Dashboard: promotion overview for a course ───────────────────

exports.getPromotionOverview = async (req, res) => {
  try {
    const { courseId } = req.params;

    const buckets = await StudentBucket.find({ courseId })
      .populate('studentId', 'name email studentId');

    const overview = {
      easy:   buckets.filter(b => b.bucket === 'Easy'),
      medium: buckets.filter(b => b.bucket === 'Medium'),
      hard:   buckets.filter(b => b.bucket === 'Hard'),
      recentPromotions: buckets
        .filter(b => b.promotionHistory.length > 0)
        .flatMap(b =>
          b.promotionHistory.map(p => ({
            student: b.studentId,
            from: p.from,
            to: p.to,
            score: p.triggeredByScore,
            promotedAt: p.promotedAt,
          }))
        )
        .sort((a, b) => new Date(b.promotedAt) - new Date(a.promotedAt))
        .slice(0, 20),
    };

    res.json(overview);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching overview', error: err.message });
  }
};

// ─── Student Performance summary ──────────────────────────────────────────

exports.getStudentPerformanceSummary = async (req, res) => {
  try {
    const { studentId } = req.params;

    const buckets = await StudentBucket.find({ studentId })
      .populate('courseId', 'courseName courseCode');

    // Aggregate quiz results per course
    const results = await QuizResult.find({ studentId })
      .populate('quizId', 'title difficulty courseId totalMarks');

    const summary = await Promise.all(buckets.map(async (b) => {
      const courseResults = results.filter(
        r => r.quizId && String(r.quizId.courseId) === String(b.courseId._id)
      );
      const avg = courseResults.length
        ? courseResults.reduce((s, r) => s + r.percentage, 0) / courseResults.length
        : 0;

      const threshold = await SubjectThreshold.findOne({ courseId: b.courseId._id });

      return {
        course: b.courseId,
        bucket: b.bucket,
        promotionHistory: b.promotionHistory,
        quizCount: courseResults.length,
        averageScore: Math.round(avg * 100) / 100,
        scores: courseResults.map(r => ({
          quizTitle: r.quizId?.title,
          score: r.score,
          totalMarks: r.totalMarks,
          percentage: r.percentage,
          submittedAt: r.submittedAt,
        })),
        nextThreshold:
          b.bucket === 'Easy' ? threshold?.easyToMedium ?? 70 :
          b.bucket === 'Medium' ? threshold?.mediumToHard ?? 85 : null,
      };
    }));

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching performance summary', error: err.message });
  }
};
