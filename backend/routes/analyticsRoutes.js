const express = require('express');
const router = express.Router();
const { getStudentRiskReport, getTeacherInsights } = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/auth');

// Student Risk Report Endpoint
router.get('/student/:studentId/risk', verifyToken, getStudentRiskReport);

// Teacher Analytics Insights Endpoint
router.get('/teacher/:teacherId/insights', verifyToken, getTeacherInsights);

module.exports = router;
