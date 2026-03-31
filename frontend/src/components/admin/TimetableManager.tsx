import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const API = 'http://localhost:5000/api';

interface TimetableSlot {
  _id: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  semester: number;
  department: string;
  teacherName: string;
  room: string;
}

interface CourseTeacher {
  teacherId: string;
  teacherName: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  department: string;
  semester: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEPARTMENTS = ['CS', 'IT', 'ECE', 'EE', 'ME', 'CE', 'CH', 'BT', 'MBA', 'MCA'];
const DEPT_LABELS: Record<string, string> = {
  CS: 'Computer Science', IT: 'Information Technology', ECE: 'Electronics & Communication',
  EE: 'Electrical Engineering', ME: 'Mechanical Engineering', CE: 'Civil Engineering',
  CH: 'Chemical Engineering', BT: 'Biotechnology', MBA: 'MBA', MCA: 'MCA',
};
const DAY_COLOR: Record<string, string> = {
  Monday: 'bg-blue-50 border-blue-200 text-blue-800',
  Tuesday: 'bg-green-50 border-green-200 text-green-800',
  Wednesday: 'bg-purple-50 border-purple-200 text-purple-800',
  Thursday: 'bg-orange-50 border-orange-200 text-orange-800',
  Friday: 'bg-pink-50 border-pink-200 text-pink-800',
  Saturday: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

export default function TimetableManager() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  // courseTeachers = list of {teacherId, teacherName, courseId, courseName, ...}
  // built from the courses that HAVE a teacher assigned
  const [courseTeachers, setCourseTeachers] = useState<CourseTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterSem, setFilterSem] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Form state
  const [form, setForm] = useState({
    subject: '', day: 'Monday', startTime: '09:00', endTime: '10:00',
    semester: '1', department: 'CS', teacherId: '', room: ''
  });

  // ── Derived: when user picks a course-teacher, auto-fill subject ──
  const selectedCT = courseTeachers.find(ct => ct.teacherId === form.teacherId && ct.courseName === form.subject);

  // ── Fetch timetable slots ─────────────────────────────────────
  const fetchSlots = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSem) params.set('semester', filterSem);
      if (filterDept) params.set('department', filterDept);
      const res = await fetch(`${API}/timetable?${params.toString()}`);
      const json = await res.json();
      if (json.success) setSlots(json.slots || []);
      else setError('Failed to load timetable.');
    } catch {
      setError('Network error loading timetable.');
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch courses that have a teacher assigned ────────────────
  // This is the KEY fix: instead of fetching /admin/teachers (which returns
  // all teachers), we fetch courses and extract teacher info from each course
  // that has a teacher assigned. This ensures only teacher+course combos that
  // are actually set up appear in the dropdown.
  const fetchCourseTeachers = async () => {
    try {
      const res = await fetch(`${API}/admin/courses`);
      const json = await res.json();
      const courses: any[] = json.data || [];

      const list: CourseTeacher[] = [];
      courses.forEach((c: any) => {
        // Only include if teacher is properly assigned (has _id or is a string id)
        const t = c.teacher;
        if (t && (t._id || (typeof t === 'string' && t.length > 0))) {
          list.push({
            teacherId: t._id || t,
            teacherName: t.name || 'Unknown Teacher',
            courseId: c._id,
            courseName: c.courseName,
            courseCode: c.courseCode || '',
            department: c.department || 'CS',
            semester: c.semester || 1,
          });
        }
      });
      setCourseTeachers(list);

      if (list.length === 0) {
        setError('No courses have teachers assigned yet. Go to Courses in admin panel and assign teachers first.');
      }
    } catch {
      setError('Could not load course-teacher data. Is the backend running?');
    }
  };

  useEffect(() => { fetchSlots(); fetchCourseTeachers(); }, []);
  useEffect(() => { fetchSlots(); }, [filterSem, filterDept]);

  // When user selects a course-teacher entry, auto-fill subject, dept, semester
  const handleCourseTeacherSelect = (value: string) => {
    // value is "teacherId::courseId"
    const [tid, cid] = value.split('::');
    const ct = courseTeachers.find(c => c.teacherId === tid && c.courseId === cid);
    if (ct) {
      setForm(p => ({
        ...p,
        teacherId: ct.teacherId,
        subject: ct.courseName,
        department: ct.department,
        semester: String(ct.semester),
      }));
    } else {
      setForm(p => ({ ...p, teacherId: '', subject: '' }));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.subject.trim() || !form.teacherId) {
      setError('Please select a course & teacher from the dropdown.'); return;
    }
    if (form.startTime >= form.endTime) {
      setError('End time must be after start time.'); return;
    }
    setSaving(true);
    try {
      // Find teacher name
      const ct = courseTeachers.find(c => c.teacherId === form.teacherId && c.courseName === form.subject);
      const res = await fetch(`${API}/timetable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject,
          day: form.day,
          startTime: form.startTime,
          endTime: form.endTime,
          semester: Number(form.semester),
          department: form.department,
          teacherId: form.teacherId,
          teacherName: ct?.teacherName || '',
          room: form.room,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess('Timetable slot created!');
        setForm({ subject: '', day: 'Monday', startTime: '09:00', endTime: '10:00', semester: '1', department: 'CS', teacherId: '', room: '' });
        setShowForm(false);
        fetchSlots();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(json.message || 'Failed to create slot. This slot may already exist.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this timetable slot?')) return;
    try {
      const res = await fetch(`${API}/timetable/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setSlots(prev => prev.filter(s => s._id !== id));
        setSuccess('Slot removed.'); setTimeout(() => setSuccess(''), 2000);
      } else {
        setError('Delete failed: ' + (json.message || ''));
      }
    } catch { setError('Delete failed.'); }
  };

  // Group slots by day
  const grouped: Record<string, TimetableSlot[]> = {};
  slots.forEach(s => { if (!grouped[s.day]) grouped[s.day] = []; grouped[s.day].push(s); });

  // Build unique course-teacher options for dropdown
  // Deduplicate by "teacherId::courseId"
  const dropdownOptions = courseTeachers.map(ct => ({
    value: `${ct.teacherId}::${ct.courseId}`,
    label: `${ct.courseName} (${ct.courseCode}) — ${ct.teacherName}`,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" /> Timetable Manager
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Create class schedules. Only courses with assigned teachers appear below.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Add Slot'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 mb-1">New Timetable Slot</h3>

          {courseTeachers.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              ⚠️ <strong>No courses have teachers assigned.</strong> Go to the <strong>Courses</strong> section in admin panel → edit a course → assign a teacher. Then come back here to create timetable slots.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* KEY FIX: single dropdown — course + teacher combined */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Course & Teacher * <span className="text-gray-400">(only courses with assigned teachers shown)</span>
              </label>
              <select
                value={form.teacherId && form.subject ? `${form.teacherId}::${courseTeachers.find(c => c.teacherId === form.teacherId && c.courseName === form.subject)?.courseId || ''}` : ''}
                onChange={e => handleCourseTeacherSelect(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select course + teacher…</option>
                {dropdownOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {form.subject && (
                <p className="text-xs text-green-600 mt-1">✓ Subject, department & semester auto-filled from course</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
              <select value={form.day} onChange={e => setForm(p => ({ ...p, day: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Semester (auto-filled)</label>
              <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department (auto-filled)</label>
              <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                {DEPARTMENTS.map(d => <option key={d} value={d}>{DEPT_LABELS[d] || d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Room (optional)</label>
              <input type="text" value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))}
                placeholder="e.g. Room 101"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving || courseTeachers.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Creating…' : 'Create Slot'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterSem} onChange={e => setFilterSem(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{DEPT_LABELS[d] || d}</option>)}
        </select>
        <span className="text-xs text-gray-400 self-center">{slots.length} slot{slots.length !== 1 ? 's' : ''} total</span>
      </div>

      {/* Timetable Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading timetable…
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-14 text-center text-gray-400">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No timetable slots created yet</p>
          <p className="text-xs mt-1">Click "Add Slot" above to build the schedule.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.filter(d => grouped[d]).map(day => (
            <div key={day} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className={`px-5 py-3 border-b font-semibold text-sm flex items-center gap-2 ${DAY_COLOR[day]}`}>
                <Calendar className="w-4 h-4" /> {day}
                <span className="ml-auto text-xs font-normal opacity-70">
                  {grouped[day].length} class{grouped[day].length !== 1 ? 'es' : ''}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(slot => (
                  <div key={slot._id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 group transition">
                    <div className="w-24 flex-shrink-0 text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {slot.startTime}–{slot.endTime}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{slot.subject}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">{slot.teacherName}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Sem {slot.semester}</span>
                        <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{DEPT_LABELS[slot.department] || slot.department}</span>
                        {slot.room && <span className="text-xs text-gray-400">📍 {slot.room}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(slot._id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}