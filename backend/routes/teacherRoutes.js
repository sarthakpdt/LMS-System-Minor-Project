const express    = require('express');
const router     = express.Router();
const Teacher    = require('../models/Teacher');
const Course     = require('../models/Course');
const Student    = require('../models/Student');
const Attendance = require('../models/Attendance');
const QuizResult = require('../models/QuizResult');
const { verifyToken } = require('../middleware/auth');

// ── GET /api/teachers/me ──────────────────────────────────────────────────
// Returns the logged-in teacher's full profile including assignedCourses[]
router.get('/me', verifyToken, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id).lean();
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.json({ success: true, data: teacher });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/teachers/me/courses ──────────────────────────────────────────
// Returns all courses for the logged-in teacher.
// Uses BOTH Teacher.assignedCourses[] AND Course.teacher field as sources.
// This covers all cases: courses assigned via admin panel (which sets Course.teacher)
// AND courses that only appear in Teacher.assignedCourses[].
router.get('/me/courses', verifyToken, async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Source 1: courses where Course.teacher === this teacher
    const byTeacherField = await Course.find({ teacher: teacherId })
      .select('_id courseCode courseName department semester isActive enrolledStudents')
      .lean();

    // Source 2: courses listed in Teacher.assignedCourses[]
    const teacher = await Teacher.findById(teacherId).lean();
    let merged = [...byTeacherField];

    if (teacher && Array.isArray(teacher.assignedCourses) && teacher.assignedCourses.length > 0) {
      const existingIds = new Set(byTeacherField.map(c => String(c._id)));

      // Extract valid courseIds from assignedCourses
      const extraIds = teacher.assignedCourses
        .map(ac => ac.courseId)
        .filter(id => id && !existingIds.has(String(id)));

      if (extraIds.length > 0) {
        const extra = await Course.find({ _id: { $in: extraIds } })
          .select('_id courseCode courseName department semester isActive enrolledStudents')
          .lean();
        merged = [...merged, ...extra];
      }
    }

    // Attach studentCount to each course
    const result = merged.map(c => ({
      ...c,
      studentCount: Array.isArray(c.enrolledStudents) ? c.enrolledStudents.length : 0,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('GET /api/teachers/me/courses error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Shared helper: build full marks data for a course ─────────────────────
// Fetches enrolled students from Course.enrolledStudents,
// then enriches each student with quiz scores, attendance %, and any
// existing marks stored in Student.courses[] (midterm/final/assignments).
async function buildCourseMarks(courseId) {
  const mongoose = require('mongoose');

  // Validate courseId
  if (!mongoose.Types.ObjectId.isValid(courseId)) return null;

  const course = await Course.findById(courseId)
    .populate('enrolledStudents', 'name email studentId department semester level courses enrolledCourses')
    .lean();

  if (!course) return null;

  const enrolledStudents = course.enrolledStudents || [];

  if (enrolledStudents.length === 0) {
    return { students: [], course };
  }

  const studentIds = enrolledStudents.map(s => s._id);
  const courseIdStr = String(courseId);

  // ── Quiz results for this course ─────────────────────────────────────────
  const quizResults = await QuizResult.find({
    courseId,
    studentId: { $in: studentIds },
  }).lean();

  // Map: studentId -> [percentage scores]
  const quizMap = {};
  quizResults.forEach(qr => {
    const sid = String(qr.studentId);
    if (!quizMap[sid]) quizMap[sid] = [];
    quizMap[sid].push(typeof qr.percentage === 'number' ? qr.percentage : 0);
  });

  // ── Attendance records matched by course name or code ─────────────────────
  // Attendance.subject stores the subject name string (e.g. "DCS" or "Data Structures")
  const subjectMatchers = [course.courseName, course.courseCode].filter(Boolean);
  const attendanceRecords = await Attendance.find({
    subject: { $in: subjectMatchers },
  }).lean();

  // Map: studentId -> { present, total }
  const attMap = {};
  attendanceRecords.forEach(rec => {
    if (!Array.isArray(rec.records)) return;
    rec.records.forEach(r => {
      const sid = String(r.studentId);
      if (!attMap[sid]) attMap[sid] = { present: 0, total: 0 };
      attMap[sid].total++;
      if (r.status === 'present') attMap[sid].present++;
    });
  });

  // ── Build per-student result rows ─────────────────────────────────────────
  const studentsWithMarks = enrolledStudents.map(stu => {
    const sid = String(stu._id);

    // Quiz average
    const quizScores = quizMap[sid] || [];
    const quizAvg = quizScores.length > 0
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0;

    // Attendance %
    const att = attMap[sid];
    const attendance = att && att.total > 0
      ? Math.round((att.present / att.total) * 100)
      : 0;

    // Marks from Student.courses[] (legacy/manual entry field)
    // Match by courseId OR courseCode
    const legacyCourse = (stu.courses || []).find(c =>
      String(c.courseId) === courseIdStr ||
      (course.courseCode && c.courseCode === course.courseCode)
    );
    const midterm     = Number(legacyCourse?.midterm)     || 0;
    const final       = Number(legacyCourse?.final)       || 0;
    const assignments = Number(legacyCourse?.assignments) || 0;

    // Compute weighted total
    // If manual marks exist: 30% midterm + 40% final + 15% assignments + 15% quiz
    // Else if quiz data: use quiz avg as proxy
    let total = 0;
    if (midterm > 0 || final > 0 || assignments > 0) {
      total = Math.round(midterm * 0.30 + final * 0.40 + assignments * 0.15 + quizAvg * 0.15);
    } else if (quizAvg > 0) {
      total = quizAvg;
    }

    // Letter grade
    let grade = 'F';
    if      (total >= 90) grade = 'A+';
    else if (total >= 80) grade = 'A';
    else if (total >= 70) grade = 'B+';
    else if (total >= 60) grade = 'B';
    else if (total >= 50) grade = 'C';
    else if (total >= 40) grade = 'D';

    return {
      id:           stu._id,
      name:         stu.name || '',
      email:        stu.email || '',
      studentId:    stu.studentId || '',
      avatar:       stu.name
        ? stu.name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?',
      level:        stu.level || 'Beginner',
      midterm,
      final,
      assignments,
      quizAvg,
      total,
      grade,
      attendance,
      trend:        total >= 60 ? 'up' : 'down',
    };
  });

  return {
    students: studentsWithMarks,
    course: {
      _id:        course._id,
      courseName: course.courseName,
      courseCode: course.courseCode,
      department: course.department,
      semester:   course.semester,
    },
  };
}

// ── GET /api/teachers/course/:courseId/marks ──────────────────────────────
// Fetch marks for a specific course (teacher's own subjects)
router.get('/course/:courseId/marks', verifyToken, async (req, res) => {
  try {
    const result = await buildCourseMarks(req.params.courseId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Course not found or invalid ID' });
    }
    res.json({ success: true, data: result.students, course: result.course });
  } catch (err) {
    console.error('GET /course/:courseId/marks error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/teachers/all-courses/marks?courseId=xxx ─────────────────────
// Same as above but for the "All Subjects (View Only)" mode
router.get('/all-courses/marks', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.query;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'courseId query parameter is required' });
    }
    const result = await buildCourseMarks(courseId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Course not found or invalid ID' });
    }
    res.json({ success: true, data: result.students, course: result.course });
  } catch (err) {
    console.error('GET /all-courses/marks error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/teachers/search?q=name ──────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const teachers = await Teacher.find({
      isActive: true,
      $or: [
        { name:  { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .select('_id name email department employeeId approvalStatus')
      .limit(20)
      .lean();
    res.json({ success: true, data: teachers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
