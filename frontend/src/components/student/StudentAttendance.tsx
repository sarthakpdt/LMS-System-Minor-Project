import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, BookOpen, Brain, CheckCircle2, ShieldAlert, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AttendanceRing from './AttendanceRing';
import { buildSubjectInsights } from './attendanceUtils';
import { getDemoAttendanceBundle } from './demoAttendance';
import type { AttendanceAnalytics, AttendanceRecord, AttendanceResponse, SubjectAttendance } from './StudentAttendance.types';

const API_BASE = 'http://localhost:5000/api';
const POLL_INTERVAL_MS = 20_000;

const attendancePayloadHash = (data: AttendanceResponse): string =>
  JSON.stringify({
    subjects: data.subjects,
    analytics: data.analytics,
    recordsLen: data.records?.length ?? 0,
    isDemo: data.isDemo,
  });

const riskBadge: Record<string, string> = {
  safe: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

function SubjectCard({
  subject,
  selected,
  lastUpdated,
  onSelect,
}: {
  subject: SubjectAttendance;
  selected: boolean;
  lastUpdated?: string;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md ${selected ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200'}`}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900">{subject.subject}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${riskBadge[subject.riskLevel]}`}>
          {subject.attendancePercentage.toFixed(1)}%
        </span>
      </div>
      <p className="mb-2 text-[10px] font-mono text-slate-400">{subject.courseCode}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center">
          <AttendanceRing percentage={subject.attendancePercentage} riskLevel={subject.riskLevel} size={100} />
          <div className="mt-3 w-full space-y-1 text-xs text-slate-600">
            <div className="flex justify-between"><span>Total</span><span className="font-semibold">{subject.total}</span></div>
            <div className="flex justify-between"><span>Present</span><span className="font-semibold text-emerald-600">{subject.present + subject.late}</span></div>
            <div className="flex justify-between"><span>Absent</span><span className="font-semibold text-red-600">{subject.absent}</span></div>
            <div className="flex justify-between"><span>Late</span><span className="font-semibold text-amber-600">{subject.late}</span></div>
          </div>
          {lastUpdated && (
            <p className="mt-2 text-[10px] text-slate-400">Last updated: {lastUpdated}</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold text-slate-700">Activities ({subject.activities.length})</p>
          {subject.activities.map((a) => (
            <div key={a.type} className="mb-1 flex justify-between text-xs">
              <span className="text-blue-600">{a.type}</span>
              <span className="font-semibold">{a.percentage}%</span>
            </div>
          ))}
          <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskBadge[subject.riskLevel]}`}>{subject.riskLevel} zone</span>
        </div>
      </div>
    </button>
  );
}

export default function StudentAttendance({ studentId }: { studentId: string }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const lastHashRef = useRef('');

  const loadAttendance = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError('');
      }
      const { data } = await axios.get<AttendanceResponse>(`${API_BASE}/attendance/student/${studentId}`);
      const nextHash = attendancePayloadHash(data);
      if (silent && nextHash === lastHashRef.current) {
        return;
      }
      lastHashRef.current = nextHash;

      if (!data.success || !(data.subjects?.length || data.analytics?.totalClasses)) {
        const demo = getDemoAttendanceBundle();
        setSubjects(demo.subjects);
        setRecords(demo.records);
        setAnalytics(demo.analytics);
        setIsDemo(true);
        setSelectedSubject((prev) => prev ?? demo.subjects[0]?.subject ?? null);
      } else {
        setSubjects(data.subjects || []);
        setRecords(data.records || []);
        setAnalytics(data.analytics || null);
        setIsDemo(Boolean(data.isDemo));
        setSelectedSubject((prev) => prev ?? data.subjects?.[0]?.subject ?? null);
      }
      setLastSyncedAt(new Date());
    } catch {
      if (!silent) {
        const demo = getDemoAttendanceBundle();
        setSubjects(demo.subjects);
        setRecords(demo.records);
        setAnalytics(demo.analytics);
        setIsDemo(true);
        setSelectedSubject((prev) => prev ?? demo.subjects[0]?.subject ?? null);
      }
      setError('Unable to refresh attendance. Retrying…');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadAttendance(false);
    const timer = window.setInterval(() => loadAttendance(true), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [loadAttendance]);

  const lastUpdatedBySubject = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((r) => {
      const prev = map.get(r.subject);
      if (!prev || r.date > prev) map.set(r.subject, r.date);
    });
    return map;
  }, [records]);

  const overallSummary = useMemo(() => {
    if (!subjects.length) return null;
    const totalCourses = subjects.length;
    const avgAttendance = Number(
      (subjects.reduce((sum, s) => sum + s.attendancePercentage, 0) / totalCourses).toFixed(2)
    );
    const totalPresent = subjects.reduce((sum, s) => sum + s.present, 0);
    const totalAbsent = subjects.reduce((sum, s) => sum + s.absent, 0);
    const totalLate = subjects.reduce((sum, s) => sum + s.late, 0);
    return { totalCourses, avgAttendance, totalPresent, totalAbsent, totalLate };
  }, [subjects]);

  const chartData = useMemo(() => {
    if (!analytics) return [];
    return analytics.trend.map((p) => ({ ...p, predicted: analytics.predictedAttendance }));
  }, [analytics]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      </div>
    );
  }

  if (error || !analytics || subjects.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="flex items-center gap-2 text-sm font-medium"><AlertTriangle className="h-4 w-4" />{error || 'Unable to load attendance.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Showing sample data for preview. Real records appear after teachers mark attendance.
        </div>
      )}

      {lastSyncedAt && !isDemo && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
          <span>Linked to teacher attendance — auto-refreshes every {POLL_INTERVAL_MS / 1000}s</span>
          <span>Synced {lastSyncedAt.toLocaleTimeString()}</span>
        </div>
      )}

      {overallSummary && (
        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
          <div><p className="text-xs text-slate-500">Total Courses</p><p className="text-xl font-bold text-slate-900">{overallSummary.totalCourses}</p></div>
          <div><p className="text-xs text-slate-500">Avg Attendance</p><p className="text-xl font-bold text-violet-600">{overallSummary.avgAttendance}%</p></div>
          <div><p className="text-xs text-slate-500">Total Present</p><p className="text-xl font-bold text-emerald-600">{overallSummary.totalPresent}</p></div>
          <div><p className="text-xs text-slate-500">Total Absent</p><p className="text-xl font-bold text-red-600">{overallSummary.totalAbsent}</p></div>
          <div><p className="text-xs text-slate-500">Total Late</p><p className="text-xl font-bold text-amber-600">{overallSummary.totalLate}</p></div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Subject-wise Attendance</h2>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
          <div><p className="text-xs text-slate-500">Total Lectures</p><p className="text-xl font-bold text-violet-600">{analytics.totalClasses}</p></div>
          <div><p className="text-xs text-slate-500">Present</p><p className="text-xl font-bold text-emerald-600">{analytics.presentCount + analytics.lateCount}</p></div>
          <div><p className="text-xs text-slate-500">Absent</p><p className="text-xl font-bold text-red-600">{analytics.absentCount}</p></div>
          <div>
            <p className="mb-1 text-xs text-slate-500">Overall</p>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500" style={{ width: `${analytics.attendancePercentage}%` }} />
              </div>
              <span className="text-sm font-bold">{analytics.attendancePercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((s) => (
            <SubjectCard
              key={s.subject}
              subject={s}
              selected={selectedSubject === s.subject}
              lastUpdated={lastUpdatedBySubject.get(s.subject)}
              onSelect={() => setSelectedSubject(s.subject)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Overall Attendance</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col items-center">
            <AttendanceRing percentage={analytics.attendancePercentage} riskLevel={analytics.riskLevel} size={140} label="Overall" />
            <span className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold ${riskBadge[analytics.riskLevel]}`}>{analytics.riskLevel} zone</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:col-span-2">
            {[
              { label: 'Present', value: analytics.presentCount, icon: CheckCircle2, color: 'text-emerald-600' },
              { label: 'Absent', value: analytics.absentCount, icon: ShieldAlert, color: 'text-red-600' },
              { label: 'Safe Leaves', value: analytics.safeLeavesRemaining, icon: TrendingUp, color: 'text-indigo-600' },
              { label: 'Need for 75%', value: analytics.classesNeededFor75, icon: TrendingUp, color: 'text-amber-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <Icon className={`mb-2 h-5 w-5 ${color}`} />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Attendance']} />
              <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="percentage" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
              <Line type="monotone" dataKey="predicted" stroke="#6366f1" strokeDasharray="5 5" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-bold text-slate-900">Smart Insights (per subject)</h2>
        </div>
        <div className="space-y-4">
          {subjects.map((subject) => (
            <div key={subject.subject} className={`rounded-2xl border bg-white p-5 shadow-sm ${selectedSubject === subject.subject ? 'border-violet-300' : 'border-slate-200'}`}>
              <h3 className="font-semibold text-slate-900">{subject.subject} <span className="text-xs text-slate-500">({subject.courseCode})</span></h3>
              <ul className="mt-3 space-y-2">
                {buildSubjectInsights(subject).map((tip) => (
                  <li key={tip} className="flex gap-2 text-sm text-slate-600"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />{tip}</li>
                ))}
              </ul>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-violet-50 p-3 text-sm text-violet-900">
                  <strong>Recovery:</strong> {subject.classesNeededFor75 > 0 ? `Need ${subject.classesNeededFor75} more present classes for 75%.` : 'Above 75% — maintain streak.'}
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                  <strong>Leave plan:</strong> {subject.safeLeavesRemaining > 0 ? `Can safely miss ${subject.safeLeavesRemaining} class(es).` : 'Avoid missing classes.'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {records.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b px-5 py-3 font-semibold text-slate-800">Recent Records</div>
          <div className="divide-y">
            {records.slice(0, 8).map((r) => (
              <div key={`${r.date}-${r.subject}`} className="flex justify-between px-5 py-3 text-sm">
                <div><p className="font-medium">{r.subject}</p><p className="text-xs text-slate-500">{r.date}</p></div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${r.status === 'present' ? 'bg-emerald-100 text-emerald-700' : r.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
