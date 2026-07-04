import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, AlertCircle, Clock, Target, Lightbulb, Bell, X, Brain, TrendingUp, CheckCircle, Zap, Award, Calendar, ArrowRight, FileText } from 'lucide-react';
import AILearningAssistant from './student/AILearningAssistant';
import NotificationsPanel from './teacher/NotificationsPanel';
import StudentTimetable from './timetable/StudentTimetable';
import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Card,
  Button,
  StatCard,
  Badge,
  Alert,
  ProgressRing,
} from '../theme/components';
import { animationVariants, AnimatedContainer, AnimatedProgressBar, StaggerList, StaggerItem, PageTransition, SpinningLoader } from '../theme/animations';

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

export function StudentPortalNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolled, setEnrolled] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [skills, setSkills] = useState(DEFAULT_SKILLS);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showAI, setShowAI] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'courses' | 'timetable'>('overview');
  const [attendancePercentage, setAttendancePercentage] = useState<number | null>(null);
  const [attendanceRisk, setAttendanceRisk] = useState<string | null>(null);
  const [timetableEntries, setTimetableEntries] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedUser = localStorage.getItem('lms_user');
      const token = user?.token || (storedUser ? JSON.parse(storedUser).token : null);
      if (!token) {
        navigate('/auth');
        return;
      }

      // Load enrolled courses
      const coursesRes = await fetch(`${API}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setEnrolled(coursesData);
      }

      // Load assignments
      const assignmentsRes = await fetch(`${API}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData);
        setCompleted(assignmentsData.filter((a: any) => a.submitted));
      }

      // Mock performance data
      setPerformanceData([
        { week: 'W1', score: 65, target: 70 },
        { week: 'W2', score: 72, target: 75 },
        { week: 'W3', score: 78, target: 80 },
        { week: 'W4', score: 82, target: 85 },
        { week: 'W5', score: 85, target: 85 },
      ]);

      // Fetch attendance statistics
      const currentUserId = user?.id || (storedUser ? JSON.parse(storedUser).id : null);
      if (currentUserId) {
        const attendanceRes = await fetch(`${API}/attendance/student/${currentUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (attendanceRes.ok) {
          const attendanceData = await attendanceRes.json();
          if (attendanceData.success && attendanceData.analytics) {
            setAttendancePercentage(attendanceData.analytics.attendancePercentage);
            setAttendanceRisk(attendanceData.analytics.riskLevel);
          }
        }

        // Schedule fetching is handled inside <StudentTimetable /> component
        // But we need the timetable entries for the portal overview
        try {
          const ttRes = await fetch(`${API}/timetable/engine/published/student/${currentUserId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (ttRes.ok) {
            const ttData = await ttRes.json();
            setTimetableEntries(ttData.entries || []);
          } else {
            setTimetableEntries([]);
          }
        } catch (e) {
          console.error("Failed to fetch timetable for portal overview", e);
          setTimetableEntries([]);
        }
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingClass = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const currentDay = days[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Today's upcoming classes
    const todayClasses = timetableEntries
      .filter((e: any) => e.day === currentDay && !e.isFree && !e.isLunch)
      .filter((e: any) => {
        if (!e.timeSlot?.startTime) return false;
        const [h, m] = e.timeSlot.startTime.split(':').map(Number);
        return (h * 60 + m) > currentMinutes;
      })
      .sort((a: any, b: any) => {
        const [ha, ma] = a.timeSlot.startTime.split(':').map(Number);
        const [hb, mb] = b.timeSlot.startTime.split(':').map(Number);
        return (ha * 60 + ma) - (hb * 60 + mb);
      });

    if (todayClasses.length > 0) return todayClasses[0];

    // Otherwise, check subsequent days
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (now.getDay() + i) % 7;
      const nextDayName = days[nextDayIndex];
      const nextClasses = timetableEntries
        .filter((e: any) => e.day === nextDayName && !e.isFree && !e.isLunch)
        .sort((a: any, b: any) => {
          const [ha, ma] = a.timeSlot.startTime.split(':').map(Number);
          const [hb, mb] = b.timeSlot.startTime.split(':').map(Number);
          return (ha * 60 + ma) - (hb * 60 + mb);
        });
      if (nextClasses.length > 0) {
        return { ...nextClasses[0], isNextDay: true, dayName: nextDayName };
      }
    }

    return null;
  };

  if (loading) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <SpinningLoader size="lg" className="mb-4 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </PageTransition>
    );
  }

  const allAssignments = Array.isArray(assignments) ? assignments : [];
  const pendingAssignments = allAssignments.filter(a => !a.submitted);
  const completionRate = enrolled.length > 0 ? Math.round((completed.length / allAssignments.length) * 100) : 0;

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg text-white">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Welcome back, {user?.name || 'Student'}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Track your learning progress and upcoming assignments
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.1 }} className="flex gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowNotif(!showNotif)}
              >
                <Bell className="w-4 h-4" />
                Notifications
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowAI(!showAI)}
              >
                <Brain className="w-4 h-4" />
                AI Assistant
              </Button>
                        <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/attendance')}
            >
              <Calendar className="w-4 h-4" /> Attendance
              <ArrowRight className="w-4 h-4 ml-2" />
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

        {/* Tab Navigation */}
        <motion.div
          variants={animationVariants.slideInUp}
          initial="initial"
          animate="animate"
          className="flex gap-3 mb-8 border-b border-gray-200 dark:border-gray-700"
        >
          {[
            { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
            { id: 'timetable' as const, label: 'My Timetable', icon: Calendar },
            { id: 'assignments' as const, label: 'Assignments', icon: FileText },
            { id: 'courses' as const, label: 'Courses', icon: BookOpen },
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all duration-200 ${
                activeTab === id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
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
            {/* Upcoming Class Indicator */}
            {timetableEntries.length === 0 ? (
              <motion.div
                variants={animationVariants.slideInUp}
                initial="initial"
                animate="animate"
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm mb-6 text-slate-500"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-slate-400" />
                </div>
                <span className="text-sm font-medium">No timetable generated yet.</span>
              </motion.div>
            ) : getUpcomingClass() ? (
              <motion.div
                variants={animationVariants.slideInUp}
                initial="initial"
                animate="animate"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md mb-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl animate-bounce">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-white/25 px-2 py-0.5 rounded-full">
                      Next Upcoming Class
                    </span>
                    <h4 className="text-sm font-bold mt-1.5">
                      {getUpcomingClass()?.subjectName}
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5">
                      {getUpcomingClass()?.isNextDay 
                        ? `Scheduled for ${getUpcomingClass()?.dayName} at ${getUpcomingClass()?.timeSlot.startTime}`
                        : `Today at ${getUpcomingClass()?.timeSlot.startTime}`
                      } · Room {getUpcomingClass()?.roomName} · Instructor: {getUpcomingClass()?.facultyName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('timetable')}
                  className="px-4 py-2 bg-white text-indigo-700 font-bold text-xs rounded-xl shadow hover:bg-indigo-50 transition flex-shrink-0"
                >
                  View Full Timetable
                </button>
              </motion.div>
            ) : null}

            {/* Key Stats */}
            <StaggerList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <StaggerItem>
                <StatCard
                  icon={<BookOpen className="w-5 h-5" />}
                  label="Courses Enrolled"
                  value={enrolled.length}
                  gradient="from-blue-500 to-cyan-600"
                  change={{ value: 2, isPositive: true }}
                />
              </StaggerItem>

              <StaggerItem>
                <StatCard
                  icon={<CheckCircle className="w-5 h-5" />}
                  label="Completed"
                  value={completed.length}
                  gradient="from-green-500 to-emerald-600"
                  change={{ value: 3, isPositive: true }}
                />
              </StaggerItem>

              <StaggerItem>
                <StatCard
                  icon={<Clock className="w-5 h-5" />}
                  label="Pending"
                  value={pendingAssignments.length}
                  gradient="from-orange-500 to-amber-600"
                  change={{ value: 1, isPositive: false }}
                />
              </StaggerItem>

              <StaggerItem>
                <StatCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="Completion Rate"
                  value={`${completionRate}%`}
                  gradient="from-purple-500 to-indigo-600"
                  change={{ value: 5, isPositive: true }}
                />
              </StaggerItem>

              <StaggerItem>
                <div onClick={() => navigate('/attendance')} className="cursor-pointer">
                  <StatCard
                    icon={<Calendar className="w-5 h-5" />}
                    label="My Attendance"
                    value={attendancePercentage !== null ? `${attendancePercentage}%` : 'Loading...'}
                    gradient={
                      attendanceRisk === 'safe'
                        ? 'from-emerald-500 to-teal-600'
                        : attendanceRisk === 'warning'
                        ? 'from-orange-500 to-amber-600'
                        : 'from-rose-500 to-red-600'
                    }
                  />
                </div>
              </StaggerItem>
            </StaggerList>

            {/* Performance Section */}
            <motion.div
              variants={animationVariants.slideInUp}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Progress Ring */}
              <Card gradient role="student" className="flex flex-col items-center justify-center py-8">
                <ProgressRing progress={completionRate} size="md" color="blue" />
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">Overall Progress</p>
              </Card>

              {/* Learning Status */}
              <Card gradient role="student">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Learning Status
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">This Week</span>
                      <span className="text-sm font-bold text-blue-600">+8%</span>
                    </div>
                    <AnimatedProgressBar progress={75} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
                      <span className="text-sm font-bold text-green-600">+15%</span>
                    </div>
                    <AnimatedProgressBar progress={68} />
                  </div>
                </div>
              </Card>

              {/* Achievements */}
              <Card gradient role="student">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Achievements
                </h3>
                <div className="flex items-center justify-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-2xl">
                      🏆
                    </div>
                    <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">Quick Learner</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-2xl">
                      ⭐
                    </div>
                    <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">Consistent</p>
                  </motion.div>
                </div>
              </Card>
            </motion.div>

            {/* Performance Trend Chart */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Performance Trend (Last 5 weeks)
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceData}>
                  <defs>
                    <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="score" fill="url(#studentGradient)" radius={[8, 8, 0, 0]} name="Your Score" />
                  <Bar dataKey="target" fill="#d1d5db" radius={[8, 8, 0, 0]} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
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
                <p className="text-gray-600 dark:text-gray-400">No assignments available</p>
              </Card>
            ) : (
              <StaggerList className="space-y-4">
                {allAssignments.map((assignment, idx) => (
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
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {assignment.courseId?.courseName || 'Course'}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            {assignment.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="text-gray-700 dark:text-gray-300">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              <Award className="w-4 h-4 inline mr-1" />
                              {assignment.marks} Marks
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
                {enrolled.map((course, idx) => (
                  <StaggerItem key={course._id}>
                    <Card hover className="p-6 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {course.courseName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {course.courseCode}
                          </p>
                        </div>
                        <Badge variant="info" size="sm">{course.semester}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 flex-1">
                        {course.description || 'Learn and master the concepts'}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="flex-1">
                          View Materials
                        </Button>
                        <Button variant="primary" size="sm" className="flex-1">
                          Start Quiz
                        </Button>
                      </div>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </motion.div>
        )}
        {/* TIMETABLE TAB */}
        {activeTab === 'timetable' && (
          <motion.div
            variants={animationVariants.slideInUp}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            <StudentTimetable />
          </motion.div>
        )}
      </div>

      {/* AI Assistant Sidebar */}
      {showAI && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 shadow-xl z-50 border-l border-gray-200 dark:border-gray-700"
        >
          <button
            onClick={() => setShowAI(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="h-full overflow-auto p-4">
            <h2 className="text-xl font-bold mb-4 mt-4">AI Learning Assistant</h2>
            <AILearningAssistant />
          </div>
        </motion.div>
      )}
    </PageTransition>
  );
}
