import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw, Sparkles, Send, Download, FileText, FileSpreadsheet,
  Printer, Search, ChevronDown, AlertTriangle, AlertCircle, CheckCircle2,
  Undo2, CalendarDays, List, Loader2, Calendar, X, Filter,
  Eye, ZapOff, Info, LayoutGrid, Flame, Zap, GitBranch
} from 'lucide-react';
import { api } from './api';
import { TtEntry, TtConflict, TtGenerated, TtConfig, ValidationSummary } from './types';
import TimetableInteractiveGrid, { TimetableInteractiveGridSkeleton } from './TimetableInteractiveGrid';
import TimetableDetailPanel from './TimetableDetailPanel';
import EditLectureModal from './EditLectureModal';
import { exportToCsv, exportToExcel, exportToPdf, exportWholeCollegeTimetable } from './timetableExport';
import TimetableHeatmap from './TimetableHeatmap';
import AIWorkloadOptimizer from './AIWorkloadOptimizer';
import SemesterClonePanel from './SemesterClonePanel';
import SmartNotificationBanner from './SmartNotificationBanner';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ToolbarSelect({
  label,
  value,
  onChange,
  options,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: any;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-8 pr-7 py-2 text-xs font-medium bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-gray-300 transition-colors cursor-pointer min-w-[130px]"
      >
        <option value="">{label}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {Icon && (
        <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
          <Icon className="w-3.5 h-3.5 text-gray-400" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </div>
    </div>
  );
}

function ToolbarBtn({
  onClick,
  icon: Icon,
  label,
  variant = 'default',
  loading = false,
  disabled = false,
  title,
}: {
  onClick: () => void;
  icon: any;
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  const base = 'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border';
  const variants = {
    default:  'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm',
    primary:  'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    success:  'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    danger:   'bg-red-50 border-red-200 text-red-600 hover:bg-red-100',
    ghost:    'bg-transparent border-transparent text-gray-500 hover:bg-gray-100',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`${base} ${variants[variant]} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </button>
  );
}

function ConflictBadge({ conflicts }: { conflicts: TtConflict[] }) {
  const errors = conflicts.filter(c => c.severity === 'error').length;
  const warnings = conflicts.filter(c => c.severity === 'warning').length;
  if (conflicts.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>No Conflicts</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {errors > 0 && (
        <div className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errors} Error{errors > 1 ? 's' : ''}</span>
        </div>
      )}
      {warnings > 0 && (
        <div className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-600">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{warnings} Warning{warnings > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onGenerate, generating }: { onGenerate: () => void; generating: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
        <Calendar className="w-10 h-10 text-indigo-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-700 mb-2">No Timetable Generated</h3>
      <p className="text-sm text-gray-400 max-w-xs mb-8 leading-relaxed">
        No timetable has been generated yet. Click the button below to generate a new timetable using the AI scheduling engine.
      </p>
      <button
        onClick={onGenerate}
        disabled={generating}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {generating ? 'Generating...' : 'Generate Timetable'}
      </button>
    </div>
  );
}

function ExportMenu({
  onCsv, onExcel, onPdf, onWholeCollege, open, onToggle,
}: {
  onCsv: () => void;
  onExcel: () => void;
  onPdf: () => void;
  onWholeCollege: () => void;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
      >
        <Download className="w-3.5 h-3.5" />
        Export
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          <button onClick={() => { onCsv(); onToggle(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <FileText className="w-3.5 h-3.5 text-emerald-500" /> CSV (Filtered)
          </button>
          <button onClick={() => { onExcel(); onToggle(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" /> Excel (Filtered)
          </button>
          <button onClick={() => { onPdf(); onToggle(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Printer className="w-3.5 h-3.5 text-red-500" /> Print / PDF
          </button>
          <button onClick={() => { onWholeCollege(); onToggle(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100">
            <LayoutGrid className="w-3.5 h-3.5 text-purple-500" /> Whole College Excel
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MAX_UNDO = 10;

export default function TimetableViewDashboard() {
  // ── Data state ─────────────────────────────────────────────────────────
  const [config, setConfig] = useState<TtConfig | null>(null);
  const [timetable, setTimetable] = useState<TtGenerated | null>(null);
  const [entries, setEntries] = useState<TtEntry[]>([]);
  const [conflicts, setConflicts] = useState<TtConflict[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // ── Undo stack ─────────────────────────────────────────────────────────
  const undoStack = useRef<TtEntry[][]>([]);

  // ── UI state ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // ── Filter state ───────────────────────────────────────────────────────
  const [filterBranch, setFilterBranch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState('');
  const [filterRoomId, setFilterRoomId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [activeDay, setActiveDay] = useState<string>(DAYS[0]);

  // ── Selection state ────────────────────────────────────────────────────
  const [selectedEntry, setSelectedEntry] = useState<TtEntry | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [editingEntry, setEditingEntry] = useState<{ entry: TtEntry; index: number } | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'grid' | 'heatmap' | 'optimizer' | 'clone'>('grid');

  // ── Auto-dismiss success messages ──────────────────────────────────────
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // ── Initial load ───────────────────────────────────────────────────────
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [configRes, teachersRes, roomsRes, draftRes] = await Promise.all([
        api.getConfig(),
        api.getTeachers(),
        api.getRooms(),
        api.getLatestDraft(),
      ]);
      setConfig(configRes.config);
      setTeachers(teachersRes.data || []);
      setRooms(roomsRes.rooms || []);

      if (draftRes.draft) {
        setTimetable(draftRes.draft);
        setEntries(draftRes.draft.entries || []);
        setConflicts(draftRes.draft.conflicts || []);
      }
    } catch (err: any) {
      setError('Failed to load timetable data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Generate ───────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await api.generate();
      if (res.draftId) {
        const ttRes = await api.getTimetableById(res.draftId);
        setTimetable(ttRes.timetable);
        setEntries(ttRes.timetable.entries || []);
        setConflicts(ttRes.timetable.conflicts || []);
        setSuccess('✅ Timetable generated successfully!');
        undoStack.current = [];
      }
    } catch (err: any) {
      setError('Generation failed. Please ensure subjects, rooms and faculty are configured.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Publish ────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!timetable?._id) return;
    setPublishing(true);
    setError('');
    try {
      await api.publish(timetable._id);
      await loadAll();
      setSuccess('🎉 Timetable published successfully!');
    } catch (err: any) {
      setError('Failed to publish timetable. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  // ── Swap via drag-and-drop ─────────────────────────────────────────────
  const handleSwapEntries = async (indexA: number, indexB: number) => {
    if (!timetable?._id) return;
    // Push current state to undo stack
    undoStack.current = [entries.slice(), ...undoStack.current].slice(0, MAX_UNDO);
    try {
      const res = await api.swapEntries(timetable._id, indexA, indexB);
      // Swap locally for immediate feedback
      const newEntries = entries.slice();
      const temp = { ...newEntries[indexA] };
      const swapDaySlot = { day: newEntries[indexB].day, timeSlot: newEntries[indexB].timeSlot };
      newEntries[indexA] = { ...newEntries[indexA], day: newEntries[indexB].day, timeSlot: newEntries[indexB].timeSlot };
      newEntries[indexB] = { ...newEntries[indexB], day: temp.day, timeSlot: temp.timeSlot };
      setEntries(newEntries);
      setConflicts(res.conflicts || []);
      setSuccess('Entries swapped successfully.');
    } catch (err: any) {
      undoStack.current = undoStack.current.slice(1);
      setError('Swap failed: ' + (err.message || 'A conflict was detected.'));
      // Refresh from server to revert
      if (timetable?._id) {
        const ttRes = await api.getTimetableById(timetable._id);
        setEntries(ttRes.timetable.entries || []);
        setConflicts(ttRes.timetable.conflicts || []);
      }
    }
  };

  // ── Edit entry ─────────────────────────────────────────────────────────
  const handleEntrySaved = async (updatedEntry: TtEntry) => {
    if (!timetable?._id) return;
    setEditingEntry(null);
    undoStack.current = [entries.slice(), ...undoStack.current].slice(0, MAX_UNDO);
    // Refresh to get latest from server
    try {
      const ttRes = await api.getTimetableById(timetable._id);
      setEntries(ttRes.timetable.entries || []);
      setConflicts(ttRes.timetable.conflicts || []);
      setSuccess('Lecture updated successfully.');
    } catch {
      setError('Could not refresh timetable after edit.');
    }
  };

  // ── Delete entry (mark as free) ────────────────────────────────────────
  const handleDeleteEntry = async (entry: TtEntry, index: number) => {
    if (!timetable?._id) return;
    undoStack.current = [entries.slice(), ...undoStack.current].slice(0, MAX_UNDO);
    try {
      await api.editEntry(timetable._id, index, {
        subjectId: null,
        subjectName: '',
        facultyId: null,
        facultyName: '',
        roomId: null,
        roomName: '',
        isFree: true,
        subjectType: 'free' as TtEntry['subjectType'],
      });
      const ttRes = await api.getTimetableById(timetable._id);
      setEntries(ttRes.timetable.entries || []);
      setConflicts(ttRes.timetable.conflicts || []);
      setSelectedEntry(null);
      setSelectedIndex(null);
      setPanelOpen(false);
      setSuccess('Lecture removed (slot is now free).');
    } catch (err: any) {
      undoStack.current = undoStack.current.slice(1);
      setError('Could not delete lecture. Please try again.');
    }
  };

  // ── Duplicate entry ────────────────────────────────────────────────────
  const handleDuplicateEntry = () => {
    // Opens the edit modal pre-filled — user picks the new slot
    if (selectedEntry && selectedIndex !== null) {
      setEditingEntry({ entry: selectedEntry, index: selectedIndex });
    }
  };

  // ── Undo ───────────────────────────────────────────────────────────────
  const handleUndo = async () => {
    if (undoStack.current.length === 0 || !timetable?._id) return;
    const prev = undoStack.current[0];
    undoStack.current = undoStack.current.slice(1);
    try {
      await api.updateTimetable(timetable._id, { entries: prev });
      setEntries(prev);
      setSuccess('Undo successful.');
    } catch {
      setError('Undo failed. Please refresh.');
    }
  };

  // ── Build filter options ────────────────────────────────────────────────
  const branchOptions = (config?.branches ?? []).map(b => ({ value: b.code, label: `${b.code} — ${b.name}` }));

  const yearOptions: { value: string; label: string }[] = [];
  if (filterBranch) {
    const branch = config?.branches?.find(b => b.code === filterBranch);
    branch?.years?.forEach(y => {
      yearOptions.push({ value: String(y.yearNumber), label: `Year ${y.yearNumber} — ${y.label}` });
    });
  } else {
    for (let i = 1; i <= 4; i++) yearOptions.push({ value: String(i), label: `Year ${i}` });
  }

  const sectionOptions: { value: string; label: string }[] = [];
  if (filterBranch && filterYear) {
    const branch = config?.branches?.find(b => b.code === filterBranch);
    const yr = branch?.years?.find(y => y.yearNumber === Number(filterYear));
    yr?.sections?.forEach(s => sectionOptions.push({ value: s, label: `Section ${s}` }));
  } else {
    ['A', 'B', 'C', 'D'].forEach(s => sectionOptions.push({ value: s, label: `Section ${s}` }));
  }

  const teacherOptions = teachers.map(t => ({ value: t._id, label: t.name }));
  const roomOptions = rooms.map(r => ({ value: r._id, label: `${r.name} (${r.type})` }));

  const hasFilters = !!(filterBranch || filterYear || filterSection || filterTeacherId || filterRoomId || searchQuery);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50">

      {/* ── TOP TOOLBAR ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-3 timetable-no-print flex-shrink-0">
        <SmartNotificationBanner />

        {/* Row 1: Title + Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Interactive Timetable Dashboard</h2>
              <p className="text-[10px] text-gray-400">
                {timetable
                  ? `${timetable.label || 'Draft'} · ${entries.filter(e => !e.isFree && !e.isLunch).length} lectures`
                  : 'No timetable loaded'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConflictBadge conflicts={conflicts} />
            {timetable?.status && (
              <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border ${
                timetable.status === 'published'
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : timetable.status === 'approved'
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200'
              }`}>
                {timetable.status}
              </span>
            )}
          </div>
        </div>

        {/* Row 1.5: Sub-tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit mb-3">
          <button
            onClick={() => setDashboardTab('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              dashboardTab === 'grid'
                ? 'bg-white shadow-sm text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Timetable Grid
          </button>
          <button
            onClick={() => setDashboardTab('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              dashboardTab === 'heatmap'
                ? 'bg-white shadow-sm text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Heatmap
          </button>
          <button
            onClick={() => setDashboardTab('optimizer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              dashboardTab === 'optimizer'
                ? 'bg-white shadow-sm text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> AI Optimizer
          </button>
          <button
            onClick={() => setDashboardTab('clone')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              dashboardTab === 'clone'
                ? 'bg-white shadow-sm text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" /> Semester Clone
          </button>
        </div>

        {/* Row 2: Filters */}
        {dashboardTab === 'grid' && (<>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
          <ToolbarSelect
            label="All Branches"
            value={filterBranch}
            onChange={v => { setFilterBranch(v); setFilterYear(''); setFilterSection(''); }}
            options={branchOptions}
          />
          <ToolbarSelect
            label="All Years"
            value={filterYear}
            onChange={v => { setFilterYear(v); setFilterSection(''); }}
            options={yearOptions}
          />
          <ToolbarSelect
            label="All Sections"
            value={filterSection}
            onChange={setFilterSection}
            options={sectionOptions}
          />
          <ToolbarSelect
            label="All Faculty"
            value={filterTeacherId}
            onChange={setFilterTeacherId}
            options={teacherOptions}
          />
          <ToolbarSelect
            label="All Rooms"
            value={filterRoomId}
            onChange={setFilterRoomId}
            options={roomOptions}
          />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 inset-y-0 my-auto w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40 shadow-sm"
            />
          </div>

          {hasFilters && (
            <button
              onClick={() => {
                setFilterBranch(''); setFilterYear(''); setFilterSection('');
                setFilterTeacherId(''); setFilterRoomId(''); setSearchQuery('');
              }}
              className="flex items-center gap-1 px-2.5 py-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-dashed border-gray-300 transition-colors"
              title="Clear all filters"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1 min-w-[4px]" />

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                viewMode === 'week' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                viewMode === 'day' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Day
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <ToolbarBtn onClick={loadAll} icon={RefreshCw} label="Refresh" loading={loading} />
            <ToolbarBtn onClick={handleUndo} icon={Undo2} label="Undo" disabled={undoStack.current.length === 0} variant="ghost" title={`Undo (${undoStack.current.length} actions)`} />
            <ToolbarBtn onClick={handleGenerate} icon={Sparkles} label={generating ? 'Generating…' : 'Generate'} variant="primary" loading={generating} />
            <ToolbarBtn
              onClick={handlePublish}
              icon={Send}
              label={publishing ? 'Publishing…' : 'Publish'}
              variant="success"
              loading={publishing}
              disabled={!timetable || timetable.status === 'published'}
            />
            <ExportMenu
              open={exportMenuOpen}
              onToggle={() => setExportMenuOpen(o => !o)}
              onCsv={() => exportToCsv(entries, { branch: filterBranch, year: filterYear ? Number(filterYear) : undefined, section: filterSection })}
              onExcel={() => exportToExcel(entries, { branch: filterBranch, year: filterYear ? Number(filterYear) : undefined, section: filterSection })}
              onPdf={() => exportToPdf('Weekly Timetable')}
              onWholeCollege={() => exportWholeCollegeTimetable(entries)}
            />
          </div>
        </div>

        {/* Day selector for Day view */}
        {viewMode === 'day' && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-medium mr-1">Day:</span>
            {DAYS.map(d => (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                  activeDay === d
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        )}
      </>)}
      </div>

      {/* ── TOASTS ─────────────────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-50 space-y-2 timetable-no-print">
        {success && (
          <div className="flex items-center gap-2.5 px-4 py-3 bg-white border border-emerald-200 rounded-xl shadow-lg text-sm text-emerald-700 font-medium max-w-sm animate-in slide-in-from-right">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 bg-white border border-red-200 rounded-xl shadow-lg text-sm text-red-600 font-medium max-w-sm animate-in slide-in-from-right">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {dashboardTab === 'heatmap' && (
          <div className="flex-1 overflow-auto p-6 bg-white rounded-2xl border border-gray-200 m-4 shadow-sm">
            <TimetableHeatmap />
          </div>
        )}
        {dashboardTab === 'optimizer' && (
          <div className="flex-1 overflow-auto p-6 bg-white rounded-2xl border border-gray-200 m-4 shadow-sm">
            <AIWorkloadOptimizer />
          </div>
        )}
        {dashboardTab === 'clone' && (
          <div className="flex-1 overflow-auto p-6 bg-white rounded-2xl border border-gray-200 m-4 shadow-sm">
            <SemesterClonePanel />
          </div>
        )}

        {dashboardTab === 'grid' && (
          <>
            {/* Grid Panel */}
            <div className="flex-1 overflow-auto p-4 min-w-0">
              {loading ? (
                <TimetableInteractiveGridSkeleton
                  days={viewMode === 'day' ? 1 : config?.workingDays?.length ?? 6}
                  slots={config?.timeSlots?.length ?? 7}
                />
              ) : entries.length === 0 ? (
                <EmptyState onGenerate={handleGenerate} generating={generating} />
              ) : (
                <TimetableInteractiveGrid
                  entries={entries}
                  config={config}
                  conflicts={conflicts}
                  selectedIndex={selectedIndex}
                  isEditable={timetable?.status !== 'published'}
                  filterBranch={filterBranch}
                  filterYear={filterYear ? Number(filterYear) : undefined}
                  filterSection={filterSection}
                  filterTeacherId={filterTeacherId}
                  filterRoomId={filterRoomId}
                  searchQuery={searchQuery}
                  viewMode={viewMode}
                  activeDay={activeDay}
                  onSelectEntry={(entry, idx) => {
                    setSelectedEntry(entry);
                    setSelectedIndex(idx);
                    setPanelOpen(true);
                  }}
                  onSwapEntries={handleSwapEntries}
                  onEditEntry={(entry, idx) => setEditingEntry({ entry, index: idx })}
                  onDeleteEntry={handleDeleteEntry}
                />
              )}
            </div>

            {/* Right Detail Panel */}
            {panelOpen && (
              <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto timetable-no-print">
                <TimetableDetailPanel
                  entry={selectedEntry}
                  entryIndex={selectedIndex}
                  conflicts={conflicts}
                  isEditable={timetable?.status !== 'published'}
                  onClose={() => { setPanelOpen(false); setSelectedEntry(null); setSelectedIndex(null); }}
                  onEdit={() => selectedEntry && selectedIndex !== null && setEditingEntry({ entry: selectedEntry, index: selectedIndex })}
                  onDelete={() => selectedEntry && selectedIndex !== null && handleDeleteEntry(selectedEntry, selectedIndex)}
                  onDuplicate={handleDuplicateEntry}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── COLOR LEGEND ───────────────────────────────────────────────── */}
      {!loading && entries.length > 0 && (
        <div className="bg-white border-t border-gray-100 px-6 py-2 flex items-center gap-4 flex-wrap timetable-no-print">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Legend:</span>
          {[
            { color: 'bg-blue-500', label: 'Theory' },
            { color: 'bg-emerald-500', label: 'Lab' },
            { color: 'bg-amber-500', label: 'Tutorial' },
            { color: 'bg-red-500', label: 'Exam' },
            { color: 'bg-gray-300', label: 'Free' },
            { color: 'bg-purple-400', label: 'Break' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`} />
              <span className="text-[10px] text-gray-600">{item.label}</span>
            </div>
          ))}
          {timetable?.status !== 'published' && (
            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400">
              <Info className="w-3 h-3" />
              Drag cards to swap slots · Click to view details
            </div>
          )}
        </div>
      )}

      {/* ── EDIT MODAL ─────────────────────────────────────────────────── */}
      {editingEntry && timetable?._id && (
        <EditLectureModal
          entry={editingEntry.entry}
          entryIndex={editingEntry.index}
          timetableId={timetable._id}
          onClose={() => setEditingEntry(null)}
          onSaved={handleEntrySaved}
        />
      )}
    </div>
  );
}
