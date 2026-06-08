import { useState, useEffect } from 'react';
import { TrendingUp, Award, BookOpen, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface CoursePerformance {
  course: { _id: string; courseName: string; courseCode: string };
  bucket: 'Easy' | 'Medium' | 'Hard';
  promotionHistory: {
    from: string; to: string; promotedAt: string; triggeredByScore: number;
  }[];
  quizCount: number;
  averageScore: number;
  scores: {
    quizTitle: string;
    score: number;
    totalMarks: number;
    percentage: number;
    submittedAt: string;
  }[];
  nextThreshold: number | null;
}

const API = 'http://localhost:5000';

const BUCKET_CONFIG = {
  Easy: {
    label: 'Easy',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    bar: 'bg-green-500',
    badge: 'bg-green-100 text-green-700',
    icon: '🟢',
  },
  Medium: {
    label: 'Medium',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    bar: 'bg-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700',
    icon: '🟡',
  },
  Hard: {
    label: 'Hard',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    bar: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    icon: '🔴',
  },
};

// ── FEATURE 5: Star rating helper ────────────────────────────────────────────
function getStars(percentage: number): number {
  if (percentage <= 20) return 1;
  if (percentage <= 40) return 2;
  if (percentage <= 60) return 3;
  if (percentage <= 80) return 4;
  return 5;
}

function StarRow({ percentage }: { percentage: number }) {
  const stars = getStars(percentage);
  const colors = ['','text-red-400','text-orange-400','text-yellow-400','text-blue-400','text-green-500'];
  return (
    <span className={`inline-flex items-center gap-0.5 text-sm ${colors[stars]}`} title={`${stars}/5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < stars ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

export function StudentBucketProgress() {
  const { user } = useAuth();
  const [performance, setPerformance] = useState<CoursePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [promoted, setPromoted] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) fetchPerformance();
  }, [user]);

  const fetchPerformance = async () => {
    try {
      const res = await fetch(`${API}/api/buckets/performance/${user?.id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      setPerformance(Array.isArray(data) ? data : []);

      // Check if any promotion happened recently (last 2 minutes, from localStorage flag)
      const flag = localStorage.getItem('lms_promotion_notice');
      if (flag) {
        setPromoted(flag);
        localStorage.removeItem('lms_promotion_notice');
      }
    } catch (e) {
      console.error('Failed to load performance', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (performance.length === 0) {
    return (
      <div className="p-8 text-center">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No performance data yet. Complete some quizzes to see your progress here.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Learning Progress</h2>
        <p className="text-gray-500 text-sm mt-1">
          Your current difficulty level and performance per subject.
        </p>
      </div>

      {/* Promotion banner */}
      {promoted && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3">
          <Star className="w-6 h-6 text-purple-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-purple-900">🎉 You've been promoted!</p>
            <p className="text-sm text-purple-700">{promoted}</p>
          </div>
        </div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(['Easy', 'Medium', 'Hard'] as const).map(b => {
          const count = performance.filter(p => p.bucket === b).length;
          const cfg = BUCKET_CONFIG[b];
          return (
            <div key={b} className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
              <p className="text-xs font-medium text-gray-500 mb-1">{cfg.icon} {b}</p>
              <p className={`text-2xl font-bold ${cfg.color}`}>{count}</p>
              <p className="text-xs text-gray-500">subject{count !== 1 ? 's' : ''}</p>
            </div>
          );
        })}
      </div>

      {/* Per-subject cards */}
      <div className="space-y-4">
        {performance.map((p) => {
          const cfg = BUCKET_CONFIG[p.bucket];
          const isExpanded = expanded === p.course._id;
          const progressPct = p.nextThreshold
            ? Math.min(100, Math.round((p.averageScore / p.nextThreshold) * 100))
            : 100;

          return (
            <div key={p.course._id} className={`rounded-xl border overflow-hidden ${cfg.border}`}>
              {/* Card header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : p.course._id)}
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg} flex-shrink-0`}>
                  <Award className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{p.course.courseName}</span>
                    <span className="text-xs text-gray-500">({p.course.courseCode})</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                      {cfg.icon} {p.bucket}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{p.quizCount} quiz{p.quizCount !== 1 ? 'zes' : ''} taken</span>
                    <span>Avg: <strong className="text-gray-700">{p.averageScore}%</strong></span>
                    {p.nextThreshold && (
                      <span>Next level at: <strong className="text-gray-700">{p.nextThreshold}%</strong></span>
                    )}
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              {/* Progress bar */}
              {p.nextThreshold && (
                <div className="px-5 pb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress to {p.bucket === 'Easy' ? 'Medium' : 'Hard'}</span>
                    <span>{p.averageScore}% / {p.nextThreshold}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${cfg.bar}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {p.bucket === 'Hard' && (
                <div className="px-5 pb-3">
                  <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                    <Star className="w-3.5 h-3.5" />
                    <span>Top level reached! Keep it up 🏆</span>
                  </div>
                </div>
              )}

              {/* Expanded: quiz scores + promotion history */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-4">
                  {/* Quiz scores */}
                  {p.scores.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Quiz Scores</h4>
                      <div className="space-y-2">
                        {p.scores.map((s, i) => (
                          <div key={i} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-100">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{s.quizTitle || 'Quiz'}</p>
                              <p className="text-xs text-gray-500">{new Date(s.submittedAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">{s.score}/{s.totalMarks}</p>
                              <p className={`text-xs font-medium ${s.percentage >= 80 ? 'text-green-600' : s.percentage >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                                {s.percentage}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Promotion history */}
                  {p.promotionHistory.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-purple-500" /> Promotion History
                      </h4>
                      <div className="space-y-2">
                        {p.promotionHistory.map((h, i) => (
                          <div key={i} className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-lg px-4 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${BUCKET_CONFIG[h.from as 'Easy'|'Medium'|'Hard']?.badge}`}>{h.from}</span>
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                            <span className={`text-xs px-2 py-0.5 rounded-full ${BUCKET_CONFIG[h.to as 'Easy'|'Medium'|'Hard']?.badge}`}>{h.to}</span>
                            <span className="text-xs text-gray-500 ml-auto">Score: {h.triggeredByScore}% · {new Date(h.promotedAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.scores.length === 0 && p.promotionHistory.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No quiz data yet for this subject.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
