import React, { useState, useEffect } from 'react';
import { api } from './api';
import { TtConfig, TtEntry, TtConflict, TtGenerated, ValidationSummary } from './types';
import TimetableGrid from './TimetableGrid';
import ConflictViewer from './ConflictViewer';
import {
  Loader2, Calendar, AlertCircle, RefreshCw, Send, CheckCircle2,
  FileSpreadsheet, Save, FolderOpen, Trash2, Sparkles, ChevronRight,
  Printer, Copy, X, Info, Zap, ArrowLeftRight, Check, Move, Edit
} from 'lucide-react';

type WizardStep = 'configure' | 'generate' | 'preview' | 'save' | 'publish';

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'configure', label: 'Configure' },
  { id: 'generate', label: 'Generate' },
  { id: 'preview', label: 'Preview' },
  { id: 'save', label: 'Save' },
  { id: 'publish', label: 'Publish' },
];

interface TimetableGeneratorProps {
  focusStep?: 'generate' | 'preview' | 'save';
  embedded?: boolean;
}

export default function TimetableGenerator({ focusStep, embedded }: TimetableGeneratorProps = {}) {
  const [config, setConfig] = useState<TtConfig | null>(null);
  const [draftId, setDraftId] = useState<string>('');
  const [entries, setEntries] = useState<TtEntry[]>([]);
  const [conflicts, setConflicts] = useState<TtConflict[]>([]);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [aiOptimized, setAiOptimized] = useState(false);
  const [savedTimetables, setSavedTimetables] = useState<TtGenerated[]>([]);
  const [activeStep, setActiveStep] = useState<WizardStep>('configure');

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationIssues, setValidationIssues] = useState<Array<{ type: string; message: string }>>([]);

  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [selectedSection, setSelectedSection] = useState('');

  // Dropdown list data for Edit Dialog
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);

  // Dialog / Sidebar states
  const [editingEntry, setEditingEntry] = useState<{ entry: TtEntry; index: number } | null>(null);
  const [editSubjectId, setEditSubjectId] = useState('');
  const [editFacultyId, setEditFacultyId] = useState('');
  const [editRoomId, setEditRoomId] = useState('');
  const [editFreeSlotIdx, setEditFreeSlotIdx] = useState<string>('');

  // Semester cloning modal
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneSourceBranch, setCloneSourceBranch] = useState('');
  const [cloneSourceYear, setCloneSourceYear] = useState(1);
  const [cloneTargetBranch, setCloneTargetBranch] = useState('');
  const [cloneTargetYear, setCloneTargetYear] = useState(1);
  const [clonePrefix, setClonePrefix] = useState('');

  // AI Clash Resolution Suggestions
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const loadSavedList = async () => {
    try {
      const res = await api.listTimetables();
      setSavedTimetables(res.timetables);
    } catch {
      // non-blocking
    }
  };

  const loadModalData = async () => {
    try {
      const [sRes, tRes, rRes] = await Promise.all([
        api.getSubjects(),
        api.getTeachers(),
        api.getRooms(),
      ]);
      setSubjectsList(sRes.subjects || []);
      setTeachersList(tRes.data || []);
      setRoomsList(rRes.rooms || []);
    } catch (e) {
      console.error('Failed to load edit modal selection lists', e);
    }
  };

  const loadClashResolutions = async (id: string) => {
    if (!id) return;
    setLoadingSuggestions(true);
    try {
      const res = await api.getClashResolutions(id);
      setAiSuggestions(res.suggestions || []);
    } catch (e) {
      console.error('Failed to load clash suggestions', e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const configRes = await api.getConfig();
      setConfig(configRes.config);

      if (configRes.config?.branches.length > 0) {
        const firstBranch = configRes.config.branches[0];
        setSelectedBranch(firstBranch.code);
        setCloneSourceBranch(firstBranch.code);
        setCloneTargetBranch(firstBranch.code);
        if (firstBranch.years.length > 0) {
          const firstYear = firstBranch.years[0];
          setSelectedYear(firstYear.yearNumber);
          if (firstYear.sections.length > 0) {
            setSelectedSection(firstYear.sections[0]);
          }
        }
      }

      const draftRes = await api.getLatestDraft();
      if (draftRes.draft) {
        setDraftId(draftRes.draft._id);
        setEntries(draftRes.draft.entries);
        setConflicts(draftRes.draft.conflicts);
        setValidationSummary(draftRes.draft.validationSummary || null);
        setAiOptimized(Boolean(draftRes.draft.aiOptimized));
        if (draftRes.draft.entries.length > 0) setActiveStep('preview');
      }

      await loadSavedList();
      await loadModalData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduling generator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (focusStep) setActiveStep(focusStep);
  }, [focusStep]);

  useEffect(() => {
    if (draftId) {
      loadClashResolutions(draftId);
    }
  }, [draftId]);

  useEffect(() => {
    if (!config || !selectedBranch) return;
    const branch = config.branches.find((b) => b.code === selectedBranch);
    if (!branch) return;
    const year = branch.years.find((y) => y.yearNumber === selectedYear);
    if (!year) {
      if (branch.years.length > 0) setSelectedYear(branch.years[0].yearNumber);
      return;
    }
    if (year.sections.length > 0 && !year.sections.includes(selectedSection)) {
      setSelectedSection(year.sections[0]);
    }
  }, [selectedBranch, selectedYear, config, selectedSection]);

  const handleGenerate = async (regenerateId?: string) => {
    setGenerating(true);
    setError('');
    setSuccess('');
    setValidationIssues([]);
    try {
      const res = await api.generate(regenerateId ? { timetableId: regenerateId } : undefined);
      setDraftId(res.draftId);
      setEntries(res.entries);
      setConflicts(res.conflicts);
      setValidationSummary(res.validationSummary || null);
      setAiOptimized(Boolean(res.aiOptimized));
      if (res.validationIssues?.length) setValidationIssues(res.validationIssues);
      setActiveStep('preview');
      setSuccess(
        res.aiOptimized
          ? 'Timetable generated and AI-optimized successfully!'
          : 'Timetable generated successfully!'
      );
      await loadSavedList();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error executing scheduling engine.';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveTimetable = async () => {
    if (!draftId && entries.length === 0) return;
    const label = window.prompt('Enter a name for this timetable:', `Timetable ${new Date().toLocaleDateString()}`);
    if (!label?.trim()) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.saveTimetable({
        draftId: draftId || undefined,
        label: label.trim(),
        entries,
        conflicts,
      });
      setDraftId(res.timetable._id);
      setActiveStep('save');
      setSuccess(res.message || 'Timetable saved to database.');
      await loadSavedList();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save timetable.');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadTimetable = async (id: string) => {
    setError('');
    try {
      const res = await api.getTimetableById(id);
      const tt = res.timetable;
      setDraftId(tt._id);
      setEntries(tt.entries);
      setConflicts(tt.conflicts);
      setValidationSummary(tt.validationSummary || null);
      setAiOptimized(Boolean(tt.aiOptimized));
      setActiveStep('preview');
      setSuccess(`Loaded: ${tt.label || 'Timetable'}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load timetable.');
    }
  };

  const handleDeleteTimetable = async (id: string) => {
    if (!window.confirm('Delete this saved timetable?')) return;
    try {
      await api.deleteTimetable(id);
      if (draftId === id) {
        setDraftId('');
        setEntries([]);
        setConflicts([]);
      }
      setSuccess('Timetable deleted.');
      await loadSavedList();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete timetable.');
    }
  };

  const handlePublish = async () => {
    if (!draftId) return;
    setPublishing(true);
    setError('');
    setSuccess('');
    try {
      await api.publish(draftId);
      setActiveStep('publish');
      setSuccess('Timetable published live successfully!');
      await loadSavedList();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error publishing timetable.');
    } finally {
      setPublishing(false);
    }
  };

  // Canvas manual drag & drop slot swap
  const handleSwapSlots = async (indexA: number, indexB: number) => {
    if (!draftId) {
      setError('Please save or generate a timetable draft first.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.swapEntries(draftId, indexA, indexB);
      setConflicts(res.conflicts);
      setValidationSummary(res.validationSummary);
      
      // Update local state by swapping
      const updatedEntries = [...entries];
      const temp = updatedEntries[indexA];
      updatedEntries[indexA] = updatedEntries[indexB];
      updatedEntries[indexB] = temp;
      setEntries(updatedEntries);
      
      setSuccess('Slots swapped and validated successfully.');
      await loadClashResolutions(draftId);
    } catch (err: any) {
      setError(err.message || 'Failed to swap timetable cells.');
    } finally {
      setSaving(false);
    }
  };

  // Triggered when an interactive card is clicked
  const handleCellClick = (entry: TtEntry, index: number) => {
    setEditingEntry({ entry, index });
    // Find matched objects in dropdown lists
    const matchedSubject = subjectsList.find(s => s.name === entry.subjectName);
    setEditSubjectId(matchedSubject?._id || '');

    const matchedTeacher = teachersList.find(t => t.name === entry.facultyName);
    setEditFacultyId(matchedTeacher?._id || '');

    const matchedRoom = roomsList.find(r => r.name === entry.roomName);
    setEditRoomId(matchedRoom?._id || '');
    setEditFreeSlotIdx('');
  };

  // Submit cell details edit
  const handleUpdateEntry = async () => {
    if (!draftId || !editingEntry) return;
    setSaving(true);
    setError('');
    try {
      const subject = subjectsList.find(s => s._id === editSubjectId);
      const teacher = teachersList.find(t => t._id === editFacultyId);
      const room = roomsList.find(r => r._id === editRoomId);

      const updates: Partial<TtEntry> = {
        subjectId: subject?._id || null,
        subjectName: subject?.name || 'Free Slot',
        subjectType: subject?.type || 'free',
        facultyId: teacher?._id || null,
        facultyName: teacher?.name || '',
        roomId: room?._id || null,
        roomName: room?.name || '',
        roomCapacity: room?.capacity || null,
        isFree: !subject,
      };

      const res = await api.editEntry(draftId, editingEntry.index, updates);
      setConflicts(res.conflicts);
      setValidationSummary(res.validationSummary);

      const updatedEntries = [...entries];
      updatedEntries[editingEntry.index] = res.entry;
      setEntries(updatedEntries);

      setSuccess('Period updated and conflicts recalculated.');
      setEditingEntry(null);
      await loadClashResolutions(draftId);
    } catch (err: any) {
      setError(err.message || 'Failed to edit cell details.');
    } finally {
      setSaving(false);
    }
  };

  // Move period to free slot via dropdown selection
  const handleMoveToFreeSlot = async () => {
    if (!draftId || !editingEntry || !editFreeSlotIdx) return;
    const targetIdx = parseInt(editFreeSlotIdx, 10);
    await handleSwapSlots(editingEntry.index, targetIdx);
    setEditingEntry(null);
  };

  // Apply AI clash resolution recommendation
  const applyResolution = async (suggestion: any, targetRoom?: any) => {
    if (!draftId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const desc = suggestion.conflictDescription;
      
      // Parse day and timeslot
      let day = '';
      let slotLabel = '';
      for (const d of config?.workingDays || []) {
        if (desc.includes(d)) { day = d; break; }
      }
      for (const s of config?.timeSlots || []) {
        if (desc.includes(s.label)) { slotLabel = s.label; break; }
      }

      if (!day || !slotLabel) {
        throw new Error("Could not automatically locate the conflicting cell in the layout. Please fix manually.");
      }

      // Find matching entry indices
      const matchingIndices = entries.reduce((acc: number[], e, idx) => {
        if (e.day === day && e.timeSlot.label === slotLabel && !e.isFree && !e.isLunch) {
          acc.push(idx);
        }
        return acc;
      }, []);

      if (matchingIndices.length === 0) {
        throw new Error("Could not locate the conflicting course entry.");
      }

      if (suggestion.actionType === 'reassign_room' && targetRoom) {
        const targetIdx = matchingIndices[0];
        const res = await api.editEntry(draftId, targetIdx, {
          roomId: targetRoom.id,
          roomName: targetRoom.name,
          roomCapacity: targetRoom.capacity
        });
        
        // Update local entries
        const updatedEntries = [...entries];
        updatedEntries[targetIdx] = res.entry;
        setEntries(updatedEntries);
        setConflicts(res.conflicts);
        setValidationSummary(res.validationSummary);
        
        setSuccess(`Successfully reassigned room to ${targetRoom.name}.`);
      } else if (suggestion.actionType === 'move' && suggestion.targetDays?.length) {
        const targetIdx = matchingIndices[0];
        const entryToMove = entries[targetIdx];
        const targetDay = suggestion.targetDays[0];

        // Search for a free slot for this specific section on the target day
        const freeSlotIdx = entries.findIndex(e => 
          e.branch === entryToMove.branch &&
          e.year === entryToMove.year &&
          e.section === entryToMove.section &&
          e.day === targetDay &&
          e.isFree
        );

        if (freeSlotIdx === -1) {
          throw new Error(`Could not find a free slot on ${targetDay} for section ${entryToMove.branch} Year ${entryToMove.year} Section ${entryToMove.section}.`);
        }

        const res = await api.swapEntries(draftId, targetIdx, freeSlotIdx);
        
        // Update local state by swapping
        const updatedEntries = [...entries];
        const temp = updatedEntries[targetIdx];
        updatedEntries[targetIdx] = updatedEntries[freeSlotIdx];
        updatedEntries[freeSlotIdx] = temp;
        
        setEntries(updatedEntries);
        setConflicts(res.conflicts);
        setValidationSummary(res.validationSummary);

        setSuccess(`Moved period to a free slot on ${targetDay}.`);
      } else {
        throw new Error("No automatic action handler for this type. Please resolve manually.");
      }
      
      await loadClashResolutions(draftId);
    } catch (err: any) {
      setError(err.message || 'Failed to apply resolution.');
    } finally {
      setSaving(false);
    }
  };

  // Semester cloning form submit
  const handleCloneSemester = async () => {
    if (!cloneSourceBranch || !cloneSourceYear || !cloneTargetBranch || !cloneTargetYear) {
      setError('Please fill in all cloning modal fields.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.cloneSemester({
        sourceBranch: cloneSourceBranch,
        sourceYear: Number(cloneSourceYear),
        targetBranch: cloneTargetBranch,
        targetYear: Number(cloneTargetYear),
        prefixCode: clonePrefix || undefined
      });
      setSuccess(res.message);
      setIsCloneModalOpen(false);
      await loadModalData();
    } catch (err: any) {
      setError(err.message || 'Failed to clone subjects.');
    } finally {
      setSaving(false);
    }
  };

  const getFilteredEntries = () =>
    entries.filter(
      (e) =>
        e.branch === selectedBranch &&
        e.year === selectedYear &&
        e.section === selectedSection
    );

  const getFreeSlotsForSelectedSection = () => {
    if (!editingEntry) return [];
    return entries.reduce((acc: Array<{ index: number; label: string }>, e, idx) => {
      if (
        e.branch === editingEntry.entry.branch &&
        e.year === editingEntry.entry.year &&
        e.section === editingEntry.entry.section &&
        e.isFree &&
        idx !== editingEntry.index
      ) {
        acc.push({ index: idx, label: `${e.day} (${e.timeSlot.label})` });
      }
      return acc;
    }, []);
  };

  const exportToCSV = () => {
    if (entries.length === 0 || !config) return;
    let csvContent =
      'data:text/csv;charset=utf-8,\uFEFFBranch,Year,Section,Day,Time Slot,Subject,Type,Faculty,Room\n';
    entries.forEach((e) => {
      const row = [
        e.branch,
        `Year ${e.year}`,
        e.section,
        e.day,
        `"${e.timeSlot.label}"`,
        `"${e.subjectName || ''}"`,
        e.subjectType || '',
        `"${e.facultyName || ''}"`,
        `"${e.roomName || ''}"`,
      ].join(',');
      csvContent += `${row}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EduTrack_Timetable_${config.academicYear || 'Draft'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-3" />
        <p className="text-sm font-medium">Initializing Scheduling Engine Workspace...</p>
      </div>
    );
  }

  const activeBranchObj = config?.branches.find((b) => b.code === selectedBranch);
  const activeYearObj = activeBranchObj?.years.find((y) => y.yearNumber === selectedYear);
  const stepIndex = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <div className="space-y-6">
      {/* Print media css hack */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-timetable-area, #printable-timetable-area * {
            visibility: visible;
          }
          #printable-timetable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Wizard progress */}
      {!embedded && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm no-print">
          <div className="flex flex-wrap items-center gap-2">
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition ${
                    activeStep === step.id
                      ? 'bg-purple-600 text-white'
                      : idx <= stepIndex
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {step.label}
                </button>
                {idx < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {embedded && (
        <div className="px-1 pb-1 no-print">
          <h3 className="text-sm font-bold text-gray-900">
            {focusStep === 'generate' && 'Generate Timetable'}
            {focusStep === 'preview' && 'Preview Timetable'}
            {focusStep === 'save' && 'Save Timetable'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {focusStep === 'generate' && 'Validate constraints and run the scheduling engine with AI optimization.'}
            {focusStep === 'preview' && 'Review the weekly grid and resolve any conflicts before saving.'}
            {focusStep === 'save' && 'Persist the generated timetable to the database for future use.'}
          </p>
        </div>
      )}

      {/* Control panel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" /> Timetable Generator Workspace
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              Academic Year: <strong>{config?.academicYear || 'Not set'}</strong>
            </span>
            {draftId && (
              <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide">
                Draft
              </span>
            )}
            {aiOptimized && (
              <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full text-[9px] inline-flex items-center gap-0.5 uppercase tracking-wide">
                <Sparkles className="w-2.5 h-2.5" /> AI Optimized
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsCloneModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl text-xs font-semibold transition"
          >
            <Copy className="w-4 h-4" /> Clone Semester
          </button>

          <button
            onClick={() => handleGenerate()}
            disabled={generating}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Generate Draft
          </button>

          {entries.length > 0 && (
            <>
              <button
                onClick={handleSaveTimetable}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-semibold transition shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>

              {draftId && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publish Live
                </button>
              )}

              <button
                onClick={exportToCSV}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs text-gray-600 transition"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel/CSV
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs text-gray-600 transition"
              >
                <Printer className="w-4 h-4" /> Print PDF
              </button>
            </>
          )}
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs no-print">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-xs no-print">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {validationIssues.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1 no-print">
          <p className="font-semibold flex items-center gap-1"><Info className="w-4 h-4 text-amber-600" /> Validation notices:</p>
          {validationIssues.map((v, i) => (
            <p key={i}>• {v.message}</p>
          ))}
        </div>
      )}

      {/* Saved timetables list */}
      {(!embedded || focusStep === 'save') && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm no-print">
          <h4 className="text-xs font-bold text-gray-800 flex items-center gap-2 mb-3">
            <FolderOpen className="w-4 h-4 text-purple-600" /> Timetables in Database
          </h4>
          {savedTimetables.length === 0 ? (
            <p className="text-xs text-gray-500">No saved drafts yet. Generate a schedule and save it.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-1">
              {savedTimetables.map((tt) => (
                <div
                  key={tt._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-gray-800 truncate">{tt.label || 'Untitled'}</p>
                    <p className="text-[9px] text-gray-400">
                      {tt.status} · {new Date(tt.generatedAt || tt.createdAt || '').toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleLoadTimetable(tt._id)}
                      className="px-2 py-1 text-[9px] font-bold rounded-lg bg-purple-100 text-purple-700"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleGenerate(tt._id)}
                      className="px-2 py-1 text-[9px] font-bold rounded-lg bg-gray-100 text-gray-700"
                    >
                      Retry
                    </button>
                    {tt.status !== 'published' && (
                      <button
                        onClick={() => handleDeleteTimetable(tt._id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Generator Canvas Preview */}
      {entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center space-y-4 shadow-sm no-print">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 opacity-80" />
          <h4 className="font-bold text-gray-800 text-sm">No Active Timetable Layout</h4>
          <p className="text-xs text-gray-500 px-6 max-w-md mx-auto">
            Click <strong>Generate Draft</strong> to run the automated scheduling logic.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6" id="printable-timetable-area">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-2.5">
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Canvas Preview Filter</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 mb-1">BRANCH</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                  >
                    {config?.branches.map((b) => (
                      <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 mb-1">ACADEMIC YEAR</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                  >
                    {activeBranchObj?.years.map((y) => (
                      <option key={y.yearNumber} value={y.yearNumber}>{y.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 mb-1">SECTION</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                  >
                    {activeYearObj?.sections.map((sec) => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {config && (
              <TimetableGrid
                entries={getFilteredEntries()}
                config={config}
                isEditable={true}
                onSwapCell={handleSwapSlots}
                onCellClick={handleCellClick}
              />
            )}
          </div>

          <div className="lg:col-span-1 space-y-6 no-print">
            {/* AI Clash Resolution Assistant */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" /> AI Clash Fixer
              </h4>
              {loadingSuggestions ? (
                <div className="flex items-center justify-center py-6 text-gray-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Calculating recommendations...
                </div>
              ) : aiSuggestions.length === 0 ? (
                <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl text-center text-xs text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  No scheduling conflicts detected in this draft.
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {aiSuggestions.map((s, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-purple-100 bg-purple-50/30 text-left space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          s.severity === 'error' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {s.severity}
                        </span>
                        <span className="text-[9px] text-gray-400 font-semibold">{s.conflictType}</span>
                      </div>
                      <p className="text-[10px] text-gray-700 leading-normal">{s.conflictDescription}</p>
                      
                      <div className="border-t border-purple-100 pt-2 space-y-1.5">
                        <p className="text-[9px] text-purple-800 font-bold flex items-center gap-1">
                          <Zap className="w-3 h-3 text-purple-600" /> AI Advice:
                        </p>
                        <p className="text-[10px] text-gray-600 italic leading-snug">{s.recommendation}</p>

                        {/* Recommendation action buttons */}
                        {s.actionType === 'reassign_room' && s.alternativeRooms?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {s.alternativeRooms.map((r: any) => (
                              <button
                                key={r.id}
                                onClick={() => applyResolution(s, r)}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-bold rounded-lg transition"
                              >
                                Swap to {r.name}
                              </button>
                            ))}
                          </div>
                        )}

                        {s.actionType === 'move' && s.targetDays?.length > 0 && (
                          <button
                            onClick={() => applyResolution(s)}
                            className="w-full mt-1.5 py-1 px-2 text-[9px] font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-1 transition"
                          >
                            <Move className="w-3 h-3" /> Move to {s.targetDays[0]} Free Slot
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ConflictViewer conflicts={conflicts} />
          </div>
        </div>
      )}

      {/* Interactive Edit/Swap dialog */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-purple-600" /> Edit Slot Period
              </h4>
              <button onClick={() => setEditingEntry(null)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-2xl space-y-1 text-xs">
              <p className="text-gray-500">Section Location:</p>
              <p className="font-bold text-gray-800">
                {editingEntry.entry.day} · {editingEntry.entry.timeSlot.label} ({editingEntry.entry.timeSlot.startTime} - {editingEntry.entry.timeSlot.endTime})
              </p>
              <p className="font-semibold text-purple-700">
                Section: {editingEntry.entry.branch} Year {editingEntry.entry.year} Sec {editingEntry.entry.section}
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Course/Subject</label>
                <select
                  value={editSubjectId}
                  onChange={(e) => setEditSubjectId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">-- Free Period / No Subject --</option>
                  {subjectsList
                    .filter((s) => s.branch === editingEntry.entry.branch && s.year === editingEntry.entry.year)
                    .map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.code}) [{s.type}]</option>
                    ))}
                </select>
              </div>

              {editSubjectId && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Instructor / Faculty</label>
                    <select
                      value={editFacultyId}
                      onChange={(e) => setEditFacultyId(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">-- Assign Faculty --</option>
                      {teachersList.map((t) => (
                        <option key={t._id} value={t._id}>{t.name} ({t.department})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Room / Lab</label>
                    <select
                      value={editRoomId}
                      onChange={(e) => setEditRoomId(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">-- Assign Classroom/Lab --</option>
                      {roomsList.map((r) => (
                        <option key={r._id} value={r._id}>{r.name} ({r.type} · Cap: {r.capacity})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Move slot quick-action dropdown */}
              <div className="border-t pt-3">
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide flex items-center gap-1">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" /> Move Period to Free Slot
                </label>
                <div className="flex gap-2">
                  <select
                    value={editFreeSlotIdx}
                    onChange={(e) => setEditFreeSlotIdx(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="">-- Select Free Target Slot --</option>
                    {getFreeSlotsForSelectedSection().map((fs) => (
                      <option key={fs.index} value={fs.index}>{fs.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleMoveToFreeSlot}
                    disabled={!editFreeSlotIdx}
                    className="px-3 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 text-xs font-semibold rounded-xl transition"
                  >
                    Move
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setEditingEntry(null)}
                className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEntry}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone semester configuration structure modal */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Copy className="w-4 h-4 text-purple-600 animate-pulse" /> Clone Semester Structure
              </h4>
              <button onClick={() => setIsCloneModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-normal">
              Clone all active subjects, room preferences, duration properties, and hours configuration from a source branch/year (e.g., Year 1) to a target branch/year (e.g., Year 2).
            </p>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Source Branch</label>
                  <select
                    value={cloneSourceBranch}
                    onChange={(e) => setCloneSourceBranch(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                  >
                    {config?.branches.map((b) => (
                      <option key={b.code} value={b.code}>{b.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Source Year</label>
                  <select
                    value={cloneSourceYear}
                    onChange={(e) => setCloneSourceYear(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                  >
                    {[1, 2, 3, 4].map((y) => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Target Branch</label>
                  <select
                    value={cloneTargetBranch}
                    onChange={(e) => setCloneTargetBranch(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                  >
                    {config?.branches.map((b) => (
                      <option key={b.code} value={b.code}>{b.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Target Year</label>
                  <select
                    value={cloneTargetYear}
                    onChange={(e) => setCloneTargetYear(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                  >
                    {[1, 2, 3, 4].map((y) => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Code Prefix (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. CS-"
                  value={clonePrefix}
                  onChange={(e) => setClonePrefix(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setIsCloneModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCloneSemester}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                Clone Subjects
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
