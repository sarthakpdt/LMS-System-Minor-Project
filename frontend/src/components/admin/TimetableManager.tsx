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

interface Teacher {
  _id: string;
  name: string;
  department: string;
  specialization: string;
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
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterSem, setFilterSem] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Form
  const [form, setForm] = useState({
    subject: '', day: 'Monday', startTime: '09:00', endTime: '10:00',
    semester: '1', department: 'CS', teacherId: '', room: ''
  });

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

  const fetchTeachers = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/teachers`);
      const json = await res.json();
      // Support both {data: [...]} and {teachers: [...]} response shapes
      setTeachers(json.data || json.teachers || []);
    } catch {}
  };

  useEffect(() => { fetchSlots(); fetchTeachers(); }, []);
  useEffect(() => { fetchSlots(); }, [filterSem, filterDept]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.subject.trim() || !form.teacherId) {
      setError('Subject and teacher are required.'); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/timetable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, semester: Number(form.semester) }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess('Timetable slot created!');
        setForm({ subject: '', day: 'Monday', startTime: '09:00', endTime: '10:00', semester: '1', department: 'CS', teacherId: '', room: '' });
        setShowForm(false);
        fetchSlots();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(json.message || 'Failed to create slot.');
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
      await fetch(`${API}/timetable/${id}`, { method: 'DELETE' });
      setSlots(prev => prev.filter(s => s._id !== id));
      setSuccess('Slot removed.');
      setTimeout(() => setSuccess(''), 2000);
    } catch {
      setError('Delete failed.');
    }
  };

  // Group slots by day for display
  const grouped: Record<string, TimetableSlot[]> = {};
  slots.forEach(s => {
    if (!grouped[s.day]) grouped[s.day] = [];
    grouped[s.day].push(s);
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" /> Timetable Manager
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Create class schedules — teachers use these to mark attendance.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
              <input type="text" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="e.g. Data Structures"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
              <select value={form.day} onChange={e => setForm(p => ({ ...p, day: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
              <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                {DEPARTMENTS.map(d => <option key={d} value={d}>{DEPT_LABELS[d] || d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assign Teacher *</label>
              <select value={form.teacherId} onChange={e => setForm(p => ({ ...p, teacherId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Select teacher…</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.name} ({t.department})</option>
                ))}
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
            <button type="submit" disabled={saving}
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
      </div>

      {/* Timetable Grid by Day */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading timetable…
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-14 text-center text-gray-400">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No timetable slots created yet</p>
          <p className="text-xs mt-1">Click "Add Slot" above to build the timetable.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.filter(d => grouped[d]).map(day => (
            <div key={day} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className={`px-5 py-3 border-b font-semibold text-sm flex items-center gap-2 ${DAY_COLOR[day]}`}>
                <Calendar className="w-4 h-4" /> {day}
                <span className="ml-auto text-xs font-normal opacity-70">{grouped[day].length} class{grouped[day].length !== 1 ? 'es' : ''}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(slot => (
                  <div key={slot._id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 group transition">
                    <div className="w-20 flex-shrink-0 text-xs text-gray-500 flex items-center gap-1">
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
                    <button onClick={() => handleDelete(slot._id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100">
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