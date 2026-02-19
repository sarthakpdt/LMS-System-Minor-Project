import { BookOpen, TrendingUp, TrendingDown, Award, AlertCircle, CheckCircle, Clock, Target, Lightbulb } from 'lucide-react';
import { LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const studentProfile = {
  name: 'Emma Thompson',
  id: 'ST2024-001',
  email: 'emma.t@school.edu',
  program: 'Computer Science',
  semester: 'Spring 2026',
  gpa: 3.78,
  rank: '12 / 201'
};

const enrolledCourses = [
  { name: 'Mathematics 101', progress: 68, grade: 87.5, instructor: 'Dr. Sarah Johnson', credits: 4, attendance: 94 },
  { name: 'Physics 202', progress: 52, grade: 72.3, instructor: 'Prof. Michael Chen', credits: 4, attendance: 78 },
  { name: 'Computer Science 101', progress: 61, grade: 91.2, instructor: 'Dr. David Lee', credits: 3, attendance: 96 },
  { name: 'English Literature', progress: 78, grade: 84.9, instructor: 'Prof. James Wilson', credits: 3, attendance: 91 },
];

const performanceTrend = [
  { month: 'Jan', score: 82 },
  { month: 'Feb', score: 85 },
  { month: 'Mar', score: 83 },
  { month: 'Apr', score: 87 },
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
  { 
    icon: Lightbulb, 
    title: 'Focus on Physics Mechanics', 
    description: 'Your scores in mechanics are below average. Watch additional video lectures.',
    priority: 'high',
    color: 'bg-red-100 text-red-600'
  },
  { 
    icon: BookOpen, 
    title: 'Practice More Integration Problems', 
    description: 'Complete extra problem sets to improve your integration skills.',
    priority: 'medium',
    color: 'bg-yellow-100 text-yellow-600'
  },
  { 
    icon: Target, 
    title: 'Maintain Programming Excellence', 
    description: 'You\'re excelling in CS! Keep up the great work.',
    priority: 'low',
    color: 'bg-green-100 text-green-600'
  },
];

const upcomingAssignments = [
  { title: 'Physics Lab Report', course: 'Physics 202', dueDate: '2026-02-03', status: 'pending' },
  { title: 'Calculus Problem Set 3', course: 'Mathematics 101', dueDate: '2026-02-05', status: 'pending' },
  { title: 'Python Programming Project', course: 'Computer Science 101', dueDate: '2026-02-10', status: 'in-progress' },
];

export function StudentPortal() {
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
              <span className="text-2xl font-bold">ET</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">{studentProfile.name}</h3>
              <p className="text-sm opacity-90">{studentProfile.id} • {studentProfile.email}</p>
              <p className="text-sm opacity-75">{studentProfile.program} • {studentProfile.semester}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <p className="text-sm opacity-75">Current GPA</p>
              <p className="text-3xl font-bold">{studentProfile.gpa}</p>
            </div>
            <p className="text-xs opacity-75">Rank: {studentProfile.rank}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 pt-6 border-t border-white/20">
          <div>
            <p className="text-sm opacity-75 mb-1">Enrolled Courses</p>
            <p className="text-2xl font-bold">{enrolledCourses.length}</p>
          </div>
          <div>
            <p className="text-sm opacity-75 mb-1">Avg Score</p>
            <p className="text-2xl font-bold">84.0%</p>
          </div>
          <div>
            <p className="text-sm opacity-75 mb-1">Attendance</p>
            <p className="text-2xl font-bold">89.8%</p>
          </div>
          <div>
            <p className="text-sm opacity-75 mb-1">Credits</p>
            <p className="text-2xl font-bold">14</p>
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

        {/* Upcoming Assignments */}
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
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    assignment.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {assignment.status === 'pending' ? 'Not Started' : 'In Progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Personalized Recommendations */}
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
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Weak Areas & Improvement */}
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
                      <div
                        className={`h-full rounded-full ${
                          area.currentScore >= 75 ? 'bg-green-500' : area.currentScore >= 65 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${area.currentScore}%` }}
                      />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrolledCourses.map((course, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{course.name}</h4>
                  <p className="text-sm text-gray-600">{course.instructor}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  course.grade >= 90 ? 'bg-green-100 text-green-700' :
                  course.grade >= 80 ? 'bg-blue-100 text-blue-700' :
                  course.grade >= 70 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {course.grade >= 90 ? 'A' : course.grade >= 80 ? 'B' : course.grade >= 70 ? 'C' : 'D'}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Grade</p>
                  <p className="text-sm font-medium text-gray-900">{course.grade}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Credits</p>
                  <p className="text-sm font-medium text-gray-900">{course.credits}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Attendance</p>
                  <p className="text-sm font-medium text-gray-900">{course.attendance}%</p>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Course Progress</span>
                  <span className="font-medium text-gray-900">{course.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
