const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const SEMESTER_SUBJECTS = require('../data/semesterSubjects');

// GET subjects for a semester
router.get('/subjects/semester/:sem', (req, res) => {
  const sem = parseInt(req.params.sem);
  const subjects = SEMESTER_SUBJECTS[sem] || [];
  res.json({ semester: sem, subjects });
});

// GET all courses for a semester
router.get('/semester/:sem', async (req, res) => {
  try {
    const courses = await Course.find({ semester: req.params.sem })
      .populate('enrolledStudents', 'name email studentId semester'); // ✅ added
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('enrolledStudents', 'name email studentId semester'); // ✅ added
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create a course
router.post('/', async (req, res) => {
  try {
    const course = await Course.create({
      ...req.body,
      instructor: req.body.instructorId,
      enrolledStudents: []
    });
    res.json({ success: true, course });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST enroll a student
router.post('/:courseId/enroll', async (req, res) => {
  try {
    const { studentId } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.courseId,
      { $addToSet: { enrolledStudents: studentId } },
      { new: true }
    ).populate('enrolledStudents', 'name email studentId semester'); // ✅ added
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST auto-enroll whole semester
router.post('/:courseId/enroll-semester', async (req, res) => {
  try {
    const { semester } = req.body;
    const User = require('../models/User');
    const students = await User.find({ role: 'student', semester, approvalStatus: 'approved' });
    const studentIds = students.map(s => s._id);
    const course = await Course.findByIdAndUpdate(
      req.params.courseId,
      { $addToSet: { enrolledStudents: { $each: studentIds } } },
      { new: true }
    ).populate('enrolledStudents', 'name email studentId semester'); // ✅ added
    res.json({ success: true, enrolled: students.length, course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
