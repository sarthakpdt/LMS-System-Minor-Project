const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export interface TeacherSlot {
  _id: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  semester: number;
  department: string; // branch
  section: string;
  teacherId: string;
  teacherName: string;
  room: string;
  date?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  attendanceSubmitted?: boolean;
  isMissed?: boolean;
}

export interface AttendanceSlot {
  _id: string;
  timetableEntryRef: string | null;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectId: string | null;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  sectionId: string | null;
  sectionLabel: string;
  branch: string;
  year: number;
  section: string;
  roomId: string | null;
  room: string;
  lectureType: 'theory' | 'lab' | 'tutorial' | 'exam' | 'free' | 'lunch';
  attendanceStatus: 'pending' | 'completed' | 'missed' | 'late_submission';
  attendanceRecordId: string | null;
  liveStatus: 'upcoming' | 'ongoing' | 'completed' | null;
}

export interface StudentBySection {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  semester: string;
  section: string | null;
}

export const teacherScheduleApi = {
  // Today's schedule
  getTodaySchedule: (teacherId: string) =>
    request<{
      slots: TeacherSlot[];
      currentSlot: TeacherSlot | null;
      upcomingSlots: TeacherSlot[];
      missedSlots: TeacherSlot[];
      date: string;
      day: string;
    }>(`/teachers/schedule/${teacherId}/today`),

  // Weekly schedule
  getWeeklySchedule: (teacherId: string, filters?: { section?: string; semester?: number; subject?: string; day?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.section) params.append('section', filters.section);
      if (filters.semester) params.append('semester', String(filters.semester));
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.day) params.append('day', filters.day);
    }
    const qs = params.toString();
    return request<{
      slots: TeacherSlot[];
      grouped: Record<string, TeacherSlot[]>;
      workingDays: string[];
      uniqueSubjects: string[];
      uniqueSections: string[];
    }>(`/teachers/schedule/${teacherId}/week${qs ? `?${qs}` : ''}`);
  },

  // Attendance slots
  getAttendanceSlots: (teacherId: string, params?: { date?: string; fromDate?: string; toDate?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params) {
      if (params.date) qs.append('date', params.date);
      if (params.fromDate) qs.append('fromDate', params.fromDate);
      if (params.toDate) qs.append('toDate', params.toDate);
      if (params.status) qs.append('status', params.status);
    }
    const queryString = qs.toString();
    return request<{
      slots: AttendanceSlot[];
      byDate: Record<string, AttendanceSlot[]>;
      total: number;
    }>(`/teachers/schedule/${teacherId}/attendance-slots${queryString ? `?${queryString}` : ''}`);
  },

  // Update attendance slot status after marking attendance
  updateSlotStatus: (slotId: string, status: string, attendanceRecordId?: string) =>
    request<{ success: boolean; slot: AttendanceSlot }>(`/teachers/schedule/attendance-slots/${slotId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, attendanceRecordId }),
    }),

  // Get student list by branch/semester/section
  getStudentsBySection: (branch: string, semester: string | number, section: string) =>
    request<{ success: boolean; students: StudentBySection[] }>(
      `/attendance/students-by-section?branch=${encodeURIComponent(branch)}&semester=${semester}&section=${encodeURIComponent(section)}`
    ),
};
