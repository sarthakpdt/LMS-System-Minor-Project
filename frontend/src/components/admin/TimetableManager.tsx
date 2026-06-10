import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Trash2, Loader2, AlertCircle, CheckCircle, Clock, MapPin, User, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

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
  CS: 'Computer Science', IT: 'Information Technology', ECE: 'Electronics & Comm.',
  EE: 'Electrical Eng.', ME: 'Mechanical Eng.', CE: 'Civil Eng.',
  CH: 'Chemical Eng.', BT: 'Biotechnology', MBA: 'MBA', MCA: 'MCA',
};

const DAY_COLORS: Record<string, { bg: string; text: string; gradient: string }> = {
  Monday: { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-600' },
  Tuesday: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-600' },
  Wednesday: { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-400', gradient: 'from-purple-500 to-indigo-600' },
  Thursday: { bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-400', gradient: 'from-orange-500 to-amber-600' },
  Friday: { bg: 'bg-pink-50 dark:bg-pink-950/20', text: 'text-pink-700 dark:text-pink-400', gradient: 'from-pink-500 to-rose-600' },
  Saturday: { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-400', gradient: 'from-amber-500 to-yellow-600' },
};

export default function TimetableManager() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
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

  const fetchCourseTeachers = async () => {
    try {
      const res = await fetch(`${API}/admin/courses`);
      const json = await res.json();
      const courses: any[] = json.data || [];

      const list: CourseTeacher[] = [];
      courses.forEach((c: any) => {
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
        setError('No courses have teachers assigned yet. Go to Courses and assign teachers first.');
      }
    } catch {
      setError('Could not load course-teacher data. Is the backend running?');
    }
  };

  useEffect(() => { fetchSlots(); fetchCourseTeachers(); }, []);
  useEffect(() => { fetchSlots(); }, [filterSem, filterDept]);

  const handleCourseTeacherSelect = (value: string) => {
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
        toast.success('Timetable slot created!');
        setForm({ subject: '', day: 'Monday', startTime: '09:00', endTime: '10:00', semester: '1', department: 'CS', teacherId: '', room: '' });
        setShowForm(false);
        fetchSlots();
      } else {
        setError(json.message || 'Failed to create slot. Conflict detected.');
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
        toast.success('Slot removed.');
      } else {
        setError('Delete failed: ' + (json.message || ''));
      }
    } catch { setError('Delete failed.'); }
  };

  const grouped: Record<string, TimetableSlot[]> = {};
  slots.forEach(s => { if (!grouped[s.day]) grouped[s.day] = []; grouped[s.day].push(s); });

  const dropdownOptions = courseTeachers.map(ct => ({
    value: `${ct.teacherId}::${ct.courseId}`,
    label: `${ct.courseName} (${ct.courseCode}) — ${ct.teacherName}`,
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Timetable Manager
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Build and organize weekly schedules. Only courses with assigned faculty are selectable.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Add Slot'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Add Slot Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            onSubmit={handleCreate}
            className="bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/50 rounded-2xl shadow-sm p-6 space-y-5"
          >
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">New Timetable Slot Configuration</h3>

            {courseTeachers.length === 0 ? (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-400 font-medium">
                ⚠️ <strong>No courses have teachers assigned.</strong> Please go to the <strong>Courses</strong> section to assign teachers first.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Course & Assignee *
                  </label>
                  <select
                    value={form.teacherId && form.subject ? `${form.teacherId}::${courseTeachers.find(c => c.teacherId === form.teacherId && c.courseName === form.subject)?.courseId || ''}` : ''}
                    onChange={e => handleCourseTeacherSelect(e.target.value)}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white font-medium"
                  >
                    <option value="">Select course + teacher…</option>
                    {dropdownOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {form.subject && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5">
                      ✓ Subject, department & semester auto-filled
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Day</label>
                  <select value={form.day} onChange={e => setForm(p => ({ ...p, day: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white font-medium">
                    {DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Semester</label>
                  <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white font-medium">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
                  <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white font-medium">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{DEPT_LABELS[d] || d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Room Location</label>
                  <input type="text" value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))}
                    placeholder="e.g. Room 101"
                    className="w-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white font-medium" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Start Time</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">End Time</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white font-mono" />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving || courseTeachers.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? 'Creating…' : 'Create Slot'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-900 transition-all">
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filter Options */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={filterSem} onChange={e => setFilterSem(e.target.value)}
          className="border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-slate-300 font-medium">
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-slate-300 font-medium">
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{DEPT_LABELS[d] || d}</option>)}
        </select>
        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider self-center">
          {slots.length} class slot{slots.length !== 1 ? 's' : ''} filtered
        </span>
      </div>

      {/* Day Columns Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-500 dark:text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading weekly schedules...</span>
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200/80 dark:border-slate-700/50 py-16 text-center text-gray-400 dark:text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm text-gray-900 dark:text-white">No schedule configurations found</p>
          <p className="text-xs mt-1 max-w-xs mx-auto">Create class slots using the action button or adjust filters above.</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {DAYS.map(day => {
            const daySlots = grouped[day] || [];
            if (daySlots.length === 0) return null;
            const colors = DAY_COLORS[day] || { bg: 'bg-gray-50', text: 'text-gray-700', gradient: 'from-gray-500 to-gray-600' };

            return (
              <motion.div
                key={day}
                variants={itemVariants}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200/80 dark:border-slate-700/50 shadow-xs flex flex-col overflow-hidden"
              >
                {/* Header for Day Card */}
                <div className={`p-4 text-white bg-gradient-to-r ${colors.gradient} flex items-center justify-between`}>
                  <h3 className="font-black text-sm tracking-wide flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white/90" />
                    {day}
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
                    {daySlots.length} Classes
                  </span>
                </div>

                {/* List of slots under day */}
                <div className="p-4 space-y-3 flex-1 bg-gray-50/30 dark:bg-slate-900/10">
                  {daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(slot => (
                    <div
                      key={slot._id}
                      className="group relative flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/60 hover:border-purple-500/20 hover:shadow-sm transition-all duration-300"
                    >
                      <div className="w-14 flex-shrink-0 text-[10px] font-bold text-purple-600 dark:text-purple-400 font-mono flex flex-col pt-0.5 leading-tight gap-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-purple-400" />{slot.startTime}</span>
                        <span className="text-gray-400 dark:text-slate-600 pl-4">{slot.endTime}</span>
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-gray-900 dark:text-white text-xs leading-snug">{slot.subject}</p>
                        
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-[9px] font-bold">
                          <span className="text-gray-500 dark:text-slate-400 flex items-center gap-0.5">
                            <User className="w-3 h-3" />
                            {slot.teacherName}
                          </span>
                          <span className="text-gray-300 dark:text-slate-700">•</span>
                          <span className="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 px-1.5 py-0.5 rounded-md border border-purple-100/50 dark:border-purple-900/30">
                            Sem {slot.semester}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded-md border border-blue-100/50 dark:border-blue-900/30">
                            {slot.department}
                          </span>
                          {slot.room && (
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {slot.room}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete slot button */}
                      <button
                        onClick={() => handleDelete(slot._id)}
                        className="absolute right-2 top-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}