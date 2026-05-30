export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface StudentRow {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
}

export interface TimetableSlot {
  _id: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  semester: number;
  department: string;
}

export interface StudentSummary {
  studentId: string;
  studentName: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  attendancePercentage: number;
  riskLevel: 'safe' | 'warning' | 'critical';
  recentTrend: { date: string; status: string; attended: boolean }[];
}

export interface ClassAnalytics {
  totalSessions: number;
  averageAttendance: number;
  highestAttendance: number;
  lowestAttendance: number;
  todayPercentage: number;
  weeklyTrend: { week: string; attendance: number }[];
  courseWise: { subject: string; sessions: number; attendancePercentage: number }[];
}

export interface PastSession {
  _id?: string;
  date: string;
  subject: string;
  records: { studentId?: string; studentName: string; status: string }[];
}
