import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, BookOpen, FileText, TrendingUp, Award,
  ArrowUp, AlertCircle, ChevronDown, ChevronUp, Loader2,
  Clock, Star, Send, CheckCircle, Brain,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { StudyMaterials }            from './StudyMaterials';
import NotificationsPanel            from './teacher/NotificationsPanel';
import { StudentReviewSheet }        from './StudentReviewSheet';
import AILearningAssistant           from './student/AILearningAssistant';
import { Assignments }               from './Assignments';
import AttendanceManager             from './teacher/AttendanceManager';
import StudentAttendance             from './student/StudentAttendance';
import AnalyticsAdmin                from './admin/Analytics';
import TimetableManager              from './admin/TimetableManager';

const BASE = 'http://localhost:5000/api/admin';
const API  = 'http://localhost:5000/api';

const DEPT_LABELS: Record<string, string> = {
  CS: 'Computer Science', IT: 'Information Technology',
  ECE: 'Electronics & Communication', EE: 'Electrical Engineering',
  ME: 'Mechanical Engineering', CE: 'Civil Engineering',
  CH: 'Chemical Engineering', BT: 'Biotechnology',
  MBA: 'MBA', MCA: 'MCA',
};

// ─────────────────────────────────────────────────────────────
// STUDENT ASSIGNMENTS VIEW (grouped by course)
// ─────────────────────────────────────────────────────────────
function StudentAssignmentsView() {
  const { user } = useAuth();
  const [grouped,        setGrouped]        = useState<Record<string, any[]>>({});
  const [loading,        setLoading]        = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [attempting,     setAttempting]     = useState<any | null>(null);
  const [mode,           setMode]           = useState<'quiz' | 'solve'>('solve');
  const [error,          setError]          = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const sRes  = await fetch(`${BASE}/students/${user.id}`);
        const sJson = await sRes.json();
        const enrolled: any[] = sJson.data?.enrolledCourses || [];

        const cRes    = await fetch(`${BASE}/courses`);
        const cJson   = await cRes.json();
        const allCourses: any[] = cJson.data || [];
        const enrolledIds = new Set(enrolled.map((c: any) => String(c.courseId)));
        const myCourses   = allCourses.filter((c: any) => enrolledIds.has(String(c._id)));

        const result: Record<string, any[]> = {};
        for (const course of myCourses) {
          try {
            const aRes  = await fetch(`${API}/assignments/course/${course._id}?studentId=${user?.id || ''}`);
            const aData = await aRes.json();
            if (aData.success && Array.isArray(aData.assignments)) {
              const pub = aData.assignments
                .filter((a: any) => a.isPublished)
                .map((a: any) => ({ ...a, courseObj: course }));
              if (pub.length > 0)
                result[`${course.courseName} (${course.courseCode})`] = pub;
            }
          } catch {}
        }
        setGrouped(result);
        const first = Object.keys(result)[0];
        if (first) setExpandedCourse(first);
      } catch { setError('Failed to load assignments.'); }
      finally { setLoading(false); }
    };
    load();
  }, [user?.id]);

  if (attempting) {
    return (
      <StudentAttemptView
        assignment={attempting}
        mode={mode}
        userId={user?.id || ''}
        userName={user?.name || ''}
        onClose={() => setAttempting(null)}
      />
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading assignments...
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
  );

  const courseKeys = Object.keys(grouped);

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-xl font-bold text-gray-900">My Assignments</h3>
        <p className="text-sm text-gray-500 mt-0.5">Grouped by your enrolled subjects</p>
      </div>

      {courseKeys.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No assignments published yet</p>
          <p className="text-xs mt-1">Your teachers will publish assignments here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courseKeys.map(courseLabel => {
            const items  = grouped[courseLabel];
            const isOpen = expandedCourse === courseLabel;
            const now    = new Date();
            const active = items.filter(a => new Date(a.dueDate) > now).length;

            return (
              <div key={courseLabel} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedCourse(isOpen ? null : courseLabel)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition text-left"
                >
                  <div>
                    <h4 className="font-bold text-gray-900">{courseLabel}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {items.length} assignment{items.length !== 1 ? 's' : ''} · {active} active
                    </p>
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="divide-y divide-gray-100">
                    {items.map(a => {
                      const isExpired = new Date(a.dueDate) < now;
                      return (
                        <div key={a._id} className="p-5 flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h5 className="font-semibold text-gray-900">{a.title}</h5>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {isExpired ? 'Expired' : 'Active'}
                              </span>
                              {a.creationMethod === 'ai' || a.creationMethod === 'mixed' ? (
                                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">✨ AI</span>
                              ) : null}
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              {a.questions?.length || 0} questions · {a.totalMarks} marks ·
                              Due {new Date(a.dueDate).toLocaleDateString()}
                            </p>
                            <div className="flex gap-2">
                              {a.easyCount   > 0 && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">🟢 {a.easyCount} Easy</span>}
                              {a.mediumCount > 0 && <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">🟡 {a.mediumCount} Medium</span>}
                              {a.hardCount   > 0 && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">🔴 {a.hardCount} Hard</span>}
                            </div>
                          </div>
                          {!isExpired && (
                            <div className="flex flex-col gap-2 min-w-[130px]">
                              {a.allowSolveMode !== false && (
                                <button
                                  onClick={() => { setMode('solve'); setAttempting(a); }}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-semibold text-center"
                                >
                                  📝 Solve Mode
                                </button>
                              )}
                              {a.allowQuizMode !== false && (
                                <button
                                  onClick={() => { setMode('quiz'); setAttempting(a); }}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-semibold text-center"
                                >
                                  ⚡ Quiz Mode
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STUDENT ATTEMPT VIEW (submit assignment inline)
// ─────────────────────────────────────────────────────────────
function StudentAttemptView({
  assignment, mode, userId, userName, onClose
}: {
  assignment: any; mode: 'quiz' | 'solve';
  userId: string; userName: string; onClose: () => void;
}) {
  const [answers,    setAnswers]    = useState<Record<string, string>>({});
  const [currentQ,   setCurrentQ]  = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]    = useState<any>(null);
  const [error,      setError]     = useState('');
  const [timeLeft,   setTimeLeft]  = useState(mode === 'quiz' ? 30 * 60 : 0);
  const [showReview, setShowReview] = useState(false);

  const questions = assignment.questions || [];
  const total     = questions.length;

  useEffect(() => {
    if (mode !== 'quiz' || result) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, mode, result]);

  const handleSubmit = async (auto = false) => {
    if (!auto && !confirm('Submit assignment now?')) return;
    setSubmitting(true);
    try {
      const answersArray = questions.map((q: any) => ({
        questionId: q._id,
        studentAnswer: answers[q._id] || ''
      }));
      const courseId = assignment.courseObj?._id || assignment.courseId;
      const res = await fetch(`${API}/assignments/${assignment._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: userId, studentName: userName, courseId, answers: answersArray, mode })
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Submission failed'); setSubmitting(false); return; }
      setResult(data.submission);
    } catch { setError('Submission failed. Check connection.'); setSubmitting(false); }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Result screen ──────────────────────────────────────────
  if (result) {
    // Show full review sheet if user clicked "Review My Answers"
    if (showReview) {
      return (
        <StudentReviewSheet
          assignment={assignment}
          submission={result}
          onClose={() => setShowReview(false)}
        />
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className={`rounded-2xl p-8 text-white text-center mb-6 shadow-xl ${
          result.percentage >= 80 ? 'bg-gradient-to-br from-green-500 to-green-700' :
          result.percentage >= 60 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                                    'bg-gradient-to-br from-red-500 to-red-700'
        }`}>
          <div className="text-5xl mb-3">
            {result.percentage >= 80 ? '🏆' : result.percentage >= 60 ? '✅' : '📚'}
          </div>
          <h2 className="text-xl font-bold mb-2">{assignment.title}</h2>
          <div className="text-5xl font-black my-3">{result.percentage?.toFixed(1)}%</div>
          <p className="text-lg">{result.totalScore} / {result.totalMarks} · Grade: <strong>{result.grade}</strong></p>
          {result.plagiarismFlagged && (
            <p className="mt-3 text-sm bg-white/20 rounded-lg px-3 py-2">
              ⚠️ Plagiarism detected ({result.plagiarismScore}%) — Teacher will review
            </p>
          )}
        </div>

        {result.overallFeedback && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-4">
            <p className="text-sm font-bold text-indigo-700 mb-2">✨ AI Feedback</p>
            <p className="text-sm text-gray-700 mb-3">{result.overallFeedback}</p>
            {result.strengths?.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-bold text-green-700 mb-1">✅ Strengths:</p>
                {result.strengths.map((s: string, i: number) => (
                  <p key={i} className="text-xs text-gray-600">• {s}</p>
                ))}
              </div>
            )}
            {result.improvementAreas?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-orange-700 mb-1">📈 Improve:</p>
                {result.improvementAreas.map((a: string, i: number) => (
                  <p key={i} className="text-xs text-gray-600">• {a}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Review My Answers button */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowReview(true)}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-md"
          >
            📋 Review My Answers &amp; Correct Solutions
          </button>
          <button onClick={onClose}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium w-full">
            ← Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz mode ──────────────────────────────────────────────
  if (mode === 'quiz') {
    const q      = questions[currentQ];
    const warn   = timeLeft <= 60;
    return (
      <div>
        <div className={`rounded-xl px-5 py-3 flex items-center justify-between mb-5 ${warn ? 'bg-red-600' : 'bg-indigo-600'}`}>
          <span className="text-white font-bold truncate">{assignment.title} — Quiz Mode</span>
          <span className={`px-4 py-1 rounded-full font-mono font-bold ${warn ? 'bg-white text-red-600 animate-pulse' : 'bg-white/20 text-white'}`}>
            ⏱ {fmt(timeLeft)}
          </span>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex justify-between mb-3 text-sm text-gray-500">
            <span>Q{currentQ + 1} of {total}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{q.questionText}</h3>
          {q.type === 'mcq' ? (
            <div className="space-y-2">
              {q.options?.filter((o: string) => o.trim()).map((opt: string, oi: number) => (
                <button key={oi} onClick={() => setAnswers(p => ({ ...p, [q._id]: opt }))}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm font-medium transition ${
                    answers[q._id] === opt ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  {String.fromCharCode(65 + oi)}. {opt}
                </button>
              ))}
            </div>
          ) : (
            <textarea rows={4} placeholder="Your answer..." value={answers[q._id] || ''}
              onChange={e => setAnswers(p => ({ ...p, [q._id]: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          )}
        </div>
        <div className="flex justify-between">
          <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}
            className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40">
            ← Previous
          </button>
          {currentQ === total - 1 ? (
            <button onClick={() => handleSubmit(false)} disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
              {submitting ? 'Submitting...' : '✅ Submit'}
            </button>
          ) : (
            <button onClick={() => setCurrentQ(q => Math.min(total - 1, q + 1))}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-white font-medium">
              Next →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Solve mode ─────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{assignment.title}</h2>
          <p className="text-sm text-gray-500">Solve Mode — answer all, then submit</p>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
          ← Back
        </button>
      </div>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {assignment.description && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-5 text-sm text-indigo-800">
          📋 {assignment.description}
        </div>
      )}
      <div className="space-y-4 mb-8">
        {questions.map((q: any, qi: number) => (
          <div key={q._id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-semibold text-gray-700">Q{qi + 1}.</span>
              <span className="text-xs text-gray-400 ml-auto">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
            </div>
            <p className="font-medium text-gray-900 mb-4">{q.questionText}</p>
            {q.type === 'mcq' ? (
              <div className="space-y-2">
                {q.options?.filter((o: string) => o.trim()).map((opt: string, oi: number) => (
                  <label key={oi} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                    answers[q._id] === opt ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input type="radio" name={q._id} value={opt} checked={answers[q._id] === opt}
                      onChange={() => setAnswers(p => ({ ...p, [q._id]: opt }))}
                      className="text-indigo-600" />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea rows={q.type === 'long' ? 6 : 3}
                placeholder={q.type === 'long' ? 'Detailed answer...' : 'Your answer...'}
                value={answers[q._id] || ''}
                onChange={e => setAnswers(p => ({ ...p, [q._id]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            )}
          </div>
        ))}
      </div>
      <div className="bg-white border-t border-gray-200 p-4 flex items-center justify-between -mx-8 px-8 sticky bottom-0">
        <p className="text-sm text-gray-500">
          {Object.values(answers).filter(a => a.trim()).length} / {total} answered
        </p>
        <button onClick={() => handleSubmit(false)} disabled={submitting}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md">
          <Send className="w-4 h-4" />
          {submitting ? 'AI Grading...' : 'Submit Assignment'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STUDENT DASHBOARD
// ─────────────────────────────────────────────────────────────
function StudentDashboard() {
  const { user } = useAuth();
  const [loading,         setLoading]         = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [assignments,     setAssignments]     = useState<any[]>([]);
  const [activeTab,       setActiveTab]       = useState('home');

  // AI Performance Insights panel (inline icon → modal)
  const [showAIPanel, setShowAIPanel] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const sRes  = await fetch(`${BASE}/students/${user.id}`);
        const sJson = await sRes.json();
        const enrolled: any[] = sJson.data?.enrolledCourses || [];
        setEnrolledCourses(enrolled);

        const allAssignments: any[] = [];
        for (const ec of enrolled) {
          const courseId = ec.courseId || ec._id;
          try {
            const aRes  = await fetch(`${API}/assignments/course/${courseId}?studentId=${user?.id || ''}`);
            const aData = await aRes.json();
            if (aData.success && Array.isArray(aData.assignments))
              allAssignments.push(...aData.assignments);
          } catch {}
        }
        setAssignments(allAssignments);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const tabs = [
    { id: 'home',        label: '🏠 Home' },
    { id: 'assignments', label: '📝 Assignments' },
    { id: 'materials',   label: '📚 Materials' },
    { id: 'attendance',  label: '📋 Attendance' },
  ];

  return (
    <div className="p-8">
      {/* Tab bar with AI Insights icon */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
        <div className="flex gap-2 flex-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white border border-b-white border-gray-200 text-indigo-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        {/* Small AI Insights button - top right of tab bar */}
        <button
          onClick={() => setShowAIPanel(true)}
          title="AI Performance Insights"
          className="flex items-center gap-1.5 px-3 py-1.5 mb-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
        >
          <Brain className="w-3.5 h-3.5" />
          <span>AI Insights</span>
        </button>
      </div>

      {/* ── AI Performance Modal ── */}
      {showAIPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold text-base">AI Performance Insights</h3>
              </div>
              <button onClick={() => setShowAIPanel(false)} className="text-white/80 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AILearningAssistant userId={user?.id || ''} userName={user?.name || 'Student'} />
            </div>
          </div>
        </div>
      )}

      {/* Home tab */}
      {activeTab === 'home' && (
        <>
          {/* Welcome banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-8 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}!</h2>
                <p className="text-indigo-100 text-sm">
                  {DEPT_LABELS[user?.department || ''] || user?.department} · Semester {user?.semester}
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{enrolledCourses.length}</p>
                <p className="text-indigo-200 text-sm">Enrolled Courses</p>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Enrolled Courses', value: enrolledCourses.length, icon: BookOpen, color: 'bg-blue-500', onClick: undefined },
              { label: 'Assignments',      value: assignments.filter(a => a.isPublished).length, icon: FileText,   color: 'bg-purple-500', onClick: () => setActiveTab('assignments') },
              { label: 'Avg. Score',       value: '—',                    icon: TrendingUp, color: 'bg-green-500', onClick: undefined },
              { label: 'Level',            value: 'Beginner',             icon: Award,      color: 'bg-orange-500', onClick: undefined },
            ].map((s, i) => (
              <div key={i} onClick={s.onClick}
                className={`bg-white rounded-xl p-5 border border-gray-200 shadow-sm ${s.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
                <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* AI Improvement Cards */}
          <DashboardImprovementCards userId={user?.id || ''} assignments={assignments} />

          {/* 2-Column: Upcoming Deadlines + Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" /> Upcoming Deadlines
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { course: 'DSA', title: 'Data Structures (CS201)', date: '24 Apr 2026', status: 'Due Soon!' },
                  { course: 'COA', title: 'COA (CS301)', date: '25 Apr 2026', status: 'Due Soon' },
                ].map((item, i) => (
                  <div key={i} className={`p-4 rounded-lg border-l-4 ${i === 0 ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'}`}>
                    <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600 mt-1">📅 {item.date}</p>
                    <span className={`inline-block text-xs font-bold mt-2 px-2 py-0.5 rounded ${i === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      🔴 {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications Panel */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="text-lg">🔔</span>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              </div>
              <div className="p-5 max-h-[400px] overflow-y-auto">
                <NotificationsPanel 
                  userId={user?.id} 
                  role="student" 
                  userName={user?.name}
                  isAdmin={false}
                />
              </div>
            </div>
          </div>

          {/* Enrolled courses */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" /> My Enrolled Courses
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading...
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No courses enrolled yet</p>
                <p className="text-sm text-gray-400 mt-1">Admin will enroll you based on department and semester.</p>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrolledCourses.map((c: any) => (
                  <div key={String(c.courseId)} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{c.courseName}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">{c.courseCode}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            {DEPT_LABELS[c.department] || c.department}
                          </span>
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                            Sem {c.semester}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shortcut to assignments */}
          <div onClick={() => setActiveTab('assignments')}
            className="cursor-pointer bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800 flex items-center gap-3 hover:bg-indigo-100 transition">
            <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <strong>View your Assignments</strong>
              <p className="text-xs text-indigo-600 mt-0.5">All published assignments grouped by subject</p>
            </div>
          </div>
        </>
      )}

      {activeTab === 'assignments'   && <StudentAssignmentsView />}
      {activeTab === 'materials'     && <StudyMaterials />}
      {activeTab === 'attendance'    && <StudentAttendance studentId={user?.id} />}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TEACHER DASHBOARD
// ─────────────────────────────────────────────────────────────
function TeacherDashboard() {
  const { user } = useAuth();
  const [stats,      setStats]      = useState<any>({});
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('home');
  const [myCourses,  setMyCourses]  = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${BASE}/dashboard-stats`);
        const data = await res.json();
        setStats(data.data || data);

        const cRes  = await fetch(`${API}/courses`);
        const cData = await cRes.json();
        const all: any[] = Array.isArray(cData) ? cData : [];
        const myIds = new Set((user?.assignedCourses || []).map((c: any) => String(c.courseId)));
        setMyCourses(all.filter(c => myIds.has(String(c._id))));
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const tabs = [
    { id: 'home',        label: '🏠 Home' },
    { id: 'assignments', label: '📝 Assignments' },
    { id: 'materials',   label: '📚 Materials' },
    { id: 'attendance',  label: '📋 Attendance' },
  ];

  return (
    <div className="p-8">
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white border border-b-white border-gray-200 text-indigo-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'home' && (
        <>
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white mb-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-1">Welcome, {user?.name?.split(' ')[0]}!</h2>
            <p className="text-green-100 text-sm">{user?.department} · {user?.specialization}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'My Courses',  value: myCourses.length, icon: BookOpen,   color: 'bg-blue-500'   },
              { label: 'Assignments', value: '📝',             icon: FileText,   color: 'bg-purple-500', onClick: () => setActiveTab('assignments') },
              { label: 'Students',    value: stats.totalStudents || '—', icon: Users, color: 'bg-green-500' },
              { label: 'Materials',   value: '📚',             icon: Award,      color: 'bg-orange-500', onClick: () => setActiveTab('materials') },
            ].map((s: any, i) => (
              <div key={i} onClick={s.onClick}
                className={`bg-white rounded-xl p-5 border border-gray-200 shadow-sm ${s.onClick ? 'cursor-pointer hover:shadow-md' : ''}`}>
                <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {myCourses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">My Assigned Courses</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCourses.map((c: any) => (
                  <div key={c._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <p className="font-semibold text-gray-900">{c.courseName}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{c.courseCode}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{c.department}</span>
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">Sem {c.semester}</span>
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                        {c.enrolledStudents?.length || 0} students
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications on Teacher Home page */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <span className="text-xs text-gray-400 ml-auto">Send announcements to your students</span>
            </div>
            <div className="p-5">
              <NotificationsPanel userId={user?.id} role="teacher" userName={user?.name} />
            </div>
          </div>
        </>
      )}

      {activeTab === 'assignments'   && <Assignments />}
      {activeTab === 'materials'     && <StudyMaterials />}
      {activeTab === 'attendance'    && <AttendanceManager teacherId={user?.id} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────
function AdminDashboard() {
  const { user } = useAuth();
  const [stats,     setStats]     = useState<any>({});
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${BASE}/dashboard-stats`);
        const data = await res.json();
        setStats(data.data || data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const tabs = [
    { id: 'home',        label: '🏠 Home' },
    { id: 'analytics',   label: '📊 Analytics' },
    { id: 'timetable',   label: '📅 Timetable' },
    { id: 'materials',   label: '📚 Materials' },
    { id: 'assignments', label: '📝 Assignments' },
  ];

  return (
    <div className="p-8">
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white border border-b-white border-gray-200 text-indigo-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'home' && (
        <>
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white mb-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-1">Admin Dashboard</h2>
            <p className="text-gray-300 text-sm">System overview and management</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Students', value: stats.totalStudents  || 0, icon: Users,    color: 'bg-blue-500'   },
              { label: 'Total Teachers', value: stats.totalTeachers  || 0, icon: Award,    color: 'bg-green-500'  },
              { label: 'Total Courses',  value: stats.totalCourses   || 0, icon: BookOpen, color: 'bg-purple-500' },
              { label: 'Pending',        value: stats.pendingStudents || 0, icon: Clock,   color: 'bg-orange-500' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <span className="text-xs text-gray-400 ml-auto">Send announcements to your users</span>
            </div>
            <div className="p-5">
              <NotificationsPanel userId={user?.id} role="admin" userName={user?.name} isAdmin />
            </div>
          </div>
        </>
      )}

      {activeTab === 'analytics'   && <AnalyticsAdmin />}
      {activeTab === 'timetable'   && <TimetableManager />}
      {activeTab === 'materials'   && <StudyMaterials />}
      {activeTab === 'assignments' && <Assignments />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'student') return <StudentDashboard />;
  if (user.role === 'teacher') return <TeacherDashboard />;
  return <AdminDashboard />;
}