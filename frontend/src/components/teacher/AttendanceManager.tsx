import { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';

const API = 'http://localhost:5000/api';

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface TimetableSlot {
  _id: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  semester: number;
  department: string;
}

interface AttendanceRecord {
  date: string;
  subject: string;
  records: { studentName: string; status: string }[];
}

interface Props {
  teacherId?: string;
  teacherName?: string;
}

export default function AttendanceManager({ teacherId, teacherName }: Props) {
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pastRecords, setPastRecords] = useState<AttendanceRecord[]>([]);
  const [view, setView] = useState<'mark' | 'history'>('mark');
  const [error, setError] = useState('');

  // Load timetable slots assigned to this teacher
  useEffect(() => {
    if (!teacherId) return;
    fetch(`${API}/timetable/teacher/${teacherId}`)
      .then(r => r.json())
      .then(j => setTimetableSlots(j.slots || []))
      .catch(() => setError('Could not load timetable. Make sure admin has created a timetable.'));
  }, [teacherId]);

  // Load students when a slot is selected
  useEffect(() => {
    if (!selectedSlot) return;
    setLoading(true);
    setError('');
    fetch(`${API}/attendance/students?semester=${selectedSlot.semester}&department=${selectedSlot.department}`)
      .then(r => r.json())
      .then(j => {
        const studs: Student[] = j.students || [];
        setStudents(studs);
        // Default everyone to present
        const init: Record<string, 'present' | 'absent' | 'late'> = {};
        studs.forEach(s => { init[s._id] = 'present'; });
        setAttendance(init);
      })
      .catch(() => setError('Could not load students.'))
      .finally(() => setLoading(false));
  }, [selectedSlot]);

  // Load past attendance records for this teacher
  useEffect(() => {
    if (!teacherId || view !== 'history') return;
    fetch(`${API}/attendance/teacher/${teacherId}`)
      .then(r => r.json())
      .then(j => setPastRecords(j.records || []))
      .catch(() => {});
  }, [teacherId, view]);

  const toggle = (id: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({ ...prev, [id]: status }));
  };

  const markAll = (status: 'present' | 'absent') => {
    const next: Record<string, 'present' | 'absent' | 'late'> = {};
    students.forEach(s => { next[s._id] = status; });
    setAttendance(next);
  };

  const handleSave = async () => {
    if (!selectedSlot || !teacherId) return;
    setSaving(true);
    setError('');
    try {
      const records = students.map(s => ({
        studentId: s._id,
        studentName: s.name,
        status: attendance[s._id] || 'absent',
      }));
      const res = await fetch(`${API}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          subject: selectedSlot.subject,
          timetableSlotId: selectedSlot._id,
          teacherId,
          teacherName,
          records,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(json.message || 'Failed to save attendance.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const present = students.filter(s => attendance[s._id] === 'present').length;
  const absent = students.filter(s => attendance[s._id] === 'absent').length;
  const late = students.filter(s => attendance[s._id] === 'late').length;

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const groupedSlots: Record<string, TimetableSlot[]> = {};
  timetableSlots.forEach(slot => {
    if (!groupedSlots[slot.day]) groupedSlots[slot.day] = [];
    groupedSlots[slot.day].push(slot);
  });

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2 border-b border-gray-200 pb-1">
        {(['mark', 'history'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors capitalize ${
              view === v ? 'bg-white border border-b-white border-gray-200 text-emerald-600 -mb-px' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {v === 'mark' ? '✏️ Mark Attendance' : '📋 History'}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {view === 'mark' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Timetable slot picker */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" /> Select Class
              </h3>
              <div className="mb-3">
                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  value={date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {timetableSlots.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No timetable slots assigned.</p>
                  <p className="text-xs mt-1">Ask your admin to create a timetable.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayOrder.filter(d => groupedSlots[d]).map(day => (
                    <div key={day}>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{day}</p>
                      {groupedSlots[day].map(slot => (
                        <button
                          key={slot._id}
                          onClick={() => { setSelectedSlot(slot); setSaved(false); }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm mb-1 transition-all ${
                            selectedSlot?._id === slot._id
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                              : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-700'
                          }`}
                        >
                          <p className="font-medium">{slot.subject}</p>
                          <p className="text-xs text-gray-400">{slot.startTime} – {slot.endTime} · Sem {slot.semester}</p>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Student attendance grid */}
          <div className="lg:col-span-2">
            {!selectedSlot ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a class from the left to mark attendance</p>
                </div>
              </div>
            ) : loading ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center h-64 gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading students...
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedSlot.subject}</h3>
                    <p className="text-xs text-gray-500">{date} · {students.length} students · Sem {selectedSlot.semester}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-3 text-xs mr-2">
                      <span className="text-green-600 font-semibold">✓ {present}</span>
                      <span className="text-red-500 font-semibold">✗ {absent}</span>
                      <span className="text-yellow-500 font-semibold">⏱ {late}</span>
                    </div>
                    <button onClick={() => markAll('present')} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 transition">All Present</button>
                    <button onClick={() => markAll('absent')} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 transition">All Absent</button>
                  </div>
                </div>

                {students.length === 0 ? (
                  <div className="py-10 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No students found for this semester/department.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                    {students.map(student => {
                      const status = attendance[student._id] || 'absent';
                      return (
                        <div key={student._id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-emerald-700">{student.name?.[0]?.toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{student.name}</p>
                              <p className="text-xs text-gray-400">{student.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {(['present', 'late', 'absent'] as const).map(s => (
                              <button
                                key={s}
                                onClick={() => toggle(student._id, s)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  status === s
                                    ? s === 'present' ? 'bg-green-500 text-white border-green-500'
                                      : s === 'late' ? 'bg-yellow-400 text-white border-yellow-400'
                                      : 'bg-red-500 text-white border-red-500'
                                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {s === 'present' ? <CheckCircle className="w-3 h-3" /> : s === 'late' ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                <span className="capitalize hidden sm:inline">{s}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                  {saved && <span className="text-green-600 text-sm font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Attendance saved!</span>}
                  {!saved && <span />}
                  <button
                    onClick={handleSave}
                    disabled={saving || students.length === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {saving ? 'Saving…' : 'Save Attendance'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Past Attendance Records</h3>
          </div>
          {pastRecords.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No records yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pastRecords.map((r, i) => {
                const p = r.records.filter(x => x.status === 'present').length;
                const total = r.records.length;
                return (
                  <div key={i} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{r.subject}</p>
                      <p className="text-xs text-gray-400">{r.date}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-600 font-medium">{p} present</span>
                      <span className="text-red-500 font-medium">{total - p} absent</span>
                      <span className="text-gray-500">{total} total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}