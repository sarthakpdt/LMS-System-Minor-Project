import React, { useState } from 'react';
import { TtEntry, TtConfig } from './types';
import { Clock, MapPin, User, Info, Move, Edit } from 'lucide-react';

interface TimetableGridProps {
  entries: TtEntry[];
  config: TtConfig;
  onCellClick?: (entry: TtEntry, index: number) => void;
  onSwapCell?: (indexA: number, indexB: number) => void;
  isEditable?: boolean;
}

export default function TimetableGrid({
  entries,
  config,
  onCellClick,
  onSwapCell,
  isEditable = false,
}: TimetableGridProps) {
  const workingDays = config.workingDays;
  const timeSlots = config.timeSlots;
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isEditable) return;
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditable) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!isEditable) return;
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (sourceIndexStr !== '') {
      const sourceIndex = parseInt(sourceIndexStr, 10);
      if (sourceIndex !== targetIndex && onSwapCell) {
        onSwapCell(sourceIndex, targetIndex);
      }
    }
    setDraggedIndex(null);
  };

  // Render helper for cell content
  const renderCell = (day: string, slotLabel: string) => {
    const index = entries.findIndex(
      (e) => e.day === day && e.timeSlot.label === slotLabel
    );
    const entry = index !== -1 ? entries[index] : null;

    if (!entry) {
      return (
        <div className="h-full min-h-[72px] border border-dashed border-gray-200 rounded-xl bg-gray-50/20 flex items-center justify-center text-[10px] text-gray-300 italic">
          No data
        </div>
      );
    }

    const type = (entry.subjectType || '').toLowerCase();
    const isLunch = entry.isLunch || type === 'lunch';
    const isFree = entry.isFree || type === 'free' || type === 'free slot';

    if (isLunch) {
      return (
        <div className="h-full min-h-[72px] bg-purple-50/40 border border-purple-100 rounded-xl flex flex-col items-center justify-center p-2 text-center text-[11px] text-purple-700 font-bold uppercase tracking-wider shadow-sm">
          <Clock className="w-3.5 h-3.5 mb-1 text-purple-400 animate-pulse" />
          Lunch Break
        </div>
      );
    }

    if (isFree) {
      return (
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          onClick={() => isEditable && onCellClick && onCellClick(entry, index)}
          className={`h-full min-h-[72px] border border-dashed border-gray-200 rounded-xl bg-gray-50/30 hover:bg-gray-50/60 hover:border-gray-300 transition-all flex flex-col items-center justify-center text-[10px] text-gray-400 font-medium tracking-wide uppercase cursor-pointer ${
            isEditable ? 'hover:scale-[1.01] active:scale-[0.99]' : ''
          }`}
        >
          Free Slot
        </div>
      );
    }

    let cardClasses = 'bg-blue-50/70 border border-blue-200 border-l-4 border-l-blue-600 text-blue-950 shadow-sm';
    let badgeClasses = 'bg-blue-100 text-blue-800 border border-blue-200';
    let typeLabel = 'Theory';

    if (type === 'lab') {
      cardClasses = 'bg-emerald-50/70 border border-emerald-200 border-l-4 border-l-emerald-600 text-emerald-950 shadow-sm';
      badgeClasses = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      typeLabel = 'Lab';
    } else if (type === 'tutorial') {
      cardClasses = 'bg-amber-50/70 border border-amber-200 border-l-4 border-l-amber-600 text-amber-950 shadow-sm';
      badgeClasses = 'bg-amber-100 text-amber-850 border border-amber-200';
      typeLabel = 'Tutorial';
    } else if (type === 'exam') {
      cardClasses = 'bg-rose-50/70 border border-rose-200 border-l-4 border-l-rose-600 text-rose-950 shadow-sm';
      badgeClasses = 'bg-rose-100 text-rose-800 border border-rose-200';
      typeLabel = 'Exam';
    }

    const isBeingDragged = draggedIndex === index;

    return (
      <div
        draggable={isEditable}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index)}
        onClick={() => onCellClick && onCellClick(entry, index)}
        className={`group relative h-full min-h-[76px] border p-2.5 rounded-xl transition-all shadow-sm flex flex-col justify-between text-left select-none ${cardClasses} ${
          isEditable ? 'cursor-grab active:cursor-grabbing hover:scale-[1.02] hover:shadow-md' : ''
        } ${isBeingDragged ? 'opacity-40 border-dashed border-gray-400' : ''}`}
      >
        <div className="w-full">
          <div className="flex justify-between items-start gap-1">
            <h5 className="font-bold text-[11px] leading-tight truncate group-hover:text-clip group-hover:whitespace-normal break-words max-w-[95px]">
              {entry.subjectName}
            </h5>
            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${badgeClasses}`}>
              {typeLabel}
            </span>
          </div>
          
          <div className="flex items-center gap-1 mt-1 text-[9px] opacity-75 font-medium">
            <User className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate max-w-[80px]">{entry.facultyName || 'TBA'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between w-full mt-1">
          {entry.roomName ? (
            <div className="flex items-center gap-1 text-[9px] font-bold opacity-80 uppercase tracking-wide">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate max-w-[70px]">{entry.roomName}</span>
            </div>
          ) : (
            <div className="w-1" />
          )}

          {isEditable && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <Move className="w-2.5 h-2.5 text-gray-400" />
              <Edit className="w-2.5 h-2.5 text-gray-500 hover:text-gray-800" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-purple-600 animate-pulse" /> Weekly Schedule Matrix
        </h4>
        <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
          <Info className="w-3.5 h-3.5 text-purple-400" /> 
          {isEditable ? 'Drag & Drop cards to reschedule, or click to edit details' : 'View-only timetable mode'}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full border-collapse table-fixed min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-3 px-4 text-left font-bold text-gray-500 text-[10px] uppercase tracking-wider w-24">Day</th>
              {timeSlots.map((slot, idx) => (
                <th key={idx} className="py-3 px-2 text-center font-bold text-gray-500 text-[10px] uppercase tracking-wider">
                  <div>{slot.label}</div>
                  <div className="text-[9px] text-gray-400 font-normal normal-case mt-0.5">{slot.startTime} - {slot.endTime}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {workingDays.map(day => (
              <tr key={day} className="hover:bg-gray-50/20 transition">
                <td className="py-4 px-4 font-bold text-gray-700 text-xs">
                  {day}
                </td>
                {timeSlots.map((slot, idx) => (
                  <td key={idx} className="py-2 px-1 text-center align-middle">
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

