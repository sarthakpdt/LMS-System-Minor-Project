const express = require('express');
const router  = express.Router();
const {
  setThreshold,
  getThreshold,
  getStudentBucket,
  getAllBucketsForStudent,
  getBucketsForCourse,
  updateStudentBucket,
  triggerPromotion,
  getPromotionOverview,
  getStudentPerformanceSummary,
} = require('../controllers/bucketController');

// ── Threshold (Faculty) ────────────────────────────────────────────────────
router.post('/threshold/:courseId',  setThreshold);   // set/update threshold
router.get('/threshold/:courseId',   getThreshold);   // get threshold for a course

// ── Student Bucket ─────────────────────────────────────────────────────────
router.get('/student/:studentId/course/:courseId',  getStudentBucket);       // single course bucket
router.get('/student/:studentId',                    getAllBucketsForStudent); // all courses
router.put('/student/:studentId/course/:courseId',   updateStudentBucket);    // manual override

// ── Course-level (Faculty) ─────────────────────────────────────────────────
router.get('/course/:courseId',           getBucketsForCourse);    // all students in a course
router.get('/course/:courseId/overview',  getPromotionOverview);   // promotion overview

// ── Promotion ─────────────────────────────────────────────────────────────
router.post('/promote', triggerPromotion); // manual trigger

// ── Performance (Student) ─────────────────────────────────────────────────
router.get('/performance/:studentId', getStudentPerformanceSummary);

module.exports = router;
