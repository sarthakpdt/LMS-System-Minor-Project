export interface TimeSlot {
  _id?: string;
  label: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  breakType: 'lunch' | 'short' | null;
}

export interface SemesterConfig {
  semesterNumber: number;
  label: string;
  sections: string[];
}

export interface BranchConfig {
  code: string;
  name: string;
  semesters: SemesterConfig[];
}

export interface SchedulingRules {
  maxClassesPerDay: number;
  maxConsecutiveLectures: number;
  maxLabsPerDay: number;
  lectureDuration: number;
  dayStartTime: string;
  dayEndTime: string;
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
  schedulingRules?: SchedulingRules;
  isActive?: boolean;
}

export interface UnifiedTtConfig {
  academicYear: TtAcademicYear;
  branches: TtBranch[];
  semesters: TtSemester[];
  sections: TtSection[];
  workingDays: TtWorkingDay[];
  timeSlots: TtLectureSlot[];
  lunchBreak: TtLunchBreak | null;
}

export interface TtSubject {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  type: 'theory' | 'lab';
  branch: string;
  semester: number;
  credits: number;
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
  semester: number;
  section: string;
  day: string;
  timeSlot: {
    label: string;
    startTime: string;
    endTime: string;
  };
  subjectId: string | null;
  subjectName: string;
  subjectType: 'theory' | 'lab' | 'free' | 'lunch' | 'exam' | 'tutorial';
  facultyId: string | null;
  facultyName: string;
  roomId: string | null;
  roomName: string;
  isLunch: boolean;
  isFree: boolean;
}

export interface TtConflict {
  _id?: string;
  type: 'teacher' | 'room' | 'section' | 'lab' | 'missing' | 'unassigned' | 'lunch' | 'room_capacity';
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
  status: 'draft' | 'approved' | 'published' | 'archived';
  isWorkingDraft?: boolean;
  aiOptimized?: boolean;
  validationSummary?: ValidationSummary;
  conflicts: TtConflict[];
  entries: TtEntry[];
  generatedAt: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  versionGroupId?: string;
  parentVersionId?: string;
  generationScope?: GenerationScope;
  generationReport?: GenerationReport | null;
}

export interface GenerationScope {
  type: 'full' | 'branch' | 'semester' | 'section' | 'day' | 'faculty';
  branch?: string;
  semester?: number;
  section?: string;
  day?: string;
  facultyId?: string;
}

export interface GenerationReport {
  generatedAt: string;
  scope: GenerationScope;
  algorithm: string;
  aiOptimized: boolean;
  stats: {
    totalSlots: number;
    scheduledLectures: number;
    freeSlots: number;
    lunchSlots: number;
    errorCount: number;
    warningCount: number;
    branches: number;
    lecturesByBranch: Record<string, number>;
    lecturesByType: { theory: number; lab: number };
    facultyScheduled: number;
    roomsUsed: number;
  };
  topErrors: string[];
  topWarnings: string[];
  configSnapshot: {
    academicYear: string;
    workingDays: number;
    timeSlots: number;
    subjectCount: number;
    roomCount: number;
  };
}

export interface Teacher {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
}

export interface TtAcademicYear {
  _id?: string;
  label: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
}

export interface TtBranch {
  _id?: string;
  code: string;
  name: string;
  academicYearId: string | TtAcademicYear;
  departmentId: string | TtDepartment;
  isActive: boolean;
}

export interface TtSemester {
  _id?: string;
  semesterNumber: number;
  year: number;
  branchId: string | TtBranch;
  academicYearId: string | TtAcademicYear;
  isActive: boolean;
}

export interface TtSection {
  _id?: string;
  label: string;
  semesterId: string | TtSemester;
  branchId: string | TtBranch;
  studentCount: number;
  isActive: boolean;
}

export interface TtDepartment {
  _id?: string;
  code: string;
  name: string;
  headOfDepartment?: string | Teacher | null;
  isActive: boolean;
}

export interface TtLab {
  _id?: string;
  name: string;
  labType: string;
  capacity: number;
  building?: string;
  floor?: string;
  equipment?: string[];
  departmentId: string | TtDepartment;
  isActive: boolean;
}

export interface TtCourseAssignment {
  _id?: string;
  subjectId: string | TtSubject;
  facultyId: string | Teacher;
  sectionId: string | TtSection;
  branchId: string | TtBranch;
  semesterId: string | TtSemester;
  academicYearId: string | TtAcademicYear;
  isActive: boolean;
}

export interface TtLectureSlot {
  _id?: string;
  label: string;
  startTime: string;
  endTime: string;
  slotNumber: number;
  duration: number;
  isBreak: boolean;
  breakType: 'lunch' | 'short' | 'tea' | null;
  academicYearId: string | TtAcademicYear;
  isActive: boolean;
}

export interface TtWorkingDay {
  _id?: string;
  dayName: string;
  dayOrder: number;
  isHalfDay: boolean;
  academicYearId: string | TtAcademicYear;
  isActive: boolean;
}

export interface TtLunchBreak {
  _id?: string;
  startTime: string;
  endTime: string;
  duration: number;
  academicYearId: string | TtAcademicYear;
  isActive: boolean;
}

