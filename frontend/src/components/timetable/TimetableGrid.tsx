import React from 'react';
import { TtEntry, TtConfig } from './types';
import { Clock, MapPin, User, Info } from 'lucide-react';

interface TimetableGridProps {
  entries: TtEntry[];
  config: TtConfig;
}

export default function TimetableGrid({ entries, config }: TimetableGridProps) {
  const workingDays = config.workingDays;
  const timeSlots = config.timeSlots;

  // Render helper for cell content
  const renderCell = (day: string, slotLabel: string) => {
    const entry = entries.find(e => 
      e.day === day && 
      e.timeSlot.label === slotLabel
    );

    if (!entry) {
      return (
        <div className="h-full min-h-[60px] border border-dashed border-gray-100 rounded-lg bg-gray-50/20 flex items-center justify-center text-[10px] text-gray-300 italic">
          No data
        </div>
      );
    }

    if (entry.isLunch) {
      return (
        <div className="h-full min-h-[60px] bg-gray-100/70 border border-gray-200/50 rounded-lg flex flex-col items-center justify-center p-2 text-center text-[11px] text-gray-500 font-bold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5 mb-1 text-gray-400" />
          Lunch Break
        </div>
      );
    }

    if (entry.isFree || entry.subjectType === 'free') {
      return (
        <div className="h-full min-h-[60px] border border-dashed border-gray-100 rounded-lg bg-gray-50/10 hover:bg-gray-50/35 transition flex items-center justify-center text-[10px] text-gray-400 font-medium tracking-wide uppercase">
          Free Slot
        </div>
      );
    }

    const isLab = entry.subjectType === 'lab';

    return (
      <div className={`h-full min-h-[60px] border p-2.5 rounded-xl transition shadow-sm hover:shadow flex flex-col justify-between text-left ${
        isLab 
          ? 'bg-amber-50/60 border-amber-100 text-amber-900' 
          : 'bg-indigo-50/60 border-indigo-100 text-indigo-900'
      }`}>
        <div>
          <div className="flex justify-between items-start">
            <h5 className="font-bold text-[12px] leading-tight truncate max-w-[120px]">{entry.subjectName}</h5>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${
              isLab ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {isLab ? 'Lab' : 'Lect'}
            </span>
          </div>
          
          <div className="flex items-center gap-1 mt-1 text-[10px] opacity-75 font-medium">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{entry.facultyName || 'Instructor'}</span>
          </div>
        </div>

        {entry.roomName && (
          <div className="flex items-center gap-1 mt-2 text-[9px] font-bold opacity-80 uppercase tracking-wide">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span>{entry.roomName}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-purple-600" /> Weekly Schedule Matrix
        </h4>
        <span className="text-[10px] text-gray-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-purple-400" /> Hover cells for details
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full border-collapse table-fixed min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-3 px-4 text-left font-bold text-gray-500 text-[10px] uppercase tracking-wider w-28">Day</th>
              {timeSlots.map((slot, idx) => (
                <th key={idx} className="py-3 px-3 text-center font-bold text-gray-500 text-[10px] uppercase tracking-wider">
                  <div>{slot.label}</div>
                  <div className="text-[9px] text-gray-400 font-normal normal-case mt-0.5">{slot.startTime} - {slot.endTime}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {workingDays.map(day => (
              <tr key={day} className="hover:bg-gray-50/30 transition">
                <td className="py-4 px-4 font-bold text-gray-700 text-xs flex flex-col justify-center h-full">
                  {day}
                </td>
                {timeSlots.map((slot, idx) => (
                  <td key={idx} className="py-2.5 px-2 text-center h-full">
                    {renderCell(day, slot.label)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
