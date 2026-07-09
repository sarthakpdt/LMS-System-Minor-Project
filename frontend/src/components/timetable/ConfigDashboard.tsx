import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Building2, BookOpen, UserCheck, MapPin, Shield, ClipboardCheck,
  ChevronLeft, ChevronRight, CheckCircle2, Circle, Save, AlertTriangle,
} from 'lucide-react';
import { manageApi, engineApi } from './manageApi';
import { TtAcademicYear, TtDepartment, Teacher, UnifiedTtConfig } from './types';
import { LoadingSkeleton } from './config/shared';
import CollegeStructureStep from './config/CollegeStructureStep';
import SubjectStep from './config/SubjectStep';
import FacultyStep from './config/FacultyStep';
import RoomStep from './config/RoomStep';
import ConstraintsStep from './config/ConstraintsStep';
import ReviewStep from './config/ReviewStep';

const STEPS = [
  { id: 'structure', label: 'College Structure', icon: Building2 },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'faculty', label: 'Faculty', icon: UserCheck },
  { id: 'rooms', label: 'Rooms', icon: MapPin },
  { id: 'constraints', label: 'Constraints', icon: Shield },
  { id: 'review', label: 'Review', icon: ClipboardCheck },
] as const;

export default function ConfigDashboard() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<TtAcademicYear[]>([]);
  const [academicYearId, setAcademicYearId] = useState('');
  const [departments, setDepartments] = useState<TtDepartment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [unified, setUnified] = useState<UnifiedTtConfig | null>(null);
  const [dirty, setDirty] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentYear = academicYears.find((y) => y._id === academicYearId);
  const academicYearLabel = currentYear?.label || unified?.academicYear?.label || '';

  const loadBase = useCallback(async () => {
    const [yearsRes, deptRes, teachersRes] = await Promise.all([
      manageApi.getAcademicYears(),
      manageApi.getDepartments(),
      engineApi.getTeachers(),
    ]);
    setAcademicYears(yearsRes.data);
    setDepartments(deptRes.data);
    setTeachers(teachersRes.data);

    const current = yearsRes.data.find((y) => y.isCurrent) || yearsRes.data[0];
    if (current?._id) {
      setAcademicYearId((prev) => prev || current._id!);
    }
  }, []);

  const loadUnified = useCallback(async (ayId: string) => {
    if (!ayId) {
      setUnified(null);
      return;
    }
    try {
      const res = await manageApi.getUnifiedConfig(ayId);
      setUnified(res.data);
    } catch {
      setUnified(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await loadBase();
      if (academicYearId) await loadUnified(academicYearId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  }, [academicYearId, loadBase, loadUnified]);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (academicYearId) {
      loadUnified(academicYearId).catch(() => setUnified(null));
    }
  }, [academicYearId, loadUnified]);

  const markDirty = () => setDirty(true);
  const markStepComplete = (idx: number) => setCompletedSteps((prev) => ({ ...prev, [idx]: true }));

  const goToStep = (index: number) => {
    if (dirty && index !== step) {
      const proceed = window.confirm('You have unsaved changes. Navigate anyway?');
      if (!proceed) return;
      setDirty(false);
    }
    setStep(index);
  };

  const goNext = () => {
    markStepComplete(step);
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const goBack = () => {
    if (dirty) {
      const proceed = window.confirm('You have unsaved changes. Go back anyway?');
      if (!proceed) return;
      setDirty(false);
    }
    if (step > 0) setStep(step - 1);
  };

  const handleSaveDraft = async () => {
    if (!academicYearId) {
      toast.error('Select an academic year first.');
      return;
    }
    try {
      await manageApi.syncLegacyConfig(academicYearId);
      toast.success('Configuration draft saved and synced.');
      setDirty(false);
      markStepComplete(step);
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save draft failed. Complete working days, slots, and lunch first.');
    }
  };

  useEffect(() => {
    if (!dirty) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      toast.info('Unsaved changes — use Save Draft to persist.', { duration: 2000 });
    }, 8000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [dirty]);

  const completionPct = Math.round(
    ((Object.keys(completedSteps).length + (dirty ? 0 : 1)) / STEPS.length) * 100,
  );

  if (loading && !unified && academicYears.length === 0) {
    return <LoadingSkeleton message="Loading timetable configuration dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-900">Admin Configuration Dashboard</h2>
            <p className="text-[10px] text-gray-500">Phase 2 — Configure all inputs before timetable generation</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white min-w-[160px]"
              value={academicYearId}
              onChange={(e) => {
                if (dirty && !window.confirm('Unsaved changes will be lost. Switch academic year?')) return;
                setDirty(false);
                setAcademicYearId(e.target.value);
              }}
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((y) => (
                <option key={y._id} value={y._id}>{y.label}{y.isCurrent ? ' (Current)' : ''}</option>
              ))}
            </select>
            {dirty && (
              <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> Unsaved
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition shadow-sm"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="mt-4 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === idx;
              const isDone = completedSteps[idx] || idx < step;
              return (
                <React.Fragment key={s.id}>
                  <button
                    type="button"
                    onClick={() => goToStep(idx)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-semibold transition whitespace-nowrap ${
                      isActive ? 'bg-purple-600 text-white shadow-md'
                        : isDone ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : 'bg-white text-gray-500 border border-gray-100 hover:border-purple-200'
                    }`}
                  >
                    {isDone && !isActive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Icon className="w-3.5 h-3.5" />}
                    <span>{idx + 1}. {s.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>
            <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
              Step {step + 1}/{STEPS.length} · {completionPct}% complete
            </span>
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-[480px]">
        {step === 0 && (
          <CollegeStructureStep
            academicYearId={academicYearId}
            unified={unified}
            departments={departments}
            onRefresh={refresh}
            onDirty={markDirty}
          />
        )}
        {step === 1 && (
          <SubjectStep unified={unified} teachers={teachers} onRefresh={refresh} onDirty={markDirty} />
        )}
        {step === 2 && (
          <FacultyStep teachers={teachers} onRefresh={refresh} onDirty={markDirty} />
        )}
        {step === 3 && (
          <RoomStep departments={departments} onRefresh={refresh} onDirty={markDirty} />
        )}
        {step === 4 && (
          <ConstraintsStep
            academicYearId={academicYearId}
            academicYearLabel={academicYearLabel}
            unified={unified}
            onRefresh={refresh}
            onDirty={markDirty}
          />
        )}
        {step === 5 && (
          <ReviewStep unified={unified} onGoToStep={goToStep} onRefresh={refresh} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, idx) => (
            <Circle
              key={idx}
              className={`w-2 h-2 ${idx === step ? 'text-purple-600 fill-purple-600' : idx < step ? 'text-emerald-400 fill-emerald-400' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={goNext}
          disabled={step >= STEPS.length - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 transition shadow-sm"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export { ConfigDashboard };
