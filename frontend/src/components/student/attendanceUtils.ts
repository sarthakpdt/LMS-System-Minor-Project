import type { AttendanceAnalytics, AttendanceRecord, SubjectAttendance } from './StudentAttendance.types';

const SUBJECT_CODES: Record<string, string> = {
  'Machine Learning': 'CS1138',
  'Communication and Identity': 'CC1104',
  'Design and Analysis of Algorithms': 'CS1105',
  'Optimization for Computer Science': 'AS1113',
  'Data Structures': 'CS201',
  'Database Systems': 'CS301',
  'Operating Systems': 'CS302',
  'Computer Networks': 'CS303',
};

const MIN_REQUIRED = 75;

export const getRiskLevel = (percentage: number): SubjectAttendance['riskLevel'] => {
  if (percentage >= 75) return 'safe';
  if (percentage >= 65) return 'warning';
  return 'critical';
};

const safeLeaves = (present: number, total: number) => {
  if (total === 0) return 0;
  return Math.max(0, Math.floor((present * 100) / MIN_REQUIRED) - total);
};

const classesNeeded = (present: number, total: number) => {
  if (total === 0) return 0;
  const current = (present / total) * 100;
  if (current >= MIN_REQUIRED) return 0;
  return Math.max(0, Math.ceil((MIN_REQUIRED * total - 100 * present) / (100 - MIN_REQUIRED)));
};

const predict = (present: number, total: number) => {
  if (total === 0) return 0;
  const future = 6;
  const rate = Math.max(0.5, Math.min(1, present / total));
  return Number((((present + future * rate) / (total + future)) * 100).toFixed(1));
};

export const getCourseCode = (subject: string) =>
  SUBJECT_CODES[subject] || subject.replace(/\s+/g, '').slice(0, 6).toUpperCase();

export const buildSubjectAnalytics = (
  records: AttendanceRecord[],
  stats?: Record<string, { present: number; absent: number; late: number; total: number }>
): SubjectAttendance[] => {
  const grouped: Record<string, AttendanceRecord[]> = {};
  records.forEach((r) => {
    if (!grouped[r.subject]) grouped[r.subject] = [];
    grouped[r.subject].push(r);
  });

  const names = stats ? Object.keys(stats) : Object.keys(grouped);

  return names.map((subject) => {
    const subjectRecords = grouped[subject] || [];
    const present = stats?.[subject]?.present ?? subjectRecords.filter((r) => r.status === 'present').length;
    const absent = stats?.[subject]?.absent ?? subjectRecords.filter((r) => r.status === 'absent').length;
    const late = stats?.[subject]?.late ?? subjectRecords.filter((r) => r.status === 'late').length;
    const total = stats?.[subject]?.total ?? (subjectRecords.length || present + absent + late);
    const effectivePresent = present + late;
    const attendancePercentage = total > 0 ? Number(((effectivePresent / total) * 100).toFixed(2)) : 0;

    const activities =
      subject === 'Optimization for Computer Science'
        ? [
            { type: 'LECTURE', percentage: Math.round(attendancePercentage - 3) },
            { type: 'PRACTICAL', percentage: Math.round(attendancePercentage + 3) },
          ]
        : [{ type: 'LECTURE', percentage: Math.round(attendancePercentage) }];

    return {
      subject,
      courseCode: getCourseCode(subject),
      present,
      absent,
      late,
      total,
      attendancePercentage,
      predictedAttendance: predict(effectivePresent, total),
      safeLeavesRemaining: safeLeaves(effectivePresent, total),
      classesNeededFor75: classesNeeded(effectivePresent, total),
      riskLevel: getRiskLevel(attendancePercentage),
      activities,
    };
  });
};

export const buildOverallAnalytics = (subjects: SubjectAttendance[]): AttendanceAnalytics => {
  const presentCount = subjects.reduce((s, x) => s + x.present, 0);
  const absentCount = subjects.reduce((s, x) => s + x.absent, 0);
  const lateCount = subjects.reduce((s, x) => s + x.late, 0);
  const totalClasses = subjects.reduce((s, x) => s + x.total, 0);
  const effectivePresent = presentCount + lateCount;
  const attendancePercentage =
    totalClasses > 0 ? Number(((effectivePresent / totalClasses) * 100).toFixed(2)) : 0;

  return {
    attendancePercentage,
    presentCount,
    absentCount,
    lateCount,
    totalClasses,
    predictedAttendance: predict(effectivePresent, totalClasses),
    safeLeavesRemaining: safeLeaves(effectivePresent, totalClasses),
    classesNeededFor75: classesNeeded(effectivePresent, totalClasses),
    riskLevel: getRiskLevel(attendancePercentage),
    trend: [
      { date: 'Apr 01', percentage: Math.min(100, attendancePercentage + 14) },
      { date: 'Apr 08', percentage: Math.min(100, attendancePercentage + 11) },
      { date: 'Apr 15', percentage: Math.min(100, attendancePercentage + 8) },
      { date: 'Apr 22', percentage: Math.min(100, attendancePercentage + 5) },
      { date: 'Apr 29', percentage: Math.min(100, attendancePercentage + 3) },
      { date: 'May 06', percentage: Math.min(100, attendancePercentage + 1) },
      { date: 'May 13', percentage: attendancePercentage },
      { date: 'May 20', percentage: attendancePercentage },
    ],
  };
};

export const buildSubjectInsights = (subject: SubjectAttendance): string[] => {
  const insights: string[] = [];
  if (subject.riskLevel === 'critical') {
    insights.push(`Critical in ${subject.subject}: attend upcoming classes to avoid shortage.`);
  } else if (subject.riskLevel === 'warning') {
    insights.push(`${subject.subject} is in the warning zone. Stay above 75%.`);
  } else {
    insights.push(`${subject.subject} is in the safe zone.`);
  }
  if (subject.classesNeededFor75 > 0) {
    insights.push(`Attend next ${subject.classesNeededFor75} classes in ${subject.subject} to reach 75%.`);
  } else if (subject.safeLeavesRemaining > 0) {
    insights.push(`You can safely miss ${subject.safeLeavesRemaining} more class(es) in ${subject.subject}.`);
  }
  insights.push(`Projected attendance: ${subject.predictedAttendance}% if trend continues.`);
  return insights.slice(0, 3);
};

export const ringStrokeColor = (risk: SubjectAttendance['riskLevel']) => {
  if (risk === 'safe') return '#10b981';
  if (risk === 'warning') return '#f59e0b';
  return '#ef4444';
};
