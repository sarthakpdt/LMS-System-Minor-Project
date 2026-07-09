import React, { useState, useEffect } from 'react';
import { api } from './api';
import { TtConfig, TtEntry, TtConflict, TtGenerated, ValidationSummary } from './types';
import TimetableGrid from './TimetableGrid';
import ConflictViewer from './ConflictViewer';
import {
  Loader2, Calendar, AlertCircle, RefreshCw, Send, CheckCircle2,
  FileSpreadsheet, Save, FolderOpen, Trash2, Sparkles, ChevronRight,
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

  const loadSavedList = async () => {
    try {
      const res = await api.listTimetables();
      setSavedTimetables(res.timetables);
    } catch {
      // non-blocking
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
      const res = await api.generate(regenerateId);
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

  const getFilteredEntries = () =>
    entries.filter(
      (e) =>
        e.branch === selectedBranch &&
        e.year === selectedYear &&
        e.section === selectedSection
    );

  const exportToCSV = () => {
    if (entries.length === 0 || !config) return;
    let csvContent =
      'data:text/csv;charset=utf-8,Branch,Year,Section,Day,Time Slot,Subject,Type,Faculty,Room\n';
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
      {/* Wizard progress (hidden when embedded in SetupWizard) */}
      {!embedded && (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
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
        <div className="px-1 pb-1">
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
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
        <div>
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" /> Timetable Generator
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Academic Year: <strong>{config?.academicYear || 'Not set'}</strong>
            {draftId && (
              <span className="ml-2 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">
                Draft Active
              </span>
            )}
            {aiOptimized && (
              <span className="ml-2 text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Optimized
              </span>
            )}
          </p>
          {validationSummary && (
            <p className="text-[10px] text-gray-400 mt-1">
              {validationSummary.errorCount} errors · {validationSummary.warningCount} warnings ·
              {validationSummary.missingFaculty} missing faculty · {validationSummary.missingRoom} missing rooms
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <button
            onClick={() => handleGenerate()}
            disabled={generating}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Generate Timetable
          </button>

          {entries.length > 0 && (
            <>
              <button
                onClick={handleSaveTimetable}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-semibold transition shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Timetable
              </button>

              {draftId && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publish
                </button>
              )}

              <button
                onClick={exportToCSV}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs text-gray-600 transition"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-xs">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {validationIssues.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
          <p className="font-semibold">Validation notices:</p>
          {validationIssues.map((v, i) => (
            <p key={i}>• {v.message}</p>
          ))}
        </div>
      )}

      {/* Saved timetables */}
      {(!embedded || focusStep === 'save') && (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
        <h4 className="text-xs font-bold text-gray-800 flex items-center gap-2 mb-3">
          <FolderOpen className="w-4 h-4 text-purple-600" /> Saved Timetables
        </h4>
        {savedTimetables.length === 0 ? (
          <p className="text-xs text-gray-500">No saved timetables yet. Generate and save to persist.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {savedTimetables.map((tt) => (
              <div
                key={tt._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-gray-100 hover:bg-gray-50"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-800">{tt.label || 'Untitled'}</p>
                  <p className="text-[10px] text-gray-500">
                    {tt.status} · {new Date(tt.generatedAt || tt.createdAt || '').toLocaleString()}
                    {tt.aiOptimized && ' · AI optimized'}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleLoadTimetable(tt._id)}
                    className="px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-purple-100 text-purple-700"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleGenerate(tt._id)}
                    className="px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-gray-100 text-gray-700"
                  >
                    Regenerate
                  </button>
                  {tt.status !== 'published' && (
                    <button
                      onClick={() => handleDeleteTimetable(tt._id)}
                      className="p-1.5 rounded-lg border border-red-100 text-red-500"
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

      {!embedded && activeStep === 'configure' && entries.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center space-y-3 shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
          <Calendar className="w-10 h-10 mx-auto text-gray-300" />
          <h4 className="font-bold text-gray-800 text-sm">Step 1: Configure Courses & Constraints</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto px-6">
            Use Setup Config to define branches, courses, rooms, and faculty constraints. Then click Generate Timetable.
          </p>
        </div>
      )}

      {entries.length === 0 && (embedded ? focusStep !== 'generate' : activeStep !== 'configure') ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center space-y-4 shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 opacity-80" />
          <h4 className="font-bold text-gray-800 text-sm">No Timetable Available</h4>
          <p className="text-xs text-gray-500 px-6 max-w-md mx-auto">
            Click Generate Timetable to run constraint-based scheduling with AI optimization.
          </p>
        </div>
      ) : entries.length > 0 && (!embedded || focusStep === 'preview' || focusStep === 'save') ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
              <div className="flex justify-between items-center border-b pb-2.5">
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Preview — Class View</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">BRANCH</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full border border-gray-200/80 rounded-xl px-3.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium dark:bg-slate-800 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {config?.branches.map((b) => (
                      <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">ACADEMIC YEAR</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full border border-gray-200/80 rounded-xl px-3.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium dark:bg-slate-800 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {activeBranchObj?.years.map((y) => (
                      <option key={y.yearNumber} value={y.yearNumber}>{y.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">SECTION</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full border border-gray-200/80 rounded-xl px-3.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium dark:bg-slate-800 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {activeYearObj?.sections.map((sec) => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {config && <TimetableGrid entries={getFilteredEntries()} config={config} />}
          </div>

          <div className="lg:col-span-1">
            <ConflictViewer conflicts={conflicts} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
