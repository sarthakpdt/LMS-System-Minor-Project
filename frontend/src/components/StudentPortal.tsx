import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { 
  BookOpen, AlertCircle, Clock, Target, Lightbulb, Bell, X, Brain, 
  TrendingUp, CheckCircle, Zap, Award, Calendar, FileText, Wallet, Activity 
} from 'lucide-react';
import AILearningAssistant from './student/AILearningAssistant';
import NotificationsPanel from './teacher/NotificationsPanel';
import StudentDiscussionOfTheDay from './student/StudentDiscussionOfTheDay';
import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import {
  Card,
  Button,
  StatCard,
  Badge,
  ProgressRing,
} from '../theme/components';
import { 
  animationVariants, StaggerList, StaggerItem, PageTransition, 
  SpinningLoader, AnimatedProgressBar 
} from '../theme/animations';

const BASE = 'http://localhost:5000/api/admin';
const API = 'http://localhost:5000/api';

const DEFAULT_SKILLS = [
  { skill: 'Problem Solving', current: 0, target: 0 },
  { skill: 'Critical Thinking', current: 0, target: 0 },
  { skill: 'Programming', current: 0, target: 0 },
  { skill: 'Communication', current: 0, target: 0 },
  { skill: 'Collaboration', current: 0, target: 0 },
];

// Deadline Alarm Banner
function DeadlineAlarm({ assignments, onDismiss }: {
  assignments: any[];
  onDismiss: (id: string) => void;
}) {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const urgent = assignments.filter(a => {
    const due = new Date(a.dueDate);
    return due > now && due <= in24h;
  });

  if (urgent.length === 0) return null;

  return (
    <motion.div
      variants={animationVariants.slideInDown}
      initial="initial"
      animate="animate"
      className="mb-6 space-y-3"
    >
      {urgent.map(a => (
        <motion.div
          key={a._id}
          layout
          className="flex items-start gap-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-300 dark:border-red-700 rounded-xl px-4 py-3 shadow-sm"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Bell className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-800 dark:text-red-300">⏰ Deadline in less than 24 hours!</p>
            <p className="text-sm text-red-700 dark:text-red-400 truncate">
              <span className="font-semibold">{a.title}</span>
              {a.courseId?.courseName && <span className="text-red-500"> · {a.courseId.courseName}</span>}
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
              Due: {new Date(a.dueDate).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDismiss(a._id)}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Deadline Status Badge
function DeadlineBadge({ dueDate }: { dueDate: string }) {
  const now = new Date();
  const due = new Date(dueDate);
  const diffH = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffH < 0) return <Badge variant="warning" size="sm">Expired</Badge>;
  if (diffH < 24) return <Badge variant="error" size="sm">🔴 Due Soon!</Badge>;
  if (diffH < 72) return <Badge variant="warning" size="sm">⚠ Due Soon</Badge>;
  return <Badge variant="success" size="sm">Upcoming</Badge>;
}

export function StudentPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Enrolled courses
  const [enrolled, setEnrolled] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Assignments
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingAssign, setLoadingAssign] = useState(true);
  const [completed, setCompleted] = useState<any[]>([]);

  // Dismissed alerts
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Audio alarm state
  const alarmFiredRef = useRef(false);

  // Tab & Panel Toggles
  const [showAI, setShowAI] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'courses'>('overview');

  // Fee Statement States
  const [feeRecord, setFeeRecord] = useState<any>(null);
  const [latestPaymentStatus, setLatestPaymentStatus] = useState<string | null>(null);

  // Dynamic performance data & insights
  const [performanceTrend, setPerformanceTrend] = useState<any[]>([]);
  const [skillsRadar, setSkillsRadar] = useState<any[]>(DEFAULT_SKILLS);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [avgScoreDisplay, setAvgScoreDisplay] = useState('—');

  // Quiz star summaries
  const [quizStarSummary, setQuizStarSummary] = useState<{
    total: number; avgStars: number; breakdown: number[]
  }>({ total: 0, avgStars: 0, breakdown: [0, 0, 0, 0, 0] });

  // Play simple beep alarm via Web Audio API
  const playAlarm = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const beep = (start: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.5, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.4);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + 0.5);
      };
      beep(0); beep(0.6); beep(1.2);
    } catch { /* browser may block audio without interaction */ }
  };

  // Coordinated data load
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      setLoadingCourses(true);
      setLoadingAssign(true);

      try {
        const storedUser = localStorage.getItem('lms_user');
        const token = user?.token || (storedUser ? JSON.parse(storedUser).token : null);
        if (!token) {
          navigate('/auth');
          return;
        }

        // 1. Fetch Enrolled Courses
        let myCourses: any[] = [];
        try {
          const studentRes = await fetch(`${BASE}/students/${user.id}`);
          const studentJson = await studentRes.json();
          const enrolledList: any[] = studentJson.data?.enrolledCourses || [];

          if (enrolledList.length > 0) {
            const coursesRes = await fetch(`${BASE}/courses`);
            const coursesJson = await coursesRes.json();
            const allCourses: any[] = coursesJson.data || [];

            const enrolledIds = new Set(enrolledList.map((c: any) => String(c.courseId)));
            myCourses = allCourses
              .filter((c: any) => enrolledIds.has(String(c._id)))
              .map((c: any) => ({
                ...c,
                title: c.courseName,
                name: c.courseName,
                instructor: c.teacher ? { name: c.teacher.name } : null,
              }));
          }
        } catch (err) {
          console.warn('Fallback to student enrolled courses list:', err);
          const coursesRes = await fetch(`${API}/courses`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (coursesRes.ok) {
            myCourses = await coursesRes.json();
          }
        }
        setEnrolled(myCourses);
        setLoadingCourses(false);

        // 2. Fetch Assignments
        let myAssignments: any[] = [];
        try {
          const all: any[] = [];
          for (const course of myCourses) {
            try {
              const aRes = await fetch(`${API}/assignments/course/${course._id}`);
              const aData = await aRes.json();
              if (aData.success && Array.isArray(aData.assignments)) {
                aData.assignments
                  .filter((a: any) => a.isPublished)
                  .forEach((a: any) => all.push({ ...a, courseId: course }));
              }
            } catch { /* skip */ }
          }
          all.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
          myAssignments = all;
        } catch (err) {
          console.warn('Fallback to assignments list:', err);
          const assignmentsRes = await fetch(`${API}/assignments`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (assignmentsRes.ok) {
            myAssignments = await assignmentsRes.json();
          }
        }
        setAssignments(myAssignments);
        setCompleted(myAssignments.filter((a: any) => a.submitted));
        setLoadingAssign(false);

        // Trigger beep alarm if any pending due within 24h
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const urgent = myAssignments.filter(a => {
          const due = new Date(a.dueDate);
          return !a.submitted && due > now && due <= in24h;
        });

        if (urgent.length > 0 && !alarmFiredRef.current) {
          alarmFiredRef.current = true;
          playAlarm();
        }

        // 3. Fetch Fee details
        const studentId = user?.studentId || 'STU002';
        try {
          const feeRes = await fetch(`http://localhost:5000/api/accounts/student/${studentId}`);
          if (feeRes.ok) {
            const feeData = await feeRes.json();
            if (feeData.success) {
              setFeeRecord(feeData.record);
            }
          }

          const paymentsRes = await fetch(`http://localhost:5000/api/accounts/student/${studentId}/payments`);
          if (paymentsRes.ok) {
            const paymentsData = await paymentsRes.json();
            if (paymentsData.success && paymentsData.transactions && paymentsData.transactions.length > 0) {
              setLatestPaymentStatus(paymentsData.transactions[0].status);
            }
          }
        } catch (err) {
          console.warn('Could not fetch fee information:', err);
        }

      } catch (err) {
        console.error('Failed to load portal data:', err);
      } finally {
        setLoadingCourses(false);
        setLoadingAssign(false);
      }
    };

    loadData();
  }, [user?.id, user?.token, navigate]);

  // Build softcoded AI insights based on real results + Gemini
  useEffect(() => {
    const buildInsights = async () => {
      if (!user?.id || enrolled.length === 0) return;

      try {
        const quizResults: any[] = [];
        const assignmentResults: any[] = [];
        const timeline: Array<{ date: Date; score: number }> = [];

        // Collect quiz attempts from enrolled courses
        for (const course of enrolled) {
          try {
            const qRes = await fetch(`${API}/quizzes/course/${course._id}`);
            if (!qRes.ok) continue;
            const quizzes = await qRes.json();
            for (const quiz of quizzes.filter((q: any) => q.isPublished)) {
              try {
                const rRes = await fetch(`${API}/quizzes/${quiz._id}/result/${user.id}`);
                if (!rRes.ok) continue;
                const result = await rRes.json();
                const scored = Number(result.score ?? 0);
                const total = Number(result.totalMarks ?? 100);
                const pct = total > 0 ? Math.round((scored / total) * 100) : 0;
                quizResults.push({
                  subject: course.courseName || quiz.title || 'Quiz',
                  scored,
                  total,
                });
                timeline.push({
                  date: new Date(result.submittedAt || result.createdAt || Date.now()),
                  score: pct,
                });
              } catch { /* ignore quiz */ }
            }
          } catch { /* ignore course */ }
        }

        // Collect assignment submissions
        for (const assignment of assignments) {
          try {
            const subRes = await fetch(`${API}/assignments/${assignment._id}/submission/${user.id}`);
            if (!subRes.ok) continue;
            const subData = await subRes.json();
            if (!subData.success || !subData.submission) continue;
            const sub = subData.submission;
            const scored = Number(sub.totalScore ?? 0);
            const total = Number(sub.totalMarks ?? assignment.totalMarks ?? 100);
            const pct = total > 0 ? Math.round((scored / total) * 100) : 0;
            assignmentResults.push({
              subject: assignment.courseId?.courseName || assignment.title || 'Assignment',
              scored,
              total,
            });
            timeline.push({
              date: new Date(sub.submittedAt || sub.createdAt || Date.now()),
              score: pct,
            });
          } catch { /* ignore submission */ }
        }

        const all = [...quizResults, ...assignmentResults];
        if (all.length === 0) {
          setPerformanceTrend([]);
          setSkillsRadar(DEFAULT_SKILLS);
          setWeakAreas([]);
          setRecommendations([]);
          setAvgScoreDisplay('—');
          return;
        }

        const avg = Math.round(all.reduce((sum, r) => sum + (r.total > 0 ? (r.scored / r.total) * 100 : 0), 0) / all.length);
        setAvgScoreDisplay(String(avg));

        // Trend chart points
        const trend = timeline
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(-8)
          .map((t, idx) => ({
            label: Number.isNaN(t.date.getTime())
              ? `A${idx + 1}`
              : t.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            score: t.score,
            target: Math.min(100, t.score + 5),
          }));
        setPerformanceTrend(trend);

        // Subject averages
        const bySubject: Record<string, { sum: number; count: number }> = {};
        all.forEach((r) => {
          const pct = r.total > 0 ? Math.round((r.scored / r.total) * 100) : 0;
          const key = String(r.subject || 'General');
          if (!bySubject[key]) bySubject[key] = { sum: 0, count: 0 };
          bySubject[key].sum += pct;
          bySubject[key].count += 1;
        });
        const subjectAverages = Object.entries(bySubject).map(([subject, v]) => ({
          subject,
          avg: Math.round(v.sum / v.count),
        }));

        // Gemini AI insights integration
        let aiFeedback: any = null;
        try {
          const aiRes = await fetch(`${API}/assignments/ai-performance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizResults,
              assignmentResults,
              studentName: user?.name || 'Student',
            }),
          });
          const aiData = await aiRes.json();
          if (aiData?.success && aiData?.feedback) aiFeedback = aiData.feedback;
        } catch { /* AI optional */ }

        const derivedWeak = (aiFeedback?.weakAreas?.length
          ? aiFeedback.weakAreas
          : subjectAverages.filter((s) => s.avg < 75).map((s) => ({
              subject: s.subject,
              percentage: s.avg,
            })))
          .slice(0, 6)
          .map((w: any) => {
            const current = Number(w.percentage ?? 0);
            const target = Math.min(100, Math.max(current + 10, 75));
            return {
              subject: String(w.subject || 'General'),
              currentScore: current,
              targetScore: target,
              improvement: `+${Math.max(3, Math.round((target - current) / 2))}%`,
            };
          });
        setWeakAreas(derivedWeak);

        const aiTips: string[] = [
          ...(aiFeedback?.improvements || []),
          ...(aiFeedback?.improvementTips || []),
          ...(aiFeedback?.studyTips || []),
        ].filter(Boolean);
        const recTexts = aiTips.length > 0
          ? aiTips.slice(0, 6)
          : (derivedWeak.length > 0
              ? derivedWeak.map((w) => `Revise ${w.subject} and attempt two practice sets this week.`).slice(0, 3)
              : ['Keep practicing consistently to maintain your current performance.']);

        const iconCycle = [Lightbulb, BookOpen, Target];
        const recColors = [
          'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
        ];
        setRecommendations(
          recTexts.map((text, idx) => ({
            icon: iconCycle[idx % iconCycle.length],
            title: idx === 0 ? 'Priority Focus' : `Action ${idx + 1}`,
            description: text,
            priority: idx === 0 ? 'high' : idx < 3 ? 'medium' : 'low',
            color: recColors[idx % recColors.length],
          }))
        );

        // Skills growth mapping
        const assignmentAvg = assignmentResults.length > 0
          ? Math.round(assignmentResults.reduce((s, r) => s + (r.total > 0 ? (r.scored / r.total) * 100 : 0), 0) / assignmentResults.length)
          : avg;
        const programmingAvgCandidates = subjectAverages
          .filter((s) => /cs|program|coding|data|algo|software/i.test(s.subject))
          .map((s) => s.avg);
        const programmingAvg = programmingAvgCandidates.length > 0
          ? Math.round(programmingAvgCandidates.reduce((a, b) => a + b, 0) / programmingAvgCandidates.length)
          : avg;
        const submissionRate = assignments.length > 0
          ? Math.min(1, assignmentResults.length / assignments.length)
          : 0.7;
        const collaboration = Math.round(submissionRate * 100);
        const communication = Math.round((assignmentAvg * 0.85) + (collaboration * 0.15));

        const computedSkills = [
          { skill: 'Problem Solving', current: avg, target: Math.min(100, avg + 10) },
          { skill: 'Critical Thinking', current: assignmentAvg, target: Math.min(100, assignmentAvg + 10) },
          { skill: 'Programming', current: programmingAvg, target: Math.min(100, programmingAvg + 8) },
          { skill: 'Communication', current: communication, target: Math.min(100, communication + 10) },
          { skill: 'Collaboration', current: collaboration, target: Math.min(100, collaboration + 8) },
        ];
        setSkillsRadar(computedSkills);
      } catch (err) {
        console.warn('Could not compile dynamic insights:', err);
      }
    };

    buildInsights();
  }, [user?.id, user?.name, enrolled, assignments]);

  // Fetch quiz stars summaries from all course quizzes in user's semester
  useEffect(() => {
    const fetchQuizStars = async () => {
      if (!user?.id || !user?.semester) return;
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
                if (rRes.ok) {
                  const r = await rRes.json();
                  allResults.push(r);
                }
              } catch { /* not attempted */ }
            }
          } catch { /* skip */ }
        }
        if (allResults.length === 0) return;
        const breakdown = [0, 0, 0, 0, 0];
        let totalStars = 0;
        allResults.forEach(r => {
          const pct = r.percentage || 0;
          const stars = pct <= 20 ? 1 : pct <= 40 ? 2 : pct <= 60 ? 3 : pct <= 80 ? 4 : 5;
          breakdown[stars - 1]++;
          totalStars += stars;
        });
        setQuizStarSummary({
          total: allResults.length,
          avgStars: parseFloat((totalStars / allResults.length).toFixed(1)),
          breakdown,
        });
      } catch { /* ignore */ }
    };
    fetchQuizStars();
  }, [user?.id, user?.semester]);

  const allAssignments = Array.isArray(assignments) ? assignments : [];
  const pendingAssignments = allAssignments.filter(a => !a.submitted && !dismissedAlerts.has(a._id));
  const completionRate = enrolled.length > 0 && allAssignments.length > 0
    ? Math.round((completed.length / allAssignments.length) * 100)
    : 0;

  // Chart dark mode setups
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipText = isDark ? '#ffffff' : '#000000';

  const chartData = performanceTrend.length > 0 ? performanceTrend : [
    { label: 'W1', score: 65, target: 70 },
    { label: 'W2', score: 72, target: 75 },
    { label: 'W3', score: 78, target: 80 },
    { label: 'W4', score: 82, target: 85 },
    { label: 'W5', score: 85, target: 85 },
  ];

  if (loadingCourses || loadingAssign) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <SpinningLoader size="lg" className="mb-4 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      <div className="p-8">
        {/* Header */}
        <motion.div
          variants={animationVariants.slideInDown}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg text-white">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Welcome back, {user?.name || 'Student'}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  {user?.studentId || 'N/A'} · Semester {user?.semester || '—'} · Average Score: {avgScoreDisplay}%
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/academic-health')}
                className="bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30 flex items-center gap-1.5"
              >
                <Activity className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                Academic Health
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/fees')}
                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 flex items-center gap-1.5"
              >
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Pay Fees
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowNotif(!showNotif)}
                className={`flex items-center gap-1.5 ${
                  showNotif 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-bold border-blue-300 dark:border-blue-800' 
                    : 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Bell className="w-4 h-4" />
                Notifications
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowAI(!showAI)}
                className="flex items-center gap-1.5 font-bold"
              >
                <Brain className="w-4 h-4" />
                AI Assistant
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Alerts */}
        {pendingAssignments.length > 0 && (
          <DeadlineAlarm
            assignments={pendingAssignments}
            onDismiss={(id) => {
              const newDismissed = new Set(dismissedAlerts);
              newDismissed.add(id);
              setDismissedAlerts(newDismissed);
            }}
          />
        )}

        {/* Announcements Toggle */}
        {showNotif && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-8 overflow-hidden"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-150 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Announcements & Notifications</h3>
                </div>
                <Button variant="secondary" size="xs" onClick={() => setShowNotif(false)}>
                  Close
                </Button>
              </div>
              <NotificationsPanel
                userId={user?.id}
                role="student"
                userName={user?.name}
                isAdmin={false}
              />
            </Card>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <motion.div
          variants={animationVariants.slideInUp}
          initial="initial"
          animate="animate"
          className="flex gap-3 mb-8 border-b border-gray-200 dark:border-gray-700"
        >
          {[
            { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
            { id: 'assignments' as const, label: 'Assignments', icon: FileText },
            { id: 'courses' as const, label: 'Courses', icon: BookOpen },
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all duration-200 ${
                activeTab === id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-gray-650 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
          ))}
        </motion.div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div
            variants={animationVariants.slideInUp}
            initial="initial"
            animate="animate"
            className="space-y-8"
          >
            {/* Key Stats */}
            <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StaggerItem>
                <StatCard
                  icon={<BookOpen className="w-5 h-5" />}
                  label="Courses Enrolled"
                  value={enrolled.length}
                  gradient="from-blue-500 to-cyan-600"
                />
              </StaggerItem>

              <StaggerItem>
                <StatCard
                  icon={<CheckCircle className="w-5 h-5" />}
                  label="Assignments Completed"
                  value={completed.length}
                  gradient="from-green-500 to-emerald-600"
                />
              </StaggerItem>

              <StaggerItem>
                <StatCard
                  icon={<Clock className="w-5 h-5" />}
                  label="Pending Assignments"
                  value={allAssignments.filter(a => !a.submitted).length}
                  gradient="from-orange-500 to-amber-600"
                />
              </StaggerItem>

              <StaggerItem>
                <StatCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="Completion Rate"
                  value={`${completionRate}%`}
                  gradient="from-purple-500 to-indigo-600"
                />
              </StaggerItem>
            </StaggerList>

            {/* Question / Discussion of the Day */}
            <motion.div
              variants={animationVariants.slideInUp}
              initial="initial"
              animate="animate"
            >
              <StudentDiscussionOfTheDay />
            </motion.div>

            {/* Performance Section Grid */}
            <motion.div
              variants={animationVariants.slideInUp}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* Progress Ring */}
              <Card gradient role="student" className="flex flex-col items-center justify-center py-8">
                <ProgressRing progress={completionRate} size="md" color="blue" />
                <p className="mt-4 text-gray-655 dark:text-gray-400 text-sm font-semibold">Overall Progress</p>
              </Card>

              {/* Learning Status */}
              <Card gradient role="student">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                  Learning Status
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Quiz Stars Avg</span>
                      <span className="text-sm font-bold text-amber-500">
                        {quizStarSummary.avgStars > 0 ? `${quizStarSummary.avgStars} ★` : '—'}
                      </span>
                    </div>
                    <AnimatedProgressBar progress={quizStarSummary.avgStars > 0 ? (quizStarSummary.avgStars / 5) * 100 : 0} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Class Match Score</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {avgScoreDisplay !== '—' ? `${avgScoreDisplay}%` : '—'}
                      </span>
                    </div>
                    <AnimatedProgressBar progress={avgScoreDisplay !== '—' ? Number(avgScoreDisplay) : 0} />
                  </div>
                </div>
              </Card>

              {/* Achievements */}
              <Card gradient role="student">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600 dark:text-purple-400" />
                  Achievements
                </h3>
                <div className="flex items-center justify-center gap-4 py-2">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-2xl shadow-sm border border-yellow-200">
                      🏆
                    </div>
                    <p className="text-xs mt-2 text-gray-600 dark:text-gray-400 font-semibold">Quick Learner</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-2xl shadow-sm border border-blue-200">
                      ⭐
                    </div>
                    <p className="text-xs mt-2 text-gray-600 dark:text-gray-400 font-semibold">Consistent</p>
                  </motion.div>
                </div>
              </Card>

              {/* Fee Payment Card */}
              <Card gradient role="student" className="flex flex-col justify-between">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Fee Statement
                  </h3>
                  {feeRecord && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                      feeRecord.feeStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30' :
                      feeRecord.feeStatus === 'partial' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30' :
                      feeRecord.feeStatus === 'overdue' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30' :
                      'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                    }`}>
                      {feeRecord.feeStatus}
                    </span>
                  )}
                </div>
                <div className="space-y-2 flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Total Invoice:</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">
                      {feeRecord ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(feeRecord.totalFee) : '₹0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Amount Paid:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {feeRecord ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(feeRecord.paidAmount) : '₹0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-dashed border-gray-200 dark:border-slate-700/50 pt-2 text-xs">
                    <span className="font-semibold text-gray-700 dark:text-slate-350">Remaining Due:</span>
                    <span className={`font-black ${feeRecord?.dueAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-slate-500'}`}>
                      {feeRecord ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(feeRecord.dueAmount) : '₹0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-dashed border-gray-200 dark:border-slate-700/50 pt-2 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Latest Payment:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                      latestPaymentStatus === 'Paid' || latestPaymentStatus === 'completed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30' :
                      latestPaymentStatus === 'Under Verification' || latestPaymentStatus === 'processing' || latestPaymentStatus === 'Payment Submitted' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 animate-pulse' :
                      latestPaymentStatus === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30' :
                      'bg-gray-100 text-gray-650 border-gray-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                    }`}>
                      {latestPaymentStatus || 'None'}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 transition duration-200"
                    onClick={() => navigate('/fees')}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Go to Fee Portal</span>
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Performance Analytics Trend Chart + Stars */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trend Chart */}
              <Card className="lg:col-span-2 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    My Performance Trend
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <defs>
                      <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="label" stroke={axisColor} />
                    <YAxis stroke={axisColor} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`,
                        borderRadius: '8px',
                        color: tooltipText,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="score" fill="url(#studentGradient)" radius={[8, 8, 0, 0]} name="Your Score" />
                    <Bar dataKey="target" fill="#d1d5db" radius={[8, 8, 0, 0]} name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Quiz Star Summary Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quiz Stars Breakdown</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {quizStarSummary.total} quiz{quizStarSummary.total !== 1 ? 'zes' : ''} completed
                    </p>
                  </div>
                  {quizStarSummary.total > 0 && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-amber-500 dark:text-amber-400">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={i < Math.round(quizStarSummary.avgStars) ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}>★</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Avg: {quizStarSummary.avgStars}/5 stars</p>
                    </div>
                  )}
                </div>

                {quizStarSummary.total === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <Award className="w-10 h-10 mb-2 opacity-30 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-400">Attempt quizzes to collect stars</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = quizStarSummary.breakdown[star - 1];
                      const pct = quizStarSummary.total > 0 ? Math.round((count / quizStarSummary.total) * 100) : 0;
                      const colors: Record<number, string> = { 5: 'bg-green-500', 4: 'bg-blue-400', 3: 'bg-yellow-400', 2: 'bg-orange-400', 1: 'bg-red-400' };
                      const labels: Record<number, string> = { 5: '81–100%', 4: '61–80%', 3: '41–60%', 2: '21–40%', 1: '0–20%' };
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-amber-400 text-xs w-16 flex-shrink-0 font-medium text-left">
                            {Array.from({ length: 5 }, (_, i) => <span key={i}>{i < star ? '★' : '☆'}</span>)}
                          </span>
                          <span className="text-[10px] text-gray-400 w-12 flex-shrink-0">{labels[star]}</span>
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-750 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${colors[star]}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-gray-450 w-6 text-right font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Radar Analysis and Weak Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Skills Profile & Target
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={skillsRadar}>
                    <PolarGrid stroke={gridColor} />
                    <PolarAngleAxis dataKey="skill" stroke={axisColor} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={axisColor} />
                    <Radar name="Current level" dataKey="current" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                    <Radar name="Target level" dataKey="target" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`,
                        borderRadius: '8px',
                        color: tooltipText,
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>

              {/* Weak Areas Progress bars */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Areas Requiring Attention</h3>
                </div>
                <div className="space-y-4">
                  {weakAreas.length === 0 ? (
                    <div className="text-center py-10 text-gray-450 dark:text-gray-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-60" />
                      <p className="text-sm font-semibold">All subjects are on track!</p>
                      <p className="text-xs">No critical areas requiring immediate attention.</p>
                    </div>
                  ) : (
                    weakAreas.map((area, i) => (
                      <div key={i} className="pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate">{area.subject}</p>
                            <p className="text-xs text-gray-550 dark:text-gray-400">Target Score: {area.targetScore}%</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-750 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30 border border-green-200 ml-2 flex-shrink-0">
                            {area.improvement} recommended
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="w-full h-2 bg-gray-150 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${
                                area.currentScore >= 75 ? 'bg-green-500' :
                                area.currentScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} style={{ width: `${area.currentScore}%` }} />
                            </div>
                          </div>
                          <span className="text-xs font-bold text-gray-900 dark:text-slate-200 min-w-[30px]">{area.currentScore}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* AI-Driven recommendations */}
            {recommendations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Learning Strategy Recommendations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendations.map((rec, i) => (
                    <Card key={i} className={`p-6 border flex flex-col justify-between ${rec.color}`}>
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center mb-4 shadow-sm">
                          <rec.icon className="w-5 h-5 text-blue-600 dark:text-blue-450" />
                        </div>
                        <h4 className="font-bold text-sm text-gray-955 dark:text-white mb-2">{rec.title}</h4>
                        <p className="text-xs text-gray-800 dark:text-gray-300 leading-relaxed mb-4">{rec.description}</p>
                      </div>
                      <span className={`self-start text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30' :
                        rec.priority === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-205 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' :
                        'bg-green-100 text-green-800 border-green-205 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'
                      }`}>
                        {rec.priority} Priority
                      </span>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ASSIGNMENTS TAB */}
        {activeTab === 'assignments' && (
          <motion.div
            variants={animationVariants.slideInUp}
            initial="initial"
            animate="animate"
          >
            {allAssignments.length === 0 ? (
              <Card className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-semibold">No assignments available</p>
              </Card>
            ) : (
              <StaggerList className="space-y-4">
                {allAssignments.map((assignment) => (
                  <StaggerItem key={assignment._id}>
                    <Card hover className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {assignment.title}
                            </h4>
                            <DeadlineBadge dueDate={assignment.dueDate} />
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-3">
                            {assignment.courseId?.courseName || 'Course'}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            {assignment.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs font-medium">
                            <span className="text-gray-600 dark:text-gray-400">
                              <Calendar className="w-3.5 h-3.5 inline mr-1 text-gray-500" />
                              Due: {new Date(assignment.dueDate).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              <Award className="w-3.5 h-3.5 inline mr-1 text-gray-500" />
                              {assignment.totalMarks ?? assignment.marks ?? 0} Marks
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              <Clock className="w-3.5 h-3.5 inline mr-1 text-gray-500" />
                              {assignment.questions?.length || 0} Questions
                            </span>
                          </div>
                        </div>
                        <Button
                          variant={assignment.submitted ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => navigate(`/assignments/${assignment._id}`)}
                        >
                          {assignment.submitted ? 'View Submission' : 'Submit Now'}
                        </Button>
                      </div>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </motion.div>
        )}

        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <motion.div
            variants={animationVariants.slideInUp}
            initial="initial"
            animate="animate"
          >
            {enrolled.length === 0 ? (
              <Card className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No courses enrolled</p>
                <Button variant="primary">Browse Courses</Button>
              </Card>
            ) : (
              <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolled.map((course) => (
                  <StaggerItem key={course._id}>
                    <Card hover className="p-6 flex flex-col h-full justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {course.courseName}
                            </h4>
                            <p className="text-xs font-mono text-gray-500">
                              {course.courseCode}
                            </p>
                          </div>
                          <Badge variant="info" size="sm" className="ml-2 flex-shrink-0">Sem {course.semester}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed line-clamp-3">
                          {course.description || 'Learn and master core concepts of this subject.'}
                        </p>
                        <div className="space-y-1 mb-4 text-xs font-semibold text-gray-650 dark:text-gray-400">
                          {course.instructor?.name && (
                            <p>👤 Teacher: <span className="text-blue-650 dark:text-cyan-400">{course.instructor.name}</span></p>
                          )}
                          <p>📚 Department: {course.department || 'N/A'}</p>
                          <p>⭐ Credits: {course.credits ?? 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate('/materials')}
                        >
                          Materials
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate('/quizzes')}
                        >
                          Quizzes
                        </Button>
                      </div>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </motion.div>
        )}
      </div>

      {/* AI Assistant Sidebar */}
      {showAI && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 border-l border-gray-200 dark:border-gray-700"
        >
          <button
            onClick={() => setShowAI(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-450" />
          </button>
          <div className="h-full overflow-auto p-4">
            <h2 className="text-xl font-bold mb-4 mt-4 text-gray-900 dark:text-white">AI Learning Assistant</h2>
            <AILearningAssistant userId={user?.id || ''} userName={user?.name || 'Student'} />
          </div>
        </motion.div>
      )}
    </PageTransition>
  );
}
