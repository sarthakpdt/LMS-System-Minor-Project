import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Save, BookOpen, User, MapPin } from 'lucide-react';
import { TtEntry, TtSubject, TtRoom } from './types';
import { api } from './api';

interface EditLectureModalProps {
  entry: TtEntry;
  entryIndex: number;
  timetableId: string;
  onClose: () => void;
  onSaved: (updatedEntry: TtEntry) => void;
}

export default function EditLectureModal({
  entry,
  entryIndex,
  timetableId,
  onClose,
  onSaved,
}: EditLectureModalProps) {
  const [subjects, setSubjects] = useState<TtSubject[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<TtRoom[]>([]);

  const [subjectId, setSubjectId] = useState(entry.subjectId || '');
  const [facultyId, setFacultyId] = useState(entry.facultyId || '');
  const [roomId, setRoomId] = useState(entry.roomId || '');
  const [subjectType, setSubjectType] = useState<TtEntry['subjectType']>(entry.subjectType || 'theory');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      try {
        const [subRes, teachRes, roomRes] = await Promise.all([
          api.getSubjects({ branch: entry.branch, year: entry.year }),
          api.getTeachers(),
          api.getRooms(),
        ]);
        setSubjects(subRes.subjects || []);
        setTeachers(teachRes.data || []);
        setRooms(roomRes.rooms || []);
      } catch (err: any) {
        setError('Failed to load options. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadOptions();
  }, [entry.branch, entry.year]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const selectedSubject = subjects.find(s => s._id === subjectId || s.id === subjectId);
      const selectedTeacher = teachers.find(t => t._id === facultyId);
      const selectedRoom = rooms.find(r => r._id === roomId);

      const updates: Partial<TtEntry> = {
        subjectId: subjectId || null,
        subjectName: selectedSubject?.name || entry.subjectName,
        facultyId: facultyId || null,
        facultyName: selectedTeacher?.name || entry.facultyName,
        roomId: roomId || null,
        roomName: selectedRoom?.name || entry.roomName,
        subjectType,
        isFree: false,
        isLunch: false,
      };

      const res = await api.editEntry(timetableId, entryIndex, updates);
      onSaved(res.entry);
    } catch (err: any) {
      // Show user-friendly version of backend conflict error
      const msg = err.message || 'Failed to save changes.';
      if (msg.toLowerCase().includes('conflict') || msg.toLowerCase().includes('already')) {
        setError(`⚠️ Conflict detected: ${msg}`);
      } else if (msg.toLowerCase().includes('not found')) {
        setError('This lecture slot could not be found. Please refresh and try again.');
      } else {
        setError('Unable to save changes. Please check your input and try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div>
            <h2 className="text-sm font-bold text-white">Edit Lecture</h2>
            <p className="text-[10px] text-indigo-200 mt-0.5">
              {entry.day} · {entry.timeSlot?.startTime} – {entry.timeSlot?.endTime}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{error}</p>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  <BookOpen className="inline w-3 h-3 mr-1" />
                  Subject
                </label>
                <select
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value="">— Keep current —</option>
                  {subjects.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name} ({s.code}) · {s.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Faculty */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  <User className="inline w-3 h-3 mr-1" />
                  Faculty
                </label>
                <select
                  value={facultyId}
                  onChange={e => setFacultyId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value="">— Keep current —</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.employeeId || t.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Room */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  <MapPin className="inline w-3 h-3 mr-1" />
                  Room
                </label>
                <select
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value="">— Keep current —</option>
                  {rooms.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.name} · {r.type} (cap: {r.capacity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lecture Type */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Lecture Type
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(['theory', 'lab', 'tutorial', 'exam'] as TtEntry['subjectType'][]).map(t => (
                    <button
                      key={t}
                      onClick={() => setSubjectType(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        subjectType === t
                          ? t === 'theory' ? 'bg-blue-600 text-white border-blue-600'
                          : t === 'lab' ? 'bg-emerald-600 text-white border-emerald-600'
                          : t === 'tutorial' ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-red-600 text-white border-red-600'
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {(t as string).charAt(0).toUpperCase() + (t as string).slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info note */}
              <p className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 rounded-lg p-2.5 leading-relaxed">
                ℹ️ Changes will be validated against existing schedules. If a conflict is detected, the save will be rejected with the reason shown above.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
