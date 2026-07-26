import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Sparkles, Loader2, RefreshCw, AlertTriangle,
  History, ShieldCheck, Zap,
} from 'lucide-react';
import { api } from './api';
import {
  TtConfig, TtEntry, TtConflict, TtGenerated, ValidationSummary,
  GenerationScope, GenerationReport, Teacher,
} from './types';
import TimetableGrid from './TimetableGrid';
import ConflictViewer from './ConflictViewer';

const SCOPE_TYPES: GenerationScope['type'][] = ['full', 'branch', 'semester', 'section', 'day', 'faculty'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableGenerationEngine() {
  const [config, setConfig] = useState<TtConfig | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [draftId, setDraftId] = useState('');
  const [entries, setEntries] = useState<TtEntry[]>([]);
  const [conflicts, setConflicts] = useState<TtConflict[]>([]);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [report, setReport] = useState<GenerationReport | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [versions, setVersions] = useState<TtGenerated[]>([]);
  const [version, setVersion] = useState(1);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);

  const [scopeType, setScopeType] = useState<GenerationScope['type']>('full');
  const [scopeBranch, setScopeBranch] = useState('');
  const [scopeSemester, setScopeSemester] = useState(1);
  const [scopeSection, setScopeSection] = useState('A');
  const [scopeDay, setScopeDay] = useState('Monday');
  const [scopeFacultyId, setScopeFacultyId] = useState('');

  const [previewBranch, setPreviewBranch] = useState('');
  const [previewSemester, setPreviewSemester] = useState(1);
  const [previewSection, setPreviewSection] = useState('');

  const buildScope = (): GenerationScope => {
    const base: GenerationScope = { type: scopeType };
    if (scopeType === 'branch' || scopeType === 'semester' || scopeType === 'section') {
      base.branch = scopeBranch;
    }
    if (scopeType === 'semester' || scopeType === 'section') base.semester = scopeSemester;
    if (scopeType === 'section') base.section = scopeSection;
    if (scopeType === 'day') base.day = scopeDay;
    if (scopeType === 'faculty') base.facultyId = scopeFacultyId;
    return base;
  };

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [configRes, teachersRes, draftRes] = await Promise.all([
        api.getConfig(),
        api.getTeachers(),
        api.getLatestDraft(),
      ]);
      setConfig(configRes.config);
      setTeachers(teachersRes.data || []);
      if (configRes.config?.branches?.length) {
        const b = configRes.config.branches[0];
        setScopeBranch(b.code);
        setPreviewBranch(b.code);
        if (b.semesters?.length) {
          setScopeSemester(b.semesters[0].semesterNumber);
          setPreviewSemester(b.semesters[0].semesterNumber);
          setPreviewSection(b.semesters[0].sections[0] || 'A');
          setScopeSection(b.semesters[0].sections[0] || 'A');
        }
      }
      if (draftRes.draft) {
        hydrateDraft(draftRes.draft);
        if (draftRes.draft._id) {
          const vRes = await api.listVersions(draftRes.draft._id);
          setVersions(vRes.versions || []);
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load engine.');
    } finally {
      setLoading(false);
    }
  };

  const hydrateDraft = (draft: TtGenerated) => {
    setDraftId(draft._id);
    setEntries(draft.entries || []);
    setConflicts(draft.conflicts || []);
    setValidationSummary(draft.validationSummary || null);
    setReport(draft.generationReport || null);
    setVersion(draft.version || 1);
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const handleGenerate = async (isRegenerate = false) => {
    setGenerating(true);
    try {
      const scope = buildScope();
      const res = isRegenerate
        ? await api.regenerate({ timetableId: draftId || undefined, scope })
        : await api.generate({ timetableId: draftId || undefined, scope });

      setDraftId(res.draftId);
      setEntries(res.entries);
      setConflicts(res.conflicts);
      setValidationSummary(res.validationSummary || null);
      setReport(res.generationReport || null);
      setSuggestions((res as any).suggestions || []);
      setVersion(res.version || 1);

      const vRes = await api.listVersions(res.draftId);
      setVersions(vRes.versions || []);

      const errCount = res.validationSummary?.errorCount ?? res.conflicts.filter((c) => c.severity === 'error').length;
      toast.success(isRegenerate ? 'Timetable regenerated.' : 'Timetable generated.', {
        description: `${res.entries.filter((e) => !e.isFree && !e.isLunch).length} lectures scheduled · ${errCount} errors`,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!draftId) return;
    setApproving(true);
    try {
      await api.approveTimetable(draftId);
      toast.success('Timetable approved (draft state saved).');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Approval failed.');
    } finally {
      setApproving(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await api.restoreVersion(id);
      hydrateDraft(res.timetable);
      toast.success(res.message);
      const vRes = await api.listVersions(res.timetable._id);
      setVersions(vRes.versions || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Restore failed.');
    }
  };

  const handleApplySuggestion = async (suggestion: any) => {
    if (!draftId || !suggestion.applyPayload) {
      toast.info(suggestion.recommendation);
      return;
    }
    try {
      const res = await api.applyClashResolution(draftId, suggestion.applyPayload);
      setEntries(res.entries);
      setConflicts(res.conflicts);
      setValidationSummary(res.validationSummary);
      toast.success('Resolution applied.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not apply resolution.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center py-20 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-3" />
        <p className="text-sm">Loading AI Generation Engine...</p>
      </div>
    );
  }

  const branchObj = config?.branches.find((b) => b.code === scopeBranch);
  const semesterObj = branchObj?.semesters?.find((s) => s.semesterNumber === scopeSemester);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-black flex items-center gap-2">
          <Sparkles className="w-6 h-6" /> AI Timetable Generation Engine
        </h2>
        <p className="text-purple-200 text-xs mt-1">
          Constraint scheduling · Backtracking · Greedy optimization · MongoDB-backed configuration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">Generation Scope</h3>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase">Scope Type</label>
            <select
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-xs"
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value as GenerationScope['type'])}
            >
              {SCOPE_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          {(scopeType === 'branch' || scopeType === 'semester' || scopeType === 'section') && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Branch</label>
              <select className="w-full mt-1 border rounded-lg px-3 py-2 text-xs" value={scopeBranch} onChange={(e) => setScopeBranch(e.target.value)}>
                {config?.branches.map((b) => <option key={b.code} value={b.code}>{b.code}</option>)}
              </select>
            </div>
          )}

          {(scopeType === 'semester' || scopeType === 'section') && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Semester</label>
              <select className="w-full mt-1 border rounded-lg px-3 py-2 text-xs" value={scopeSemester} onChange={(e) => setScopeSemester(Number(e.target.value))}>
                {branchObj?.semesters?.map((s) => (
                  <option key={s.semesterNumber} value={s.semesterNumber}>Semester {s.semesterNumber}</option>
                ))}
              </select>
            </div>
          )}

          {scopeType === 'section' && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Section</label>
              <select className="w-full mt-1 border rounded-lg px-3 py-2 text-xs" value={scopeSection} onChange={(e) => setScopeSection(e.target.value)}>
                {semesterObj?.sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {scopeType === 'day' && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Day</label>
              <select className="w-full mt-1 border rounded-lg px-3 py-2 text-xs" value={scopeDay} onChange={(e) => setScopeDay(e.target.value)}>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          {scopeType === 'faculty' && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Faculty</label>
              <select className="w-full mt-1 border rounded-lg px-3 py-2 text-xs" value={scopeFacultyId} onChange={(e) => setScopeFacultyId(e.target.value)}>
                <option value="">Select faculty</option>
                {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              disabled={generating}
              onClick={() => handleGenerate(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Generate Timetable
            </button>
            <button
              type="button"
              disabled={generating || !draftId}
              onClick={() => handleGenerate(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-purple-200 text-purple-700 text-xs font-semibold hover:bg-purple-50 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" /> Regenerate Scope
            </button>
            <button
              type="button"
              disabled={approving || !draftId || (validationSummary?.errorCount || 0) > 0}
              onClick={handleApprove}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" /> Approve Draft
            </button>
          </div>

          {draftId && (
            <p className="text-[10px] text-gray-400 text-center">Draft v{version} · ID {draftId.slice(-6)}</p>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {report && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Generation Report</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-purple-600 font-bold text-lg">{report.stats.scheduledLectures}</p>
                  <p className="text-gray-500">Scheduled</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-red-600 font-bold text-lg">{report.stats.errorCount}</p>
                  <p className="text-gray-500">Errors</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-amber-600 font-bold text-lg">{report.stats.warningCount}</p>
                  <p className="text-gray-500">Warnings</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-emerald-600 font-bold text-lg">{report.stats.roomsUsed}</p>
                  <p className="text-gray-500">Rooms Used</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-3">{report.algorithm} · {report.configSnapshot.academicYear}</p>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm space-y-2">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> AI Clash Resolutions
              </h3>
              {suggestions.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-start justify-between gap-3 bg-amber-50/50 border border-amber-100 rounded-lg p-3 text-xs">
                  <div>
                    <p className="font-semibold text-gray-800">{s.conflictDescription}</p>
                    <p className="text-gray-600 mt-1">{s.recommendation}</p>
                  </div>
                  {s.applyPayload && (
                    <button type="button" onClick={() => handleApplySuggestion(s)} className="shrink-0 px-2 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-semibold">
                      Apply
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {conflicts.length > 0 && <ConflictViewer conflicts={conflicts} />}

          {entries.length > 0 && config && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-wrap gap-2 mb-4 items-end">
                <h3 className="text-sm font-bold text-gray-900 flex-1">Preview Grid</h3>
                <select className="border rounded-lg px-2 py-1 text-xs" value={previewBranch} onChange={(e) => setPreviewBranch(e.target.value)}>
                  {config.branches.map((b) => <option key={b.code} value={b.code}>{b.code}</option>)}
                </select>
                <select className="border rounded-lg px-2 py-1 text-xs" value={previewSemester} onChange={(e) => setPreviewSemester(Number(e.target.value))}>
                  {config.branches.find((b) => b.code === previewBranch)?.semesters?.map((s) => (
                    <option key={s.semesterNumber} value={s.semesterNumber}>Sem {s.semesterNumber}</option>
                  ))}
                </select>
                <select className="border rounded-lg px-2 py-1 text-xs" value={previewSection} onChange={(e) => setPreviewSection(e.target.value)}>
                  {config.branches.find((b) => b.code === previewBranch)?.semesters?.find((s) => s.semesterNumber === previewSemester)?.sections.map((s) => (
                    <option key={s} value={s}>Sec {s}</option>
                  ))}
                </select>
              </div>
              <TimetableGrid
                entries={entries}
                config={config}
                branch={previewBranch}
                year={previewSemester}
                section={previewSection}
                isEditable={false}
              />
            </div>
          )}
        </div>
      </div>

      {versions.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-purple-600" /> Version History
          </h3>
          <div className="space-y-2">
            {versions.map((v) => (
              <div key={v._id} className="flex items-center justify-between border border-gray-50 rounded-lg px-3 py-2 text-xs">
                <div>
                  <span className="font-bold text-purple-700">v{v.version}</span>
                  <span className="text-gray-500 ml-2">{v.label}</span>
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${v.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{v.status}</span>
                </div>
                <button type="button" onClick={() => handleRestore(v._id!)} className="text-purple-600 font-semibold hover:underline">
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { TimetableGenerationEngine };
