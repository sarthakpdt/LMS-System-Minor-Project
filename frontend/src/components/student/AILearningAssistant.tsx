import { useState, useEffect } from 'react';
import {
  Brain, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw,
  AlertTriangle, CheckCircle, Target, Lightbulb, BookOpen, Star,
} from 'lucide-react';

const API  = 'http://localhost:5000/api';
const BASE = 'http://localhost:5000/api/admin';

interface AreaItem {
  subject: string;
  percentage: number;
  status: 'Weak Area' | 'Needs Improvement' | 'Strong Area';
}

interface Feedback {
  summary: string;
  strengths: string[];
  areasOfImprovement: string[];
  weakAreas: AreaItem[];
  suggestedTopics: string[];
  improvementTips: string[];
  overallStatus: 'Needs Attention' | 'On Track' | 'Excellent';
  priorityAction: string;
}

interface Props {
  userId: string;
  userName?: string;
}

function classifyPct(pct: number): 'Weak Area' | 'Needs Improvement' | 'Strong Area' {
  if (pct < 50)  return 'Weak Area';
  if (pct <= 75) return 'Needs Improvement';
  return 'Strong Area';
}

const STATUS_COLORS: Record<string, string> = {
  'Weak Area':         'bg-red-100 text-red-700 border-red-200',
  'Needs Improvement': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Strong Area':       'bg-green-100 text-green-700 border-green-200',
};

const OVERALL_COLORS: Record<string, string> = {
  'Needs Attention': 'from-red-500 to-rose-600',
  'On Track':        'from-blue-500 to-indigo-600',
  'Excellent':       'from-green-500 to-emerald-600',
};

export default function AILearningAssistant({ userId, userName = 'Student' }: Props) {
  const [loading,  setLoading]  = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [allAreas, setAllAreas] = useState<AreaItem[]>([]);
  const [error,    setError]    = useState('');
  const [fetched,  setFetched]  = useState(false);

  const analyze = async () => {
    if (!userId) return;
    setLoading(true); setError(''); setFeedback(null);
    try {
      // 1. enrolled courses
      const sRes  = await fetch(`${BASE}/students/${userId}`);
      const sJson = await sRes.json();
      const enrolled: any[] = sJson.data?.enrolledCourses || [];

      const quizResults:       any[] = [];
      const assignmentResults: any[] = [];

      // 2. quiz results
      try {
        const qRes  = await fetch(`${API}/quizzes/results/student/${userId}`);
        const qJson = await qRes.json();
        (qJson.results || qJson.data || []).forEach((r: any) => {
          const scored = r.obtainedMarks ?? r.scored ?? r.score ?? 0;
          const total  = r.totalMarks ?? r.total ?? r.maxScore ?? 100;
          quizResults.push({ subject: r.quizTitle || r.subject || 'Quiz', scored, total });
        });
      } catch {}

      // 3. assignment submissions
      for (const ec of enrolled) {
        const cId = ec.courseId || ec._id;
        try {
          const aRes  = await fetch(`${API}/assignments/course/${cId}`);
          const aData = await aRes.json();
          if (!aData.success) continue;
          for (const a of aData.assignments || []) {
            if (!a.isPublished) continue;
            try {
              const subRes  = await fetch(`${API}/assignments/${a._id}/submission/${userId}`);
              const subData = await subRes.json();
              if (subData.success && subData.submission) {
                const scored = subData.submission.totalScore ?? subData.submission.obtainedMarks ?? 0;
                assignmentResults.push({ subject: a.title || ec.courseName || 'Assignment', scored, total: a.totalMarks ?? 100 });
              }
            } catch {}
          }
        } catch {}
      }

      // 4. local classification
      const allRaw: AreaItem[] = [
        ...quizResults.map(r => {
          const pct = r.total > 0 ? Math.round((r.scored / r.total) * 100) : 0;
          return { subject: r.subject, percentage: pct, status: classifyPct(pct) };
        }),
        ...assignmentResults.map(r => {
          const pct = r.total > 0 ? Math.round((r.scored / r.total) * 100) : 0;
          return { subject: r.subject, percentage: pct, status: classifyPct(pct) };
        }),
      ];
      setAllAreas(allRaw);

      // 5. call AI backend
      const aiRes  = await fetch(`${API}/assignments/ai-performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizResults, assignmentResults, studentName: userName }),
      });
      const aiData = await aiRes.json();

      if (aiData.success && aiData.feedback) {
        const fb: Feedback = aiData.feedback;
        if (!fb.weakAreas || fb.weakAreas.length === 0)
          fb.weakAreas = allRaw.filter(a => a.status !== 'Strong Area');
        setFeedback(fb);
      } else {
        // local fallback
        const strong    = allRaw.filter(a => a.status === 'Strong Area');
        const nonStrong = allRaw.filter(a => a.status !== 'Strong Area');
        setFeedback({
          summary: `You have completed ${allRaw.length} assessments. ${strong.length > 0 ? `You're performing well in ${strong.map(s => s.subject).join(', ')}.` : ''} ${nonStrong.length > 0 ? `Focus on improving ${nonStrong.map(s => s.subject).join(', ')}.` : 'Keep up the great work!'}`,
          strengths: strong.length > 0 ? strong.map(s => `${s.subject} — ${s.percentage}%`) : ['Keep practicing to build strong areas!'],
          areasOfImprovement: nonStrong.map(s => `${s.subject} — ${s.percentage}% (${s.status})`),
          weakAreas: nonStrong,
          suggestedTopics: nonStrong.map(s => `Revise: ${s.subject}`),
          improvementTips: [
            'Dedicate 30 minutes daily to weak subjects.',
            'Revisit mistakes from past quizzes.',
            'Ask your faculty for help on difficult topics.',
            'Use quiz mode to build speed and confidence.',
          ],
          overallStatus: allRaw.some(a => a.status === 'Weak Area') ? 'Needs Attention' : 'On Track',
          priorityAction: nonStrong.length > 0 ? `Focus on "${nonStrong[0].subject}" this week.` : 'Keep up the excellent work!',
        });
      }
    } catch {
      setError('Failed to load performance data. Ensure the backend is running.');
    } finally {
      setLoading(false); setFetched(true);
    }
  };

  useEffect(() => { if (userId) analyze(); }, [userId]);

  const PercentBar = ({ pct }: { pct: number }) => (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${pct < 50 ? 'bg-red-400' : pct <= 75 ? 'bg-yellow-400' : 'bg-green-400'}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );

  return (
    <div className="p-5 max-w-2xl mx-auto">
      {/* Refresh */}
      <div className="flex justify-end mb-4">
        <button onClick={analyze} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium hover:bg-indigo-100 disabled:opacity-60 transition">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-gray-400 text-sm">Analyzing your performance…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex gap-3 items-start">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* No data */}
      {!loading && fetched && !error && allAreas.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">No performance data yet</p>
          <p className="text-xs text-gray-400 mt-1">Complete quizzes and assignments to see your analysis.</p>
        </div>
      )}

      {!loading && feedback && (
        <div className="space-y-4">

          {/* Overall Status */}
          <div className={`bg-gradient-to-r ${OVERALL_COLORS[feedback.overallStatus] || 'from-indigo-500 to-purple-600'} rounded-2xl p-4 text-white`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-white/70 mb-0.5">Overall Status</p>
                <h3 className="text-xl font-bold">{feedback.overallStatus}</h3>
                {feedback.priorityAction && (
                  <p className="text-xs text-white/85 mt-1.5">💡 {feedback.priorityAction}</p>
                )}
              </div>
              <span className="text-4xl">
                {feedback.overallStatus === 'Excellent' ? '🏆' : feedback.overallStatus === 'On Track' ? '📈' : '⚠️'}
              </span>
            </div>
          </div>

          {/* Performance Summary */}
          {feedback.summary && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-indigo-500" />
                <h4 className="font-semibold text-gray-900 text-sm">Performance Summary</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{feedback.summary}</p>
            </div>
          )}

          {/* Strengths */}
          {feedback.strengths && feedback.strengths.length > 0 && (
            <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-green-100 flex items-center gap-2 bg-green-50">
                <Star className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold text-green-800 text-sm">Strengths</h4>
              </div>
              <div className="p-4 space-y-2">
                {feedback.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Areas of Improvement */}
          {feedback.areasOfImprovement && feedback.areasOfImprovement.length > 0 && (
            <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-orange-100 flex items-center gap-2 bg-orange-50">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <h4 className="font-semibold text-orange-800 text-sm">Areas of Improvement</h4>
              </div>
              <div className="p-4 space-y-2">
                {feedback.areasOfImprovement.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subject Scores */}
          {allAreas.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <h4 className="font-semibold text-gray-900 text-sm">Score Breakdown</h4>
              </div>
              <div className="p-4 space-y-3">
                {allAreas.map((area, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm text-gray-700 truncate pr-2">{area.subject}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${STATUS_COLORS[area.status]}`}>
                        {area.percentage}%
                      </span>
                    </div>
                    <PercentBar pct={area.percentage} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {feedback.improvementTips && feedback.improvementTips.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <h4 className="font-semibold text-gray-900 text-sm">Study Tips</h4>
              </div>
              <div className="p-4 space-y-2">
                {feedback.improvementTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                    <span className="text-yellow-600 font-bold text-xs flex-shrink-0 mt-0.5">{i + 1}.</span>
                    <p className="text-sm text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full border border-red-200">
              <TrendingDown className="w-3 h-3" /> Below 50% — Weak
            </span>
            <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200">
              <Minus className="w-3 h-3" /> 50–75% — Needs Work
            </span>
            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
              <TrendingUp className="w-3 h-3" /> Above 75% — Strong
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
