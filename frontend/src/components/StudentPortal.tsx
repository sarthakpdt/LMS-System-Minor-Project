  import { useAuth } from '../contexts/AuthContext';
  import { useState, useEffect, useRef } from 'react';
  import { useNavigate } from 'react-router';
  import { BookOpen, AlertCircle, Clock, Target, Lightbulb, Bell, X, Brain } from 'lucide-react';
  import AILearningAssistant from './student/AILearningAssistant';
  import {
    LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
  } from 'recharts';

  const BASE     = 'http://localhost:5000/api/admin';
  const API      = 'http://localhost:5000/api';

  const performanceTrend = [
    { month: 'Jan', score: 82 }, { month: 'Feb', score: 85 },
    { month: 'Mar', score: 83 }, { month: 'Apr', score: 87 },
    { month: 'May', score: 89 },
  ];

  const skillsRadar = [
    { skill: 'Problem Solving',  current: 88, target: 95 },
    { skill: 'Critical Thinking', current: 75, target: 85 },
    { skill: 'Programming',      current: 92, target: 95 },
    { skill: 'Communication',    current: 80, target: 90 },
    { skill: 'Collaboration',    current: 85, target: 90 },
  ];

  const weakAreas = [
    { subject: 'Physics - Mechanics',      currentScore: 68, targetScore: 80, improvement: '+5%' },
    { subject: 'Math - Integration',       currentScore: 72, targetScore: 85, improvement: '+3%' },
    { subject: 'English - Essay Writing',  currentScore: 76, targetScore: 85, improvement: '+8%' },
  ];

  const recommendations = [
    { icon: Lightbulb, title: 'Focus on Physics Mechanics',         description: 'Your scores in mechanics are below average. Watch additional video lectures.',     priority: 'high',   color: 'bg-red-100 text-red-600'    },
    { icon: BookOpen,  title: 'Practice More Integration Problems',  description: 'Complete extra problem sets to improve your integration skills.',                 priority: 'medium', color: 'bg-yellow-100 text-yellow-600' },
    { icon: Target,    title: 'Maintain Programming Excellence',     description: "You're excelling in CS! Keep up the great work.",                                  priority: 'low',    color: 'bg-green-100 text-green-600'  },
  ];

  // Load AI recommendations from localStorage
  const getAIRecommendations = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('aiRecommendations') || '[]');
      return stored.flatMap((item: any) => item.recommendations.map((rec: string) => ({
        icon: Sparkles,
        title: `From ${item.assignment}`,
        description: rec,
        priority: 'medium',
        color: 'bg-indigo-100 text-indigo-600'
      })));
    } catch {
      return [];
    }
  };

  // ── Deadline alarm banner ─────────────────────────────────────
  function DeadlineAlarm({ assignments, onDismiss }: {
    assignments: any[];
    onDismiss: (id: string) => void;
  }) {
    const now          = new Date();
    const in24h        = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const urgent       = assignments.filter(a => {
      const due = new Date(a.dueDate);
      return due > now && due <= in24h;
    });

    if (urgent.length === 0) return null;

    return (
      <div className="mb-6 space-y-2">
        {urgent.map(a => (
          <div key={a._id}
            className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-xl px-4 py-3 shadow-sm animate-pulse">
            <Bell className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-800">⏰ Deadline in less than 24 hours!</p>
              <p className="text-sm text-red-700 truncate">
                <span className="font-semibold">{a.title}</span>
                {a.courseId?.courseName && <span className="text-red-500"> · {a.courseId.courseName}</span>}
              </p>
              <p className="text-xs text-red-500 mt-0.5">
                Due: {new Date(a.dueDate).toLocaleString('en-IN', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            <button onClick={() => onDismiss(a._id)}
              className="text-red-400 hover:text-red-600 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  // ── Deadline status badge ─────────────────────────────────────
  function DeadlineBadge({ dueDate }: { dueDate: string }) {
    const now   = new Date();
    const due   = new Date(dueDate);
    const diffH = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffH < 0)   return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Expired</span>;
    if (diffH < 24)  return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold animate-pulse">🔴 Due Soon!</span>;
    if (diffH < 72)  return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">⚠ Due Soon</span>;
    return               <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Upcoming</span>;
  }

  // ─────────────────────────────────────────────────────────────
  export function StudentPortal() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
    const [loadingCourses,  setLoadingCourses]  = useState(true);

    // Real assignments from backend
    const [assignments,     setAssignments]     = useState<any[]>([]);
    const [loadingAssign,   setLoadingAssign]   = useState(true);

    // Dismissed alarm IDs
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    // AI Insights panel
    const [showAIPanel, setShowAIPanel] = useState(false);

    // Quiz star summary
    const [quizStarSummary, setQuizStarSummary] = useState<{
      total: number; avgStars: number; breakdown: number[]
    }>({ total: 0, avgStars: 0, breakdown: [0, 0, 0, 0, 0] });

    // AI Recommendations
    const [aiRecs, setAiRecs] = useState<any[]>([]);

    // Alarm sound via AudioContext
    const alarmFiredRef = useRef(false);

    const getInitials = (name?: string) => {
      if (!name) return 'ST';
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // ── Fetch enrolled courses ──────────────────────────────────
    useEffect(() => {
      const fetchEnrolledCourses = async () => {
        if (!user?.id) { setLoadingCourses(false); return; }
        try {
          const studentRes  = await fetch(`${BASE}/students/${user.id}`);
          const studentJson = await studentRes.json();
          const enrolledList: any[] = studentJson.data?.enrolledCourses || [];

          if (enrolledList.length === 0) {
            setEnrolledCourses([]);
            setLoadingCourses(false);
            return;
          }

          const coursesRes  = await fetch(`${BASE}/courses`);
          const coursesJson = await coursesRes.json();
          const allCourses: any[] = coursesJson.data || [];

          const enrolledIds = new Set(enrolledList.map((c: any) => String(c.courseId)));
          const myCourses = allCourses
            .filter((c: any) => enrolledIds.has(String(c._id)))
            .map((c: any) => ({
              ...c,
              title: c.courseName,
              name:  c.courseName,
              instructor: c.teacher ? { name: c.teacher.name } : null,
            }));

          setEnrolledCourses(myCourses);
        } catch (err) {
          console.warn('Could not fetch enrolled courses:', err);
        } finally {
          setLoadingCourses(false);
        }
      };
      fetchEnrolledCourses();
    }, [user?.id]);

    // ── Load AI recommendations ─────────────────────────────────
    useEffect(() => {
      setAiRecs(getAIRecommendations());
    }, []);

    // ── Fetch real assignments for this student ─────────────────
    useEffect(() => {
      const fetchAssignments = async () => {
        if (!user?.id) { setLoadingAssign(false); return; }
        setLoadingAssign(true);
        try {
          // Get all courses, collect published assignments
          const cRes  = await fetch(`${BASE}/courses`);
          const cJson = await cRes.json();
          const allCourses: any[] = cJson.data || [];

          // Get this student's enrolled course IDs
          const sRes   = await fetch(`${BASE}/students/${user.id}`);
          const sJson  = await sRes.json();
          const enrolled: any[] = sJson.data?.enrolledCourses || [];
          const enrolledIds = new Set(enrolled.map((c: any) => String(c.courseId)));

          const myCourses = allCourses.filter((c: any) => enrolledIds.has(String(c._id)));

          const all: any[] = [];
          for (const course of myCourses) {
            try {
              const aRes  = await fetch(`${API}/assignments/course/${course._id}`);
              const aData = await aRes.json();
              if (aData.success && Array.isArray(aData.assignments)) {
                aData.assignments
                  .filter((a: any) => a.isPublished)
                  .forEach((a: any) => all.push({ ...a, courseId: course }));
              }
            } catch { /* skip */ }
          }

          // Sort by due date ascending
          all.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
          setAssignments(all);

          // ── Trigger alarm if any due within 24h ──────────────
          const now   = new Date();
          const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          const urgent = all.filter(a => {
            const due = new Date(a.dueDate);
            return due > now && due <= in24h;
          });

          if (urgent.length > 0 && !alarmFiredRef.current) {
            alarmFiredRef.current = true;
            playAlarm();
          }
        } catch (err) {
          console.warn('Could not fetch assignments:', err);
        } finally {
          setLoadingAssign(false);
        }
      };
      fetchAssignments();
    }, [user?.id]);

    // ── Quiz stars ──────────────────────────────────────────────
    useEffect(() => {
      const fetchQuizStars = async () => {
        if (!user?.id) return;
        try {
          const cRes = await fetch(`${API}/courses/semester/${user?.semester}`);
          if (!cRes.ok) return;
          const courses = await cRes.json();
          let allResults: any[] = [];
          for (const course of courses) {
            try {
              const qRes = await fetch(`${API}/quizzes/course/${course._id}`);
              if (!qRes.ok) continue;
              const quizzes = await qRes.json();
              for (const quiz of quizzes.filter((q: any) => q.isPublished)) {
                try {
                  const rRes = await fetch(`${API}/quizzes/${quiz._id}/result/${user.id}`);
                  if (rRes.ok) { const r = await rRes.json(); allResults.push(r); }
                } catch { /* not attempted */ }
              }
            } catch { /* skip */ }
          }
          if (allResults.length === 0) return;
          const breakdown = [0, 0, 0, 0, 0];
          let totalStars = 0;
          allResults.forEach(r => {
            const pct   = r.percentage || 0;
            const stars = pct <= 20 ? 1 : pct <= 40 ? 2 : pct <= 60 ? 3 : pct <= 80 ? 4 : 5;
            breakdown[stars - 1]++;
            totalStars += stars;
          });
          setQuizStarSummary({
            total:    allResults.length,
            avgStars: parseFloat((totalStars / allResults.length).toFixed(1)),
            breakdown,
          });
        } catch { /* ignore */ }
      };
      fetchQuizStars();
    }, [user?.id]);

    // ── Play a simple beep alarm via Web Audio API ──────────────
    const playAlarm = () => {
      try {
        const ctx  = new (window.AudioContext || (window as any).webkitAudioContext)();
        const beep = (start: number) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type      = 'sine';
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.5, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.4);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + 0.5);
        };
        beep(0); beep(0.6); beep(1.2);
      } catch { /* browser may block audio without user interaction */ }
    };

    const handleDismiss = (id: string) =>
      setDismissed(prev => new Set([...prev, id]));

    // Filter out dismissed alarms
    const visibleAssignments = assignments.filter(a => !dismissed.has(a._id));

    // Upcoming = not expired, limit to 5
    const upcomingAssignments = visibleAssignments
      .filter(a => new Date(a.dueDate) > new Date())
      .slice(0, 5);

    const avgScore      = enrolledCourses.length > 0
      ? (enrolledCourses.reduce((s, c) => s + (c.grade || 0), 0) / enrolledCourses.length).toFixed(1)
      : '—';
    const avgAttendance = enrolledCourses.length > 0
      ? (enrolledCourses.reduce((s, c) => s + (c.attendance || 0), 0) / enrolledCourses.length).toFixed(1)
      : '—';
    const totalCredits  = enrolledCourses.reduce((s, c) => s + (c.credits || 0), 0);

    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">Student Portal</h2>
          <p className="text-gray-600">Personalized dashboard with performance insights and learning recommendations.</p>
        </div>

        {/* ── Deadline Alarm Banners ── */}
        <DeadlineAlarm
          assignments={visibleAssignments}
          onDismiss={handleDismiss}
        />

        {/* ── Student Profile Card ── */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-8 mb-6 text-white">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">{getInitials(user?.name)}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">{user?.name ?? 'Student'}</h3>
                <p className="text-sm opacity-90">{user?.studentId ?? 'N/A'} · {user?.email}</p>
                <p className="text-sm opacity-75">{user?.department ?? 'Department'} · Semester {user?.semester ?? '—'}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-sm opacity-75">Current GPA</p>
                <p className="text-3xl font-bold">—</p>
                <p className="text-xs opacity-75">Rank: —</p>
              </div>
              {/* AI Insights icon */}
              <button
                onClick={() => setShowAIPanel(true)}
                title="AI Performance Insights"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>AI Insights</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 pt-6 border-t border-white/20">
            <div>
              <p className="text-sm opacity-75 mb-1">Enrolled Courses</p>
              <p className="text-2xl font-bold">{loadingCourses ? '…' : enrolledCourses.length}</p>
            </div>
            <div>
              <p className="text-sm opacity-75 mb-1">Avg Score</p>
              <p className="text-2xl font-bold">{avgScore}{avgScore !== '—' ? '%' : ''}</p>
            </div>
            <div>
              <p className="text-sm opacity-75 mb-1">Attendance</p>
              <p className="text-2xl font-bold">{avgAttendance}{avgAttendance !== '—' ? '%' : ''}</p>
            </div>
            <div>
              <p className="text-sm opacity-75 mb-1">Credits</p>
              <p className="text-2xl font-bold">{totalCredits || '—'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Quiz Star Summary */}
          {quizStarSummary.total > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Quiz Performance Stars</h3>
                  <p className="text-sm text-gray-500">
                    {quizStarSummary.total} quiz{quizStarSummary.total !== 1 ? 'zes' : ''} completed
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-amber-400">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={i < Math.round(quizStarSummary.avgStars) ? 'text-amber-400' : 'text-gray-200'}>★</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Avg {quizStarSummary.avgStars} / 5 stars</p>
                </div>
              </div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(star => {
                  const count  = quizStarSummary.breakdown[star - 1];
                  const pct    = quizStarSummary.total > 0 ? Math.round((count / quizStarSummary.total) * 100) : 0;
                  const colors: Record<number, string> = { 5: 'bg-green-500', 4: 'bg-blue-400', 3: 'bg-yellow-400', 2: 'bg-orange-400', 1: 'bg-red-400' };
                  const labels: Record<number, string> = { 5: '81–100%', 4: '61–80%', 3: '41–60%', 2: '21–40%', 1: '0–20%' };
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-amber-400 text-sm w-20 flex-shrink-0 font-medium">
                        {Array.from({ length: 5 }, (_, i) => <span key={i}>{i < star ? '★' : '☆'}</span>)}
                      </span>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0">{labels[star]}</span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${colors[star]}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Performance Trend */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Performance Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} name="Average Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── Upcoming Deadlines — REAL DATA ── */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
            </div>

            {loadingAssign ? (
              <p className="text-sm text-gray-400 text-center py-6">Loading assignments...</p>
            ) : upcomingAssignments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No upcoming deadlines 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map(a => {
                  const course = typeof a.courseId === 'object' ? a.courseId : null;
                  const due    = new Date(a.dueDate);
                  const diffH  = (due.getTime() - Date.now()) / (1000 * 60 * 60);
                  return (
                    <div key={a._id}
                      className={`pb-3 border-b border-gray-100 last:border-0 rounded-lg px-2 py-2 transition ${
                        diffH < 24 ? 'bg-red-50 border border-red-100' : ''
                      }`}>
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                      {course && (
                        <p className="text-xs text-indigo-600 mb-1 truncate">
                          {course.courseName} {course.courseCode ? `(${course.courseCode})` : ''}
                        </p>
                      )}
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-xs text-gray-500">
                          Due: {due.toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                        <DeadlineBadge dueDate={a.dueDate} />
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400">
                          {a.questions?.length || 0} questions · {a.totalMarks} marks
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Personalized Learning Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...recommendations, ...aiRecs].map((rec, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className={`w-12 h-12 ${rec.color} rounded-lg flex items-center justify-center mb-4`}>
                  <rec.icon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{rec.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                  rec.priority === 'high'   ? 'bg-red-100 text-red-700'    :
                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                              'bg-green-100 text-green-700'
                }`}>
                  {rec.priority.toUpperCase()} Priority
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Skills Analysis */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Analysis & Growth Areas</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={skillsRadar}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="skill" stroke="#6b7280" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
                <Radar name="Current Level" dataKey="current" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Radar name="Target Level"  dataKey="target"  stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Legend /><Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Weak Areas */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Areas Requiring Improvement</h3>
            </div>
            <div className="space-y-4">
              {weakAreas.map((area, i) => (
                <div key={i} className="pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{area.subject}</p>
                      <p className="text-sm text-gray-600">Target: {area.targetScore}%</p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                      {area.improvement} this month
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          area.currentScore >= 75 ? 'bg-green-500' :
                          area.currentScore >= 65 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{ width: `${area.currentScore}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 min-w-[50px]">{area.currentScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Courses</h3>        {loadingCourses ? (
            <p className="text-gray-500 text-sm">Loading your courses...</p>
          ) : enrolledCourses.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">You are not enrolled in any courses yet.</p>
              <p className="text-xs mt-1">Contact your admin to get enrolled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.map((course, i) => (
                <div key={course._id || i} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1 truncate">{course.courseName}</h4>
                      <p className="text-xs font-mono text-gray-500">{course.courseCode}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {course.instructor?.name
                          ? <span className="text-emerald-600 font-medium">👤 {course.instructor.name}</span>
                          : <span className="text-orange-500">⚠ No teacher assigned</span>
                        }
                      </p>
                      <p className="text-xs text-indigo-600 mt-0.5">Semester {course.semester}</p>
                    </div>
                    <span className="ml-2 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0">
                      {course.department}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Grade</p>
                      <p className="text-sm font-medium text-gray-900">{course.grade != null ? `${course.grade}%` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Credits</p>
                      <p className="text-sm font-medium text-gray-900">{course.credits ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Students</p>
                      <p className="text-sm font-medium text-gray-900">{course.enrolledStudents?.length ?? 0}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/assignments?courseId=${course._id}`)}
                    className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                  >
                    View Assignments
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── AI Performance Insights Modal ── */}
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
      </div>
    );
  }