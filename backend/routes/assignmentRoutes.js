const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/assignmentController');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// ── Multer for submission file uploads ───────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const submitUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `sub_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`)
  }),
  limits: { fileSize: 20 * 1024 * 1024 }
}).any();

// Fixed-path routes FIRST (prevents /:id shadowing)
router.post('/generate-ai',                ctrl.generateWithAI);
router.post('/extract-pdf',                ctrl.extractFromPdf);
router.post('/gemini',                     ctrl.callGeminiDirect);  // ← for StudentReviewSheet AI tips
router.patch('/submissions/:subId/review', ctrl.teacherReview);
router.get('/course/:courseId',            ctrl.getByCourse);

// Collection
router.post('/', ctrl.createAssignment);

// /:id routes LAST
router.get('/:id',                         ctrl.getById);
router.delete('/:id',                      ctrl.deleteAssignment);
router.patch('/:id/publish',               ctrl.publishAssignment);
router.post('/:id/submit',                 (req, res, next) => submitUpload(req, res, () => next()), ctrl.submit);
router.get('/:id/submissions',             ctrl.getSubmissions);
router.get('/:id/submission/:studentId',   ctrl.getStudentSubmission);

module.exports = router;