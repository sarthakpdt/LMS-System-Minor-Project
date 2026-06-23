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
      activities: [{ type: 'LECTURE', percentage: Math.round(attendancePercentage) }],
    };
  });

module.exports = {
  MIN_REQUIRED_PERCENTAGE,
  DEFAULT_FUTURE_CLASSES,
  toRiskLevel,
  calculateSafeLeavesRemaining,
  calculateClassesNeededForTarget,
  buildTrendData,
  calculatePredictedAttendance,
  buildSubjectsFromStats,
};
