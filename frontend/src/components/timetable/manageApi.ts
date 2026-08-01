import {
  TtAcademicYear,
  TtBranch,
  TtDepartment,
  TtSemester,
  TtSection,
  TtLab,
  TtLectureSlot,
  TtWorkingDay,
  TtLunchBreak,
  TtCourseAssignment,
  TtConfig,
  TtSubject,
  TtRoom,
  TtFacultyConstraint,
  Teacher,
  UnifiedTtConfig,
  SchedulingRules,
} from './types';

const MANAGE_BASE = 'http://localhost:5000/api/timetable/manage';
const ENGINE_BASE = 'http://localhost:5000/api/timetable/engine';

function getAuthHeaders(): Record<string, string> {
  try {
    const user = JSON.parse(localStorage.getItem('lms_user') || '{}');
    return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
  } catch {
    return {};
  }
}

async function manageRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${MANAGE_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
    ...options,
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

async function engineRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${ENGINE_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
    ...options,
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

export const manageApi = {
  // ── Academic Years ──
  getAcademicYears: () =>
    manageRequest<{ data: TtAcademicYear[] }>('/academic-years'),
  createAcademicYear: (payload: Partial<TtAcademicYear>) =>
    manageRequest<{ data: TtAcademicYear }>('/academic-years', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAcademicYear: (id: string, payload: Partial<TtAcademicYear>) =>
    manageRequest<{ data: TtAcademicYear }>(`/academic-years/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteAcademicYear: (id: string) =>
    manageRequest<{ message: string }>(`/academic-years/${id}`, { method: 'DELETE' }),
  setCurrentAcademicYear: (id: string) =>
    manageRequest<{ data: TtAcademicYear; message: string }>(`/academic-years/${id}/set-current`, {
      method: 'PATCH',
    }),

  // ── Departments ──
  getDepartments: () =>
    manageRequest<{ data: TtDepartment[] }>('/departments'),
  createDepartment: (payload: Partial<TtDepartment>) =>
    manageRequest<{ data: TtDepartment }>('/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateDepartment: (id: string, payload: Partial<TtDepartment>) =>
    manageRequest<{ data: TtDepartment }>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteDepartment: (id: string) =>
    manageRequest<{ message: string }>(`/departments/${id}`, { method: 'DELETE' }),

  // ── Branches ──
  getBranches: () =>
    manageRequest<{ data: TtBranch[] }>('/branches'),
  createBranch: (payload: Partial<TtBranch>) =>
    manageRequest<{ data: TtBranch }>('/branches', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateBranch: (id: string, payload: Partial<TtBranch>) =>
    manageRequest<{ data: TtBranch }>(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteBranch: (id: string) =>
    manageRequest<{ message: string }>(`/branches/${id}`, { method: 'DELETE' }),

  // ── Semesters ──
  getSemesters: () =>
    manageRequest<{ data: TtSemester[] }>('/semesters'),
  getSemestersByBranch: (branchId: string) =>
    manageRequest<{ data: TtSemester[] }>(`/semesters/branch/${branchId}`),
  createSemester: (payload: Partial<TtSemester>) =>
    manageRequest<{ data: TtSemester }>('/semesters', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteSemester: (id: string) =>
    manageRequest<{ message: string }>(`/semesters/${id}`, { method: 'DELETE' }),

  // ── Sections ──
  getSections: () =>
    manageRequest<{ data: TtSection[] }>('/sections'),
  getSectionsBySemester: (semesterId: string) =>
    manageRequest<{ data: TtSection[] }>(`/sections/semester/${semesterId}`),
  createSection: (payload: Partial<TtSection>) =>
    manageRequest<{ data: TtSection }>('/sections', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateSection: (id: string, payload: Partial<TtSection>) =>
    manageRequest<{ data: TtSection }>(`/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteSection: (id: string) =>
    manageRequest<{ message: string }>(`/sections/${id}`, { method: 'DELETE' }),

  // ── Labs ──
  getLabs: () =>
    manageRequest<{ data: TtLab[] }>('/labs'),
  createLab: (payload: Partial<TtLab>) =>
    manageRequest<{ data: TtLab }>('/labs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateLab: (id: string, payload: Partial<TtLab>) =>
    manageRequest<{ data: TtLab }>(`/labs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteLab: (id: string) =>
    manageRequest<{ message: string }>(`/labs/${id}`, { method: 'DELETE' }),

  // ── Working Days ──
  bulkSetWorkingDays: (academicYearId: string, workingDays: Array<{ dayName: string; dayOrder: number; isHalfDay?: boolean }>) =>
    manageRequest<{ data: TtWorkingDay[] }>('/working-days/bulk', {
      method: 'POST',
      body: JSON.stringify({ academicYearId, workingDays }),
    }),

  // ── Lecture Slots ──
  getLectureSlots: () =>
    manageRequest<{ data: TtLectureSlot[] }>('/lecture-slots'),
  createLectureSlot: (payload: Partial<TtLectureSlot>) =>
    manageRequest<{ data: TtLectureSlot }>('/lecture-slots', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateLectureSlot: (id: string, payload: Partial<TtLectureSlot>) =>
    manageRequest<{ data: TtLectureSlot }>(`/lecture-slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteLectureSlot: (id: string) =>
    manageRequest<{ message: string }>(`/lecture-slots/${id}`, { method: 'DELETE' }),

  // ── Lunch Break ──
  getLunchBreaks: () =>
    manageRequest<{ data: TtLunchBreak[] }>('/lunch-breaks'),
  createLunchBreak: (payload: Partial<TtLunchBreak>) =>
    manageRequest<{ data: TtLunchBreak }>('/lunch-breaks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateLunchBreak: (id: string, payload: Partial<TtLunchBreak>) =>
    manageRequest<{ data: TtLunchBreak }>(`/lunch-breaks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // ── Course Assignments ──
  getCourseAssignments: () =>
    manageRequest<{ data: TtCourseAssignment[] }>('/course-assignments'),
  createCourseAssignment: (payload: Partial<TtCourseAssignment>) =>
    manageRequest<{ data: TtCourseAssignment }>('/course-assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteCourseAssignment: (id: string) =>
    manageRequest<{ message: string }>(`/course-assignments/${id}`, { method: 'DELETE' }),

  // ── Unified Config ──
  getUnifiedConfig: (academicYearId: string) =>
    manageRequest<{ data: UnifiedTtConfig }>(`/configs/${academicYearId}`),
  syncLegacyConfig: (academicYearId: string) =>
    manageRequest<{ config: TtConfig; message: string }>(`/configs/${academicYearId}/sync`, {
      method: 'POST',
    }),
};

export const engineApi = {
  getConfig: () => engineRequest<{ config: TtConfig }>('/config'),
  saveConfig: (config: Partial<TtConfig>) =>
    engineRequest<{ config: TtConfig }>('/config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  getSubjects: (filters?: { branch?: string; year?: number }) => {
    const params = new URLSearchParams();
    if (filters?.branch) params.append('branch', filters.branch);
    if (filters?.year) params.append('year', String(filters.year));
    const qs = params.toString();
    return engineRequest<{ subjects: TtSubject[] }>(`/subjects${qs ? `?${qs}` : ''}`);
  },
  getAllSubjects: () => engineRequest<{ subjects: TtSubject[] }>('/subjects'),
  saveSubject: (subject: Partial<TtSubject>) =>
    engineRequest<{ subject: TtSubject }>('/subjects', {
      method: 'POST',
      body: JSON.stringify(subject),
    }),
  deleteSubject: (id: string) =>
    engineRequest<{ message: string }>(`/subjects/${id}`, { method: 'DELETE' }),
  duplicateSubject: (id: string) =>
    engineRequest<{ subject: TtSubject }>(`/subjects/${id}/duplicate`, { method: 'POST' }),
  getRooms: () => engineRequest<{ rooms: TtRoom[] }>('/rooms'),
  saveRoom: (room: Partial<TtRoom>) =>
    engineRequest<{ room: TtRoom }>('/rooms', {
      method: 'POST',
      body: JSON.stringify(room),
    }),
  deleteRoom: (id: string) =>
    engineRequest<{ message: string }>(`/rooms/${id}`, { method: 'DELETE' }),
  getFacultyConstraints: () =>
    engineRequest<{ constraints: TtFacultyConstraint[] }>('/faculty-constraints'),
  saveFacultyConstraint: (constraint: Partial<TtFacultyConstraint>) =>
    engineRequest<{ constraint: TtFacultyConstraint }>('/faculty-constraints', {
      method: 'POST',
      body: JSON.stringify(constraint),
    }),
  getTeachers: () => engineRequest<{ data: Teacher[] }>('/teachers'),
  saveSchedulingRules: async (rules: SchedulingRules, academicYearLabel: string) => {
    const { config } = await engineRequest<{ config: TtConfig }>('/config');
    return engineRequest<{ config: TtConfig }>('/config', {
      method: 'POST',
      body: JSON.stringify({
        ...config,
        academicYear: academicYearLabel || config.academicYear,
        schedulingRules: rules,
      }),
    });
  },
};
