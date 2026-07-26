import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, BookOpen, FileText, TrendingUp, Award,
  ArrowUp, AlertCircle, ChevronDown, ChevronUp, Loader2,
  Clock, Star, Send, CheckCircle, Brain, UserCheck,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
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
import { toast }                     from 'sonner';

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
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200/80 text-gray-400 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
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
              <div key={courseLabel} className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
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
  const [nextPracticeAttempt, setNextPracticeAttempt] = useState(1);

  const questions = assignment.questions || [];
  const total     = questions.length;

  useEffect(() => {
    const loadLatestAttempt = async () => {
      if (!assignment?._id || !userId) return;
      try {
        // Quiz mode: show existing submission instead of allowing re-attempt.
        if (mode === 'quiz') {
          const quizSubRes = await fetch(`${API}/assignments/${assignment._id}/submission/${userId}?mode=quiz`);
          if (quizSubRes.ok) {
            const quizSubData = await quizSubRes.json();
            if (quizSubData?.success && quizSubData?.submission) {
              setResult(quizSubData.submission);
            }
          }
          return;
        }

        // Solve mode: calculate next practice attempt number.
        const solveSubRes = await fetch(`${API}/assignments/${assignment._id}/submission/${userId}?mode=solve`);
        if (solveSubRes.ok) {
          const solveSubData = await solveSubRes.json();
          const latestAttempt = Number(solveSubData?.submission?.attemptNumber || 0);
          setNextPracticeAttempt(latestAttempt + 1);
        } else {
          setNextPracticeAttempt(1);
        }
      } catch {
        setNextPracticeAttempt(1);
      }
    };
    loadLatestAttempt();
  }, [assignment?._id, mode, userId]);

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
          {result.attemptNumber && (
            <p className="text-sm text-white/90">Attempt #{result.attemptNumber} ({result.mode === 'solve' ? 'Practice' : 'Quiz'})</p>
          )}
          <div className="text-5xl font-black my-3">{result.percentage?.toFixed(1)}%</div>
          <p className="text-lg">{result.totalScore} / {result.totalMarks} · Grade: <strong>{result.grade}</strong></p>
          {result.plagiarismFlagged && (
            <p className="mt-3 text-sm bg-white/20 rounded-[1.5rem] px-3 py-2 dark:bg-slate-800 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
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
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-md hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            📋 Review My Answers &amp; Correct Solutions
          </button>
          <button onClick={onClose}
            className="px-6 py-3 bg-white border border-gray-200/80 text-gray-700 rounded-xl hover:bg-gray-50 font-medium w-full dark:bg-slate-800 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
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
        {result && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            You already submitted this assignment in quiz mode. Showing your previous response and feedback.
          </div>
        )}
        <div className={`rounded-xl px-5 py-3 flex items-center justify-between mb-5 ${warn ? 'bg-red-600' : 'bg-indigo-600'}`}>
          <span className="text-white font-bold truncate">{assignment.title} — Quiz Mode</span>
          <span className={`px-4 py-1 rounded-full font-mono font-bold ${warn ? 'bg-white text-red-600 animate-pulse' : 'bg-white/20 text-white'}`}>
            ⏱ {fmt(timeLeft)}
          </span>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 mb-4 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
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
            className="px-5 py-2.5 bg-white border border-gray-300 rounded-[1.5rem] text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:bg-slate-800 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
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
          <p className="text-sm text-gray-500">
            Solve Mode — Practice Attempt #{nextPracticeAttempt}
          </p>
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
          <div key={q._id} className="bg-white rounded-xl border border-gray-200/80 p-5 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
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
      <div className="bg-white border-t border-gray-200/80 p-4 flex items-center justify-between -mx-8 px-8 sticky bottom-0 dark:bg-slate-800 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <p className="text-sm text-gray-500">
          {Object.values(answers).filter(a => a.trim()).length} / {total} answered
        </p>
        <button onClick={() => handleSubmit(false)} disabled={submitting}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md">
          <Send className="w-4 h-4" />
          {submitting ? 'AI Grading...' : `Submit Attempt #${nextPracticeAttempt}`}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800">
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
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-8 shadow-lg hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {[
              {
                label: 'Total Students',
                value: stats.students?.total || 0,
                icon: Users,
                textColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30',
                description: `${stats.students?.approved || 0} approved students`
              },
              {
                label: 'Total Teachers',
                value: stats.teachers?.total || 0,
                icon: Award,
                textColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
                description: `${stats.teachers?.approved || 0} active teachers`
              },
              {
                label: 'Total Courses',
                value: stats.courses?.total || 0,
                icon: BookOpen,
                textColor: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30',
                description: 'Across all departments'
              },
              {
                label: 'Pending Approvals',
                value: stats.students?.pending || 0,
                icon: Clock,
                textColor: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30',
                description: 'Requires admin attention'
              },
            ].map((s, idx) => (
              <div
                key={idx}
                className="premium-glass neon-glow p-8 relative overflow-hidden cursor-default hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                style={{ borderRadius: '1.5rem' }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div 
                    className={`flex items-center justify-center flex-shrink-0 shadow-lg ${s.textColor}`}
                    style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem' }}
                  >
                    <s.icon className="w-6 h-6 icon-pulse" />
                  </div>
                </div>
                <div className="flex flex-col relative z-10">
                  <h3 className="text-4xl font-black leading-none mb-2 tracking-tight dynamic-text-white">
                    {loading ? '—' : s.value}
                  </h3>
                  <p className="text-sm font-bold uppercase tracking-widest dynamic-text-muted">{s.label}</p>
                  <p className="text-xs font-medium dynamic-text-muted opacity-80 mt-1">{s.description}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Core Body Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Approvals (Left 2 Columns) */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-2 space-y-6"
            >
              <div className="premium-glass neon-glow flex flex-col h-full hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300" style={{ borderRadius: '1.5rem' }}>
                <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
                  <h3 className="text-lg font-bold dynamic-text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Pending Approvals Request
                  </h3>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Quick Feed
                  </button>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-center">
                  {loading ? (
                    <div className="text-center py-12 text-sm text-gray-400">Loading registrations...</div>
                  ) : pendingStudents.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-purple-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-100 dark:border-slate-800">
                        <CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="font-bold text-gray-800 dark:text-slate-200">System is fully approved!</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">All registrations processed.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingStudents.map(student => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 hover:border-purple-500/20 transition-all gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="font-bold text-purple-700 dark:text-purple-400 text-sm">
                                {student.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold dynamic-text-white truncate">{student.name}</p>
                              <p className="text-xs dynamic-text-muted truncate">
                                {student.email} · {student.department} Sem {student.semester}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              disabled={approvingId === student.id || rejectingId === student.id}
                              onClick={() => handleApprove(student.id)}
                              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center disabled:opacity-50"
                            >
                              {approvingId === student.id ? '...' : 'Approve'}
                            </button>
                            <button
                              disabled={approvingId === student.id || rejectingId === student.id}
                              onClick={() => handleReject(student.id)}
                              className="px-3.5 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                            >
                              {rejectingId === student.id ? '...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Recharts Pie Chart (Right 1 Column) */}
            <motion.div
              variants={itemVariants}
              className="space-y-6"
            >
              <div className="premium-glass neon-glow p-6 flex flex-col h-full justify-between hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300" style={{ borderRadius: '1.5rem' }}>
                <div>
                  <h3 className="text-base font-bold dynamic-text-white mb-1">Student Ratios</h3>
                  <p className="text-[10px] font-bold dynamic-text-muted uppercase tracking-wider">Approval Overview</p>
                </div>

                <div className="h-48 my-4 relative flex items-center justify-center">
                  {loading ? (
                    <div className="text-xs text-gray-400">Loading chart...</div>
                  ) : chartData.length === 0 ? (
                    <div className="text-xs text-gray-400">No chart data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {/* Center Total Count label inside donut */}
                  {!loading && (
                    <div className="absolute text-center">
                      <p className="text-2xl font-black dynamic-text-white leading-none">
                        {stats.students?.total || 0}
                      </p>
                      <p className="text-[9px] uppercase font-bold tracking-wider dynamic-text-muted mt-1">Total</p>
                    </div>
                  )}
                </div>

                {/* Legend list */}
                <div className="space-y-2.5">
                  {[
                    { label: 'Approved Students', value: stats.students?.approved || 0, color: 'bg-purple-500' },
                    { label: 'Pending Registrations', value: stats.students?.pending || 0, color: 'bg-amber-500' },
                    { label: 'Rejected Applications', value: stats.students?.rejected || 0, color: 'bg-red-500' },
                  ].map((leg, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${leg.color}`} />
                        <span className="font-semibold dynamic-text-muted">{leg.label}</span>
                      </div>
                      <span className="font-black dynamic-text-white">{loading ? '—' : leg.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions Panel */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: 'Add New Course',
                desc: 'Configure semesters and departments',
                action: () => setActiveTab('materials'),
                emoji: '📚',
                bg: 'hover:border-purple-500/30'
              },
              {
                title: 'Register Faculty',
                desc: 'Assign teachers to specific subjects',
                action: () => toast.info('Navigate to Teachers menu from the sidebar'),
                emoji: '👨‍🏫',
                bg: 'hover:border-indigo-500/30'
              },
              {
                title: 'View Full Reports',
                desc: 'Examine detailed metrics and analytics',
                action: () => setActiveTab('analytics'),
                emoji: '📊',
                bg: 'hover:border-pink-500/30'
              }
            ].map((act, idx) => (
              <div
                key={idx}
                onClick={act.action}
                className={`premium-glass neon-glow p-5 cursor-pointer transition-all duration-300 flex items-center gap-4 group ${act.bg}`}
                style={{ borderRadius: '1.5rem' }}
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-black/20 border border-white/20 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  {act.emoji}
                </div>
                <div>
                  <h4 className="font-bold text-sm dynamic-text-white group-hover:text-purple-600 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-xs dynamic-text-muted mt-1">{act.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Notifications / Announcements Panel */}
          <motion.div
            variants={itemVariants}
            className="premium-glass neon-glow hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            style={{ borderRadius: '1.5rem' }}
          >
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700/50 flex items-center gap-2">
              <span className="text-lg">📢</span>
              <h3 className="text-lg font-bold dynamic-text-white">Global Announcements</h3>
              <span className="text-[10px] font-bold dynamic-text-muted uppercase tracking-wider ml-auto">
                System Broadcast
              </span>
            </div>
            <div className="p-6">
              <NotificationsPanel userId={user?.id} role="admin" userName={user?.name} isAdmin />
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'approvals' && (
        <div>
          <div className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-2xl p-6 text-white mb-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-1">Teacher Approvals</h2>
            <p className="text-indigo-200 text-sm">Review and approve teacher registration requests</p>
          </div>

          {teacherLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading pending teachers...
            </div>
          ) : pendingTeachers.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
              <p className="font-semibold text-gray-700">No pending teacher requests</p>
              <p className="text-sm text-gray-400 mt-1">All teacher registrations have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTeachers.map((t: any) => (
                <div key={t._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-indigo-600">{t.name?.[0]?.toUpperCase() ?? '?'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                      <p className="text-sm text-gray-500 truncate">{t.email}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {t.department && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{t.department}</span>
                        )}
                        {t.employeeId && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">ID: {t.employeeId}</span>
                        )}
                        {t.specialization && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{t.specialization}</span>
                        )}
                        {t.phone && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">📞 {t.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApproveTeacher(t._id)}
                      disabled={teacherActionLoading === t._id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                    >
                      {teacherActionLoading === t._id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <CheckCircle className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectTeacher(t._id)}
                      disabled={teacherActionLoading === t._id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors disabled:opacity-60"
                    >
                      {teacherActionLoading === t._id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <AlertCircle className="w-4 h-4" />}
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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