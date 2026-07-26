const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();
const {
  getPendingStudents,
  getApprovedStudents,
  approveStudent,
  rejectStudent,
  getPendingTeachers,
  approveTeacher,
  rejectTeacher,
  getTeacherById,
  getStudentById,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudentsByCriteria,
  getCourseStudents,
  getApprovedTeachers,
  assignTeacherToCourse,
  getDashboardStats,
} = require('../controllers/adminController');

// ── Student routes ─────────────────────────────────────────────────────────────
router.post('/students/assign-section', protect, require('../controllers/adminController').assignSection);
router.post('/students/bulk-assign-section', protect, require('../controllers/adminController').bulkAssignSection);
router.post('/students/bulk-distribute', protect, require('../controllers/adminController').bulkDistribute);
router.post('/students/bulk-update-semester', protect, require('../controllers/adminController').bulkUpdateSemester);
router.post('/students/bulk-promote', protect, require('../controllers/adminController').bulkPromote);
router.get('/students/pending', getPendingStudents);
router.get('/students/approved', getApprovedStudents);
router.get('/students/:studentId', getStudentById);
router.post('/students/:studentId/approve', approveStudent);
router.post('/students/:studentId/reject', rejectStudent);

// ── Teacher routes ─────────────────────────────────────────────────────────────
router.get('/teachers/pending', getPendingTeachers);
router.get('/teachers/approved', getApprovedTeachers);
router.get('/teachers/:teacherId', getTeacherById);
router.post('/teachers/:teacherId/approve', approveTeacher);
router.post('/teachers/:teacherId/reject', rejectTeacher);

// ── Course routes ──────────────────────────────────────────────────────────────
router.get('/courses', getAllCourses);
router.post('/courses', createCourse);
router.put('/courses/:courseId', updateCourse);
router.delete('/courses/:courseId', deleteCourse);
router.get('/courses/:courseId/students', getCourseStudents);
router.post('/courses/:courseId/enroll', enrollStudentsByCriteria);
router.patch('/courses/:courseId/assign-teacher', assignTeacherToCourse);

// ── Dashboard ──────────────────────────────────────────────────────────────────
router.get('/dashboard-stats', getDashboardStats);

module.exports = router;