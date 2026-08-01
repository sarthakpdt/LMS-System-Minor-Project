// File: frontend/src/components/attendance/getDemoAttendancePayload.ts

export interface DemoSubject {
  subject: string;
  courseCode: string;
  attendancePercentage?: number; // undefined means N/A
  present: number | string;
  absent: number | string;
  totalLectures: number | string;
  activityBreakdown?: {
    LECTURE: number | string;
    LAB: number | string;
    TUTORIAL: number | string;
  };
  predictedAttendance?: number;
  safeLeavesRemaining?: number;
  classesNeededFor75?: number;
  trend?: string;
  riskLevel?: 'low' | 'medium' | 'high' | string;
  insights?: string;
  recovery?: string;
  planner?: string;
  noteTag?: string; // Top note tag, e.g. "High Attendance, Green"
}

export const getDemoAttendancePayload = (): DemoSubject[] => [
  {
    subject: 'Design and Analysis of Algorithms',
    courseCode: 'CS1105',
    attendancePercentage: 92,
    present: 58,
    absent: 6,
    totalLectures: 64,
    activityBreakdown: { LECTURE: 89, LAB: 92, TUTORIAL: 95 },
    predictedAttendance: 92,
    safeLeavesRemaining: 4,
    classesNeededFor75: 0,
    trend: '~',
    riskLevel: 'low',
    insights: 'Excellent consistency, likely above 85%',
    recovery: 'None',
    planner: 'Can safely miss 4 classes',
    noteTag: 'High Attendance, Green'
  },
  {
    subject: 'Operating Systems',
    courseCode: 'CS1108',
    attendancePercentage: 81,
    present: 58,
    absent: 6,
    totalLectures: 64,
    activityBreakdown: { LECTURE: 89, LAB: 92, TUTORIAL: 95 },
    predictedAttendance: 78, // matching ML predictor values for visual consistency or mockup values
    safeLeavesRemaining: 1,
    classesNeededFor75: 0,
    trend: '~',
    riskLevel: 'medium',
    insights: 'Decline, avoid missing >1',
    recovery: 'Maintain presents',
    planner: 'Can safely miss 1 class',
    noteTag: 'My Course-wise Attendance & AI Predictor'
  },
  {
    subject: 'Optimization for CS',
    courseCode: 'AS1113',
    attendancePercentage: 72,
    present: 58,
    absent: 6,
    totalLectures: 64,
    activityBreakdown: { LECTURE: 89, LAB: 92, TUTORIAL: 95 },
    predictedAttendance: 68,
    safeLeavesRemaining: 0,
    classesNeededFor75: 5,
    trend: '↓',
    riskLevel: 'high',
    insights: 'Decline, attendance below 75%',
    recovery: 'Need 5 consecutive presents to reach 75%',
    planner: 'Cannot miss any class',
    noteTag: 'Risk Risk'
  },
  {
    subject: 'Communication & Identity',
    courseCode: 'CC1104',
    attendancePercentage: 65,
    present: 58,
    absent: 6,
    totalLectures: 64,
    activityBreakdown: { LECTURE: 89, LAB: 92, TUTORIAL: 95 },
    predictedAttendance: 60,
    safeLeavesRemaining: 0,
    classesNeededFor75: 12,
    trend: '↓',
    riskLevel: 'high',
    insights: 'Decline, attendance below 75%',
    recovery: 'Need 12 consecutive presents to reach 75%',
    planner: 'Cannot miss any class',
    noteTag: 'High Risk'
  },
  {
    subject: 'New Elective Course',
    courseCode: 'CSXXXX',
    attendancePercentage: undefined,
    present: '-',
    absent: '-',
    totalLectures: '-',
    activityBreakdown: undefined,
    noteTag: 'Special Case, N/A'
  }
];

export const getDemoSmartPredictorPayload = () => [
  {
    subject: 'Machine Learning',
    courseCode: 'CS1138',
    current: 90,
    predicted: 86,
    leavesRemaining: 4,
    trend: '~',
    riskLevel: 'low',
    insights: 'Excellent consistency, likely above 85%',
    recovery: 'None',
    planner: 'Can safely miss 4 classes'
  },
  {
    subject: 'Operating Systems',
    courseCode: 'CS1108',
    current: 78,
    predicted: 73,
    leavesRemaining: 1, // Trend Buffer 1
    trend: '~',
    riskLevel: 'medium',
    insights: 'Decline, avoid missing >1',
    recovery: 'Maintain presents',
    planner: 'Can safely miss 1 class'
  },
  {
    subject: 'Optimization for CS',
    courseCode: 'AS1113',
    current: 72,
    predicted: 68,
    leavesRemaining: 0, // Buffer -
    trend: '↓',
    riskLevel: 'high',
    insights: 'Decline, attendance below 75%',
    recovery: 'Need 5 consecutive presents to reach 75%',
    planner: 'Cannot miss any class'
  }
];

