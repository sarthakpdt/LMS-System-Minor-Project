import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap, Loader2, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw,
  TrendingUp, TrendingDown, Minus, Info, Lightbulb, Users, Home
} from 'lucide-react';
import { api } from './api';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface FacultyStat {
  teacherId: string;
  teacherName: string;
  department: string;
  weeklyHours: number;
  maxWeekly: number;
  loadPct: number;
  status: 'overloaded' | 'balanced' | 'underloaded';
}

interface SlotRecommendation {
  subjectName: string;
  currentDay?: string;
  currentSlot?: string;
  suggestedDay: string;
  suggestedSlot: string;
  reason: string;
  confidence: number;
  type: 'move' | 'swap' | 'rebalance' | 'reduce_gap';
}

interface RoomStat {
  roomId: string;
  roomName: string;
  roomType: string;
  utilizationPct: number;
  status: 'high' | 'medium' | 'low';
}

function confidenceColor(score: number): string {
  if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (score >= 60) return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

function confidenceLabel(score: number): string {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  return 'Low';
}

function typeIcon(type: string) {
  switch (type) {
    case 'move': return <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />;
    case 'swap': return <RefreshCw className="w-3.5 h-3.5 text-purple-500" />;
    case 'rebalance': return <TrendingUp className="w-3.5 h-3.5 text-blue-500" />;
    case 'reduce_gap': return <Minus className="w-3.5 h-3.5 text-amber-500" />;
    default: return <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />;
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'overloaded') return <TrendingUp className="w-4 h-4 text-red-500" />;
  if (status === 'underloaded') return <TrendingDown className="w-4 h-4 text-blue-400" />;
  return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
}

function LoadBar({ pct }: { pct: number }) {
  const color = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-1.5 rounded-full ${color} transition-all duration-500`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const AIWorkloadOptimizer: React.FC = () => {
  const [faculty, setFaculty] = useState<FacultyStat[]>([]);
  const [recommendations, setRecommendations] = useState<SlotRecommendation[]>([]);
  const [rooms, setRooms] = useState<RoomStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'faculty' | 'rooms' | 'recommendations'>('recommendations');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wRes, sRes, rRes] = await Promise.all([
        api.get('/analytics/faculty-workload'),
        api.get('/recommend-slots'),
        api.get('/analytics/rooms'),
      ]);
      if (wRes.success) setFaculty(wRes.faculty || []);
      if (sRes.success) setRecommendations(sRes.recommendations || []);
      if (rRes.success) setRooms(rRes.rooms || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load optimizer data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const overloaded = faculty.filter((f) => f.status === 'overloaded');
  const underloaded = faculty.filter((f) => f.status === 'underloaded');
  const highRooms = rooms.filter((r) => r.utilizationPct > 75);
  const unusedRooms = rooms.filter((r) => r.utilizationPct < 20);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Analyzing workload...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
        <button onClick={load} className="ml-auto text-xs underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            AI Workload Optimizer
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Read-only recommendations — no automatic changes are applied
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-analyze
        </button>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Overloaded Faculty', value: overloaded.length, color: 'bg-red-50 border-red-200 text-red-700', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'Underutilized Faculty', value: underloaded.length, color: 'bg-blue-50 border-blue-200 text-blue-700', icon: <TrendingDown className="w-4 h-4" /> },
          { label: 'Overloaded Rooms', value: highRooms.length, color: 'bg-orange-50 border-orange-200 text-orange-700', icon: <Home className="w-4 h-4" /> },
          { label: 'Recommendations', value: recommendations.length, color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: <Lightbulb className="w-4 h-4" /> },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-3 ${s.color}`}>
            <div className="flex items-center gap-2">
              {s.icon}
              <span className="text-xl font-bold">{s.value}</span>
            </div>
            <p className="text-xs mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(['recommendations', 'faculty', 'rooms'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
              activeSection === s ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'recommendations' ? '💡 Recommendations' : s === 'faculty' ? '👨‍🏫 Faculty' : '🏫 Rooms'}
          </button>
        ))}
      </div>

      {/* Recommendations */}
      {activeSection === 'recommendations' && (
        <div className="space-y-3">
          {recommendations.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-sm font-medium text-emerald-600">Timetable looks balanced!</p>
              <p className="text-xs mt-1">No optimization recommendations at this time.</p>
            </div>
          ) : (
            recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {typeIcon(rec.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{rec.subjectName}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${confidenceColor(rec.confidence)}`}>
                        {confidenceLabel(rec.confidence)} confidence ({rec.confidence}%)
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                        {rec.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      {rec.currentDay && (
                        <>
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                            {rec.currentDay} {rec.currentSlot}
                          </span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                        </>
                      )}
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
                        {rec.suggestedDay} {rec.suggestedSlot}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>These are AI-generated suggestions only. To apply them, use the interactive timetable editor (Timetable &rarr; Edit) to make swaps manually.</span>
          </div>
        </div>
      )}

      {/* Faculty workload */}
      {activeSection === 'faculty' && (
        <div className="space-y-2">
          {faculty.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No faculty data available.</div>
          ) : (
            faculty
              .sort((a, b) => b.loadPct - a.loadPct)
              .map((f) => (
                <div key={f.teacherId} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-indigo-200 transition-colors">
                  <StatusIcon status={f.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 truncate">{f.teacherName}</span>
                      <span className="text-xs text-gray-400">{f.department}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <LoadBar pct={f.loadPct} />
                      <span className="text-xs text-gray-500 w-20 flex-shrink-0">
                        {f.weeklyHours}h / {f.maxWeekly}h ({f.loadPct}%)
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    f.status === 'overloaded' ? 'bg-red-100 text-red-700' :
                    f.status === 'underloaded' ? 'bg-blue-100 text-blue-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {f.status}
                  </span>
                </div>
              ))
          )}
        </div>
      )}

      {/* Room utilization */}
      {activeSection === 'rooms' && (
        <div className="space-y-2">
          {rooms.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No room utilization data available.</div>
          ) : (
            rooms
              .sort((a, b) => b.utilizationPct - a.utilizationPct)
              .map((r) => (
                <div key={r.roomId} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                  <Home className={`w-4 h-4 flex-shrink-0 ${
                    r.status === 'high' ? 'text-red-500' : r.status === 'medium' ? 'text-amber-500' : 'text-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 truncate">{r.roomName}</span>
                      <span className="text-xs text-gray-400 capitalize">{r.roomType}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <LoadBar pct={r.utilizationPct} />
                      <span className="text-xs text-gray-500 w-12 flex-shrink-0 text-right">{r.utilizationPct}%</span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    r.status === 'high' ? 'bg-red-100 text-red-700' :
                    r.status === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))
          )}
          {unusedRooms.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              {unusedRooms.length} room(s) are rarely used (&lt;20% utilization): {unusedRooms.map((r) => r.roomName).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIWorkloadOptimizer;
