export interface AttendanceRecord {
  date: string;
  subject: string;
  status: 'present' | 'absent' | 'late';
  teacherName?: string;
}

export interface TrendPoint {
  date: string;
  percentage: number;
}

export interface SubjectActivity {
  type: string;
  percentage: number;
}

export interface SubjectAttendance {
  subject: string;
  courseCode: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  attendancePercentage: number;
  predictedAttendance: number;
  safeLeavesRemaining: number;
  classesNeededFor75: number;
  riskLevel: 'safe' | 'warning' | 'critical';
  activities: SubjectActivity[];
}

export interface AttendanceAnalytics {
  attendancePercentage: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalClasses: number;
  predictedAttendance: number;
  safeLeavesRemaining: number;
  classesNeededFor75: number;
  riskLevel: 'safe' | 'warning' | 'critical';
  trend: TrendPoint[];
}

export interface AttendanceResponse {
  success: boolean;
  message?: string;
  records?: AttendanceRecord[];
  stats?: Record<string, { present: number; absent: number; late: number; total: number }>;
  subjects?: SubjectAttendance[];
  analytics?: AttendanceAnalytics;
  isDemo?: boolean;
}
