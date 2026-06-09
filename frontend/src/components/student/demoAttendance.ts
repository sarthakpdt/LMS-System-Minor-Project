import { buildOverallAnalytics } from './attendanceUtils';
import type { AttendanceRecord, SubjectAttendance } from './StudentAttendance.types';

export const DEMO_SUBJECTS: SubjectAttendance[] = [
  { subject: 'Machine Learning', courseCode: 'CS1138', present: 58, absent: 6, late: 0, total: 64, attendancePercentage: 90.63, predictedAttendance: 91.2, safeLeavesRemaining: 4, classesNeededFor75: 0, riskLevel: 'safe', activities: [{ type: 'LECTURE', percentage: 91 }] },
  { subject: 'Communication and Identity', courseCode: 'CC1104', present: 24, absent: 2, late: 0, total: 26, attendancePercentage: 92.31, predictedAttendance: 92.8, safeLeavesRemaining: 2, classesNeededFor75: 0, riskLevel: 'safe', activities: [{ type: 'LECTURE', percentage: 92 }] },
  { subject: 'Design and Analysis of Algorithms', courseCode: 'CS1105', present: 49, absent: 8, late: 0, total: 57, attendancePercentage: 85.96, predictedAttendance: 86.5, safeLeavesRemaining: 2, classesNeededFor75: 0, riskLevel: 'safe', activities: [{ type: 'LECTURE', percentage: 86 }] },
  { subject: 'Optimization for Computer Science', courseCode: 'AS1113', present: 34, absent: 5, late: 1, total: 40, attendancePercentage: 87.5, predictedAttendance: 88.1, safeLeavesRemaining: 2, classesNeededFor75: 0, riskLevel: 'safe', activities: [{ type: 'LECTURE', percentage: 89 }, { type: 'PRACTICAL', percentage: 92 }] },
  { subject: 'Data Structures', courseCode: 'CS201', present: 28, absent: 10, late: 2, total: 40, attendancePercentage: 75, predictedAttendance: 76.2, safeLeavesRemaining: 0, classesNeededFor75: 0, riskLevel: 'safe', activities: [{ type: 'LECTURE', percentage: 75 }] },
  { subject: 'Database Systems', courseCode: 'CS301', present: 20, absent: 12, late: 1, total: 33, attendancePercentage: 63.64, predictedAttendance: 66.8, safeLeavesRemaining: 0, classesNeededFor75: 5, riskLevel: 'critical', activities: [{ type: 'LECTURE', percentage: 64 }] },
];

export const DEMO_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  { date: '2026-05-20', subject: 'Database Systems', status: 'absent', teacherName: 'Prof. Mehta' },
  { date: '2026-05-19', subject: 'Data Structures', status: 'present', teacherName: 'Dr. Sharma' },
  { date: '2026-05-18', subject: 'Machine Learning', status: 'present', teacherName: 'Dr. Roy' },
];

export const DEMO_ATTENDANCE_ANALYTICS = buildOverallAnalytics(DEMO_SUBJECTS);

export const getDemoAttendanceBundle = () => ({
  records: DEMO_ATTENDANCE_RECORDS,
  subjects: DEMO_SUBJECTS,
  analytics: DEMO_ATTENDANCE_ANALYTICS,
  isDemo: true,
});
