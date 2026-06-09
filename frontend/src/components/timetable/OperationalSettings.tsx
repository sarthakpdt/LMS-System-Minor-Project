import React from 'react';
import { TtConfig, TimeSlot } from './types';
import { Clock, Plus, Trash2, CalendarDays } from 'lucide-react';

const ALL_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const;

const formatLabel = (start: string, end: string) => `${start} - ${end}`;

const emptySlot = (lectureDuration: number): TimeSlot => {
  const start = '09:00';
  const endMins = 9 * 60 + lectureDuration;
  const endH = String(Math.floor(endMins / 60)).padStart(2, '0');
  const endM = String(endMins % 60).padStart(2, '0');
  return {
    label: formatLabel(start, `${endH}:${endM}`),
    startTime: start,
    endTime: `${endH}:${endM}`,
    isBreak: false,
    breakType: null,
  };
};

interface Props {
  config: TtConfig;
  onChange: (config: TtConfig) => void;
}

export default function OperationalSettings({ config, onChange }: Props) {
  const toggleDay = (day: string) => {
    const active = config.workingDays.includes(day);
    const workingDays = active
      ? config.workingDays.filter((d) => d !== day)
      : [...config.workingDays, day];
    if (workingDays.length === 0) return;
    onChange({ ...config, workingDays });
  };

  const updateSlot = (index: number, patch: Partial<TimeSlot>) => {
    const timeSlots = config.timeSlots.map((slot, i) => {
      if (i !== index) return slot;
      const next = { ...slot, ...patch };
      if (patch.startTime !== undefined || patch.endTime !== undefined) {
        next.label = formatLabel(next.startTime, next.endTime);
      }
      if (patch.isBreak === false) {
        next.breakType = null;
      }
      if (patch.isBreak === true && !next.breakType) {
        next.breakType = 'short';
      }
      return next;
    });

    let lunchBreak = { ...config.lunchBreak };
    const lunchSlot = timeSlots.find((s) => s.isBreak && s.breakType === 'lunch');
    if (lunchSlot) {
      lunchBreak = { startTime: lunchSlot.startTime, endTime: lunchSlot.endTime };
    }

    onChange({ ...config, timeSlots, lunchBreak });
  };

  const addSlot = () => {
    const last = config.timeSlots[config.timeSlots.length - 1];
    let newSlot: TimeSlot;
    if (last) {
      const [h, m] = last.endTime.split(':').map(Number);
      const startMins = h * 60 + m + 10;
      const startH = String(Math.floor(startMins / 60)).padStart(2, '0');
      const startM = String(startMins % 60).padStart(2, '0');
      const endMins = startMins + (config.lectureDuration || 50);
      const endH = String(Math.floor(endMins / 60)).padStart(2, '0');
      const endM = String(endMins % 60).padStart(2, '0');
      newSlot = {
        label: formatLabel(`${startH}:${startM}`, `${endH}:${endM}`),
        startTime: `${startH}:${startM}`,
        endTime: `${endH}:${endM}`,
        isBreak: false,
        breakType: null,
      };
    } else {
      newSlot = emptySlot(config.lectureDuration || 50);
    }
    onChange({ ...config, timeSlots: [...config.timeSlots, newSlot] });
  };

  const removeSlot = (index: number) => {
    if (config.timeSlots.length <= 1) return;
    onChange({
      ...config,
      timeSlots: config.timeSlots.filter((_, i) => i !== index),
    });
  };

  const updateLunchPeriod = (field: 'startTime' | 'endTime', value: string) => {
    const lunchBreak = { ...config.lunchBreak, [field]: value };
    const timeSlots = config.timeSlots.map((slot) => {
      if (slot.isBreak && slot.breakType === 'lunch') {
        const next = {
          ...slot,
          startTime: field === 'startTime' ? value : slot.startTime,
          endTime: field === 'endTime' ? value : slot.endTime,
        };
        next.label = formatLabel(next.startTime, next.endTime);
        return next;
      }
      return slot;
    });
    onChange({ ...config, lunchBreak, timeSlots });
  };

  const markAsLunch = (index: number) => {
    const timeSlots = config.timeSlots.map((slot, i) => {
      if (i === index) {
        return { ...slot, isBreak: true, breakType: 'lunch' as const };
      }
      if (slot.breakType === 'lunch') {
        return { ...slot, isBreak: false, breakType: null };
      }
      return slot;
    });
    const lunchSlot = timeSlots[index];
    onChange({
      ...config,
      timeSlots,
      lunchBreak: {
        startTime: lunchSlot.startTime,
        endTime: lunchSlot.endTime,
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Academic year + lecture duration */}
      <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50 space-y-3">
        <h5 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-purple-600" /> Operational Parameters
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-gray-400 text-[10px] font-bold block mb-1">ACADEMIC YEAR</span>
            <input
              type="text"
              value={config.academicYear}
              onChange={(e) => onChange({ ...config, academicYear: e.target.value })}
              placeholder="e.g. 2024-25"
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
            />
          </div>
          <div>
            <span className="text-gray-400 text-[10px] font-bold block mb-1">LECTURE DURATION (MIN)</span>
            <input
              type="number"
              min={30}
              max={120}
              value={config.lectureDuration}
              onChange={(e) => onChange({ ...config, lectureDuration: Number(e.target.value) })}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
            />
          </div>
          <div>
            <span className="text-gray-400 text-[10px] font-bold block mb-1">LUNCH PERIOD</span>
            <div className="flex items-center gap-1">
              <input
                type="time"
                value={config.lunchBreak.startTime}
                onChange={(e) => updateLunchPeriod('startTime', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
              />
              <span className="text-gray-400">–</span>
              <input
                type="time"
                value={config.lunchBreak.endTime}
                onChange={(e) => updateLunchPeriod('endTime', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Working days */}
      <div className="border border-gray-100 rounded-xl p-5 bg-white space-y-3">
        <h5 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-purple-600" /> Working Days
        </h5>
        <p className="text-[10px] text-gray-500">Select which days classes run. At least one day is required.</p>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map((day) => {
            const active = config.workingDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                  active
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-purple-300'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div className="border border-gray-100 rounded-xl p-5 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-600" /> Daily Time Slots
          </h5>
          <button
            type="button"
            onClick={addSlot}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-semibold hover:bg-purple-100 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Slot
          </button>
        </div>
        <p className="text-[10px] text-gray-500">
          Define the college bell schedule. Mark one slot as lunch break for the generator.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase border-b">
                <th className="text-left py-2 pr-2">#</th>
                <th className="text-left py-2 pr-2">Start</th>
                <th className="text-left py-2 pr-2">End</th>
                <th className="text-left py-2 pr-2">Label</th>
                <th className="text-left py-2 pr-2">Break</th>
                <th className="text-left py-2 pr-2">Type</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {config.timeSlots.map((slot, index) => (
                <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 pr-2 text-gray-400 font-mono">{index + 1}</td>
                  <td className="py-2 pr-2">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(index, { startTime: e.target.value })}
                      className="border border-gray-200 rounded px-2 py-1 text-xs w-[7rem]"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(index, { endTime: e.target.value })}
                      className="border border-gray-200 rounded px-2 py-1 text-xs w-[7rem]"
                    />
                  </td>
                  <td className="py-2 pr-2 text-gray-600 font-medium">{slot.label}</td>
                  <td className="py-2 pr-2">
                    <input
                      type="checkbox"
                      checked={slot.isBreak}
                      onChange={(e) => updateSlot(index, { isBreak: e.target.checked })}
                      className="rounded"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    {slot.isBreak ? (
                      <select
                        value={slot.breakType || 'short'}
                        onChange={(e) => {
                          const breakType = e.target.value as 'lunch' | 'short';
                          if (breakType === 'lunch') {
                            markAsLunch(index);
                          } else {
                            updateSlot(index, { breakType });
                          }
                        }}
                        className="border border-gray-200 rounded px-2 py-1 text-xs bg-white"
                      >
                        <option value="short">Short Break</option>
                        <option value="lunch">Lunch</option>
                      </select>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      disabled={config.timeSlots.length <= 1}
                      className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 transition"
                      title="Remove slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
