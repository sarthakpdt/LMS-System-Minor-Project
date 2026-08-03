export type HealthLevel = 'Excellent' | 'Good' | 'Moderate' | 'Warning' | 'Critical';
export type RiskSeverity = 'Low' | 'Medium' | 'High';
export type AttendanceRiskLevel = 'safe' | 'warning' | 'critical';

export interface SubjectStrength {
  name: string;
  courseCode: string;
  averageScore: number;
}

export interface AcademicRisk {
  type: string;
  severity: RiskSeverity;
  description: string;
  metric: number | null;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  action: string;
  reason: string;
}

export interface TrendPoint {
  week: string;
  score?: number;
  percentage?: number;
}

export interface AcademicHealthData {
  healthScore: number;
  healthLevel: HealthLevel;
  student: {
    name: string;
    gpa: number;
    level: string;
    semester: string;
  };
  attendance: {
    currentPercentage: number;
    requiredPercentage: number;
    riskLevel: AttendanceRiskLevel;
    classesAttended: number;
    classesMissed: number;
    totalClasses: number;
    canMissMore: number;
    classesNeededForSafeZone: number;
    predictedAttendance: number;
    subjects: Array<{
      subject: string;
      courseCode: string;
      attendancePercentage: number;
      riskLevel: AttendanceRiskLevel;
    }>;
  };
  performancePredictor: {
    expectedSemesterPercentage: number;
    expectedGpa: number;
    currentGpa: number;
    explanation: string;
  };
  subjectStrengths: {
    strong: SubjectStrength[];
    average: SubjectStrength[];
    weak: SubjectStrength[];
  };
  risks: AcademicRisk[];
  recommendations: Recommendation[];
  trends: {
    attendance: TrendPoint[];
    quiz: TrendPoint[];
    assignment: TrendPoint[];
    overall: TrendPoint[];
  };
  summaries: {
    assignments: {
      total: number;
      submitted: number;
      pending: number;
      overdue: number;
      averageScore: number;
      completionRate: number;
    };
    quizzes: {
      totalAttempts: number;
      averageScore: number;
    };
    progress: {
      averageBucketScore: number;
      coursesTracked: number;
    };
  };
  generatedAt: string;
}

export interface AcademicHealthResponse {
  success: boolean;
  data?: AcademicHealthData;
  message?: string;
}
