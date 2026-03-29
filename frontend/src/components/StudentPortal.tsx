import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { BookOpen, Award, AlertCircle, Clock, Target, Lightbulb } from 'lucide-react';
import { LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BASE = 'http://localhost:5000/api/admin';

const performanceTrend = [
  { month: 'Jan', score: 82 }, { month: 'Feb', score: 85 },
  { month: 'Mar', score: 83 }, { month: 'Apr', score: 87 },
  { month: 'May', score: 89 },
];

const skillsRadar = [
  { skill: 'Problem Solving', current: 88, target: 95 },
  { skill: 'Critical Thinking', current: 75, target: 85 },
  { skill: 'Programming', current: 92, target: 95 },
  { skill: 'Communication', current: 80, target: 90 },
  { skill: 'Collaboration', current: 85, target: 90 },
];

const weakAreas = [
  { subject: 'Physics - Mechanics', currentScore: 68, targetScore: 80, improvement: '+5%' },
  { subject: 'Math - Integration', currentScore: 72, targetScore: 85, improvement: '+3%' },
  { subject: 'English - Essay Writing', currentScore: 76, targetScore: 85, improvement: '+8%' },
];

const recommendations = [
  { icon: Lightbulb, title: 'Focus on Physics Mechanics', description: 'Your scores in mechanics are below average. Watch additional video lectures.', priority: 'high', color: 'bg-red-100 text-red-600' },
  { icon: BookOpen, title: 'Practice More Integration Problems', description: 'Complete extra problem sets to improve your integration skills.', priority: 'medium', color: 'bg-yellow-100 text-yellow-600' },
  { icon: Target, title: 'Maintain Programming Excellence', description: "You're excelling in CS! Keep up the great work.", priority: 'low', color: 'bg-green-100 text-green-600' },
];

const upcomingAssignments = [
  { title: 'Physics Lab Report', course: 'Physics 202', dueDate: '2026-02-03', status: 'pending' },
  { title: 'Calculus Problem Set 3', course: 'Mathematics 101', dueDate: '2026-02-05', status: 'pending' },
  { title: 'Python Programming Project', course: 'Computer Science 101', dueDate: '2026-02-10', status: 'in-progress' },
];

export function StudentPortal() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // ✅ FIXED: use the same working API as Courses.tsx
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!user?.id) { setLoadingCourses(false); return; }
      try {
        // Step 1: get student's enrolledCourses list (courseIds)
        const studentRes = await fetch(`${BASE}/students/${user.id}`);
        const studentJson = await studentRes.json();
        const enrolledList: any[] = studentJson.data?.enrolledCourses || [];

        if (enrolledList.length === 0) {
          setEnrolledCourses([]);
          setLoadingCourses(false);
          return;
        }

        // Step 2: get all courses with teacher populated
        const coursesRes = await fetch(`${BASE}/courses`);
        const coursesJson = await coursesRes.json();
        const allCourses: any[] = coursesJson.data || [];

        // Step 3: filter to only this student's enrolled courses
        const enrolledIds = new Set(enrolledList.map((c: any) => String(c.courseId)));
        const myCourses = allCourses
          .filter((c: any) => enrolledIds.has(String(c._id)))
          .map((c: any) => ({
            ...c,
            title: c.courseName,
            name: c.courseName,
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

  const avgScore = enrolledCourses.length > 0
    ? (enrolledCourses.reduce((sum, c) => sum + (c.grade || 0), 0) / enrolledCourses.length).toFixed(1)
    : '—';
  const avgAttendance = enrolledCourses.length > 0
    ? (enrolledCourses.reduce((sum, c) => sum + (c.attendance || 0), 0) / enrolledCourses.length).toFixed(1)
    : '—';
  const totalCredits = enrolledCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Student Portal</h2>
        <p className="text-gray-600">Personalized dashboard with performance insights and learning recommendations.</p>
      </div>

      {/* Student Profile Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-8 mb-6 text-white">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">{getInitials(user?.name)}</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">{user?.name ?? 'Student'}</h3>
              <p className="text-sm opacity-90">{user?.studentId ?? 'N/A'} • {user?.email}</p>
              <p className="text-sm opacity-75">{user?.department ?? 'Department'} • Semester {user?.semester ?? '—'}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <p className="text-sm opacity-75">Current GPA</p>
              <p className="text-3xl font-bold">—</p>
            </div>
            <p className="text-xs opacity-75">Rank: —</p>
          </div>
        </div>

        {/* ✅ enrolledCourses.length now shows correct count */}
        <div className="grid grid-cols-4 gap-4 pt-6 border-t border-white/20">
          <div>
            <p className="text-sm opacity-75 mb-1">Enrolled Courses</p>
            <p className="text-2xl font-bold">
              {loadingCourses ? '…' : enrolledCourses.length}
            </p>
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

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
          </div>
          <div className="space-y-3">
            {upcomingAssignments.map((assignment, index) => (
              <div key={index} className="pb-3 border-b border-gray-100 last:border-0">
                <p className="text-sm font-medium text-gray-900">{assignment.title}</p>
                <p className="text-xs text-gray-500 mb-1">{assignment.course}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${assignment.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {assignment.status === 'pending' ? 'Not Started' : 'In Progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Personalized Learning Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((rec, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className={`w-12 h-12 ${rec.color} rounded-lg flex items-center justify-center mb-4`}>
                <rec.icon className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{rec.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
              <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                rec.priority === 'high' ? 'bg-red-100 text-red-700' :
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
              <Radar name="Target Level" dataKey="target" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
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
            {weakAreas.map((area, index) => (
              <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
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
                      <div className={`h-full rounded-full ${area.currentScore >= 75 ? 'bg-green-500' : area.currentScore >= 65 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${area.currentScore}%` }} />
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Courses</h3>
        {loadingCourses ? (
          <p className="text-gray-500 text-sm">Loading your courses...</p>
        ) : enrolledCourses.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">You are not enrolled in any courses yet.</p>
            <p className="text-xs mt-1">Contact your admin to get enrolled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrolledCourses.map((course, index) => (
              <div key={course._id || index} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}