import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, BookOpen, FileText, TrendingUp, Award, Target, ArrowUp, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const BASE = 'http://localhost:5000/api/admin';

// ─── Shared grade distribution colours ───────────────────────────────────────
const gradeColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

// ─── Student Dashboard ────────────────────────────────────────────────────────
function StudentDashboard() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch fresh student profile to get enrolledCourses
        const res = await fetch(`${BASE}/students/approved`);
        const json = await res.json();
        const me = (json.data || []).find((s: any) => s._id === user?.id || s.email === user?.email);
        setEnrolledCourses(me?.enrolledCourses || []);
      } catch {/* ignore */} finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const deptLabel: Record<string, string> = {
    CS: 'Computer Science', IT: 'Information Technology', ECE: 'Electronics & Communication',
    EE: 'Electrical Engineering', ME: 'Mechanical Engineering', CE: 'Civil Engineering',
    CH: 'Chemical Engineering', BT: 'Biotechnology', MBA: 'MBA', MCA: 'MCA',
  };

  return (
    <div className="p-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-8 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
            <p className="text-indigo-100 text-sm">
              {deptLabel[user?.department || ''] || user?.department} · Semester {user?.semester}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{enrolledCourses.length}</p>
            <p className="text-indigo-200 text-sm">Enrolled Courses</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Enrolled Courses', value: enrolledCourses.length, icon: BookOpen, color: 'bg-blue-500' },
          { label: 'Assignments Due', value: '—', icon: FileText, color: 'bg-purple-500' },
          { label: 'Avg. Score', value: '—', icon: TrendingUp, color: 'bg-green-500' },
          { label: 'Level', value: user ? 'Beginner' : '—', icon: Award, color: 'bg-orange-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Enrolled Courses */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" /> My Enrolled Courses
          </h3>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-gray-400">Loading your courses...</div>
        ) : enrolledCourses.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No courses enrolled yet</p>
            <p className="text-sm text-gray-400 mt-1">Your admin will enroll you in courses based on your department and semester.</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrolledCourses.map((c: any) => (
              <div key={c.courseId} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{c.courseName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.courseCode}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {deptLabel[c.department] || c.department}
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

      {/* Placeholder for future quiz scores */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Coming soon:</strong> Quiz scores, assignment submissions, and performance trends will appear here once your teacher publishes them.
      </div>
    </div>
  );
}

// ─── Admin / Teacher Dashboard ────────────────────────────────────────────────
function AdminTeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/dashboard-stats`)
      .then(r => r.json())
      .then(j => setStats(j.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isTeacher = user?.role === 'teacher';

  const statCards = stats ? [
    { label: 'Total Students', value: stats.students?.total ?? 0, sub: `${stats.students?.approved ?? 0} approved`, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Courses', value: stats.courses?.total ?? 0, sub: 'all departments', icon: BookOpen, color: 'bg-green-500' },
    { label: 'Pending Approvals', value: (stats.students?.pending ?? 0) + (stats.teachers?.pending ?? 0), sub: 'need action', icon: AlertCircle, color: 'bg-orange-500' },
    { label: 'Total Teachers', value: stats.teachers?.total ?? 0, sub: `${stats.teachers?.approved ?? 0} approved`, icon: Award, color: 'bg-purple-500' },
  ] : [];

  // Fake trend data — replace with real API if you build that endpoint later
  const performanceData = [
    { month: 'Jan', avgScore: 72, submissions: 85 },
    { month: 'Feb', avgScore: 75, submissions: 88 },
    { month: 'Mar', avgScore: 73, submissions: 82 },
    { month: 'Apr', avgScore: 78, submissions: 90 },
    { month: 'May', avgScore: 80, submissions: 92 },
    { month: 'Jun', avgScore: 79, submissions: 89 },
  ];

  const gradeDistribution = [
    { name: 'A (90-100)', value: 285, color: '#10b981' },
    { name: 'B (80-89)',  value: 412, color: '#3b82f6' },
    { name: 'C (70-79)',  value: 328, color: '#f59e0b' },
    { name: 'D (60-69)',  value: 156, color: '#ef4444' },
    { name: 'F (<60)',    value: 53,  color: '#6b7280' },
  ];

  const levelProgressData = [
    { month: 'Jan', promoted: 12 }, { month: 'Feb', promoted: 18 },
    { month: 'Mar', promoted: 15 }, { month: 'Apr', promoted: 22 },
    { month: 'May', promoted: 28 }, { month: 'Jun', promoted: 25 },
  ];

  const performanceTiers = stats ? [
    { tier: 'Top Performers',     count: Math.round((stats.students?.approved || 0) * 0.23), percentage: 23, color: '#10b981', level: 'Advanced' },
    { tier: 'Average Performers', count: Math.round((stats.students?.approved || 0) * 0.60), percentage: 60, color: '#3b82f6', level: 'Intermediate' },
    { tier: 'Needs Attention',    count: Math.round((stats.students?.approved || 0) * 0.17), percentage: 17, color: '#f59e0b', level: 'Beginner' },
  ] : [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">
          {isTeacher
            ? `Welcome back, ${user?.name}. Here's your class overview.`
            : "Welcome back! Here's an overview of your academic performance metrics."}
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${s.color} rounded-lg flex items-center justify-center`}>
                  <s.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{s.value}</h3>
              <p className="text-sm text-gray-600 font-medium">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Performance Distribution */}
      {performanceTiers.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 mb-6 text-white shadow-lg">
          <h3 className="text-xl font-bold mb-4">Student Performance Distribution by Levels</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {performanceTiers.map((tier, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">{tier.tier}</h4>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">{tier.level}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold">{tier.count}</p>
                    <p className="text-xs opacity-75">students</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{tier.percentage}%</p>
                    <p className="text-xs opacity-75">of total</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full mt-3">
                  <div className="h-full bg-white/60 rounded-full" style={{ width: `${tier.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgScore" stroke="#3b82f6" strokeWidth={2} name="Avg Score (%)" />
              <Line type="monotone" dataKey="submissions" stroke="#10b981" strokeWidth={2} name="Submissions (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUp className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Level Promotions</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={levelProgressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="promoted" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={gradeDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {gradeDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pending approvals callout */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" /> Quick Summary
          </h3>
          {stats && (
            <div className="space-y-3">
              {[
                { label: 'Students pending approval', value: stats.students?.pending, color: 'bg-orange-100 text-orange-800', action: 'Review in Student Approvals' },
                { label: 'Teachers pending approval', value: stats.teachers?.pending, color: 'bg-yellow-100 text-yellow-800', action: 'Review in Teacher Approvals' },
                { label: 'Students approved', value: stats.students?.approved, color: 'bg-green-100 text-green-800', action: 'View in Students section' },
                { label: 'Total active courses', value: stats.courses?.total, color: 'bg-blue-100 text-blue-800', action: 'Manage in Courses section' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center justify-between rounded-lg px-4 py-3 ${item.color}`}>
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs opacity-70">{item.action}</p>
                  </div>
                  <span className="text-2xl font-bold">{item.value ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Entry Point ──────────────────────────────────────────────────────────────
export function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'student') return <StudentDashboard />;
  return <AdminTeacherDashboard />;
}