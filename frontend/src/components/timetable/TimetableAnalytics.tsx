import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import {
  BarChart2, Users, Home, TrendingUp, RefreshCw, AlertTriangle,
  CheckCircle2, Loader2, ChevronDown, ChevronUp, Book, FlaskConical,
  Zap, BarChart as BarIcon, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

// ─────────────────────────── Types ───────────────────────────────────────────
interface RoomStat {
  roomId: string;
  roomName: string;
  roomType: string;
  capacity: number;
  usedSlots: number;
  totalSlots: number;
  utilizationPct: number;
  byDay: Record<string, number>;
  byType: { theory: number; lab: number };
  status: 'high' | 'medium' | 'low';
}

interface FacultyStat {
  teacherId: string;
  teacherName: string;
  department: string;
  weeklyHours: number;
  maxWeekly: number;
  loadPct: number;
  byDay: Record<string, number>;
  byType: { theory: number; lab: number };
  gapCount: number;
  status: 'overloaded' | 'balanced' | 'underloaded';
  overloadedDays: string[];
}

// ─────────────────────────── Utility helpers ─────────────────────────────────
const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    high:        { bg: 'bg-red-100',    text: 'text-red-700',    label: 'High' },
    medium:      { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' },
    low:         { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Low' },
    overloaded:  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Overloaded' },
    balanced:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Balanced' },
    underloaded: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Light Load' },
  };
  const s = map[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
};

const ProgressBar: React.FC<{ pct: number; color?: string }> = ({ pct, color }) => {
  const clamped = Math.min(100, Math.max(0, pct));
  const bg = color || (pct >= 80 ? 'bg-red-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-blue-400');
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className={`${bg} h-2 rounded-full transition-all duration-500`} style={{ width: `${clamped}%` }} />
    </div>
  );
};

const KPICard: React.FC<{
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
}> = ({ title, value, sub, icon, accent = 'from-indigo-500 to-purple-600' }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
    <div className={`p-3 rounded-xl bg-gradient-to-br ${accent} text-white shadow`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─────────────────────────── DayBar mini chart ───────────────────────────────
const DayBarChart: React.FC<{ byDay: Record<string, number>; max?: number }> = ({ byDay, max }) => {
  const keys = Object.keys(byDay);
  const maxVal = max ?? Math.max(1, ...Object.values(byDay));
  return (
    <div className="flex items-end gap-1 h-8">
      {keys.map((d) => {
        const h = Math.round((byDay[d] / maxVal) * 32);
        return (
          <div key={d} title={`${d}: ${byDay[d]} slots`} className="flex flex-col items-center gap-0.5">
            <div
              className="w-4 rounded-t bg-indigo-400 hover:bg-indigo-600 transition-colors"
              style={{ height: `${h}px` }}
            />
            <span className="text-[9px] text-gray-400">{d.slice(0, 2)}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────── Room Row ────────────────────────────────────────
const RoomRow: React.FC<{ room: RoomStat; expanded: boolean; onToggle: () => void }> = ({ room, expanded, onToggle }) => (
  <div className="border border-gray-100 rounded-xl overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Home size={14} className="text-gray-400 shrink-0" />
          <span className="font-semibold text-gray-800 text-sm truncate">{room.roomName}</span>
          <span className="text-xs text-gray-400">({room.roomType})</span>
          {statusBadge(room.status)}
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          <ProgressBar pct={room.utilizationPct} />
          <span className="text-xs font-bold text-gray-600 whitespace-nowrap">{room.utilizationPct}%</span>
        </div>
      </div>
      <span className="text-xs text-gray-400">{room.usedSlots}/{room.totalSlots} slots</span>
      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
    {expanded && (
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 mb-1 font-medium">Daily Usage</p>
          <DayBarChart byDay={room.byDay} />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1 font-medium">By Subject Type</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Book size={12} className="text-indigo-400" />
              Theory: <strong>{room.byType.theory}</strong>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <FlaskConical size={12} className="text-purple-400" />
              Lab: <strong>{room.byType.lab}</strong>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Capacity: {room.capacity} seats</p>
        </div>
      </div>
    )}
  </div>
);

// ─────────────────────────── Faculty Row ─────────────────────────────────────
const FacultyRow: React.FC<{ f: FacultyStat; expanded: boolean; onToggle: () => void }> = ({ f, expanded, onToggle }) => (
  <div className="border border-gray-100 rounded-xl overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-gray-400 shrink-0" />
          <span className="font-semibold text-gray-800 text-sm truncate">{f.teacherName}</span>
          <span className="text-xs text-gray-400">({f.department})</span>
          {statusBadge(f.status)}
          {(f.overloadedDays?.length ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
              <AlertTriangle size={11} />
              Overloaded: {f.overloadedDays.join(', ')}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          <ProgressBar
            pct={f.loadPct}
            color={f.status === 'overloaded' ? 'bg-red-500' : f.status === 'balanced' ? 'bg-green-500' : 'bg-blue-400'}
          />
          <span className="text-xs font-bold text-gray-600 whitespace-nowrap">{f.loadPct}%</span>
        </div>
      </div>
      <span className="text-xs text-gray-400">{f.weeklyHours}/{f.maxWeekly} hrs/wk</span>
      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
    {expanded && (
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 mb-1 font-medium">Daily Distribution</p>
          <DayBarChart byDay={f.byDay || {}} />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1 font-medium">Subject Types & Gaps</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Book size={12} className="text-indigo-400" />
              Theory: <strong>{f.byType?.theory ?? 0}</strong>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <FlaskConical size={12} className="text-purple-400" />
              Lab: <strong>{f.byType?.lab ?? 0}</strong>
            </div>
          </div>
          {(f.gapCount ?? 0) > 0 && (
            <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
              <Zap size={11} />
              {f.gapCount} scheduling gap{f.gapCount > 1 ? 's' : ''} detected
            </p>
          )}
        </div>
      </div>
    )}
  </div>
);

// ─────────────────────────── Main Component ──────────────────────────────────
type Tab = 'rooms' | 'faculty';

export default function TimetableAnalytics() {
  const [tab, setTab] = useState<Tab>('rooms');
  const [roomData, setRoomData] = useState<{ rooms: RoomStat[]; summary: any } | null>(null);
  const [facultyData, setFacultyData] = useState<{ faculty: FacultyStat[]; summary: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getRoomUtilization();
      setRoomData({ rooms: res.rooms, summary: res.summary });
    } catch (e: any) {
      setError(e.message || 'Failed to load room analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFaculty = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getFacultyWorkload();
      setFacultyData({ faculty: res.faculty, summary: res.summary });
    } catch (e: any) {
      setError(e.message || 'Failed to load faculty analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'rooms') loadRooms();
    else loadFaculty();
    setExpandedId(null);
    setSearch('');
  }, [tab, loadRooms, loadFaculty]);

  const toggleExpanded = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  // Filter
  const filteredRooms = (roomData?.rooms ?? []).filter(
    (r) =>
      r.roomName.toLowerCase().includes(search.toLowerCase()) ||
      r.roomType.toLowerCase().includes(search.toLowerCase())
  );
  const filteredFaculty = (facultyData?.faculty ?? []).filter(
    (f) =>
      f.teacherName.toLowerCase().includes(search.toLowerCase()) ||
      f.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity size={20} className="text-indigo-500" />
            Timetable Analytics
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Live metrics derived from the published timetable.</p>
        </div>
        <button
          onClick={tab === 'rooms' ? loadRooms : loadFaculty}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
        {(['rooms', 'faculty'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'rooms' ? <Home size={14} /> : <Users size={14} />}
            {t === 'rooms' ? 'Room Utilization' : 'Faculty Workload'}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" />
          Loading analytics…
        </div>
      )}

      {/* Room Analytics */}
      {!loading && tab === 'rooms' && roomData && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              title="Total Rooms"
              value={roomData.summary.totalRooms}
              icon={<Home size={18} />}
              accent="from-blue-500 to-indigo-600"
            />
            <KPICard
              title="Avg Utilization"
              value={`${roomData.summary.avgUtilization}%`}
              icon={<BarChart size={18} />}
              accent="from-indigo-500 to-purple-600"
            />
            <KPICard
              title="High Usage"
              value={roomData.summary.highUtilization}
              sub="≥ 80% utilized"
              icon={<TrendingUp size={18} />}
              accent="from-red-500 to-orange-500"
            />
            <KPICard
              title="Underutilized"
              value={roomData.summary.underutilized}
              sub="< 40% utilized"
              icon={<CheckCircle2 size={18} />}
              accent="from-emerald-400 to-teal-600"
            />
          </div>

          {/* Recharts Room Utilization Chart */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarIcon className="w-4 h-4 text-indigo-500" />
              Room Occupancy &amp; Utilization Analytics
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomData.rooms.slice(0, 12)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="roomName" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }}
                    formatter={(value) => [`${value}%`, 'Utilization']}
                  />
                  <Bar dataKey="utilizationPct" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Utilization %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search rooms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />

          {/* Room list */}
          {filteredRooms.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">
              No rooms match your search or no published timetable available.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredRooms.map((room) => (
                <RoomRow
                  key={room.roomId}
                  room={room}
                  expanded={expandedId === room.roomId}
                  onToggle={() => toggleExpanded(room.roomId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Faculty Analytics */}
      {!loading && tab === 'faculty' && facultyData && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              title="Total Faculty"
              value={facultyData.summary.totalFaculty}
              icon={<Users size={18} />}
              accent="from-violet-500 to-purple-600"
            />
            <KPICard
              title="Avg Load"
              value={`${facultyData.summary.avgLoadPct}%`}
              icon={<BarChart2 size={18} />}
              accent="from-indigo-500 to-blue-600"
            />
            <KPICard
              title="Overloaded"
              value={facultyData.summary.overloaded}
              sub="> 90% capacity"
              icon={<AlertTriangle size={18} />}
              accent="from-red-500 to-orange-500"
            />
            <KPICard
              title="Balanced"
              value={facultyData.summary.balanced}
              sub="Ideal load range"
              icon={<CheckCircle2 size={18} />}
              accent="from-emerald-400 to-teal-600"
            />
          </div>

          {/* Recharts Faculty Workload Chart */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-500" />
              Faculty Workload Distribution
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={facultyData.faculty.slice(0, 12)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="teacherName" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }}
                    formatter={(value) => [`${value}%`, 'Workload']}
                  />
                  <Bar dataKey="loadPct" fill="#9333ea" radius={[6, 6, 0, 0]} name="Workload %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search faculty or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />

          {/* Faculty list */}
          {filteredFaculty.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">
              No faculty match your search or no published timetable available.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredFaculty.map((f) => (
                <FacultyRow
                  key={f.teacherId}
                  f={f}
                  expanded={expandedId === f.teacherId}
                  onToggle={() => toggleExpanded(f.teacherId)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
