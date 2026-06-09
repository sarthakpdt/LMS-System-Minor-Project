export interface TimeSlot {
  _id?: string;
  label: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  breakType: 'lunch' | 'short' | null;
}

export interface YearConfig {
  yearNumber: number;
  label: string;
  sections: string[];
}

export interface BranchConfig {
  code: string;
  name: string;
  years: YearConfig[];
}

export interface TtConfig {
  _id?: string;
  academicYear: string;
  branches: BranchConfig[];
  workingDays: string[];
  timeSlots: TimeSlot[];
  lunchBreak: {
    startTime: string;
    endTime: string;
  };
  lectureDuration: number;
  isActive?: boolean;
}

export interface TtSubject {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  type: 'theory' | 'lab';
  branch: string;
  year: number;
  weeklyHours: number;
  labDuration: number;
  lectureDuration?: number | null;
  hasLab?: boolean;
  labSessionsPerWeek?: number;
  facultyId: string | null;
  facultyName: string;
  preferredDays?: string[];
  preferredSlots?: string[];
  roomType?: 'classroom' | 'lab' | 'any';
}

export interface TtRoom {
  _id?: string;
  name: string;
  type: 'classroom' | 'lab';
  capacity: number;
  labType: string;
}

export interface UnavailableSlot {
  _id?: string;
  day: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface TtFacultyConstraint {
  _id?: string;
  facultyId: string;
  facultyName: string;
  unavailableSlots: UnavailableSlot[];
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
}

export interface TtEntry {
  _id?: string;
  branch: string;
  year: number;
  section: string;
  day: string;
  timeSlot: {
    label: string;
    startTime: string;
    endTime: string;
  };
  subjectId: string | null;
  subjectName: string;
  subjectType: 'theory' | 'lab' | 'free' | 'lunch';
  facultyId: string | null;
  facultyName: string;
  roomId: string | null;
  roomName: string;
  isLunch: boolean;
  isFree: boolean;
}

export interface TtConflict {
  _id?: string;
  type: 'teacher' | 'room' | 'section' | 'lab' | 'missing' | 'unassigned';
  description: string;
  severity: 'error' | 'warning';
}

export interface ValidationSummary {
  errorCount: number;
  warningCount: number;
  missingFaculty: number;
  missingRoom: number;
  missingLab: number;
  constraintViolations: number;
}

export interface TtGenerated {
  _id: string;
  configId: string;
  label?: string;
  status: 'draft' | 'published' | 'archived';
  isWorkingDraft?: boolean;
  aiOptimized?: boolean;
  validationSummary?: ValidationSummary;
  conflicts: TtConflict[];
  entries: TtEntry[];
  generatedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Teacher {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
}
