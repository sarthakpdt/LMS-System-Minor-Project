const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const attendanceController = require('../controllers/attendanceController');

const MIN_REQUIRED_PERCENTAGE = 75;
const DEFAULT_FUTURE_CLASSES = 10;

const toRiskLevel = (percentage) => {
  if (percentage >= 75) return 'safe';
  if (percentage >= 65) return 'warning';
  return 'critical';
};

const calculateSafeLeavesRemaining = (presentCount, totalClasses, minimumPercentage = MIN_REQUIRED_PERCENTAGE) => {
  if (totalClasses === 0) return 0;
  const maximumAllowedTotal = Math.floor((presentCount * 100) / minimumPercentage);
  return Math.max(0, maximumAllowedTotal - totalClasses);
};

const calculateClassesNeededForTarget = (presentCount, totalClasses, targetPercentage = MIN_REQUIRED_PERCENTAGE) => {
  if (totalClasses === 0) return 0;
  const currentPercentage = (presentCount / totalClasses) * 100;
  if (currentPercentage >= targetPercentage) return 0;
  const numerator = (targetPercentage * totalClasses) - (100 * presentCount);
  const denominator = 100 - targetPercentage;
  return Math.max(0, Math.ceil(numerator / denominator));
};

const buildTrendData = (studentId, records) => {
  const chronological = [...records].sort((a, b) => a.date.localeCompare(b.date));
  let attended = 0;
  let total = 0;

  return chronological.map((record) => {
    const studentRecord = record.records.find(
      (entry) => entry.studentId && entry.studentId.toString() === studentId
    );
    if (studentRecord) {
      total += 1;
      if (studentRecord.status === 'present' || studentRecord.status === 'late') attended += 1;
    }
    const percentage = total > 0 ? Number(((attended / total) * 100).toFixed(2)) : 0;
    return { date: record.date, percentage };
  });
};

const calculatePredictedAttendance = (presentCount, totalClasses, futureClasses, trendData) => {
  if (totalClasses === 0) return 0;
  const currentPercentage = (presentCount / totalClasses) * 100;
  let trendDelta = 0;
  if (trendData.length >= 2) {
    const first = trendData[Math.max(0, trendData.length - 5)];
    const last = trendData[trendData.length - 1];
    trendDelta = last.percentage - first.percentage;
  }
  const projectedPresenceRate = Math.max(0.3, Math.min(1, (currentPercentage / 100) + (trendDelta / 1000)));
  const expectedFuturePresents = Math.round(futureClasses * projectedPresenceRate);
  const predicted = ((presentCount + expectedFuturePresents) / (totalClasses + futureClasses)) * 100;
  return Number(predicted.toFixed(2));
};

const SUBJECT_CODES = {
  'Machine Learning': 'CS1138',
  'Communication and Identity': 'CC1104',
  'Design and Analysis of Algorithms': 'CS1105',
  'Optimization for Computer Science': 'AS1113',
  'Data Structures': 'CS201',
  'Database Systems': 'CS301',
};

const getCourseCode = (subject) =>
  SUBJECT_CODES[subject] || subject.replace(/\s+/g, '').slice(0, 6).toUpperCase();

const buildSubjectsFromStats = (bySubject) =>
  Object.entries(bySubject).map(([subject, stats]) => {
    const effectivePresent = stats.present + stats.late;
    const attendancePercentage = stats.total > 0
      ? Number(((effectivePresent / stats.total) * 100).toFixed(2))
      : 0;
    return {
      subject,
      courseCode: getCourseCode(subject),
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      total: stats.total,
      attendancePercentage,
      predictedAttendance: calculatePredictedAttendance(effectivePresent, stats.total, 6, []),
      safeLeavesRemaining: calculateSafeLeavesRemaining(effectivePresent, stats.total),
      classesNeededFor75: calculateClassesNeededForTarget(effectivePresent, stats.total),
      riskLevel: toRiskLevel(attendancePercentage),
      activities: [{ type: 'LECTURE', percentage: Math.round(attendancePercentage), status: attendancePercentage >= 75 ? 'safe' : 'critical' }],
    };
  });

const getDemoAttendancePayload = () => {
  const subjects = [
    { subject: 'Machine Learning', courseCode: 'CS1138', present: 58, absent: 6, late: 0, total: 64, totalLectures: 64, attendancePercentage: 90.63, predictedAttendance: 91.2, safeLeavesRemaining: 4, classesNeededFor75: 0, riskLevel: 'safe', activities: [{ type: 'LECTURE', percentage: 91, status: 'safe' }] },
    { subject: 'Communication and Identity', courseCode: 'CC1104', present: 24, absent: 2, late: 0, total: 26, totalLectures: 26, attendancePercentage: 92.31, predictedAttendance: 92.8, safeLeavesRemaining: 2, classesNeededFor75: 0, riskLevel: 'safe', activities: [{ type: 'LECTURE', percentage: 92, status: 'safe' }] },
    { subject: 'Design and Analysis of Algorithms', courseCode: 'CS1105', present: 49, absent: 8, late: 0, total: 57, totalLectures: 57, attendancePercentage: 85.96, predictedAttendance: 86.5, safeLeavesRemaining: 2, classesNeededFor75: 0, riskLevel: 'safe', activities: [{ type: 'LECTURE', percentage: 86, status: 'safe' }] },
    { subject: 'Optimization for Computer Science', courseCode: 'AS1113', present: 34, absent: 5, late: 1, total: 40, totalLectures: 40, attendancePercentage: 87.5, predictedAttendance: 88.1, safeLeavesRemaining: 2, classesNeededFor75: 0, riskLevel: 'safe', activities: [{ type: 'LECTURE', percentage: 89, status: 'safe' }, { type: 'PRACTICAL', percentage: 92, status: 'safe' }] },
    { subject: 'Data Structures', courseCode: 'CS201', present: 28, absent: 10, late: 2, total: 40, totalLectures: 40, attendancePercentage: 75, predictedAttendance: 76.2, safeLeavesRemaining: 0, classesNeededFor75: 0, riskLevel: 'safe', activities: [{ type: 'LECTURE', percentage: 75, status: 'safe' }] },
    { subject: 'Database Systems', courseCode: 'CS301', present: 20, absent: 12, late: 1, total: 33, totalLectures: 33, attendancePercentage: 63.64, predictedAttendance: 66.8, safeLeavesRemaining: 0, classesNeededFor75: 5, riskLevel: 'critical', activities: [{ type: 'LECTURE', percentage: 64, status: 'critical' }] },
  ];

  const presentCount = subjects.reduce((s, x) => s + x.present, 0);
  const absentCount = subjects.reduce((s, x) => s + x.absent, 0);
  const lateCount = subjects.reduce((s, x) => s + x.late, 0);
  const totalClasses = subjects.reduce((s, x) => s + x.total, 0);
  const effectivePresent = presentCount + lateCount;
  const attendancePercentage = Number(((effectivePresent / totalClasses) * 100).toFixed(2));

  return {
    records: [
      { date: '2026-05-20', subject: 'Database Systems', status: 'absent', teacherName: 'Prof. Mehta' },
      { date: '2026-05-19', status: 'present', subject: 'Data Structures', teacherName: 'Dr. Sharma' },
      { date: '2026-05-18', status: 'present', subject: 'Machine Learning', teacherName: 'Dr. Roy' },
    ],
    stats: Object.fromEntries(subjects.map((s) => [s.subject, { present: s.present, absent: s.absent, late: s.late, total: s.total }])),
    subjects,
    analytics: {
      attendancePercentage,
      presentCount,
      absentCount,
      lateCount,
      totalClasses,
      predictedAttendance: calculatePredictedAttendance(effectivePresent, totalClasses, 10, []),
      safeLeavesRemaining: calculateSafeLeavesRemaining(effectivePresent, totalClasses),
      classesNeededFor75: calculateClassesNeededForTarget(effectivePresent, totalClasses),
      riskLevel: toRiskLevel(attendancePercentage),
      trend: [
        { date: 'Apr 01', percentage: 94 },
        { date: 'Apr 08', percentage: 92 },
        { date: 'Apr 15', percentage: 91 },
        { date: 'Apr 22', percentage: 90 },
        { date: 'Apr 29', percentage: 90 },
        { date: 'May 06', percentage: 89 },
        { date: 'May 13', percentage: 89 },
        { date: 'May 20', percentage: attendancePercentage },
      ],
    },
    isDemo: true,
  };
};

router.get('/students', attendanceController.getStudents);
router.post('/mark', attendanceController.submitAttendance);
router.get('/session', attendanceController.getSession);
router.get('/teacher/:teacherId', attendanceController.getTeacherRecords);
router.get('/teacher/:teacherId/analytics', attendanceController.getTeacherAnalytics);
router.get('/summary/:teacherId', attendanceController.getTeacherSummary);

// Phase 5 integration: Auto-fetch student list by branch, semester, and section
router.get('/students-by-section', async (req, res) => {
  try {
    const { branch, semester, section } = req.query;
    if (!branch || !semester || !section) {
      return res.status(400).json({ success: false, message: 'branch, semester, and section are required parameters' });
    }

    const Student = require('../models/Student');
    const filter = {
      approvalStatus: 'approved',
      semester: String(semester),
      section: String(section),
      $or: [
        { timetableBranch: branch },
        { department: branch }
      ]
    };

    const students = await Student.find(filter)
      .select('_id name email semester department studentId section')
      .lean();

    res.json({
      success: true,
      students: students.map(s => ({
        _id: s._id,
        name: s.name,
        email: s.email,
        studentId: s.studentId,
        department: s.department,
        semester: s.semester,
        section: s.section || null,
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;
    // Convert to ObjectId if necessary
    const mongoose = require('mongoose');
    const studentObjectId = mongoose.Types.ObjectId.isValid(studentId) ? new mongoose.Types.ObjectId(studentId) : studentId;
    console.log('Fetching attendance for studentId:', studentId, 'as ObjectId:', studentObjectId);

    const normalizedFutureClasses = Math.max(1, Number.parseInt(req.query.futureClasses, 10) || DEFAULT_FUTURE_CLASSES);

    const attendanceFilter = { 'records.studentId': studentObjectId };
    if (courseId) attendanceFilter.subject = courseId;

    const allRecords = await Attendance.find(attendanceFilter).sort({ date: -1 });

    const result = allRecords.map((a) => {
      const studentRecord = a.records.find((r) => r.studentId.toString() === studentObjectId.toString());
      return {
        date: a.date,
        subject: a.subject,
        status: studentRecord?.status || 'absent',
        teacherName: a.teacherName,
      };
    });

    const bySubject = {};
    result.forEach((r) => {
      if (!bySubject[r.subject]) bySubject[r.subject] = { present: 0, absent: 0, late: 0, total: 0 };
      bySubject[r.subject][r.status]++;
      bySubject[r.subject].total++;
    });

    const presentCount = result.filter((r) => r.status === 'present').length;
    const absentCount = result.filter((r) => r.status === 'absent').length;
    const lateCount = result.filter((r) => r.status === 'late').length;
    const totalClasses = result.length;
    const effectivePresentCount = presentCount + lateCount;

    if (totalClasses === 0) {
      const demo = getDemoAttendancePayload();
      return res.json({ success: true, ...demo });
    }

    const trend = buildTrendData(studentObjectId.toString(), allRecords);
    const subjects = buildSubjectsFromStats(bySubject);

    res.json({
      success: true,
      records: result,
      stats: bySubject,
      subjects,
      analytics: {
        attendancePercentage: Number(((effectivePresentCount / totalClasses) * 100).toFixed(2)),
        presentCount,
        absentCount,
        lateCount,
        totalClasses,
        predictedAttendance: calculatePredictedAttendance(
          effectivePresentCount,
          totalClasses,
          normalizedFutureClasses,
          trend
        ),
        safeLeavesRemaining: calculateSafeLeavesRemaining(effectivePresentCount, totalClasses),
        classesNeededFor75: calculateClassesNeededForTarget(effectivePresentCount, totalClasses),
        riskLevel: toRiskLevel((effectivePresentCount / totalClasses) * 100),
        trend,
      },
      isDemo: false,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
