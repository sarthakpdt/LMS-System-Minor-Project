import React, { useEffect, useState } from 'react';
import { api } from './api';
import { TtConfig, Teacher } from './types';
import { BookOpen, Plus, Check, AlertCircle } from 'lucide-react';

interface CourseRow {
  key: string;
  name: string;
  code: string;
  type: 'theory' | 'lab';
  weeklyHours: number;
  lectureDuration: number;
  hasLab: boolean;
  labDuration: number;
  labSessionsPerWeek: number;
  facultyId: string;
}

const emptyRow = (): CourseRow => ({
  key: crypto.randomUUID(),
  name: '',
  code: '',
  type: 'theory',
  weeklyHours: 3,
  lectureDuration: 50,
  hasLab: false,
  labDuration: 2,
  labSessionsPerWeek: 1,
  facultyId: '',
});

interface Props {
  config: TtConfig | null;
  teachers: Teacher[];
  onSaved?: () => void;
}

export default function CourseWizard({ config, teachers, onSaved }: Props) {
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState(1);
  const [courseCount, setCourseCount] = useState(1);
  const [rows, setRows] = useState<CourseRow[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!config?.branches.length) return;
    const first = config.branches[0];
    setBranch(first.code);
    setYear(first.years[0]?.yearNumber || 1);
  }, [config]);

  useEffect(() => {
    setRows((prev) => {
      const next = [...prev];
      while (next.length < courseCount) next.push(emptyRow());
      while (next.length > courseCount) next.pop();
      return next;
    });
  }, [courseCount]);

  const updateRow = (key: string, patch: Partial<CourseRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    if (!branch) {
      setError('Select a branch first.');
      return;
    }
    const invalid = rows.find((r) => !r.name.trim() || !r.code.trim());
    if (invalid) {
      setError('Every course needs a name and code.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.saveSubjectsBulk({
        branch,
        year,
        subjects: rows.map((r) => ({
          name: r.name.trim(),
          code: r.code.trim().toUpperCase(),
          type: r.type,
          weeklyHours: Number(r.weeklyHours),
          lectureDuration: Number(r.lectureDuration) || undefined,
          labDuration: Number(r.labDuration),
          hasLab: r.hasLab,
          labSessionsPerWeek: Number(r.labSessionsPerWeek),
          facultyId: r.facultyId || null,
        })),
      });
      setSuccess(`${rows.length} course(s) saved. Lab components created automatically when enabled.`);
      onSaved?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save courses.');
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;

  const selectedBranch = config.branches.find((b) => b.code === branch);

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
        <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Course Setup Wizard
        </h4>
        <p className="text-xs text-indigo-700 mt-1">
          Choose branch and year, set how many courses, then enter faculty, weekly hours, and lab details for each.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-xs">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Branch</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white"
          >
            {config.branches.map((b) => (
              <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Academic Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white"
          >
            {(selectedBranch?.years || []).map((y) => (
              <option key={y.yearNumber} value={y.yearNumber}>{y.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Number of Courses</label>
          <input
            type="number"
            min={1}
            max={20}
            value={courseCount}
            onChange={(e) => setCourseCount(Math.max(1, Number(e.target.value)))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setRows(rows.map((r) => ({ ...r, lectureDuration: config.lectureDuration })))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs hover:bg-gray-50"
          >
            Use default lecture ({config.lectureDuration} min)
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((row, idx) => (
          <div key={row.key} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">Course {idx + 1}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                placeholder="Course name (e.g. DBMS)"
                value={row.name}
                onChange={(e) => updateRow(row.key, { name: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white"
              />
              <input
                placeholder="Code (e.g. CS301)"
                value={row.code}
                onChange={(e) => updateRow(row.key, { code: e.target.value.toUpperCase() })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white uppercase"
              />
              <select
                value={row.type}
                onChange={(e) => updateRow(row.key, { type: e.target.value as 'theory' | 'lab' })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white"
              >
                <option value="theory">Theory</option>
                <option value="lab">Lab only</option>
              </select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 font-semibold">Weekly hours / sessions</label>
                <input
                  type="number"
                  min={1}
                  value={row.weeklyHours}
                  onChange={(e) => updateRow(row.key, { weeklyHours: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-semibold">Lecture duration (min)</label>
                <input
                  type="number"
                  min={30}
                  value={row.lectureDuration}
                  onChange={(e) => updateRow(row.key, { lectureDuration: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-semibold">Assigned faculty</label>
                <select
                  value={row.facultyId}
                  onChange={(e) => updateRow(row.key, { facultyId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white mt-1"
                >
                  <option value="">Select faculty</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                {row.type === 'theory' && (
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={row.hasLab}
                      onChange={(e) => updateRow(row.key, { hasLab: e.target.checked })}
                    />
                    Includes lab component
                  </label>
                )}
              </div>
            </div>
            {(row.hasLab || row.type === 'lab') && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-[10px] text-gray-500 font-semibold">Lab duration (hours per session)</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    step={0.5}
                    value={row.labDuration}
                    onChange={(e) => updateRow(row.key, { labDuration: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white mt-1"
                  />
                </div>
                {row.hasLab && row.type === 'theory' && (
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold">Lab sessions per week</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={row.labSessionsPerWeek}
                      onChange={(e) => updateRow(row.key, { labSessionsPerWeek: Number(e.target.value) })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white mt-1"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg px-6 py-2.5 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Courses & Link Faculty'}
        </button>
      </div>
    </div>
  );
}
