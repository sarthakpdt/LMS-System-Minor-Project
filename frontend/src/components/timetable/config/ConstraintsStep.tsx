import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Clock, CalendarDays, Shield } from 'lucide-react';
import { manageApi, engineApi } from '../manageApi';
import { SchedulingRules, TtLectureSlot, UnifiedTtConfig } from '../types';
import { StepHeader, FieldLabel, inputClass, btnPrimary, idOf } from './shared';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Props {
  academicYearId: string;
  academicYearLabel: string;
  unified: UnifiedTtConfig | null;
  onRefresh: () => Promise<void>;
  onDirty: () => void;
}

const defaultRules: SchedulingRules = {
  maxClassesPerDay: 6,
  maxConsecutiveLectures: 3,
  maxLabsPerDay: 2,
  lectureDuration: 50,
  dayStartTime: '09:00',
  dayEndTime: '17:00',
};

export default function ConstraintsStep({
  academicYearId,
  academicYearLabel,
  unified,
  onRefresh,
  onDirty,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [slots, setSlots] = useState<Array<Partial<TtLectureSlot>>>([]);
  const [lunch, setLunch] = useState({ startTime: '13:00', endTime: '14:00' });
  const [rules, setRules] = useState<SchedulingRules>(defaultRules);

  useEffect(() => {
    if (!unified) return;
    if (unified.workingDays?.length) {
      setSelectedDays(unified.workingDays.map((d) => d.dayName));
    }
    if (unified.timeSlots?.length) {
      setSlots(unified.timeSlots.map((s) => ({ ...s })));
    } else {
      setSlots([
        { label: '09:00 - 09:50', startTime: '09:00', endTime: '09:50', slotNumber: 1, duration: 50, isBreak: false, breakType: null },
        { label: '10:00 - 10:50', startTime: '10:00', endTime: '10:50', slotNumber: 2, duration: 50, isBreak: false, breakType: null },
        { label: '11:00 - 11:50', startTime: '11:00', endTime: '11:50', slotNumber: 3, duration: 50, isBreak: false, breakType: null },
        { label: '13:00 - 14:00', startTime: '13:00', endTime: '14:00', slotNumber: 4, duration: 60, isBreak: true, breakType: 'lunch' },
        { label: '14:00 - 14:50', startTime: '14:00', endTime: '14:50', slotNumber: 5, duration: 50, isBreak: false, breakType: null },
        { label: '15:00 - 15:50', startTime: '15:00', endTime: '15:50', slotNumber: 6, duration: 50, isBreak: false, breakType: null },
      ]);
    }
    if (unified.lunchBreak) {
      setLunch({ startTime: unified.lunchBreak.startTime, endTime: unified.lunchBreak.endTime });
    }
  }, [unified]);

  useEffect(() => {
    engineApi.getConfig().then((res) => {
      if (res.config.schedulingRules) {
        setRules(res.config.schedulingRules);
      } else if (res.config.lectureDuration) {
        setRules((r) => ({ ...r, lectureDuration: res.config.lectureDuration }));
      }
    }).catch(() => {});
  }, []);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day];
    });
    onDirty();
  };

  const updateSlot = (index: number, patch: Partial<TtLectureSlot>) => {
    setSlots((prev) => prev.map((s, i) => {
      if (i !== index) return s;
      const next = { ...s, ...patch };
      if (patch.startTime || patch.endTime) {
        next.label = `${next.startTime} - ${next.endTime}`;
      }
      return next;
    }));
    onDirty();
  };

  const addSlot = () => {
    const last = slots[slots.length - 1];
    const num = slots.length + 1;
    setSlots([...slots, {
      label: '16:00 - 16:50',
      startTime: '16:00',
      endTime: '16:50',
      slotNumber: num,
      duration: rules.lectureDuration,
      isBreak: false,
      breakType: null,
    }]);
    onDirty();
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 1) return;
    setSlots(slots.filter((_, i) => i !== index));
    onDirty();
  };

  const validate = (): string | null => {
    if (selectedDays.length === 0) return 'Select at least one working day.';
    if (lunch.startTime >= lunch.endTime) return 'Lunch end time must be after start time.';
    if (rules.dayStartTime >= rules.dayEndTime) return 'Day end time must be after start time.';
    for (const slot of slots) {
      if (!slot.startTime || !slot.endTime) return 'All time slots need start and end times.';
      if (slot.startTime >= slot.endTime) return `Invalid slot: ${slot.label}`;
    }
    return null;
  };

  const handleSave = async () => {
    if (!academicYearId) {
      toast.error('Academic year is required.');
      return;
    }
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    try {
      await manageApi.bulkSetWorkingDays(
        academicYearId,
        selectedDays.map((dayName, i) => ({ dayName, dayOrder: i + 1, isHalfDay: false })),
      );

      const existingSlots = unified?.timeSlots || [];
      for (const old of existingSlots) {
        if (old._id) await manageApi.deleteLectureSlot(old._id);
      }

      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        await manageApi.createLectureSlot({
          label: s.label || `${s.startTime} - ${s.endTime}`,
          startTime: s.startTime!,
          endTime: s.endTime!,
          slotNumber: i + 1,
          duration: s.duration || rules.lectureDuration,
          isBreak: !!s.isBreak,
          breakType: s.breakType || null,
          academicYearId,
        });
      }

      if (unified?.lunchBreak?._id) {
        await manageApi.updateLunchBreak(unified.lunchBreak._id, {
          startTime: lunch.startTime,
          endTime: lunch.endTime,
          academicYearId,
        });
      } else {
        await manageApi.createLunchBreak({
          startTime: lunch.startTime,
          endTime: lunch.endTime,
          academicYearId,
        });
      }

      await engineApi.saveSchedulingRules(rules, academicYearLabel);
      await manageApi.syncLegacyConfig(academicYearId);

      toast.success('Constraints saved and synced.');
      onDirty();
      await onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save constraints.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <StepHeader
        title="Step 5 — Constraints"
        description="Configure working days, bell schedule, lunch break, and scheduling limits."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-100 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-purple-600" /> Working Days
          </h4>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                  selectedDays.includes(day) ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-gray-100 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" /> Scheduling Rules
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Max Classes / Day</FieldLabel>
              <input type="number" min={1} className={inputClass()} value={rules.maxClassesPerDay} onChange={(e) => { setRules({ ...rules, maxClassesPerDay: Number(e.target.value) }); onDirty(); }} />
            </div>
            <div>
              <FieldLabel>Max Consecutive</FieldLabel>
              <input type="number" min={1} className={inputClass()} value={rules.maxConsecutiveLectures} onChange={(e) => { setRules({ ...rules, maxConsecutiveLectures: Number(e.target.value) }); onDirty(); }} />
            </div>
            <div>
              <FieldLabel>Max Labs / Day</FieldLabel>
              <input type="number" min={0} className={inputClass()} value={rules.maxLabsPerDay} onChange={(e) => { setRules({ ...rules, maxLabsPerDay: Number(e.target.value) }); onDirty(); }} />
            </div>
            <div>
              <FieldLabel>Lecture Duration (min)</FieldLabel>
              <input type="number" min={30} max={180} className={inputClass()} value={rules.lectureDuration} onChange={(e) => { setRules({ ...rules, lectureDuration: Number(e.target.value) }); onDirty(); }} />
            </div>
            <div>
              <FieldLabel>Day Start</FieldLabel>
              <input type="time" className={inputClass()} value={rules.dayStartTime} onChange={(e) => { setRules({ ...rules, dayStartTime: e.target.value }); onDirty(); }} />
            </div>
            <div>
              <FieldLabel>Day End</FieldLabel>
              <input type="time" className={inputClass()} value={rules.dayEndTime} onChange={(e) => { setRules({ ...rules, dayEndTime: e.target.value }); onDirty(); }} />
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" /> Daily Time Slots
          </h4>
          <button type="button" onClick={addSlot} className="flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100">
            <Plus className="w-3.5 h-3.5" /> Add Slot
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <FieldLabel>Lunch Start</FieldLabel>
            <input type="time" className={inputClass()} value={lunch.startTime} onChange={(e) => { setLunch({ ...lunch, startTime: e.target.value }); onDirty(); }} />
          </div>
          <div>
            <FieldLabel>Lunch End</FieldLabel>
            <input type="time" className={inputClass()} value={lunch.endTime} onChange={(e) => { setLunch({ ...lunch, endTime: e.target.value }); onDirty(); }} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase text-gray-400">
              <tr>
                <th className="text-left py-2">#</th>
                <th className="text-left py-2">Start</th>
                <th className="text-left py-2">End</th>
                <th className="text-left py-2">Break</th>
                <th className="text-right py-2">Del</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, i) => (
                <tr key={i} className="border-t border-gray-50">
                  <td className="py-2 text-gray-400">{i + 1}</td>
                  <td className="py-2"><input type="time" className="border rounded px-2 py-1" value={slot.startTime || ''} onChange={(e) => updateSlot(i, { startTime: e.target.value })} /></td>
                  <td className="py-2"><input type="time" className="border rounded px-2 py-1" value={slot.endTime || ''} onChange={(e) => updateSlot(i, { endTime: e.target.value })} /></td>
                  <td className="py-2">
                    <select className="border rounded px-2 py-1" value={slot.isBreak ? (slot.breakType || 'short') : 'none'} onChange={(e) => {
                      const v = e.target.value;
                      if (v === 'none') updateSlot(i, { isBreak: false, breakType: null });
                      else updateSlot(i, { isBreak: true, breakType: v as 'lunch' | 'short' });
                    }}>
                      <option value="none">Lecture</option>
                      <option value="short">Short Break</option>
                      <option value="lunch">Lunch</option>
                    </select>
                  </td>
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => removeSlot(i)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" className={btnPrimary(saving)} disabled={saving || !academicYearId} onClick={handleSave}>
          <Save className="w-4 h-4" /> Save Constraints
        </button>
      </div>
    </div>
  );
}
