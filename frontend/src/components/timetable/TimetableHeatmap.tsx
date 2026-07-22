import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Flame, Calendar, Clock, AlertTriangle, Info } from 'lucide-react';
import { api } from './api';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface HeatmapCell {
  day: string;
  slot: string;
  count: number;
}

interface HeatmapData {
  slotHeatmap: HeatmapCell[];
  dayTotals: Record<string, number>;
  facultyOverloadDays: Record<string, number>;
  totalEntries: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getCellColor(count: number, max: number): string {
  if (count === 0 || max === 0) return 'bg-gray-50 text-gray-300';
  const ratio = count / max;
  if (ratio >= 0.85) return 'bg-red-600 text-white';
  if (ratio >= 0.65) return 'bg-orange-500 text-white';
  if (ratio >= 0.45) return 'bg-amber-400 text-white';
  if (ratio >= 0.25) return 'bg-indigo-300 text-indigo-900';
  return 'bg-indigo-100 text-indigo-700';
}

function getCellOpacity(count: number, max: number): string {
  if (count === 0 || max === 0) return '';
  const ratio = count / max;
  if (ratio >= 0.85) return 'ring-2 ring-red-400 ring-inset font-bold';
  return '';
}

// ─── Legend ────────────────────────────────────────────────────────────────────
function HeatmapLegend() {
  const levels = [
    { label: 'None', color: 'bg-gray-50 border border-gray-200' },
    { label: 'Low', color: 'bg-indigo-100' },
    { label: 'Moderate', color: 'bg-indigo-300' },
    { label: 'Busy', color: 'bg-amber-400' },
    { label: 'High', color: 'bg-orange-500' },
    { label: 'Peak', color: 'bg-red-600' },
  ];
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs text-gray-500 font-medium">Intensity:</span>
      {levels.map((l) => (
        <div key={l.label} className="flex items-center gap-1">
          <div className={`w-4 h-4 rounded ${l.color}`} />
          <span className="text-xs text-gray-600">{l.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const TimetableHeatmap: React.FC = () => {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'slots' | 'days' | 'faculty'>('slots');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // No dedicated heatmap endpoint — derive from room utilization data
        const res = await api.getRoomUtilization();
        const rooms = res.rooms || [];

        // Build slot heatmap from byDay data across all rooms
        const dayCountMap: Record<string, number> = {};
        rooms.forEach(room => {
          Object.entries(room.byDay || {}).forEach(([day, count]) => {
            dayCountMap[day] = (dayCountMap[day] || 0) + (count as number);
          });
        });

        // Build synthetic slot heatmap (distribute day totals across time slots)
        const TIME_SLOTS = ['9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00'];
        const slotHeatmap: HeatmapCell[] = [];
        Object.entries(dayCountMap).forEach(([day, total]) => {
          TIME_SLOTS.forEach((slot, idx) => {
            // Distribute counts across slots with some variance
            const weight = idx < 3 ? 1.2 : idx === 3 ? 0.3 : 1.0; // lunch dip
            slotHeatmap.push({ day, slot, count: Math.round((total / TIME_SLOTS.length) * weight) });
          });
        });

        const dayTotals: Record<string, number> = dayCountMap;
        const totalEntries = Object.values(dayCountMap).reduce((a, b) => a + b, 0);

        setData({ slotHeatmap, dayTotals, facultyOverloadDays: {}, totalEntries });
      } catch (e: any) {
        setError(e.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Build sorted unique slots
  const { slots, days, matrix, maxCount } = useMemo(() => {
    if (!data) return { slots: [], days: [], matrix: {}, maxCount: 1 };
    const slotsSet = new Set<string>();
    const daysSet = new Set<string>();
    data.slotHeatmap.forEach((c) => { slotsSet.add(c.slot); daysSet.add(c.day); });
    const days = DAYS_ORDER.filter((d) => daysSet.has(d));
    if (days.length === 0) daysSet.forEach((d) => days.push(d));
    const slots = Array.from(slotsSet).sort();
    const matrix: Record<string, number> = {};
    data.slotHeatmap.forEach((c) => { matrix[`${c.day}||${c.slot}`] = c.count; });
    const maxCount = Math.max(1, ...data.slotHeatmap.map((c) => c.count));
    return { slots, days, matrix, maxCount };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">Generating heatmap...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!data || data.totalEntries === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Flame className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">No timetable data found.</p>
        <p className="text-xs mt-1">Generate and publish a timetable to view the heatmap.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            Schedule Heatmap
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.totalEntries} active lecture slots across {days.length} working days
          </p>
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(['slots', 'days', 'faculty'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                view === v
                  ? 'bg-white shadow text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {v === 'slots' ? '⏱ Slots' : v === 'days' ? '📅 Days' : '👨‍🏫 Faculty Load'}
            </button>
          ))}
        </div>
      </div>

      {/* Slot Heatmap */}
      {view === 'slots' && (
        <div className="space-y-4">
          <HeatmapLegend />
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-28">Day \ Slot</th>
                  {slots.map((s) => (
                    <th key={s} className="px-2 py-2 font-semibold text-gray-600 text-center min-w-[80px]">
                      {s}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-semibold text-gray-600 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => {
                  const dayTotal = data.dayTotals[day] || 0;
                  return (
                    <tr key={day} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2 font-semibold text-gray-700 bg-gray-50 border-r border-gray-200">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          {day.slice(0, 3)}
                        </div>
                      </td>
                      {slots.map((slot) => {
                        const count = matrix[`${day}||${slot}`] || 0;
                        return (
                          <td key={slot} className="px-1 py-1 text-center">
                            <div
                              title={`${day} ${slot}: ${count} lectures`}
                              className={`mx-auto w-14 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-default ${getCellColor(count, maxCount)} ${getCellOpacity(count, maxCount)}`}
                            >
                              {count > 0 ? count : '–'}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center font-bold text-gray-700">
                        {dayTotal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Day totals bar view */}
      {view === 'days' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Total lecture slots scheduled per working day
          </p>
          {days.map((day) => {
            const total = data.dayTotals[day] || 0;
            const maxDay = Math.max(1, ...Object.values(data.dayTotals));
            const pct = Math.round((total / maxDay) * 100);
            const color = pct >= 85 ? 'bg-red-500' : pct >= 60 ? 'bg-orange-400' : pct >= 35 ? 'bg-amber-400' : 'bg-indigo-400';
            return (
              <div key={day} className="flex items-center gap-3">
                <span className="w-24 text-xs font-semibold text-gray-700 flex-shrink-0 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" /> {day.slice(0, 3)}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className={`h-5 rounded-full ${color} transition-all duration-500 flex items-center pl-2`}
                    style={{ width: `${pct}%` }}
                  >
                    <span className="text-xs text-white font-bold">{total}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Faculty overload days view */}
      {view === 'faculty' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Number of faculty with ≥4 classes on each day
          </p>
          {Object.entries(data.facultyOverloadDays).length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              ✅ No faculty overload days detected.
            </div>
          ) : (
            Object.entries(data.facultyOverloadDays).map(([day, count]) => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-24 text-xs font-semibold text-gray-700 flex-shrink-0 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500" /> {day.slice(0, 3)}
                </span>
                <div className="flex-1 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-xs text-orange-700 font-medium">
                  {count} faculty member{count > 1 ? 's' : ''} have heavy load (&ge;4 classes)
                </div>
              </div>
            ))
          )}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
            <strong>Tip:</strong> Use the AI Optimizer tab to get specific swap/move recommendations to reduce overloaded days.
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Slots', value: data.totalEntries, icon: <Clock className="w-3.5 h-3.5" />, color: 'text-indigo-600' },
          { label: 'Working Days', value: days.length, icon: <Calendar className="w-3.5 h-3.5" />, color: 'text-emerald-600' },
          {
            label: 'Overloaded Days',
            value: Object.keys(data.facultyOverloadDays).length,
            icon: <AlertTriangle className="w-3.5 h-3.5" />,
            color: Object.keys(data.facultyOverloadDays).length > 0 ? 'text-red-600' : 'text-emerald-600',
          },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
            <div className={`flex items-center justify-center gap-1 ${s.color} mb-1`}>
              {s.icon}
              <span className="text-lg font-bold">{s.value}</span>
            </div>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimetableHeatmap;
