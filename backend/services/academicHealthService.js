const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const QuizResult = require('../models/QuizResult');
const StudentBucket = require('../models/StudentBucket');
const {
  MIN_REQUIRED_PERCENTAGE,
  DEFAULT_FUTURE_CLASSES,
  toRiskLevel,
  calculateSafeLeavesRemaining,
  calculateClassesNeededForTarget,
  buildTrendData,
  calculatePredictedAttendance,
  buildSubjectsFromStats,
} = require('../utils/attendanceAnalytics');

const HEALTH_LEVELS = [
  { min: 90, label: 'Excellent' },
  { min: 75, label: 'Good' },
  { min: 60, label: 'Moderate' },
  { min: 40, label: 'Warning' },
  { min: 0, label: 'Critical' },
];

const getHealthLevel = (score) => {
  for (const level of HEALTH_LEVELS) {
    if (score >= level.min) return level.label;
  }
  return 'Critical';
};

const severityFromScore = (score, thresholds = { low: 70, medium: 50 }) => {
  if (score >= thresholds.low) return 'Low';
  if (score >= thresholds.medium) return 'Medium';
  return 'High';
};

const percentageToGpa = (percentage) => {
  if (percentage >= 90) return 4.0;
  if (percentage >= 80) return 3.5;
  if (percentage >= 70) return 3.0;
  if (percentage >= 60) return 2.5;
  if (percentage >= 50) return 2.0;
  return 1.5;
};

const bucketToProgressScore = (bucket) => {
  if (bucket === 'Hard') return 100;
  if (bucket === 'Medium') return 70;
  return 40;
};

const groupByWeek = (items, dateField, valueField) => {
  const weeks = {};
  items.forEach((item) => {
    const date = new Date(item[dateField]);
    if (Number.isNaN(date.getTime())) return;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    if (!weeks[key]) weeks[key] = { values: [], label: `W${Object.keys(weeks).length + 1}` };
    weeks[key].values.push(item[valueField] ?? 0);
  });
  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, data], idx) => ({
      week: `W${idx + 1}`,
      score: data.values.length
        ? Number((data.values.reduce((s, v) => s + v, 0) / data.values.length).toFixed(1))
        : 0,
    }));
};

async function fetchAttendanceData(studentId) {
  const attendanceFilter = { 'records.studentId': studentId };
  const allRecords = await Attendance.find(attendanceFilter).sort({ date: -1 });

  const result = allRecords.map((a) => {
    const studentRecord = a.records.find((r) => r.studentId.toString() === studentId);
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
    return {
      attendancePercentage: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      totalClasses: 0,
      requiredPercentage: MIN_REQUIRED_PERCENTAGE,
      predictedAttendance: 0,
      safeLeavesRemaining: 0,
      classesNeededFor75: 0,
      riskLevel: 'critical',
      trend: [],
      subjects: [],
      isDemo: false,
      hasData: false,
    };
  }

  const trend = buildTrendData(studentId, allRecords);
  const subjects = buildSubjectsFromStats(bySubject);
  const attendancePercentage = Number(((effectivePresentCount / totalClasses) * 100).toFixed(2));

  return {
    attendancePercentage,
    presentCount,
    absentCount,
    lateCount,
    totalClasses,
    requiredPercentage: MIN_REQUIRED_PERCENTAGE,
    predictedAttendance: calculatePredictedAttendance(
      effectivePresentCount,
      totalClasses,
      DEFAULT_FUTURE_CLASSES,
      trend
    ),
    safeLeavesRemaining: calculateSafeLeavesRemaining(effectivePresentCount, totalClasses),
    classesNeededFor75: calculateClassesNeededForTarget(effectivePresentCount, totalClasses),
    riskLevel: toRiskLevel(attendancePercentage),
    trend,
    subjects,
    isDemo: false,
    hasData: true,
  };
}

async function fetchAssignmentData(studentId, enrolledCourseIds) {
  if (!enrolledCourseIds.length) {
    return {
      total: 0,
      submitted: 0,
      pending: 0,
      overdue: 0,
      averageScore: 0,
      completionRate: 0,
      pendingItems: [],
      trend: [],
    };
  }

  const assignments = await Assignment.find({
    courseId: { $in: enrolledCourseIds },
    isPublished: true,
  }).select('_id title courseId dueDate totalMarks');

  const submissions = await AssignmentSubmission.find({
    studentId,
    assignmentId: { $in: assignments.map((a) => a._id) },
  }).select('assignmentId percentage submittedAt status');

  const submissionMap = new Map();
  submissions.forEach((s) => {
    const existing = submissionMap.get(String(s.assignmentId));
    if (!existing || new Date(s.submittedAt) > new Date(existing.submittedAt)) {
      submissionMap.set(String(s.assignmentId), s);
    }
  });

  const now = new Date();
  const pendingItems = [];
  let submitted = 0;
  let overdue = 0;
  const scores = [];

  assignments.forEach((a) => {
    const sub = submissionMap.get(String(a._id));
    if (sub) {
      submitted += 1;
      if (sub.percentage != null) scores.push(sub.percentage);
    } else {
      const due = a.dueDate ? new Date(a.dueDate) : null;
      if (due && due < now) overdue += 1;
      pendingItems.push({
        assignmentId: a._id,
        title: a.title,
        courseId: a.courseId,
        dueDate: a.dueDate,
        isOverdue: due ? due < now : false,
      });
    }
  });

  const total = assignments.length;
  const pending = total - submitted;
  const averageScore = scores.length
    ? Number((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(2))
    : 0;
  const completionRate = total > 0 ? Number(((submitted / total) * 100).toFixed(2)) : 0;

  const trend = groupByWeek(
    submissions.map((s) => ({ submittedAt: s.submittedAt, percentage: s.percentage ?? 0 })),
    'submittedAt',
    'percentage'
  );

  return {
    total,
    submitted,
    pending,
    overdue,
    averageScore,
    completionRate,
    pendingItems: pendingItems.slice(0, 10),
    trend,
  };
}

async function fetchQuizData(studentId) {
  const results = await QuizResult.find({ studentId })
    .populate('quizId', 'title difficulty courseId totalMarks')
    .sort({ submittedAt: -1 });

  const percentages = results.map((r) => r.percentage ?? 0);
  const averageScore = percentages.length
    ? Number((percentages.reduce((s, v) => s + v, 0) / percentages.length).toFixed(2))
    : 0;

  const trend = groupByWeek(
    results.map((r) => ({ submittedAt: r.submittedAt, percentage: r.percentage ?? 0 })),
    'submittedAt',
    'percentage'
  );

  const recentLowScores = results
    .filter((r) => (r.percentage ?? 0) < 60)
    .slice(0, 5)
    .map((r) => ({
      quizTitle: r.quizId?.title || 'Quiz',
      percentage: r.percentage,
      submittedAt: r.submittedAt,
    }));

  return {
    totalAttempts: results.length,
    averageScore,
    recentLowScores,
    trend,
    results: results.map((r) => ({
      quizTitle: r.quizId?.title,
      percentage: r.percentage,
      submittedAt: r.submittedAt,
      courseId: r.courseId,
    })),
  };
}

async function fetchBucketData(studentId) {
  const buckets = await StudentBucket.find({ studentId })
    .populate('courseId', 'courseName courseCode');

  const progressScore = buckets.length
    ? buckets.reduce((s, b) => s + bucketToProgressScore(b.bucket), 0) / buckets.length
    : 0;

  return { buckets, progressScore: Number(progressScore.toFixed(2)) };
}

function buildSubjectStrengths(attendanceSubjects, bucketData, quizResults, studentCourses) {
  const subjectMap = new Map();

  const ensureSubject = (name, courseCode) => {
    const key = name || courseCode || 'Unknown';
    if (!subjectMap.has(key)) {
      subjectMap.set(key, {
        name: key,
        courseCode: courseCode || '',
        scores: [],
      });
    }
    return subjectMap.get(key);
  };

  attendanceSubjects.forEach((s) => {
    const entry = ensureSubject(s.subject, s.courseCode);
    entry.scores.push(s.attendancePercentage);
  });

  bucketData.buckets.forEach((b) => {
    const name = b.courseId?.courseName || 'Unknown';
    const entry = ensureSubject(name, b.courseId?.courseCode);
    const quizAvg = quizResults.results
      .filter((r) => String(r.courseId) === String(b.courseId?._id))
      .map((r) => r.percentage ?? 0);
    if (quizAvg.length) {
      entry.scores.push(quizAvg.reduce((s, v) => s + v, 0) / quizAvg.length);
    }
    entry.scores.push(bucketToProgressScore(b.bucket));
  });

  studentCourses.forEach((c) => {
    if (c.marks != null) {
      const entry = ensureSubject(c.courseName, c.courseCode);
      entry.scores.push(c.marks);
    }
  });

  const subjects = Array.from(subjectMap.values()).map((s) => ({
    ...s,
    averageScore: s.scores.length
      ? Number((s.scores.reduce((a, b) => a + b, 0) / s.scores.length).toFixed(2))
      : 0,
  }));

  const strong = subjects.filter((s) => s.averageScore >= 75).sort((a, b) => b.averageScore - a.averageScore);
  const weak = subjects.filter((s) => s.averageScore < 60).sort((a, b) => a.averageScore - b.averageScore);
  const average = subjects.filter((s) => s.averageScore >= 60 && s.averageScore < 75);

  return { strong, average, weak, all: subjects };
}

function buildRisks(attendance, assignments, quizzes) {
  const risks = [];

  if (attendance.hasData !== false && attendance.totalClasses > 0) {
    const attSeverity = attendance.riskLevel === 'critical' ? 'High'
      : attendance.riskLevel === 'warning' ? 'Medium' : 'Low';
    risks.push({
      type: 'Low Attendance Risk',
      severity: attSeverity,
      description: `Current attendance is ${attendance.attendancePercentage}% (required: ${MIN_REQUIRED_PERCENTAGE}%).`,
      metric: attendance.attendancePercentage,
    });
  }

  if (assignments.overdue > 0 || assignments.pending > 0) {
    const severity = assignments.overdue > 2 ? 'High' : assignments.overdue > 0 ? 'Medium' : 'Low';
    risks.push({
      type: 'Assignment Risk',
      severity,
      description: `${assignments.pending} pending assignment(s), ${assignments.overdue} overdue.`,
      metric: assignments.completionRate,
    });
  }

  if (quizzes.recentLowScores.length > 0) {
    const severity = quizzes.recentLowScores.length >= 3 ? 'High' : 'Medium';
    risks.push({
      type: 'Quiz Risk',
      severity,
      description: `${quizzes.recentLowScores.length} recent quiz score(s) below 60%.`,
      metric: quizzes.averageScore,
    });
  }

  const highCount = risks.filter((r) => r.severity === 'High').length;
  const mediumCount = risks.filter((r) => r.severity === 'Medium').length;
  const overallSeverity = highCount > 0 ? 'High' : mediumCount > 0 ? 'Medium' : 'Low';

  risks.push({
    type: 'Overall Academic Risk',
    severity: overallSeverity,
    description: overallSeverity === 'Low'
      ? 'Your academic indicators are within acceptable ranges.'
      : overallSeverity === 'Medium'
        ? 'Some areas need attention to maintain academic standing.'
        : 'Multiple critical areas require immediate action.',
    metric: null,
  });

  return risks;
}

function buildRecommendations(attendance, assignments, quizzes, subjectStrengths) {
  const recommendations = [];

  if (attendance.classesNeededFor75 > 0) {
    recommendations.push({
      priority: 'high',
      category: 'attendance',
      action: `Attend the next ${Math.min(attendance.classesNeededFor75, 5)} lecture(s) to reach the safe zone`,
      reason: `${attendance.classesNeededFor75} more class(es) needed to reach ${MIN_REQUIRED_PERCENTAGE}% attendance`,
    });
  } else if (attendance.safeLeavesRemaining <= 2 && attendance.hasData) {
    recommendations.push({
      priority: 'medium',
      category: 'attendance',
      action: 'Maintain consistent attendance — limited safe leaves remaining',
      reason: `Only ${attendance.safeLeavesRemaining} class(es) can be missed safely`,
    });
  }

  assignments.pendingItems.slice(0, 3).forEach((item) => {
    recommendations.push({
      priority: item.isOverdue ? 'high' : 'medium',
      category: 'assignment',
      action: `Complete pending assignment: ${item.title}`,
      reason: item.isOverdue ? 'This assignment is overdue' : 'Due date approaching',
    });
  });

  subjectStrengths.weak.slice(0, 2).forEach((s) => {
    recommendations.push({
      priority: 'medium',
      category: 'study',
      action: `Revise ${s.name} — focus on weak areas`,
      reason: `Average performance score: ${s.averageScore}%`,
    });
  });

  if (quizzes.recentLowScores.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'quiz',
      action: `Retake or review: ${quizzes.recentLowScores[0].quizTitle}`,
      reason: `Scored ${quizzes.recentLowScores[0].percentage}% — below passing threshold`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      category: 'general',
      action: 'Keep up the excellent work — maintain your current study routine',
      reason: 'All academic indicators are healthy',
    });
  }

  return recommendations.slice(0, 8);
}

function computeHealthScore(attendance, assignments, quizzes, bucketProgress) {
  const attScore = attendance.hasData !== false && attendance.totalClasses > 0
    ? attendance.attendancePercentage
    : 75;
  const assignScore = assignments.total > 0
    ? (assignments.completionRate * 0.5) + (assignments.averageScore * 0.5)
    : 70;
  const quizScore = quizzes.totalAttempts > 0 ? quizzes.averageScore : 70;
  const progressScore = bucketProgress > 0 ? bucketProgress : 60;

  const weighted = (attScore * 0.30) + (assignScore * 0.25) + (quizScore * 0.30) + (progressScore * 0.15);
  return Math.round(Math.max(0, Math.min(100, weighted)));
}

function buildOverallTrend(attendanceTrend, quizTrend, assignmentTrend) {
  const maxLen = Math.max(attendanceTrend.length, quizTrend.length, assignmentTrend.length, 1);
  const overall = [];
  for (let i = 0; i < maxLen; i++) {
    const att = attendanceTrend[i]?.percentage ?? attendanceTrend[attendanceTrend.length - 1]?.percentage ?? 0;
    const quiz = quizTrend[i]?.score ?? 0;
    const assign = assignmentTrend[i]?.score ?? 0;
    const count = [attendanceTrend[i], quizTrend[i], assignmentTrend[i]].filter(Boolean).length || 1;
    overall.push({
      week: `W${i + 1}`,
      score: Number(((att + quiz + assign) / count).toFixed(1)),
    });
  }
  return overall.slice(-8);
}

async function getAcademicHealth(studentId) {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    const err = new Error('Invalid student ID');
    err.statusCode = 400;
    throw err;
  }

  const student = await Student.findById(studentId).lean();
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  const enrolledCourseIds = [
    ...(student.enrolledCourses || []).map((c) => c.courseId).filter(Boolean),
    ...(student.courses || []).map((c) => c.courseId).filter(Boolean),
  ];

  const [attendance, assignments, quizzes, bucketData] = await Promise.all([
    fetchAttendanceData(studentId),
    fetchAssignmentData(studentId, enrolledCourseIds),
    fetchQuizData(studentId),
    fetchBucketData(studentId),
  ]);

  const subjectStrengths = buildSubjectStrengths(
    attendance.subjects,
    bucketData,
    quizzes,
    student.courses || []
  );

  const healthScore = computeHealthScore(attendance, assignments, quizzes, bucketData.progressScore);
  const healthLevel = getHealthLevel(healthScore);

  const expectedSemesterPercentage = Number((
    (attendance.attendancePercentage * 0.15) +
    (assignments.averageScore * 0.35) +
    (quizzes.averageScore * 0.35) +
    (bucketData.progressScore * 0.15)
  ).toFixed(2));

  const expectedGpa = percentageToGpa(expectedSemesterPercentage);
  const currentGpa = student.gpa || percentageToGpa(expectedSemesterPercentage);

  const performancePredictor = {
    expectedSemesterPercentage,
    expectedGpa,
    currentGpa,
    explanation: `Prediction combines attendance (${attendance.attendancePercentage}%), assignment performance (${assignments.averageScore}%), quiz scores (${quizzes.averageScore}%), and course progress level (${Math.round(bucketData.progressScore)}%). Weighted formula: 15% attendance + 35% assignments + 35% quizzes + 15% progress.`,
  };

  const risks = buildRisks(attendance, assignments, quizzes);
  const recommendations = buildRecommendations(attendance, assignments, quizzes, subjectStrengths);

  const attendanceTrendFormatted = (attendance.trend || []).slice(-8).map((t, i) => ({
    week: t.date?.slice(5) || `W${i + 1}`,
    percentage: t.percentage,
  }));

  const trends = {
    attendance: attendanceTrendFormatted,
    quiz: quizzes.trend.slice(-8),
    assignment: assignments.trend.slice(-8),
    overall: buildOverallTrend(
      attendance.trend || [],
      quizzes.trend,
      assignments.trend
    ),
  };

  return {
    healthScore,
    healthLevel,
    student: {
      name: student.name,
      gpa: student.gpa,
      level: student.level,
      semester: student.semester,
    },
    attendance: {
      currentPercentage: attendance.attendancePercentage,
      requiredPercentage: attendance.requiredPercentage,
      riskLevel: attendance.riskLevel,
      classesAttended: attendance.presentCount + attendance.lateCount,
      classesMissed: attendance.absentCount,
      totalClasses: attendance.totalClasses,
      canMissMore: attendance.safeLeavesRemaining,
      classesNeededForSafeZone: attendance.classesNeededFor75,
      predictedAttendance: attendance.predictedAttendance,
      subjects: attendance.subjects,
      trend: attendance.trend,
    },
    performancePredictor,
    subjectStrengths,
    risks,
    recommendations,
    trends,
    summaries: {
      assignments,
      quizzes,
      progress: {
        averageBucketScore: bucketData.progressScore,
        coursesTracked: bucketData.buckets.length,
      },
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { getAcademicHealth, getHealthLevel, HEALTH_LEVELS };
