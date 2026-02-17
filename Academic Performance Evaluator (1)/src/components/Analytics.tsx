import { TrendingUp, Users, Award, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Area, AreaChart } from 'recharts';

const performanceBySubject = [
  { subject: 'Math', avgScore: 82, highScore: 98, lowScore: 65, students: 156 },
  { subject: 'Physics', avgScore: 76, highScore: 95, lowScore: 58, students: 124 },
  { subject: 'Chemistry', avgScore: 84, highScore: 99, lowScore: 71, students: 98 },
  { subject: 'English', avgScore: 88, highScore: 97, lowScore: 74, students: 187 },
  { subject: 'CS', avgScore: 79, highScore: 100, lowScore: 62, students: 201 },
  { subject: 'Biology', avgScore: 81, highScore: 96, lowScore: 68, students: 143 },
];

const attendanceTrend = [
  { week: 'Week 1', attendance: 94, engagement: 88 },
  { week: 'Week 2', attendance: 92, engagement: 86 },
  { week: 'Week 3', attendance: 90, engagement: 84 },
  { week: 'Week 4', attendance: 93, engagement: 89 },
  { week: 'Week 5', attendance: 95, engagement: 92 },
  { week: 'Week 6', attendance: 91, engagement: 87 },
];

const skillsAnalysis = [
  { skill: 'Problem Solving', score: 85 },
  { skill: 'Critical Thinking', score: 78 },
  { skill: 'Collaboration', score: 92 },
  { skill: 'Communication', score: 88 },
  { skill: 'Creativity', score: 75 },
  { skill: 'Research', score: 82 },
];

const completionRates = [
  { month: 'Jan', completed: 85, inProgress: 15 },
  { month: 'Feb', completed: 88, inProgress: 12 },
  { month: 'Mar', completed: 82, inProgress: 18 },
  { month: 'Apr', completed: 90, inProgress: 10 },
  { month: 'May', completed: 92, inProgress: 8 },
  { month: 'Jun', completed: 89, inProgress: 11 },
];

export function Analytics() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Analytics</h2>
        <p className="text-gray-600">Comprehensive insights and data visualization for academic performance.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">+5.2%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Total Enrollment</p>
          <p className="text-3xl font-bold">1,234</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">+3.1%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Avg Performance</p>
          <p className="text-3xl font-bold">82.5%</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">+8.4%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">High Achievers</p>
          <p className="text-3xl font-bold">287</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">+2.7%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Completion Rate</p>
          <p className="text-3xl font-bold">89.2%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance by Subject */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Subject</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceBySubject}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="subject" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgScore" fill="#3b82f6" name="Average Score" radius={[8, 8, 0, 0]} />
              <Bar dataKey="highScore" fill="#10b981" name="High Score" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance & Engagement Trend */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance & Engagement Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="attendance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Attendance %" />
              <Area type="monotone" dataKey="engagement" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Engagement %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Analysis Radar */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Analysis</h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={skillsAnalysis}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="skill" stroke="#6b7280" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
              <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Rates */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Completion Rates</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={completionRates}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} name="Completed %" />
              <Line type="monotone" dataKey="inProgress" stroke="#f59e0b" strokeWidth={3} name="In Progress %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
