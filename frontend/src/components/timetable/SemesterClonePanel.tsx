import React, { useState, useEffect } from 'react';
import { Copy, Loader2, AlertTriangle, CheckCircle2, ChevronRight, RefreshCw, Info, GitBranch } from 'lucide-react';
import { api } from './api';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface TimetableMeta {
  _id: string;
  label?: string;
  status: string;
  generatedAt: string;
  entries: { branch: string; year: number }[];
}

interface CloneResult {
  success: boolean;
  message: string;
  timetableId?: string;
  modifiedCount?: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function uniqBranches(entries: { branch: string; year: number }[]): string[] {
  return [...new Set(entries.map((e) => `${e.branch} Y${e.year}`))];
}

// ─── Main Component ────────────────────────────────────────────────────────────
const SemesterClonePanel: React.FC = () => {
  const [timetables, setTimetables] = useState<TimetableMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CloneResult | null>(null);

  // Form state
  const [sourceId, setSourceId] = useState('');
  const [targetLabel, setTargetLabel] = useState('');
  const [targetYear, setTargetYear] = useState<number | ''>('');
  const [targetBranch, setTargetBranch] = useState('');
  const [targetSection, setTargetSection] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.listTimetables();
        setTimetables(res.timetables || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleClone = async () => {
    if (!sourceId || !targetLabel) {
      setError('Please select a source timetable and provide a label for the clone.');
      return;
    }
    setCloning(true);
    setError(null);
    setResult(null);
    try {
      // Use direct fetch since cloneSemester expects branch/year params, not sourceTimetableId
      const BASE = 'http://localhost:5000/api/timetable/engine';
      const response = await fetch(`${BASE}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceTimetableId: sourceId,
          targetLabel,
          targetYear: targetYear !== '' ? Number(targetYear) : undefined,
          targetBranch: targetBranch || undefined,
          targetSection: targetSection || undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setResult({ success: true, message: data.message || 'Cloned successfully', timetableId: data.timetableId, modifiedCount: data.created });
      } else {
        setError(data.message || 'Clone failed');
      }
    } catch (e: any) {
      setError(e.message || 'Clone failed');
    } finally {
      setCloning(false);
    }
  };

  const selectedSource = timetables.find((t) => t._id === sourceId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading timetables...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-purple-500" />
          Semester Clone
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Clone an existing timetable structure to a new semester. Only subjects, faculty &amp; rooms can be modified afterward.
        </p>
      </div>

      {result?.success && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Timetable cloned successfully!</p>
            <p className="text-xs mt-0.5">{result.message}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Source picker */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">1</span>
            Select Source Timetable
          </h4>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {timetables.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No timetables found.</p>
            ) : (
              timetables.map((t) => (
                <button
                  key={t._id}
                  onClick={() => { setSourceId(t._id); setResult(null); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    sourceId === t._id
                      ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {t.label || 'Untitled Timetable'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{fmtDate(t.generatedAt)}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {uniqBranches(t.entries || []).slice(0, 4).map((b) => (
                          <span key={b} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{b}</span>
                        ))}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                      t.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Source summary */}
          {selectedSource && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700">
              <strong>Source:</strong> {selectedSource.label || 'Untitled'} &middot; {selectedSource.entries?.length || 0} slots
            </div>
          )}
        </div>

        {/* Clone configuration */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">2</span>
            Configure Clone
          </h4>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Clone Label *</label>
              <input
                type="text"
                value={targetLabel}
                onChange={(e) => setTargetLabel(e.target.value)}
                placeholder="e.g., Semester 5 – 2025-26"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Target Year (optional)</label>
              <input
                type="number"
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g., 3"
                min={1} max={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Target Branch (optional)</label>
              <input
                type="text"
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                placeholder="e.g., CSE"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Target Section (optional)</label>
              <input
                type="text"
                value={targetSection}
                onChange={(e) => setTargetSection(e.target.value)}
                placeholder="e.g., A"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>The clone preserves the complete time structure (days, slots, room types). After cloning, update subjects and faculty in the timetable editor.</span>
          </div>

          {/* Arrow flow */}
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-200">
            <div className="text-center">
              <p className="font-semibold text-gray-700">{selectedSource?.label || 'Source'}</p>
              <p className="text-gray-400">Semester X</p>
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            <div className="text-center">
              <p className="font-semibold text-purple-700">{targetLabel || 'Clone'}</p>
              <p className="text-gray-400">Semester Y</p>
            </div>
          </div>

          <button
            onClick={handleClone}
            disabled={cloning || !sourceId || !targetLabel}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {cloning ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Cloning...</>
            ) : (
              <><Copy className="w-4 h-4" /> Clone Timetable</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SemesterClonePanel;
