import {
  TtConfig, TtSubject, TtRoom, TtFacultyConstraint, TtGenerated, TtEntry,
  TtConflict, ValidationSummary, GenerationScope, GenerationReport,
} from './types';

const BASE_URL = 'http://localhost:5000/api/timetable/engine';

// Helper to handle fetch responses
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

export const api = {
  // Config
  getConfig: () => request<{ config: TtConfig }>('/config'),
  saveConfig: (config: TtConfig) => request<{ config: TtConfig }>('/config', {
    method: 'POST',
    body: JSON.stringify(config),
  }),
  updateConfig: (id: string, config: Partial<TtConfig>) =>
    request<{ config: TtConfig }>(`/config/${id}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    }),

  // Subjects
  getSubjects: (filters?: { branch?: string; year?: number }) => {
    const params = new URLSearchParams();
    if (filters?.branch) params.append('branch', filters.branch);
    if (filters?.year) params.append('year', String(filters.year));
    const qs = params.toString();
    return request<{ subjects: TtSubject[] }>(`/subjects${qs ? `?${qs}` : ''}`);
  },
  saveSubject: (subject: TtSubject) => request<{ subject: TtSubject }>('/subjects', {
    method: 'POST',
    body: JSON.stringify(subject)
  }),
  deleteSubject: (id: string) => request<{ message: string }>(`/subjects/${id}`, {
    method: 'DELETE'
  }),
  duplicateSubject: (id: string) => request<{ subject: TtSubject }>(`/subjects/${id}/duplicate`, {
    method: 'POST',
  }),
  saveSubjectsBulk: (payload: {
    branch: string;
    year: number;
    subjects: Partial<TtSubject>[];
  }) => request<{ subjects: TtSubject[]; count: number }>('/subjects/bulk', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  getStudentsForAssignment: (filters: { branch?: string; year?: number; section?: string }) => {
    const params = new URLSearchParams();
    if (filters.branch) params.append('branch', filters.branch);
    if (filters.year) params.append('year', String(filters.year));
    if (filters.section) params.append('section', filters.section);
    return request<{ students: Array<{
      _id: string;
      name: string;
      email: string;
      studentId: string;
      department: string;
      semester: string;
      section?: string | null;
      enrolledCourses?: { courseId: string; courseName: string }[];
    }> }>(`/students?${params.toString()}`);
  },

  assignStudents: (payload: {
    branch: string;
    section: string;
    assignments: Array<{ studentId: string; subjectIds: string[] }>;
  }) => request<{ updated: number; results: unknown[] }>('/students/assign', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Rooms
  getRooms: () => request<{ rooms: TtRoom[] }>('/rooms'),
  saveRoom: (room: TtRoom) => request<{ room: TtRoom }>('/rooms', {
    method: 'POST',
    body: JSON.stringify(room)
  }),
  deleteRoom: (id: string) => request<{ message: string }>(`/rooms/${id}`, {
    method: 'DELETE'
  }),

  // Faculty Constraints
  getFacultyConstraints: () => request<{ constraints: TtFacultyConstraint[] }>('/faculty-constraints'),
  saveFacultyConstraint: (constraint: Partial<TtFacultyConstraint>) => request<{ constraint: TtFacultyConstraint }>('/faculty-constraints', {
    method: 'POST',
    body: JSON.stringify(constraint)
  }),
  getTeachers: () => request<{ data: any[] }>('/teachers'),

  // Engine Actions — Phase 3
  generate: (payload?: { timetableId?: string; scope?: GenerationScope; academicYearId?: string }) =>
    request<{
      draftId: string;
      conflicts: TtConflict[];
      entries: TtEntry[];
      validationSummary?: ValidationSummary;
      validationIssues?: Array<{ type: string; message: string; severity?: string }>;
      aiOptimized?: boolean;
      generationReport?: GenerationReport;
      suggestions?: Array<{ conflictDescription: string; recommendation: string; actionType: string; applyPayload?: unknown }>;
      version?: number;
      versionGroupId?: string;
    }>('/generate', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),

  regenerate: (payload: { timetableId?: string; scope: GenerationScope; academicYearId?: string }) =>
    request<{
      draftId: string;
      entries: TtEntry[];
      conflicts: TtConflict[];
      validationSummary?: ValidationSummary;
      generationReport?: GenerationReport;
      suggestions?: unknown[];
      version?: number;
      scope: GenerationScope;
    }>('/regenerate', { method: 'POST', body: JSON.stringify(payload) }),

  approveTimetable: (id: string) =>
    request<{ timetable: TtGenerated; message: string }>(`/timetables/${id}/approve`, { method: 'POST' }),

  listVersions: (id: string) =>
    request<{ versions: TtGenerated[]; currentVersion: number }>(`/timetables/${id}/versions`),

  restoreVersion: (id: string) =>
    request<{ timetable: TtGenerated; message: string }>(`/timetables/${id}/restore`, { method: 'POST' }),

  getGenerationReport: (id: string) =>
    request<{ report: GenerationReport }>(`/timetables/${id}/report`),

  applyClashResolution: (id: string, applyPayload: unknown) =>
    request<{ entries: TtEntry[]; conflicts: TtConflict[]; validationSummary: ValidationSummary }>(
      `/timetables/${id}/apply-resolution`,
      { method: 'POST', body: JSON.stringify({ applyPayload }) },
    ),

  listTimetables: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<{ timetables: TtGenerated[] }>(`/timetables${qs}`);
  },
  getTimetableById: (id: string) => request<{ timetable: TtGenerated }>(`/timetables/${id}`),
  saveTimetable: (payload: {
    draftId?: string;
    label?: string;
    entries?: TtEntry[];
    conflicts?: TtConflict[];
  }) => request<{ timetable: TtGenerated; message: string }>('/timetables/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateTimetable: (id: string, payload: Partial<TtGenerated>) =>
    request<{ timetable: TtGenerated }>(`/timetables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteTimetable: (id: string) =>
    request<{ message: string }>(`/timetables/${id}`, { method: 'DELETE' }),
  publish: (draftId: string) => request<{ published: any }>('/publish', {
    method: 'POST',
    body: JSON.stringify({ draftId })
  }),
  getLatestDraft: () => request<{ draft: TtGenerated | null }>('/draft'),
  getPublished: (filters?: { branch?: string; year?: number; section?: string; facultyId?: string; roomId?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.branch) params.append('branch', filters.branch);
      if (filters.year) params.append('year', String(filters.year));
      if (filters.section) params.append('section', filters.section);
      if (filters.facultyId) params.append('facultyId', filters.facultyId);
      if (filters.roomId) params.append('roomId', filters.roomId);
    }
    return request<{ entries: TtEntry[] }>(`/published?${params.toString()}`);
  },
  getPublishedForStudent: (studentId: string) => request<{ entries: TtEntry[]; studentMeta: any }>(`/published/student/${studentId}`),

  // ── NEW: Interactive Canvas ──
  swapEntries: (id: string, entryIndexA: number, entryIndexB: number) =>
    request<{ conflicts: TtConflict[]; validationSummary: ValidationSummary; message: string }>(
      `/timetables/${id}/swap`,
      { method: 'POST', body: JSON.stringify({ entryIndexA, entryIndexB }) }
    ),

  editEntry: (id: string, entryIndex: number, updates: Partial<TtEntry>) =>
    request<{ entry: TtEntry; conflicts: TtConflict[]; validationSummary: ValidationSummary }>(
      `/timetables/${id}/entry/${entryIndex}`,
      { method: 'PATCH', body: JSON.stringify(updates) }
    ),

  // ── NEW: AI Clash Resolution ──
  getClashResolutions: (id: string) =>
    request<{
      suggestions: Array<{
        conflictDescription: string;
        conflictType: string;
        severity: string;
        recommendation: string;
        actionType: string;
        targetDays?: string[];
        alternativeRooms?: Array<{ id: string; name: string; capacity: number; type: string }>;
      }>;
      totalConflicts: number;
    }>(`/timetables/${id}/clash-resolution`),

  // ── NEW: Semester Cloning ──
  cloneSemester: (payload: {
    sourceBranch: string;
    sourceYear: number;
    targetBranch: string;
    targetYear: number;
    prefixCode?: string;
    newFacultyMap?: Record<string, string>;
  }) =>
    request<{
      created: number;
      skipped: number;
      skippedList: Array<{ code: string; reason: string }>;
      message: string;
    }>('/clone', { method: 'POST', body: JSON.stringify(payload) }),

  // ── NEW: AI Slot Recommendations ──
  recommendSlots: (params: { subjectId: string; branch?: string; year?: number; section?: string }) => {
    const qs = new URLSearchParams();
    qs.append('subjectId', params.subjectId);
    if (params.branch) qs.append('branch', params.branch);
    if (params.year) qs.append('year', String(params.year));
    if (params.section) qs.append('section', params.section);
    return request<{
      subject: { name: string; code: string; type: string };
      recommendations: Array<{
        day: string;
        timeSlot: { label: string; startTime: string; endTime: string };
        score: number;
        reasons: string[];
      }>;
    }>(`/recommend-slots?${qs.toString()}`);
  },

  // ── NEW: Analytics ──
  getRoomUtilization: () =>
    request<{
      rooms: Array<{
        roomId: string;
        roomName: string;
        roomType: string;
        capacity: number;
        usedSlots: number;
        totalSlots: number;
        utilizationPct: number;
        byDay: Record<string, number>;
        byType: { theory: number; lab: number };
        status: 'high' | 'medium' | 'low';
      }>;
      summary: {
        totalRooms: number;
        avgUtilization: number;
        highUtilization: number;
        underutilized: number;
        workingDays: string[];
        timeSlotsPerDay: number;
      };
    }>('/analytics/rooms'),

  getFacultyWorkload: () =>
    request<{
      faculty: Array<{
        teacherId: string;
        teacherName: string;
        department: string;
        weeklyHours: number;
        maxWeekly: number;
        loadPct: number;
        byDay: Record<string, number>;
        byType: { theory: number; lab: number };
        gapCount: number;
        status: 'overloaded' | 'balanced' | 'underloaded';
        overloadedDays: string[];
      }>;
      summary: {
        totalFaculty: number;
        avgLoadPct: number;
        overloaded: number;
        underloaded: number;
        balanced: number;
      };
    }>('/analytics/faculty-workload'),
};
