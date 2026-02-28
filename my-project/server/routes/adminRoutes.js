const express = require('express');
const router = express.Router();
const { 
  getPendingStudents, 
  getApprovedStudents,
  approveStudent, 
  rejectStudent,
  getPendingTeachers,
  approveTeacher,
  getDashboardStats
} = require('../controllers/adminController');

// Student routes
router.get('/students/pending', getPendingStudents);
router.get('/students/approved', getApprovedStudents);
router.post('/students/:studentId/approve', approveStudent);
router.post('/students/:studentId/reject', rejectStudent);

// Teacher routes
router.get('/teachers/pending', getPendingTeachers);
router.post('/teachers/:teacherId/approve', approveTeacher);

// Dashboard
router.get('/dashboard-stats', getDashboardStats);

module.exports = router;