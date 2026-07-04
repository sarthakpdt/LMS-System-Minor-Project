import React, { useState, useCallback } from 'react';
import { TtEntry, TtConflict, TtConfig } from './types';
import LectureCard from './LectureCard';

interface TimetableInteractiveGridProps {
  entries: TtEntry[];
  config: TtConfig | null;
  conflicts: TtConflict[];
  selectedIndex: number | null;
  isEditable?: boolean;
  filterBranch?: string;
  filterYear?: number;
  filterSection?: string;
  filterTeacherId?: string;
  filterRoomId?: string;
  searchQuery?: string;
  viewMode?: 'week' | 'day';
  activeDay?: string;
  onSelectEntry: (entry: TtEntry, index: number) => void;
  onSwapEntries: (indexA: number, indexB: number) => void;
  onEditEntry: (entry: TtEntry, index: number) => void;
  onDeleteEntry: (entry: TtEntry, index: number) => void;
}

/** Returns true if a conflict references this entry */
function isEntryConflicted(entry: TtEntry, conflicts: TtConflict[]): boolean {
  return conflicts.some(c => {
    const desc = (c.description || '').toLowerCase();
    return (
      (entry.subjectName && desc.includes(entry.subjectName.toLowerCase())) ||
      (entry.facultyName && desc.includes(entry.facultyName.toLowerCase())) ||
      (entry.roomName && desc.includes(entry.roomName.toLowerCase()))
    );
  });
}

// Skeleton cell for loading state
function SkeletonCell() {
  return (
    <div className="min-h-[84px] rounded-xl bg-gray-100 animate-pulse">
      <div className="h-3 bg-gray-200 rounded m-3 mt-4 w-3/4" />
      <div className="h-2 bg-gray-200 rounded mx-3 w-1/2" />
      <div className="h-2 bg-gray-200 rounded mx-3 mt-1 w-2/3" />
    </div>
  );
}

export default function TimetableInteractiveGrid({
  entries,
  config,
  conflicts,
  selectedIndex,
  isEditable = false,
  filterBranch,
  filterYear,
  filterSection,
  filterTeacherId,
  filterRoomId,
  searchQuery,
  viewMode = 'week',
  activeDay,
  onSelectEntry,
  onSwapEntries,
  onEditEntry,
  onDeleteEntry,
}: TimetableInteractiveGridProps) {

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ day: string; slotLabel: string } | null>(null);

  const workingDays = config?.workingDays ?? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = config?.timeSlots ?? [];

  const displayedDays = viewMode === 'day' && activeDay
    ? workingDays.filter(d => d === activeDay)
    : workingDays;

  // ── Filter entries client-side ──────────────────────────────────────────
  const filteredEntries = entries.filter(e => {
    if (filterBranch && e.branch !== filterBranch) return false;
    if (filterYear && e.year !== filterYear) return false;
    if (filterSection && e.section !== filterSection) return false;
    if (filterTeacherId && e.facultyId !== filterTeacherId) return false;
    if (filterRoomId && e.roomId !== filterRoomId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hit = [e.subjectName, e.facultyName, e.roomName, e.section, e.branch]
        .some(field => field?.toLowerCase().includes(q));
      if (!hit) return false;
    }
    return true;
  });

  // ── Entry lookup: day + slot label → { entry, index } ───────────────────
  const entryMap = new Map<string, { entry: TtEntry; index: number }>();
  filteredEntries.forEach((entry) => {
    const realIndex = entries.indexOf(entry);
    const key = `${entry.day}||${entry.timeSlot?.label || ''}`;
    if (!entryMap.has(key)) {
      entryMap.set(key, { entry, index: realIndex });
    }
  });

  // ── Drag handlers ────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!isEditable) return;
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  }, [isEditable]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverInfo(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, day: string, slotLabel: string) => {
    if (!isEditable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverInfo({ day, slotLabel });
  }, [isEditable]);

  const handleDrop = useCallback((e: React.DragEvent, targetDay: string, targetSlotLabel: string) => {
    if (!isEditable) return;
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (sourceIndexStr === '') return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    const targetKey = `${targetDay}||${targetSlotLabel}`;
    const target = entryMap.get(targetKey);
    if (target && target.index !== sourceIndex) {
      onSwapEntries(sourceIndex, target.index);
    }
    setDraggedIndex(null);
    setDragOverInfo(null);
  }, [isEditable, entryMap, onSwapEntries]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="timetable-print-area overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
      <table className="w-full border-collapse" style={{ minWidth: `${timeSlots.length * 160 + 100}px` }}>
        {/* Column group */}
        <colgroup>
          <col style={{ width: '100px', minWidth: '100px' }} />
          {timeSlots.map((_, idx) => (
            <col key={idx} style={{ minWidth: '160px' }} />
          ))}
        </colgroup>

        {/* Sticky header */}
        <thead>
          <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
            <th className="sticky left-0 z-20 bg-indigo-700 py-3 px-3 text-left text-[10px] font-bold uppercase tracking-widest border-r border-indigo-500/40">
              Day
            </th>
            {timeSlots.map((slot, idx) => (
              <th
                key={idx}
                className="py-3 px-3 text-center text-[11px] font-bold uppercase tracking-wider border-r border-indigo-500/30 last:border-0"
              >
                <div>{slot.label}</div>
                <div className="text-[9px] text-indigo-200 font-normal mt-0.5">{slot.startTime} - {slot.endTime}</div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {displayedDays.map((day, dayIdx) => {
            const rowBg = dayIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40';

            return (
              <tr key={day} className={`${rowBg} border-b border-gray-100 last:border-0`}>
                {/* Day label — sticky left */}
                <td className={`sticky left-0 z-10 py-3 px-3 border-r border-gray-100 align-middle font-bold text-[11px] text-gray-700 ${rowBg}`}>
                  {day}
                </td>

                {/* Slots as columns */}
                {timeSlots.map((slot, slotIdx) => {
                  const key = `${day}||${slot.label}`;
                  const found = entryMap.get(key);
                  const entry = found?.entry ?? null;
                  const entryIdx = found?.index ?? -1;
                  const isSelected = selectedIndex === entryIdx && entryIdx !== -1;
                  const isConflicted = entry ? isEntryConflicted(entry, conflicts) : false;
                  const isDragging = draggedIndex === entryIdx && entryIdx !== -1;
                  const isDragOver = dragOverInfo?.day === day && dragOverInfo?.slotLabel === slot.label;

                  return (
                    <td
                      key={slotIdx}
                      className="py-1.5 px-1.5 align-top border-r border-gray-100 last:border-0"
                      style={{ verticalAlign: 'top' }}
                    >
                      {entry ? (
                        <LectureCard
                          entry={entry}
                          entryIndex={entryIdx}
                          isSelected={isSelected}
                          isConflicted={isConflicted}
                          isDragging={isDragging}
                          isDragOver={isDragOver}
                          isEditable={isEditable && !entry.isLunch}
                          onClick={() => onSelectEntry(entry, entryIdx)}
                          onEdit={() => onEditEntry(entry, entryIdx)}
                          onDelete={() => onDeleteEntry(entry, entryIdx)}
                          onDragStart={(e) => handleDragStart(e, entryIdx)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, day, slot.label)}
                          onDrop={(e) => handleDrop(e, day, slot.label)}
                        />
                      ) : (
                        // Empty cell (no entry data for this slot)
                        <div
                          className={`min-h-[84px] rounded-xl border border-dashed transition-all duration-150
                            ${isDragOver
                              ? 'border-indigo-400 bg-indigo-50/60 scale-[1.01]'
                              : 'border-gray-200 bg-gray-50/20'}
                          `}
                          onDragOver={(e) => handleDragOver(e, day, slot.label)}
                          onDrop={(e) => handleDrop(e, day, slot.label)}
                        >
                          {isDragOver && (
                            <div className="h-full flex items-center justify-center text-[10px] text-indigo-500 font-medium">
                              Drop here
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}

          {/* No slots */}
          {timeSlots.length === 0 && (
            <tr>
              <td colSpan={displayedDays.length + 1} className="py-16 text-center text-sm text-gray-400">
                No time slots configured. Please set up the timetable configuration first.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Skeleton version for loading state
export function TimetableInteractiveGridSkeleton({ days = 5, slots = 8 }: { days?: number; slots?: number }) {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].slice(0, days);
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
      <table className="w-full border-collapse" style={{ minWidth: `${slots * 160 + 100}px` }}>
        <thead>
          <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <th className="sticky left-0 z-20 bg-indigo-700 py-3 px-3 text-left text-[10px] font-bold uppercase tracking-widest border-r border-indigo-500/40 w-24">
              Day
            </th>
            {Array.from({ length: slots }).map((_, idx) => (
              <th key={idx} className="py-3 px-3 text-center text-[11px] font-bold uppercase tracking-wider border-r border-indigo-500/30 last:border-0">
                Slot {idx + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dayNames.map((d, di) => (
            <tr key={d} className={`${di % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} border-b border-gray-100`}>
              <td className="sticky left-0 z-10 py-3 px-3 border-r border-gray-100 bg-inherit font-bold text-[11px] text-gray-500">
                {d}
              </td>
              {Array.from({ length: slots }).map((_, si) => (
                <td key={si} className="py-1.5 px-1.5 border-r border-gray-100 last:border-0">
                  <SkeletonCell />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

