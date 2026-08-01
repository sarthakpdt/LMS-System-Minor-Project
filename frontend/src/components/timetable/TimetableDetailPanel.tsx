import React from 'react';
import {
  X, BookOpen, User, MapPin, Clock, Layers, Building2,
  Edit2, Trash2, Copy, AlertTriangle, AlertCircle, CheckCircle2,
  Calendar, GraduationCap, Tag
} from 'lucide-react';
import { TtEntry, TtConflict } from './types';

interface TimetableDetailPanelProps {
  entry: TtEntry | null;
  entryIndex: number | null;
  conflicts: TtConflict[];
  isEditable?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  theory:   { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   label: 'Theory' },
  lab:      { bg: 'bg-emerald-100',text: 'text-emerald-700',border: 'border-emerald-200', label: 'Lab' },
  tutorial: { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200',   label: 'Tutorial' },
  exam:     { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200',     label: 'Exam' },
  free:     { bg: 'bg-gray-100',   text: 'text-gray-500',   border: 'border-gray-200',    label: 'Free Slot' },
  lunch:    { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200',  label: 'Break' },
};

function getTypeKey(entry: TtEntry): string {
  if (entry.isLunch) return 'lunch';
  if (entry.isFree) return 'free';
  const t = (entry.subjectType || '').toLowerCase();
  if (['lab', 'tutorial', 'exam', 'lunch', 'free'].includes(t)) return t;
  return 'theory';
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-500" />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function TimetableDetailPanel({
  entry,
  entryIndex,
  conflicts,
  isEditable = false,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
}: TimetableDetailPanelProps) {

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-indigo-300" />
        </div>
        <h3 className="text-sm font-semibold text-gray-500 mb-1">No Lecture Selected</h3>
        <p className="text-xs text-gray-400">Click any lecture card on the grid to view its details here.</p>
      </div>
    );
  }

  const typeKey = getTypeKey(entry);
  const typeColor = TYPE_COLORS[typeKey] || TYPE_COLORS.theory;
  const isBreak = typeKey === 'lunch' || typeKey === 'free';

  const duration = (() => {
    try {
      if (!entry.timeSlot?.startTime || !entry.timeSlot?.endTime) return '—';
      const [sh, sm] = entry.timeSlot.startTime.split(':').map(Number);
      const [eh, em] = entry.timeSlot.endTime.split(':').map(Number);
      const mins = (eh * 60 + em) - (sh * 60 + sm);
      return `${mins} min`;
    } catch {
      return '—';
    }
  })();

  // Find conflicts that reference this entry's subject or faculty
  const relevantConflicts = conflicts.filter(c => {
    const desc = (c.description || '').toLowerCase();
    return (
      (entry.subjectName && desc.includes(entry.subjectName.toLowerCase())) ||
      (entry.facultyName && desc.includes(entry.facultyName.toLowerCase())) ||
      (entry.roomName && desc.includes(entry.roomName.toLowerCase()))
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-8 rounded-full ${typeKey === 'theory' ? 'bg-blue-500' : typeKey === 'lab' ? 'bg-emerald-500' : typeKey === 'tutorial' ? 'bg-amber-500' : typeKey === 'exam' ? 'bg-red-500' : typeKey === 'lunch' ? 'bg-purple-400' : 'bg-gray-300'}`} />
          <div>
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Lecture Details</h3>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide border ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}>
              {typeColor.label}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {/* Subject highlight card */}
        {!isBreak && (
          <div className={`rounded-xl border p-3 mb-3 ${typeColor.bg} ${typeColor.border}`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${typeColor.text} mb-1`}>Subject</p>
            <p className="text-sm font-bold text-gray-800 leading-snug">{entry.subjectName || 'Unknown'}</p>
          </div>
        )}
        {isBreak && (
          <div className="rounded-xl border bg-purple-50 border-purple-200 p-3 mb-3 text-center">
            <p className="text-sm font-bold text-purple-700">
              {typeKey === 'lunch' ? '☕ Lunch Break' : '—  Free Slot'}
            </p>
          </div>
        )}

        {/* Details list */}
        <div className="space-y-0 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white overflow-hidden px-3">
          {!isBreak && <InfoRow icon={User} label="Faculty" value={entry.facultyName || 'TBA'} />}
          <InfoRow icon={MapPin} label="Room" value={entry.roomName || '—'} />
          <InfoRow icon={Clock} label="Time" value={`${entry.timeSlot?.startTime} – ${entry.timeSlot?.endTime}`} />
          <InfoRow icon={Clock} label="Duration" value={duration} />
          <InfoRow icon={Building2} label="Branch" value={entry.branch || '—'} />
          <InfoRow icon={GraduationCap} label="Year / Semester" value={entry.year ? `Year ${entry.year}` : '—'} />
          <InfoRow icon={Layers} label="Section" value={entry.section || '—'} />
          <InfoRow icon={Calendar} label="Day" value={entry.day || '—'} />
          {!isBreak && <InfoRow icon={Tag} label="Type" value={typeColor.label} />}
        </div>

        {/* Conflicts */}
        {relevantConflicts.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h4 className="text-xs font-bold text-gray-700">
                Conflicts ({relevantConflicts.length})
              </h4>
            </div>
            <div className="space-y-2">
              {relevantConflicts.map((c, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-2.5 text-xs ${
                    c.severity === 'error'
                      ? 'bg-red-50 border-red-100 text-red-700'
                      : 'bg-amber-50 border-amber-100 text-amber-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {c.severity === 'error'
                      ? <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      : <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
                    <span className="font-bold uppercase text-[9px] tracking-wide">{c.type} {c.severity}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {relevantConflicts.length === 0 && !isBreak && (
          <div className="mt-4 flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>No conflicts detected for this lecture</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isEditable && !isBreak && (
        <div className="px-4 py-3 border-t border-gray-100 space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Actions</p>
          <button
            onClick={onEdit}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Lecture
          </button>
          <button
            onClick={onDuplicate}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicate
          </button>
          <button
            onClick={onDelete}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold border border-red-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete (Free Slot)
          </button>
        </div>
      )}
    </div>
  );
}
