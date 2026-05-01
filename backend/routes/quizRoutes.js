const express = require('express');
const router  = express.Router();
const {
  createQuiz, publishQuiz, getQuizzesByCourse,
  getQuizById, submitQuiz, getQuizAttempts, getStudentResult, reviewQuizAttempt,
  generateAIQuestions,
} = require('../controllers/quizController');

router.post('/generate-ai',              generateAIQuestions);   // NEW: AI question generation
router.post('/',                          createQuiz);            // Teacher: create
router.patch('/:id/publish',              publishQuiz);           // Teacher: publish
router.get('/course/:courseId',           getQuizzesByCourse);    // Quizzes for a course
router.get('/:id',                        getQuizById);           // Single quiz (safe)
router.post('/:id/submit',               submitQuiz);            // Student: submit
router.get('/:id/attempts',              getQuizAttempts);       // Teacher: all attempts
router.patch('/:id/attempts/:attemptId/review', reviewQuizAttempt); // Teacher: review action/marks
router.get('/:quizId/result/:studentId', getStudentResult);      // Student: own result

module.exports = router;
