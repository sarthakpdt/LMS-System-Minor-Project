import React, { useEffect, useState } from 'react';
import { api } from './api';
import { TtConfig, TtSubject, Teacher } from './types';
import {
  BookOpen, Plus, Save, Trash2, Copy, Pencil, AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react';

const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const emptyCourse = (branch: string, semester: number): Partial<TtSubject> => ({
  name: '',
  code: '',
  type: 'theory',
  branch,
  semester,
  weeklyHours: 3,
  labDuration: 2,
  lectureDuration: 50,
  hasLab: false,
  labSessionsPerWeek: 1,
  facultyId: null,
  facultyName: '',
  preferredDays: [],
  preferredSlots: [],
  roomType: 'classroom',
});

interface Props {
  config: TtConfig | null;
  teachers: Teacher[];
  onSaved?: () => void;
}

export default function CourseManager({ config, teachers, onSaved }: Props) {
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState(1);
  const [courses, setCourses] = useState<TtSubject[]>([]);
  const [editing, setEditing] = useState<Partial<TtSubject> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!config?.branches.length) return;
    const first = config.branches[0];
    setBranch(first.code);
    if (first.semesters?.length) setSemester(first.semesters[0].semesterNumber);
  }, [config]);

  const loadCourses = async () => {
    if (!branch || !semester) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.getSubjects({ branch, semester });
      setCourses(res.subjects);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [branch, semester]);

  const branchObj = config?.branches.find((b) => b.code === branch);

  const startAdd = () => {
    setEditing(emptyCourse(branch, semester));
    setSuccess('');
    setError('');
  };

  const startEdit = (course: TtSubject) => {
    setEditing({ ...course });
    setSuccess('');
    setError('');
  };

  const handleSave = async () => {
    if (!editing?.name?.trim() || !editing?.code?.trim()) {
      setError('Course name and code are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...editing,
        id: editing._id,
        branch,
        semester,
      };
      const res = await api.saveSubject(payload as TtSubject);
      setSuccess(`Saved ${res.subject.name} successfully.`);
      setEditing(null);
      await loadCourses();
      onSaved?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await api.deleteSubject(id);
      setSuccess('Course deleted.');
      if (editing?._id === id) setEditing(null);
      await loadCourses();
      onSaved?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete course.');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.duplicateSubject(id);
      setSuccess('Course duplicated.');
      await loadCourses();
      onSaved?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate course.');
    }
  };

  const togglePreferredDay = (day: string) => {
    if (!editing) return;
    const current = editing.preferredDays || [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    setEditing({ ...editing, preferredDays: next });
  };

  if (!config) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="block text-[10px] font-semibold text-gray-500 mb-1">BRANCH</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
          >
            {config.branches.map((b) => (
              <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-semibold text-gray-500 mb-1">SEMESTER</label>
          <select
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
          >
            {branchObj?.semesters?.map((s) => (
              <option key={s.semesterNumber} value={s.semesterNumber}>{s.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={startAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 text-xs">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
          <CheckCircle2 className="w-4 h-4" /> {success}
        </div>
      )}

      {editing && (
        <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            {editing._id ? 'Edit Course' : 'New Course'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              placeholder="Course Name"
              value={editing.name || ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="border rounded-xl px-3 py-2 text-xs"
            />
            <input
              placeholder="Course Code"
              value={editing.code || ''}
              onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
              className="border rounded-xl px-3 py-2 text-xs"
            />
            <select
              value={editing.type || 'theory'}
              onChange={(e) => {
                const type = e.target.value as 'theory' | 'lab';
                setEditing({
                  ...editing,
                  type,
                  roomType: type === 'lab' ? 'lab' : (editing.roomType === 'lab' ? 'classroom' : editing.roomType || 'classroom'),
                });
              }}
              className="border rounded-xl px-3 py-2 text-xs"
            >
              <option value="theory">Theory</option>
              <option value="lab">Lab</option>
            </select>
            <select
              value={editing.roomType || (editing.type === 'lab' ? 'lab' : 'classroom')}
              onChange={(e) => setEditing({ ...editing, roomType: e.target.value as 'classroom' | 'lab' | 'any' })}
              className="border rounded-xl px-3 py-2 text-xs"
              title="Preferred room type for scheduling"
            >
              <option value="classroom">Classroom</option>
              <option value="lab">Lab Room</option>
              <option value="any">Any Available</option>
            </select>
            <select
              value={editing.facultyId || ''}
              onChange={(e) => setEditing({ ...editing, facultyId: e.target.value || null })}
              className="border rounded-xl px-3 py-2 text-xs md:col-span-2"
            >
              <option value="">Select Faculty</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.name} ({t.employeeId})</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              placeholder="Weekly Hours"
              value={editing.weeklyHours || 1}
              onChange={(e) => setEditing({ ...editing, weeklyHours: Number(e.target.value) })}
              className="border rounded-xl px-3 py-2 text-xs"
            />
            <input
              type="number"
              min={30}
              placeholder="Lecture Duration (min)"
              value={editing.lectureDuration || 50}
              onChange={(e) => setEditing({ ...editing, lectureDuration: Number(e.target.value) })}
              className="border rounded-xl px-3 py-2 text-xs"
            />
            {editing.type === 'theory' && (
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(editing.hasLab)}
                  onChange={(e) => setEditing({ ...editing, hasLab: e.target.checked })}
                />
                Has Lab Component
              </label>
            )}
          </div>

          <div>
            <p className="text-[10px] font-semibold text-gray-500 mb-2">Preferred Days (optional)</p>
            <div className="flex flex-wrap gap-2">
              {WORKING_DAYS.filter((d) => config.workingDays.includes(d)).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => togglePreferredDay(day)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border ${
                    (editing.preferredDays || []).includes(day)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <input
            placeholder="Preferred slots (comma-separated, e.g. 10:00, 14:00)"
            value={(editing.preferredSlots || []).join(', ')}
            onChange={(e) =>
              setEditing({
                ...editing,
                preferredSlots: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
            className="w-full border rounded-xl px-3 py-2 text-xs"
          />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Course
            </button>
            <button
              onClick={() => setEditing(null)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-700">
            Courses ({courses.length})
          </span>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
        </div>
        {courses.length === 0 ? (
          <p className="text-xs text-gray-500 p-6 text-center">No courses configured for this branch/semester.</p>
        ) : (
          <div className="divide-y">
            {courses.map((course) => (
              <div key={course._id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-gray-800">{course.name}</p>
                  <p className="text-[10px] text-gray-500">
                    {course.code} · {course.type} · {course.roomType || 'any'} · {course.weeklyHours}h/wk
                    {course.facultyName ? ` · ${course.facultyName}` : ' · No faculty'}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => startEdit(course)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => course._id && handleDuplicate(course._id)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => course._id && handleDelete(course._id)}
                    className="p-2 rounded-lg border border-red-100 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
