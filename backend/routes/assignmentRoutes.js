const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const ctrl    = require('../controllers/assignmentController');

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  }
});

const submitUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB total
});

// Fixed-path routes FIRST
router.post('/generate-ai',                ctrl.generateWithAI);
router.post('/extract-pdf',  pdfUpload.single('pdf'), ctrl.extractFromPdf);
router.post('/gemini',                     ctrl.geminiProxy);
router.post('/ai-performance',             ctrl.aiPerformance);
router.post('/generate-variations',        ctrl.generateVariations);
router.patch('/submissions/:subId/review', ctrl.teacherReview);
router.get('/course/:courseId',            ctrl.getByCourse);

// Collection
router.post('/', ctrl.createAssignment);

// /:id routes LAST
router.get('/:id',                         ctrl.getById);
router.delete('/:id',                      ctrl.deleteAssignment);
router.patch('/:id',                       ctrl.updateAssignment);
router.patch('/:id/publish',               ctrl.publishAssignment);
router.post('/:id/submit',                 submitUpload.any(), ctrl.submit);
router.get('/:id/submissions',             ctrl.getSubmissions);
router.get('/:id/submission/:studentId',   ctrl.getStudentSubmission);

module.exports = router;