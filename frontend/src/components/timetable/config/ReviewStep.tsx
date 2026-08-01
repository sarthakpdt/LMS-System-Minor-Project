import React, { useEffect, useState } from 'react';
import {
  Building2, BookOpen, UserCheck, MapPin, Shield, CheckCircle2,
  AlertCircle, RefreshCw, Pencil,
} from 'lucide-react';
import { engineApi } from '../manageApi';
import { TtFacultyConstraint, TtRoom, TtSubject, UnifiedTtConfig } from '../types';
import { StepHeader, btnPrimary, btnSecondary } from './shared';

interface Props {
  unified: UnifiedTtConfig | null;
  onGoToStep: (step: number) => void;
  onRefresh: () => Promise<void>;
}

interface SummaryCounts {
  subjects: number;
  rooms: number;
  faculty: number;
}

export default function ReviewStep({ unified, onGoToStep, onRefresh }: Props) {
  const [counts, setCounts] = useState<SummaryCounts>({ subjects: 0, rooms: 0, faculty: 0 });
  const [subjects, setSubjects] = useState<TtSubject[]>([]);
  const [rooms, setRooms] = useState<TtRoom[]>([]);
  const [constraints, setConstraints] = useState<TtFacultyConstraint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [subRes, roomRes, facRes] = await Promise.all([
          engineApi.getAllSubjects(),
          engineApi.getRooms(),
          engineApi.getFacultyConstraints(),
        ]);
        setSubjects(subRes.subjects);
        setRooms(roomRes.rooms);
        setConstraints(facRes.constraints);
        setCounts({
          subjects: subRes.subjects.length,
          rooms: roomRes.rooms.length,
          faculty: facRes.constraints.length,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [unified]);

  const branches = unified?.branches || [];
  const sections = unified?.sections || [];
  const semesters = unified?.semesters || [];
  const workingDays = unified?.workingDays || [];
  const timeSlots = unified?.timeSlots || [];

  const cards = [
    { label: 'Branches', value: branches.length, icon: Building2, step: 0, ok: branches.length > 0 },
    { label: 'Semesters', value: semesters.length, icon: Building2, step: 0, ok: semesters.length > 0 },
    { label: 'Sections', value: sections.length, icon: Building2, step: 0, ok: sections.length > 0 },
    { label: 'Subjects', value: counts.subjects, icon: BookOpen, step: 1, ok: counts.subjects > 0 },
    { label: 'Faculty Rules', value: counts.faculty, icon: UserCheck, step: 2, ok: counts.faculty > 0 },
    { label: 'Rooms', value: counts.rooms, icon: MapPin, step: 3, ok: counts.rooms > 0 },
    { label: 'Working Days', value: workingDays.length, icon: Shield, step: 4, ok: workingDays.length > 0 },
    { label: 'Time Slots', value: timeSlots.length, icon: Shield, step: 4, ok: timeSlots.length > 0 },
  ];

  const allReady = cards.every((c) => c.ok);
  const completionPct = Math.round((cards.filter((c) => c.ok).length / cards.length) * 100);

  return (
    <div className="space-y-6">
      <StepHeader
        title="Step 6 — Review Configuration"
        description="Review all saved settings before proceeding to timetable generation (Phase 3)."
      />

      <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-gray-700">Configuration Completeness</span>
            <span className="font-bold text-purple-700">{completionPct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
          </div>
        </div>
        <button type="button" className={btnSecondary()} onClick={() => onRefresh()}>
          <RefreshCw className="w-4 h-4" /> Reload
        </button>
      </div>

      {allReady ? (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          All configuration sections have data. You are ready for Phase 3 (timetable generation).
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Some sections are incomplete. Click a card below to edit the missing configuration.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onGoToStep(card.step)}
              className={`text-left border rounded-xl p-4 transition hover:shadow-md ${
                card.ok ? 'border-emerald-100 bg-emerald-50/30' : 'border-amber-100 bg-amber-50/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${card.ok ? 'text-emerald-600' : 'text-amber-500'}`} />
                <Pencil className="w-3 h-3 text-gray-400" />
              </div>
              <p className="text-2xl font-black text-gray-900">{loading ? '…' : card.value}</p>
              <p className="text-[10px] font-semibold text-gray-500 uppercase mt-1">{card.label}</p>
            </button>
          );
        })}
      </div>

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-100 rounded-xl p-5">
            <h4 className="text-sm font-bold text-gray-800 mb-3">Branch Overview</h4>
            {branches.length === 0 ? (
              <p className="text-xs text-gray-400">No branches configured.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {branches.map((b) => (
                  <li key={b._id} className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="font-semibold">{b.code}</span>
                    <span className="text-gray-500">{b.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-gray-100 rounded-xl p-5">
            <h4 className="text-sm font-bold text-gray-800 mb-3">Recent Subjects ({subjects.slice(0, 5).length} shown)</h4>
            {subjects.length === 0 ? (
              <p className="text-xs text-gray-400">No subjects added.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {subjects.slice(0, 5).map((s) => (
                  <li key={s._id} className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="font-mono text-purple-700">{s.code}</span>
                    <span>{s.name} · {s.branch} Y{s.year}</span>
                  </li>
                ))}
                {subjects.length > 5 && <li className="text-gray-400">+{subjects.length - 5} more</li>}
              </ul>
            )}
          </div>

          <div className="border border-gray-100 rounded-xl p-5">
            <h4 className="text-sm font-bold text-gray-800 mb-3">Rooms ({rooms.length})</h4>
            {rooms.length === 0 ? (
              <p className="text-xs text-gray-400">No rooms registered.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {rooms.slice(0, 8).map((r) => (
                  <span key={r._id} className="text-[10px] bg-gray-100 px-2 py-1 rounded-lg">{r.name} ({r.capacity})</span>
                ))}
              </div>
            )}
          </div>

          <div className="border border-gray-100 rounded-xl p-5">
            <h4 className="text-sm font-bold text-gray-800 mb-3">Faculty Constraints ({constraints.length})</h4>
            {constraints.length === 0 ? (
              <p className="text-xs text-gray-400">No faculty constraints set.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {constraints.slice(0, 4).map((c) => (
                  <li key={c._id} className="flex justify-between border-b border-gray-50 pb-2">
                    <span>{c.facultyName}</span>
                    <span className="text-gray-500">{c.maxHoursPerDay}/day · {c.maxHoursPerWeek}/wk</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 text-center">
        <p className="text-sm font-semibold text-purple-900">Configuration Phase Complete</p>
        <p className="text-xs text-purple-700 mt-1">
          All data is stored in MongoDB. Timetable generation will be available in Phase 3.
        </p>
      </div>
    </div>
  );
}
