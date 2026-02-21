import { Users, BookOpen, FileText, TrendingUp, Award, AlertCircle, ArrowUp, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const statsData = [
  { label: 'Total Students', value: '1,234', change: '+12%', icon: Users, color: 'bg-blue-500' },
  { label: 'Active Courses', value: '48', change: '+3', icon: BookOpen, color: 'bg-green-500' },
  { label: 'Assignments', value: '156', change: '+8', icon: FileText, color: 'bg-purple-500' },
  { label: 'Avg. Performance', value: '78.5%', change: '+2.3%', icon: TrendingUp, color: 'bg-orange-500' },
];

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
  { name: 'B (80-89)', value: 412, color: '#3b82f6' },
  { name: 'C (70-79)', value: 328, color: '#f59e0b' },
  { name: 'D (60-69)', value: 156, color: '#ef4444' },
  { name: 'F (<60)', value: 53, color: '#6b7280' },
];

// Performance Tiers
const performanceTiers = [
  { tier: 'Top Performers', count: 285, percentage: 23, color: '#10b981', level: 'Advanced' },
  { tier: 'Average Performers', count: 740, percentage: 60, color: '#3b82f6', level: 'Intermediate' },
  { tier: 'Needs Attention', count: 209, percentage: 17, color: '#f59e0b', level: 'Beginner' },
];

const topPerformers = [
  { name: 'Sarah Johnson', score: 96.5, courses: 6, avatar: 'SJ', level: 'Advanced', improvement: '+2.5%' },
  { name: 'David Lee', score: 94.2, courses: 5, avatar: 'DL', level: 'Advanced', improvement: '+1.8%' },
  { name: 'Emily White', score: 92.8, courses: 6, avatar: 'EW', level: 'Advanced', improvement: '+3.2%' },
  { name: 'Ryan Martinez', score: 91.4, courses: 4, avatar: 'RM', level: 'Advanced', improvement: '+2.1%' },
];

const averagePerformers = [
  { name: 'Emma Thompson', score: 78.5, improvement: '+5.2%', weakArea: 'Physics', nextLevel: '82%', avatar: 'ET' },
  { name: 'Michael Chen', score: 75.3, improvement: '+3.8%', weakArea: 'Mathematics', nextLevel: '82%', avatar: 'MC' },
  { name: 'Olivia Davis', score: 79.1, improvement: '+4.5%', weakArea: 'Chemistry', nextLevel: '82%', avatar: 'OD' },
  { name: 'James Brown', score: 76.8, improvement: '+6.1%', weakArea: 'English', nextLevel: '82%', avatar: 'JB' },
];

const levelProgressData = [
  { month: 'Jan', promoted: 12 },
  { month: 'Feb', promoted: 18 },
  { month: 'Mar', promoted: 15 },
  { month: 'Apr', promoted: 22 },
  { month: 'May', promoted: 28 },
  { month: 'Jun', promoted: 25 },
];

const recentActivity = [
  { student: 'Emma Thompson', action: 'Submitted assignment', course: 'Mathematics 101', time: '5 min ago', status: 'success' },
  { student: 'James Wilson', action: 'Missed deadline', course: 'Physics 202', time: '1 hour ago', status: 'warning' },
  { student: 'Sophia Chen', action: 'Achieved top score', course: 'Chemistry 301', time: '2 hours ago', status: 'success' },
  { student: 'Michael Brown', action: 'Requested review', course: 'Biology 150', time: '3 hours ago', status: 'info' },
  { student: 'Olivia Davis', action: 'Completed course', course: 'English 101', time: '5 hours ago', status: 'success' },
];

export function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Welcome back! Here's an overview of your academic performance metrics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Performance Tiers Overview */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 mb-6 text-white shadow-lg">
        <h3 className="text-xl font-bold mb-4">Student Performance Distribution by Levels</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {performanceTiers.map((tier, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{tier.tier}</h4>
                <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium">
                  {tier.level}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">{tier.count}</p>
                  <p className="text-sm opacity-75">students</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{tier.percentage}%</p>
                  <p className="text-xs opacity-75">of total</p>
                </div>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-white/60 rounded-full"
                  style={{ width: `${tier.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Performance Trend */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
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

        {/* Level Promotions */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUp className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Level Promotions</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={levelProgressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="promoted" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>25 students</strong> promoted to next level this month
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Top Performers (Advanced Level)</h3>
          </div>
          <div className="space-y-4">
            {topPerformers.map((student, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">{student.avatar}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{student.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{student.courses} courses</span>
                    <span>•</span>
                    <span className="text-green-600 font-medium">{student.improvement}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{student.score}%</p>
                  <span className="inline-block px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                    {student.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Average Performers - Improvement Focus */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Average Performers - Growth Tracking</h3>
          </div>
          <div className="space-y-4">
            {averagePerformers.map((student, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">{student.avatar}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-600">Score: {student.score}%</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                    {student.improvement}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="text-gray-600">Weak Area:</p>
                    <p className="font-medium text-red-600">{student.weakArea}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">Next Level at:</p>
                    <p className="font-medium text-blue-600">{student.nextLevel}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Progress to Promotion</span>
                    <span className="font-medium text-gray-900">{((student.score / 82) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${(student.score / 82) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={gradeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.status === 'success' ? 'bg-green-100' :
                  activity.status === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.student}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">{activity.course} • {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}