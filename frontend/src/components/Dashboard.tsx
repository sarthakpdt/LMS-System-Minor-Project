import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, BookOpen, FileText, TrendingUp, Award, Target,
  ArrowUp, AlertCircle, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import StudyMaterials from './teacher/StudyMaterials';
import AttendanceManager from '../components/teacher/AttendanceManager';
import NotificationsPanel from '../components/teacher/NotificationsPanel';
import StudentMaterials from '../components/student/StudentMaterials';
import StudentAttendance from '../components/student/StudentAttendance';
import Analytics from '../components/admin/Analytics';
import TimetableManager from '../components/admin/TimetableManager';

const BASE = 'http://localhost:5000/api/admin';

const DEPT_LABELS: Record<string, string> = {
  CS: 'Computer Science', IT: 'Information Technology',
  ECE: 'Electronics & Communication', EE: 'Electrical Engineering',
  ME: 'Mechanical Engineering', CE: 'Civil Engineering',
  CH: 'Chemical Engineering', BT: 'Biotechnology',
  MBA: 'MBA', MCA: 'MCA',
};

/* ─────────────────────────── STUDENT DASHBOARD ─────────────────────────── */
function StudentDashboard() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const res = await fetch(`${BASE}/students/${user.id}`);
        if (res.ok) {
          const json = await res.json();
          setEnrolledCourses(json.data?.enrolledCourses || []);
        }
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [user]);

  const tabs = [
    { id: 'home', label: '🏠 Home' },
    { id: 'materials', label: '📚 Materials' },
    { id: 'attendance', label: '📋 Attendance' },
    { id: 'notifications', label: '🔔 Notifications' },
  ];

  return (
    <div className="p-8">
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Enrolled Courses', value: enrolledCourses.length, icon: BookOpen, color: 'bg-blue-500' },
              { label: 'Assignments Due', value: '—', icon: FileText, color: 'bg-purple-500' },
              { label: 'Avg. Score', value: '—', icon: TrendingUp, color: 'bg-green-500' },
              { label: 'Level', value: 'Beginner', icon: Award, color: 'bg-orange-500' },
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
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" /> My Enrolled Courses
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading your courses...
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No courses enrolled yet</p>
                <p className="text-sm text-gray-400 mt-1">Your admin will enroll you based on your department and semester.</p>
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
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{DEPT_LABELS[c.department] || c.department}</span>
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">Sem {c.semester}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <strong>Coming soon:</strong> Quiz scores, assignments, and performance trends will appear here.
          </div>
        </>
      )}

      {activeTab === 'materials' && <StudentMaterials />}
       {activeTab === 'attendance' && <StudentAttendance studentId={user?.id} />}
      {/* Students get NotificationsPanel in read-only mode (no canCreate role) */}
       {activeTab === 'notifications' && <NotificationsPanel userId={user?.id} role="student" userName={user?.name} />}
    </div>
  );
}

/* ─────────────────────────── TEACHER DASHBOARD ─────────────────────────── */
function TeacherDashboard() {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [courseStudents, setCourseStudents] = useState<Record<string, any[]>>({});
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [loadingStudents, setLoadingStudents] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${BASE}/courses`);
        const json = await res.json();
        const all: any[] = json.data || [];
        const myIds = new Set((user?.assignedCourses || []).map((c: any) => String(c.courseId)));
        const mine = all.filter(
          (c: any) => myIds.has(String(c._id)) || String(c.teacher?._id || c.teacher) === String(user?.id)
        );
        setMyCourses(mine);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [user]);

  const toggleStudents = async (courseId: string) => {
    if (expandedCourse === courseId) { setExpandedCourse(null); return; }
    setExpandedCourse(courseId);
    if (courseStudents[courseId]) return;
    setLoadingStudents(courseId);
    try {
      const res = await fetch(`${BASE}/courses/${courseId}/students`);
      const json = await res.json();
      setCourseStudents(prev => ({ ...prev, [courseId]: json.data || [] }));
    } catch {}
    finally { setLoadingStudents(null); }
  };

  const tabs = [
    { id: 'home', label: '🏠 Home' },
    { id: 'materials', label: '📚 Materials' },
    { id: 'attendance', label: '📋 Attendance' },
    { id: 'notifications', label: '🔔 Notifications' },
  ];

  return (
    <div className="p-8">
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white border border-b-white border-gray-200 text-emerald-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'home' && (
        <>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white mb-8 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}!</h2>
                <p className="text-emerald-100 text-sm">
                  {DEPT_LABELS[user?.department || ''] || user?.department}
                  {user?.specialization ? ` · ${user.specialization}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{myCourses.length}</p>
                <p className="text-emerald-200 text-sm">My Courses</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'My Courses', value: myCourses.length, icon: BookOpen, color: 'bg-emerald-500' },
              { label: 'Department', value: user?.department || '—', icon: Users, color: 'bg-blue-500' },
              { label: 'Specialization', value: user?.specialization || '—', icon: Award, color: 'bg-purple-500' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xl font-bold text-gray-900 mb-0.5 truncate">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" /> My Courses & Enrolled Students
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">Click a course to view enrolled students</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading courses...
              </div>
            ) : myCourses.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No courses assigned yet</p>
                <p className="text-sm text-gray-400 mt-1">Admin will assign courses to you.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {myCourses.map(course => {
                  const students = courseStudents[course._id] || [];
                  const isExpanded = expandedCourse === course._id;
                  return (
                    <div key={course._id}>
                      <button onClick={() => toggleStudents(course._id)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{course.courseName}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs font-mono text-gray-500">{course.courseCode}</span>
                              <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{DEPT_LABELS[course.department] || course.department}</span>
                              <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Sem {course.semester}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{course.enrolledStudents?.length || 0}</p>
                            <p className="text-xs text-gray-400">students</p>
                          </div>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4">
                          {loadingStudents === course._id ? (
                            <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
                          ) : students.length === 0 ? (
                            <p className="text-sm text-gray-500">No students enrolled yet.</p>
                          ) : (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">{students.length} students</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {students.map((s: any) => (
                                  <div key={s._id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs font-bold text-emerald-700">{s.name?.[0]?.toUpperCase()}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                                      <p className="text-xs text-gray-500 truncate">{s.email}</p>
                                    </div>
                                    {s.level && (
                                      <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${s.level === 'Advanced' ? 'bg-green-100 text-green-700' : s.level === 'Intermediate' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{s.level}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'materials' && <StudyMaterials teacherId={user?.id} teacherName={user?.name} />}
      {activeTab === 'attendance' && <AttendanceManager teacherId={user?.id} teacherName={user?.name} />}
      {/* ✅ FIX: teachers can now also create notifications for students */}
      {activeTab === 'notifications' && <NotificationsPanel userId={user?.id} role="teacher" userName={user?.name} />}
    </div>
  );
}

/* ─────────────────────────── ADMIN DASHBOARD ─────────────────────────── */
function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    fetch(`${BASE}/dashboard-stats`)
      .then(r => r.json()).then(j => setStats(j.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const performanceData = [
    { month: 'Jan', avgScore: 72, submissions: 85 }, { month: 'Feb', avgScore: 75, submissions: 88 },
    { month: 'Mar', avgScore: 73, submissions: 82 }, { month: 'Apr', avgScore: 78, submissions: 90 },
    { month: 'May', avgScore: 80, submissions: 92 }, { month: 'Jun', avgScore: 79, submissions: 89 },
  ];
  const gradeDistribution = [
    { name: 'A', value: 285, color: '#10b981' }, { name: 'B', value: 412, color: '#3b82f6' },
    { name: 'C', value: 328, color: '#f59e0b' }, { name: 'D', value: 156, color: '#ef4444' },
    { name: 'F', value: 53, color: '#6b7280' },
  ];
  const levelProgressData = [
    { month: 'Jan', promoted: 12 }, { month: 'Feb', promoted: 18 }, { month: 'Mar', promoted: 15 },
    { month: 'Apr', promoted: 22 }, { month: 'May', promoted: 28 }, { month: 'Jun', promoted: 25 },
  ];

  const statCards = stats ? [
    { label: 'Total Students', value: stats.students?.total ?? 0, sub: `${stats.students?.approved ?? 0} approved`, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Courses', value: stats.courses?.total ?? 0, sub: 'all departments', icon: BookOpen, color: 'bg-green-500' },
    { label: 'Pending Approvals', value: (stats.students?.pending ?? 0) + (stats.teachers?.pending ?? 0), sub: 'need action', icon: AlertCircle, color: 'bg-orange-500' },
    { label: 'Total Teachers', value: stats.teachers?.total ?? 0, sub: `${stats.teachers?.approved ?? 0} approved`, icon: Award, color: 'bg-purple-500' },
  ] : [];

  const tiers = stats ? [
    { tier: 'Top Performers', count: Math.round((stats.students?.approved || 0) * 0.23), percentage: 23, level: 'Advanced' },
    { tier: 'Average Performers', count: Math.round((stats.students?.approved || 0) * 0.60), percentage: 60, level: 'Intermediate' },
    { tier: 'Needs Attention', count: Math.round((stats.students?.approved || 0) * 0.17), percentage: 17, level: 'Beginner' },
  ] : [];

  // ✅ FIX: Added Timetable tab for admin
  const tabs = [
    { id: 'home', label: '🏠 Home' },
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'timetable', label: '🗓️ Timetable' },
    { id: 'notifications', label: '🔔 Notifications' },
  ];

  return (
    <div className="p-8">
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white border border-b-white border-gray-200 text-blue-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'home' && (
        <>
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">Dashboard</h2>
            <p className="text-gray-600">Overview of your academic management system.</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading stats...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((s, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <div className={`w-12 h-12 ${s.color} rounded-lg flex items-center justify-center mb-4`}><s.icon className="w-6 h-6 text-white" /></div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{s.value}</h3>
                    <p className="text-sm text-gray-600 font-medium">{s.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>

              {tiers.length > 0 && (
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 mb-6 text-white shadow-lg">
                  <h3 className="text-xl font-bold mb-4">Student Performance Distribution</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tiers.map((tier, i) => (
                      <div key={i} className="bg-white/10 rounded-lg p-4 border border-white/20">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm">{tier.tier}</h4>
                          <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">{tier.level}</span>
                        </div>
                        <div className="flex items-end justify-between">
                          <div><p className="text-3xl font-bold">{tier.count}</p><p className="text-xs opacity-75">students</p></div>
                          <div className="text-right"><p className="text-2xl font-bold">{tier.percentage}%</p><p className="text-xs opacity-75">of total</p></div>
                        </div>
                        <div className="w-full h-2 bg-white/20 rounded-full mt-3">
                          <div className="h-full bg-white/60 rounded-full" style={{ width: `${tier.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" /><YAxis stroke="#6b7280" />
                      <Tooltip /><Legend />
                      <Line type="monotone" dataKey="avgScore" stroke="#3b82f6" strokeWidth={2} name="Avg Score (%)" />
                      <Line type="monotone" dataKey="submissions" stroke="#10b981" strokeWidth={2} name="Submissions (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4"><ArrowUp className="w-5 h-5 text-green-500" /><h3 className="text-lg font-semibold text-gray-900">Level Promotions</h3></div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={levelProgressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" /><YAxis stroke="#6b7280" />
                      <Tooltip /><Bar dataKey="promoted" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={gradeDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {gradeDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie><Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-blue-500" /> Quick Summary</h3>
                  {stats && (
                    <div className="space-y-3">
                      {[
                        { label: 'Students pending approval', value: stats.students?.pending, color: 'bg-orange-100 text-orange-800', note: 'Review in Student Approvals' },
                        { label: 'Teachers pending approval', value: stats.teachers?.pending, color: 'bg-yellow-100 text-yellow-800', note: 'Review in Teacher Approvals' },
                        { label: 'Students approved', value: stats.students?.approved, color: 'bg-green-100 text-green-800', note: 'View in Students section' },
                        { label: 'Total active courses', value: stats.courses?.total, color: 'bg-blue-100 text-blue-800', note: 'Manage in Courses section' },
                      ].map((item, i) => (
                        <div key={i} className={`flex items-center justify-between rounded-lg px-4 py-3 ${item.color}`}>
                          <div><p className="font-medium text-sm">{item.label}</p><p className="text-xs opacity-70">{item.note}</p></div>
                          <span className="text-2xl font-bold">{item.value ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'analytics' && <Analytics />}
      {/* ✅ FIX: Admin now has Timetable tab */}
      {activeTab === 'timetable' && <TimetableManager />}
      {/* ✅ FIX: Admin notification panel with isAdmin flag for delete ability */}
      {activeTab === 'notifications' && <NotificationsPanel userId={user?.id} role="admin" userName={user?.name} isAdmin />}

    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'student') return <StudentDashboard />;
  if (user?.role === 'teacher') return <TeacherDashboard />;
  return <AdminDashboard />;
}