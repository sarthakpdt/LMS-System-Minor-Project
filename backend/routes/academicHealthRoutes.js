const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { getStudentAcademicHealth } = require('../controllers/academicHealthController');
const { verifyToken } = require('../middleware/auth');

const validateStudentId = (req, res, next) => {
  const { studentId } = req.params;
  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid student ID is required',
    });
  }
  next();
};

router.get('/student/:studentId', verifyToken, validateStudentId, getStudentAcademicHealth);

module.exports = router;
