// src/api/timetableApi.ts
// API helpers for timetable generation and management

export const API_BASE = '/api/admin/timetable';

export const generateTimetable = async (payload: any) => {
  const res = await fetch(`${API_BASE}/engine/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const fetchConflicts = async (timetableId: string) => {
  const res = await fetch(`${API_BASE}/engine/conflicts/${timetableId}`);
  return res.json();
};

export const publishTimetable = async (timetableId: string) => {
  const res = await fetch(`${API_BASE}/engine/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ timetableId }),
  });
  return res.json();
};
