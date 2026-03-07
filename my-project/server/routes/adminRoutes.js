const express = require('express');
const router = express.Router();
const {
  getPendingStudents,
  getApprovedStudents,
  approveStudent,
  rejectStudent,
  getPendingTeachers,
  approveTeacher,
  getTeacherById,
  getStudentById,
  getAllCourses,
  createCourse,
  enrollStudentsByCriteria,
  getCourseStudents,
  getApprovedTeachers,
  assignTeacherToCourse,
  getDashboardStats,
} = require('../controllers/adminController');

// ── Student routes ─────────────────────────────────────────────────────────────
router.get('/students/pending', getPendingStudents);
router.get('/students/approved', getApprovedStudents);
router.get('/students/:studentId', getStudentById);
router.post('/students/:studentId/approve', approveStudent);
router.post('/students/:studentId/reject', rejectStudent);

// ── Teacher routes ─────────────────────────────────────────────────────────────
router.get('/teachers/pending', getPendingTeachers);
router.get('/teachers/approved', getApprovedTeachers);
router.get('/teachers/:teacherId', getTeacherById);          // fixes 404
router.post('/teachers/:teacherId/approve', approveTeacher);

// ── Course routes ──────────────────────────────────────────────────────────────
router.get('/courses', getAllCourses);
router.post('/courses', createCourse);
router.get('/courses/:courseId/students', getCourseStudents);
router.post('/courses/:courseId/enroll', enrollStudentsByCriteria);
router.patch('/courses/:courseId/assign-teacher', assignTeacherToCourse);

// ── Dashboard ──────────────────────────────────────────────────────────────────
router.get('/dashboard-stats', getDashboardStats);

module.exports = router;