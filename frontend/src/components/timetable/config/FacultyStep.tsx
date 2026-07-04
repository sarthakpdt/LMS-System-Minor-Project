import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, Trash2, UserCheck } from 'lucide-react';
import { engineApi } from '../manageApi';
import { TtFacultyConstraint, Teacher } from '../types';
import { StepHeader, FieldLabel, inputClass, btnPrimary } from './shared';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Props {
  teachers: Teacher[];
  onRefresh: () => Promise<void>;
  onDirty: () => void;
}

export default function FacultyStep({ teachers, onRefresh, onDirty }: Props) {
  const [constraints, setConstraints] = useState<TtFacultyConstraint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({
    maxHoursPerDay: 4,
    maxHoursPerWeek: 20,
    availableDays: [] as string[],
    day: 'Monday',
    startTime: '14:00',
    endTime: '16:00',
    reason: 'Other engagement',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await engineApi.getFacultyConstraints();
      setConstraints(res.constraints);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load faculty constraints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const current = constraints.find((c) => c.facultyId === selectedId);
  const teacher = teachers.find((t) => t._id === selectedId);

  useEffect(() => {
    if (current) {
      setForm((f) => ({
        ...f,
        maxHoursPerDay: current.maxHoursPerDay,
        maxHoursPerWeek: current.maxHoursPerWeek,
      }));
    } else if (selectedId) {
      setForm((f) => ({ ...f, maxHoursPerDay: 4, maxHoursPerWeek: 20 }));
    }
  }, [selectedId, current]);

  const toggleAvailableDay = (day: string) => {
    setForm((f) => ({
      ...f,
      availableDays: f.availableDays.includes(day)
        ? f.availableDays.filter((d) => d !== day)
        : [...f.availableDays, day],
    }));
  };

  const handleSave = async () => {
    if (!selectedId) {
      toast.error('Select a faculty member.');
      return;
    }
    if (form.maxHoursPerDay < 1 || form.maxHoursPerWeek < 1) {
      toast.error('Maximum lectures must be at least 1.');
      return;
    }
    if (form.maxHoursPerDay > form.maxHoursPerWeek) {
      toast.error('Daily max cannot exceed weekly max.');
      return;
    }

    setSaving(true);
    try {
      const existing = constraints.find((c) => c.facultyId === selectedId);
      let unavailableSlots = existing?.unavailableSlots || [];

      if (form.startTime && form.endTime && form.startTime >= form.endTime) {
        toast.error('Unavailable slot end time must be after start time.');
        setSaving(false);
        return;
      }

      if (form.day && form.startTime && form.endTime) {
        const duplicate = unavailableSlots.some(
          (s) => s.day === form.day && s.startTime === form.startTime && s.endTime === form.endTime,
        );
        if (!duplicate) {
          unavailableSlots = [
            ...unavailableSlots,
            { day: form.day, startTime: form.startTime, endTime: form.endTime, reason: form.reason },
          ];
        }
      }

      await engineApi.saveFacultyConstraint({
        facultyId: selectedId,
        facultyName: teacher?.name || '',
        maxHoursPerDay: form.maxHoursPerDay,
        maxHoursPerWeek: form.maxHoursPerWeek,
        unavailableSlots,
      });

      toast.success('Faculty constraints saved.');
      onDirty();
      await load();
      await onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save faculty constraints.');
    } finally {
      setSaving(false);
    }
  };

  const removeUnavailable = async (slotIndex: number) => {
    if (!selectedId || !current) return;
    setSaving(true);
    try {
      const filtered = current.unavailableSlots.filter((_, i) => i !== slotIndex);
      await engineApi.saveFacultyConstraint({
        facultyId: selectedId,
        maxHoursPerDay: current.maxHoursPerDay,
        maxHoursPerWeek: current.maxHoursPerWeek,
        unavailableSlots: filtered,
      });
      toast.success('Unavailable slot removed.');
      onDirty();
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove slot.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      <StepHeader
        title="Step 3 — Faculty Management"
        description="Assign workload limits, available days, and blocked time slots for each faculty member."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-600" /> Select Faculty
          </h4>
          <FieldLabel>Faculty Member</FieldLabel>
          <select className={inputClass()} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Choose faculty...</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>{t.name} — {t.employeeId} ({t.department})</option>
            ))}
          </select>

          {teacher && (
            <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-gray-200">
              <p><strong>ID:</strong> {teacher.employeeId}</p>
              <p><strong>Department:</strong> {teacher.department}</p>
              <p><strong>Email:</strong> {teacher.email}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedId ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Max Lectures / Day</FieldLabel>
                  <input type="number" min={1} className={inputClass()} value={form.maxHoursPerDay} onChange={(e) => setForm({ ...form, maxHoursPerDay: Number(e.target.value) })} />
                </div>
                <div>
                  <FieldLabel>Max Lectures / Week</FieldLabel>
                  <input type="number" min={1} className={inputClass()} value={form.maxHoursPerWeek} onChange={(e) => setForm({ ...form, maxHoursPerWeek: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <FieldLabel>Preferred Available Days (optional)</FieldLabel>
                <div className="flex flex-wrap gap-2 mt-1">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleAvailableDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                        form.availableDays.includes(day)
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-500 border-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                <h5 className="text-xs font-bold text-gray-700">Add Unavailable Slot</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <select className={inputClass()} value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="time" className={inputClass()} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                  <input type="time" className={inputClass()} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                  <input className={inputClass()} placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                </div>
              </div>

              {current && current.unavailableSlots.length > 0 && (
                <div className="space-y-2">
                  <FieldLabel>Blocked Slots</FieldLabel>
                  {current.unavailableSlots.map((slot, idx) => (
                    <div key={slot._id || idx} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs">
                      <span>{slot.day} {slot.startTime}–{slot.endTime} — {slot.reason}</span>
                      <button type="button" onClick={() => removeUnavailable(idx)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button type="button" className={btnPrimary(saving)} disabled={saving} onClick={handleSave}>
                <Save className="w-4 h-4" /> Save Faculty Constraints
              </button>
            </>
          ) : (
            <p className="text-xs text-gray-400 py-10 text-center border border-dashed rounded-xl">Select a faculty member to configure constraints.</p>
          )}
        </div>
      </div>
    </div>
  );
}
