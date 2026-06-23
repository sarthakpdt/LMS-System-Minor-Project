const express = require('express');
const router = express.Router();
const { getTeacherInsights } = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/auth');

// Teacher Analytics Insights Endpoint
router.get('/teacher/:teacherId/insights', verifyToken, getTeacherInsights);

module.exports = router;
