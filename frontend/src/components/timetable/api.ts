import {
  TtConfig, TtSubject, TtRoom, TtFacultyConstraint, TtGenerated, TtEntry,
  TtConflict, ValidationSummary,
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

  // Engine Actions
  generate: (timetableId?: string) => request<{
    draftId: string;
    conflicts: any[];
    entries: TtEntry[];
    validationSummary?: ValidationSummary;
    validationIssues?: Array<{ type: string; message: string; severity?: string }>;
    aiOptimized?: boolean;
  }>('/generate', {
    method: 'POST',
    body: JSON.stringify(timetableId ? { timetableId } : {}),
  }),

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
  getPublishedForStudent: (studentId: string) => request<{ entries: TtEntry[]; studentMeta: any }>(`/published/student/${studentId}`)
};
