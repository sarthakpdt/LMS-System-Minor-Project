const Student = require('../models/Student');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const QuizResult = require('../models/QuizResult');
const AssignmentSubmission = require('../models/AssignmentSubmission');

// ── Extensible Evaluation Components (Modular Design) ─────────────────────
// Add new components here to extend risk prediction without modifying main functions.
const riskComponents = [
  {
    name: 'attendance',
    weight: 0.30,
    getTarget: () => 75, // Target threshold percentage
    getValue: (metrics) => metrics.attendancePct,
    getWarningMessage: (val, target) => val < target ? `Attendance of ${val}% is below target of ${target}%` : null,
  },
  {
    name: 'quizzes',
    weight: 0.35,
    getTarget: () => 60,
    getValue: (metrics) => metrics.quizAvg,
    getWarningMessage: (val, target) => val < target ? `Quiz average of ${val}% is below target of ${target}%` : null,
  },
  {
    name: 'assignments',
    weight: 0.35,
    getTarget: () => 60,
    getValue: (metrics) => metrics.assignmentAvg,
    getWarningMessage: (val, target) => val < target ? `Assignment average of ${val}% is below target of ${target}%` : null,
  }
];

/**
 * Calculates raw metrics for a student in a specific course.
 */
async function getStudentMetricsForCourse(studentId, course) {
  // 1. Attendance %
  const subjectMatchers = [course.courseName, course.courseCode].filter(Boolean);
  const attendanceRecords = await Attendance.find({
    subject: { $in: subjectMatchers }
  }).lean();

  let presentCount = 0;
  let lateCount = 0;
  let totalSessions = 0;

  attendanceRecords.forEach(rec => {
    if (Array.isArray(rec.records)) {
      const entry = rec.records.find(r => String(r.studentId) === String(studentId));
      if (entry) {
        totalSessions++;
        if (entry.status === 'present') presentCount++;
        else if (entry.status === 'late') lateCount++;
      }
    }
  });

  const attendancePct = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 80;

  // 2. Quiz Average %
  const quizResults = await QuizResult.find({ studentId, courseId: course._id }).lean();
  let quizSum = 0;
  quizResults.forEach(qr => {
    quizSum += qr.percentage || 0;
  });
  const quizAvg = quizResults.length > 0 ? Math.round(quizSum / quizResults.length) : 80;

  // 3. Assignment Average %
  const submissions = await AssignmentSubmission.find({ studentId, courseId: course._id }).lean();
  let assignmentSum = 0;
  submissions.forEach(sub => {
    assignmentSum += sub.percentage || 0;
  });
  const assignmentAvg = submissions.length > 0 ? Math.round(assignmentSum / submissions.length) : 80;

  return {
    attendancePct,
    quizAvg,
    assignmentAvg
  };
}

/**
 * Calculates overall risk indicators based on student performance metrics.
 */
function evaluateRisk(metrics) {
  let performanceScore = 0; // Academic Health Score (100 - Risk Score)
  const areasNeedingAttention = [];

  // Compute performance score dynamically from components
  riskComponents.forEach(comp => {
    const val = comp.getValue(metrics);
    const target = comp.getTarget();
    performanceScore += val * comp.weight;

    const warning = comp.getWarningMessage(val, target);
    if (warning) {
      areasNeedingAttention.push({
        metric: comp.name,
        value: val,
        target,
        message: warning
      });
    }
  });

  performanceScore = Math.round(performanceScore);
  const riskScore = 100 - performanceScore;

  let riskLevel = 'Safe';
  if (riskScore > 40) riskLevel = 'Critical';
  else if (riskScore > 25) riskLevel = 'Warning';

  return {
    academicHealthScore: performanceScore,
    riskScore,
    riskLevel,
    areasNeedingAttention
  };
}

// ── GET /api/analytics/student/:studentId/risk ─────────────────────────────
exports.getStudentRiskReport = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const enrolled = student.enrolledCourses || [];
    if (enrolled.length === 0) {
      return res.json({
        success: true,
        summary: {
          academicHealthScore: 100,
          riskScore: 0,
          riskLevel: 'Safe',
          areasNeedingAttention: []
        },
        courses: []
      });
    }

    const courseReports = [];
    let totalHealth = 0;

    for (const ec of enrolled) {
      const course = await Course.findById(ec.courseId).lean();
      if (!course) continue;

      const metrics = await getStudentMetricsForCourse(studentId, course);
      const riskEvaluation = evaluateRisk(metrics);

      totalHealth += riskEvaluation.academicHealthScore;

      courseReports.push({
        courseId: course._id,
        courseName: course.courseName,
        courseCode: course.courseCode,
        metrics,
        ...riskEvaluation
      });
    }

    const avgHealth = Math.round(totalHealth / courseReports.length);
    const avgRisk = 100 - avgHealth;

    let avgRiskLevel = 'Safe';
    if (avgRisk > 40) avgRiskLevel = 'Critical';
    else if (avgRisk > 25) avgRiskLevel = 'Warning';

    // Consolidate areas needing attention across all courses
    const allAreasNeedingAttention = [];
    courseReports.forEach(cr => {
      cr.areasNeedingAttention.forEach(a => {
        allAreasNeedingAttention.push({
          courseName: cr.courseName,
          courseCode: cr.courseCode,
          ...a
        });
      });
    });

    res.json({
      success: true,
      summary: {
        academicHealthScore: avgHealth,
        riskScore: avgRisk,
        riskLevel: avgRiskLevel,
        areasNeedingAttention: allAreasNeedingAttention
      },
      courses: courseReports
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/analytics/teacher/:teacherId/insights ──────────────────────────
exports.getTeacherInsights = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { courseId } = req.query;

    let coursesQuery = { teacher: teacherId };
    if (courseId) {
      coursesQuery = { _id: courseId, teacher: teacherId };
    }

    const courses = await Course.find(coursesQuery).lean();
    if (courses.length === 0) {
      return res.json({
        success: true,
        totalStudents: 0,
        safeCount: 0,
        warningCount: 0,
        criticalCount: 0,
        riskDistribution: [],
        attendanceVsPerformance: [],
        criticalStudents: [],
        students: []
      });
    }

    const uniqueStudentIds = new Set();
    const studentsReport = [];

    // Map to keep track of unique student aggregates
    const studentAggregates = new Map();

    for (const course of courses) {
      const enrolledIds = course.enrolledStudents || [];
      for (const sid of enrolledIds) {
        uniqueStudentIds.add(String(sid));

        const student = await Student.findById(sid).select('name email studentId').lean();
        if (!student) continue;

        const metrics = await getStudentMetricsForCourse(sid, course);
        const riskEvaluation = evaluateRisk(metrics);

        const studentObj = {
          id: student._id,
          studentId: student.studentId || '',
          name: student.name,
          email: student.email,
          courseName: course.courseName,
          courseCode: course.courseCode,
          metrics,
          ...riskEvaluation
        };

        studentsReport.push(studentObj);

        // Keep running overall average for unique student
        const sidStr = String(sid);
        if (!studentAggregates.has(sidStr)) {
          studentAggregates.set(sidStr, {
            id: student._id,
            name: student.name,
            studentId: student.studentId || '',
            email: student.email,
            coursesCount: 0,
            totalHealth: 0,
            totalAttendance: 0,
            totalQuiz: 0,
            totalAssignment: 0
          });
        }
        const agg = studentAggregates.get(sidStr);
        agg.coursesCount++;
        agg.totalHealth += riskEvaluation.academicHealthScore;
        agg.totalAttendance += metrics.attendancePct;
        agg.totalQuiz += metrics.quizAvg;
        agg.totalAssignment += metrics.assignmentAvg;
      }
    }

    // Build the consolidated metrics for the scatter chart
    const uniqueStudents = [];
    let safeCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    const criticalStudents = [];

    studentAggregates.forEach((agg) => {
      const avgHealth = Math.round(agg.totalHealth / agg.coursesCount);
      const avgRisk = 100 - avgHealth;
      const avgAttendance = Math.round(agg.totalAttendance / agg.coursesCount);
      const avgQuiz = Math.round(agg.totalQuiz / agg.coursesCount);
      const avgAssignment = Math.round(agg.totalAssignment / agg.coursesCount);
      const avgPerformance = Math.round((avgQuiz + avgAssignment) / 2);

      let riskLevel = 'Safe';
      if (avgRisk > 40) {
        riskLevel = 'Critical';
        criticalCount++;
      } else if (avgRisk > 25) {
        riskLevel = 'Warning';
        warningCount++;
      } else {
        safeCount++;
      }

      const formattedStudent = {
        id: agg.id,
        studentId: agg.studentId,
        name: agg.name,
        email: agg.email,
        academicHealthScore: avgHealth,
        riskScore: avgRisk,
        riskLevel,
        attendancePct: avgAttendance,
        performanceScore: avgPerformance, // quiz + assignment avg
        quizAvg: avgQuiz,
        assignmentAvg: avgAssignment
      };

      uniqueStudents.push(formattedStudent);

      if (riskLevel === 'Critical') {
        criticalStudents.push(formattedStudent);
      }
    });

    const riskDistribution = [
      { name: 'Safe', value: safeCount, fill: '#10B981' },
      { name: 'Warning', value: warningCount, fill: '#F59E0B' },
      { name: 'Critical', value: criticalCount, fill: '#EF4444' }
    ];

    const scatterData = uniqueStudents.map(s => ({
      name: s.name,
      attendance: s.attendancePct,
      performance: s.performanceScore,
      riskLevel: s.riskLevel
    }));

    res.json({
      success: true,
      totalStudents: uniqueStudentIds.size,
      safeCount,
      warningCount,
      criticalCount,
      riskDistribution,
      attendanceVsPerformance: scatterData,
      criticalStudents,
      students: uniqueStudents
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
