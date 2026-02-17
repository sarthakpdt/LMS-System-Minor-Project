import { Shield, Users, AlertTriangle, TrendingUp, Camera, Monitor, CheckCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const quizStats = [
  { month: 'Jan', quizzes: 12, violations: 5 },
  { month: 'Feb', quizzes: 15, violations: 3 },
  { month: 'Mar', quizzes: 18, violations: 4 },
  { month: 'Apr', quizzes: 14, violations: 2 },
  { month: 'May', quizzes: 20, violations: 6 },
];

const violationTypes = [
  { name: 'Tab Switching', value: 45, color: '#ef4444' },
  { name: 'Face Not Detected', value: 12, color: '#f59e0b' },
  { name: 'Multiple Faces', value: 8, color: '#eab308' },
  { name: 'Suspicious Behavior', value: 15, color: '#f97316' },
];

const recentViolations = [
  { student: 'James Wilson', quiz: 'Physics Quiz 3', violation: 'Tab Switching (3x)', time: '10 min ago', severity: 'high' },
  { student: 'Michael Brown', quiz: 'Math Midterm', violation: 'Face Not Detected', time: '25 min ago', severity: 'medium' },
  { student: 'Ethan Taylor', quiz: 'Chemistry Test', violation: 'Multiple Faces Detected', time: '1 hour ago', severity: 'high' },
  { student: 'Noah Anderson', quiz: 'Biology Quiz', violation: 'Tab Switching (1x)', time: '2 hours ago', severity: 'low' },
];

const systemHealth = [
  { metric: 'Camera Detection Rate', value: 98.5, status: 'excellent' },
  { metric: 'Tab Monitoring Accuracy', value: 99.2, status: 'excellent' },
  { metric: 'False Positive Rate', value: 1.8, status: 'good' },
  { metric: 'System Uptime', value: 99.9, status: 'excellent' },
];

export function AdminQuizDashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Quiz System Administration</h2>
        <p className="text-gray-600">Monitor quiz integrity, track violations, and manage anti-cheating systems.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">Active</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Total Quizzes</p>
          <p className="text-3xl font-bold">187</p>
          <p className="text-xs opacity-75 mt-2">This semester</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">+12%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Quiz Attempts</p>
          <p className="text-3xl font-bold">12,458</p>
          <p className="text-xs opacity-75 mt-2">Total attempts</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">-15%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Violations Detected</p>
          <p className="text-3xl font-bold">80</p>
          <p className="text-xs opacity-75 mt-2">Down from last month</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">Healthy</span>
          </div>
          <p className="text-sm opacity-90 mb-1">System Integrity</p>
          <p className="text-3xl font-bold">99.2%</p>
          <p className="text-xs opacity-75 mt-2">Detection accuracy</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Quiz Activity Trend */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Activity & Violations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={quizStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="quizzes" stroke="#8b5cf6" strokeWidth={3} name="Quizzes Conducted" />
              <Line type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={3} name="Violations Detected" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Violation Types Distribution */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Violation Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={violationTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {violationTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Health Metrics */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Anti-Cheating System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {systemHealth.map((item, index) => (
            <div key={index} className="text-center">
              <p className="text-sm text-gray-600 mb-2">{item.metric}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{item.value}%</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                item.status === 'excellent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {item.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Violations */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Violations</h3>
          <button className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700">
            View All
          </button>
        </div>
        <div className="divide-y divide-gray-200">
          {recentViolations.map((violation, index) => (
            <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    violation.severity === 'high' ? 'bg-red-100' :
                    violation.severity === 'medium' ? 'bg-yellow-100' :
                    'bg-orange-100'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                      violation.severity === 'high' ? 'text-red-600' :
                      violation.severity === 'medium' ? 'text-yellow-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{violation.student}</p>
                    <p className="text-sm text-gray-600">{violation.quiz}</p>
                    <p className="text-sm text-gray-900 mt-1">{violation.violation}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{violation.time}</p>
                  <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                    violation.severity === 'high' ? 'bg-red-100 text-red-700' :
                    violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {violation.severity.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
