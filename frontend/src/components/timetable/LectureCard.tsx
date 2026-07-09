import React from 'react';
import { User, MapPin, Clock, Layers, GripVertical, Edit2, Trash2, Copy } from 'lucide-react';
import { TtEntry } from './types';

export type LectureType = 'theory' | 'lab' | 'tutorial' | 'exam' | 'free' | 'lunch';

interface LectureCardProps {
  entry: TtEntry;
  entryIndex: number;
  isSelected?: boolean;
  isConflicted?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  isEditable?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

const TYPE_STYLES: Record<string, {
  card: string;
  border: string;
  badge: string;
  label: string;
  icon: string;
}> = {
  theory: {
    card: 'bg-blue-50 hover:bg-blue-100/80',
    border: 'border-blue-200 border-l-blue-500',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    label: 'Theory',
    icon: '📖',
  },
  lab: {
    card: 'bg-emerald-50 hover:bg-emerald-100/80',
    border: 'border-emerald-200 border-l-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    label: 'Lab',
    icon: '🔬',
  },
  tutorial: {
    card: 'bg-amber-50 hover:bg-amber-100/80',
    border: 'border-amber-200 border-l-amber-500',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    label: 'Tutorial',
    icon: '✏️',
  },
  exam: {
    card: 'bg-red-50 hover:bg-red-100/80',
    border: 'border-red-200 border-l-red-500',
    badge: 'bg-red-100 text-red-700 border-red-200',
    label: 'Exam',
    icon: '📝',
  },
  free: {
    card: 'bg-gray-50/60 hover:bg-gray-100/60',
    border: 'border-dashed border-gray-200',
    badge: 'bg-gray-100 text-gray-500 border-gray-200',
    label: 'Free',
    icon: '—',
  },
  lunch: {
    card: 'bg-purple-50/70 hover:bg-purple-100/60',
    border: 'border-purple-200 border-l-purple-400',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    label: 'Break',
    icon: '☕',
  },
};

function getTypeKey(entry: TtEntry): string {
  if (entry.isLunch) return 'lunch';
  if (entry.isFree) return 'free';
  const t = (entry.subjectType || '').toLowerCase();
  if (t === 'lab') return 'lab';
  if (t === 'tutorial') return 'tutorial';
  if (t === 'exam') return 'exam';
  if (t === 'lunch') return 'lunch';
  if (t === 'free' || t === 'free slot') return 'free';
  return 'theory';
}

export default function LectureCard({
  entry,
  entryIndex,
  isSelected = false,
  isConflicted = false,
  isDragging = false,
  isDragOver = false,
  isEditable = false,
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: LectureCardProps) {
  const typeKey = getTypeKey(entry);
  const styles = TYPE_STYLES[typeKey] || TYPE_STYLES.theory;
  const isBreakSlot = typeKey === 'lunch' || typeKey === 'free';

  if (typeKey === 'lunch') {
    return (
      <div
        className={`
          h-full min-h-[84px] flex flex-col items-center justify-center rounded-xl border
          ${styles.card} ${styles.border}
          transition-all duration-150 select-none
          ${isDragOver ? 'ring-2 ring-purple-400 ring-offset-1' : ''}
        `}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <span className="text-lg">☕</span>
        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mt-1">Lunch Break</span>
        <span className="text-[9px] text-purple-400 mt-0.5">
          {entry.timeSlot?.startTime} – {entry.timeSlot?.endTime}
        </span>
      </div>
    );
  }

  if (typeKey === 'free') {
    return (
      <div
        className={`
          group h-full min-h-[84px] flex flex-col items-center justify-center rounded-xl border
          ${styles.card} ${styles.border}
          transition-all duration-150 select-none cursor-pointer
          ${isDragOver ? 'ring-2 ring-indigo-400 ring-offset-1 bg-indigo-50/60' : ''}
          ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}
        `}
        onClick={onClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider group-hover:text-gray-600 transition-colors">
          Free Slot
        </span>
        {isDragOver && (
          <span className="text-[9px] text-indigo-500 mt-1 animate-pulse">Drop here</span>
        )}
      </div>
    );
  }

  return (
    <div
      draggable={isEditable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
      className={`
        group relative h-full min-h-[84px] rounded-xl border border-l-4 p-2.5
        ${styles.card} ${styles.border}
        transition-all duration-150 select-none
        ${isEditable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 shadow-md' : 'shadow-sm hover:shadow-md'}
        ${isDragging ? 'opacity-40 scale-95 border-dashed border-gray-400 bg-gray-50' : ''}
        ${isDragOver ? 'ring-2 ring-indigo-400 ring-offset-1 scale-[1.01]' : ''}
        ${isConflicted ? 'ring-2 ring-red-400 ring-offset-1' : ''}
      `}
    >
      {/* Conflict badge */}
      {isConflicted && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm z-10">!</span>
      )}

      {/* Drag handle */}
      {isEditable && (
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-60 transition-opacity">
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>
      )}

      {/* Top row: Subject + Badge */}
      <div className="flex items-start justify-between gap-1 pr-4">
        <h5 className="font-bold text-[11px] leading-tight text-gray-800 line-clamp-2 flex-1">
          {entry.subjectName || 'Unknown Subject'}
        </h5>
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide border flex-shrink-0 ${styles.badge}`}>
          {styles.label}
        </span>
      </div>

      {/* Faculty */}
      <div className="flex items-center gap-1 mt-1.5 text-[9px] text-gray-500">
        <User className="w-2.5 h-2.5 flex-shrink-0" />
        <span className="truncate">{entry.facultyName || 'TBA'}</span>
      </div>

      {/* Section */}
      <div className="flex items-center gap-1 mt-0.5 text-[9px] text-gray-500">
        <Layers className="w-2.5 h-2.5 flex-shrink-0" />
        <span className="truncate">Section: {entry.branch}-{entry.section}</span>
      </div>

      {/* Room */}
      {entry.roomName && (
        <div className="flex items-center gap-1 mt-0.5 text-[9px] text-gray-500">
          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="truncate">{entry.roomName}</span>
        </div>
      )}

      {/* Time */}
      <div className="flex items-center gap-1 mt-0.5 text-[9px] text-gray-400">
        <Clock className="w-2.5 h-2.5 flex-shrink-0" />
        <span>{entry.timeSlot?.startTime} – {entry.timeSlot?.endTime}</span>
      </div>

      {/* Hover actions */}
      {isEditable && (
        <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors"
              title="Edit"
            >
              <Edit2 className="w-2.5 h-2.5 text-gray-600" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm hover:bg-red-50 hover:border-red-300 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-2.5 h-2.5 text-gray-600" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
