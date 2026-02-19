import { Award, Target, TrendingUp, ArrowUp, CheckCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { PromotionCriteria } from './PromotionCriteria';

const levelCriteria = [
  {
    level: 'Beginner',
    range: '0-65%',
    color: 'from-orange-400 to-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    description: 'Foundation building phase',
    features: ['Basic concepts', 'Simple quizzes', 'Extra support materials', 'Frequent feedback']
  },
  {
    level: 'Intermediate',
    range: '66-81%',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    description: 'Skill development phase',
    features: ['Moderate difficulty', 'Mixed question types', 'Self-paced learning', 'Peer collaboration']
  },
  {
    level: 'Advanced',
    range: '82-100%',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    description: 'Mastery and excellence',
    features: ['Complex problems', 'Critical thinking', 'Leadership opportunities', 'Advanced projects']
  },
];

const studentsNearPromotion = [
  { 
    name: 'Emma Thompson', 
    currentLevel: 'Intermediate',
    currentScore: 79.2,
    targetScore: 82,
    gap: 2.8,
    improvement: '+5.2%',
    avatar: 'ET',
    weakAreas: ['Physics - Mechanics', 'Math - Calculus'],
    strengths: ['Programming', 'Chemistry'],
    recommendedActions: ['Complete 3 practice quizzes', 'Review mechanics module', 'Attend tutoring session'],
    consecutiveAboveThreshold: 2,
    lastQuizScores: [79, 83, 84]
  },
  { 
    name: 'Michael Chen', 
    currentLevel: 'Intermediate',
    currentScore: 80.5,
    targetScore: 82,
    gap: 1.5,
    improvement: '+6.8%',
    avatar: 'MC',
    weakAreas: ['English - Essays', 'History'],
    strengths: ['Mathematics', 'Science'],
    recommendedActions: ['Submit 2 essay assignments', 'Practice writing skills'],
    consecutiveAboveThreshold: 2,
    lastQuizScores: [80, 83, 85]
  },
  { 
    name: 'James Wilson', 
    currentLevel: 'Beginner',
    currentScore: 63.8,
    targetScore: 66,
    gap: 2.2,
    improvement: '+8.1%',
    avatar: 'JW',
    weakAreas: ['All subjects - struggling'],
    strengths: ['Attendance', 'Effort'],
    recommendedActions: ['1-on-1 tutoring', 'Beginner level quizzes', 'Foundation review'],
    consecutiveAboveThreshold: 1,
    lastQuizScores: [60, 65, 67]
  },
];

const improvementTrends = [
  { month: 'Jan', beginner: 65, intermediate: 74, advanced: 88 },
  { month: 'Feb', beginner: 66, intermediate: 76, advanced: 89 },
  { month: 'Mar', beginner: 64, intermediate: 75, advanced: 90 },
  { month: 'Apr', beginner: 67, intermediate: 77, advanced: 91 },
  { month: 'May', beginner: 68, intermediate: 79, advanced: 92 },
  { month: 'Jun', beginner: 69, intermediate: 80, advanced: 93 },
];

const skillGapAnalysis = [
  { subject: 'Mathematics', beginner: 55, intermediate: 72, advanced: 91, target: 85 },
  { subject: 'Physics', beginner: 52, intermediate: 70, advanced: 89, target: 85 },
  { subject: 'Chemistry', beginner: 58, intermediate: 75, advanced: 92, target: 85 },
  { subject: 'English', beginner: 60, intermediate: 76, advanced: 88, target: 85 },
  { subject: 'Programming', beginner: 48, intermediate: 68, advanced: 94, target: 85 },
];

export function PerformanceLevels() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Performance Level Management</h2>
        <p className="text-gray-600">Track student levels, automatic promotions, and create targeted improvement plans.</p>
      </div>

      {/* Promotion Criteria Section */}
      <div className="mb-8">
        <PromotionCriteria />
      </div>

      {/* Level System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {levelCriteria.map((level, index) => (
          <div key={index} className={`bg-white rounded-lg border-2 ${level.borderColor} overflow-hidden shadow-md`}>
            <div className={`bg-gradient-to-r ${level.color} p-4 text-white`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">{level.level}</h3>
                <Award className="w-8 h-8" />
              </div>
              <p className="text-sm opacity-90">{level.description}</p>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Score Range</p>
                <p className="text-2xl font-bold text-gray-900">{level.range}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                <ul className="space-y-1">
                  {level.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Improvement Trends by Level */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends by Level</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={improvementTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="beginner" stroke="#f97316" strokeWidth={3} name="Beginner Level" />
            <Line type="monotone" dataKey="intermediate" stroke="#3b82f6" strokeWidth={3} name="Intermediate Level" />
            <Line type="monotone" dataKey="advanced" stroke="#10b981" strokeWidth={3} name="Advanced Level" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Skill Gap Analysis */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Gap Analysis by Level</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={skillGapAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="subject" stroke="#6b7280" />
            <YAxis stroke="#6b7280" domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="beginner" fill="#f97316" name="Beginner" />
            <Bar dataKey="intermediate" fill="#3b82f6" name="Intermediate" />
            <Bar dataKey="advanced" fill="#10b981" name="Advanced" />
            <Bar dataKey="target" fill="#6b7280" name="Target Score" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Students Near Promotion */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Students Near Level Promotion</h3>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">Automatic System</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {studentsNearPromotion.map((student, index) => (
            <div key={index} className="bg-white rounded-lg border-2 border-blue-200 p-6 shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{student.avatar}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{student.name}</h4>
                    <p className="text-xs text-gray-600">Current: {student.currentLevel}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {student.improvement}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Current Score</p>
                  <p className="text-xl font-bold text-blue-600">{student.currentScore}%</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Target Score</p>
                  <p className="text-xl font-bold text-green-600">{student.targetScore}%</p>
                </div>
              </div>

              {/* Consecutive Quiz Tracker */}
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-purple-900">Promotion Progress</p>
                  <span className="text-xs font-bold text-purple-700">{student.consecutiveAboveThreshold}/3</span>
                </div>
                <div className="flex gap-1 mb-2">
                  {[0, 1, 2].map((idx) => (
                    <div
                      key={idx}
                      className={`flex-1 h-2 rounded-full ${
                        idx < student.consecutiveAboveThreshold ? 'bg-purple-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs">
                  {student.lastQuizScores.map((score, idx) => (
                    <span
                      key={idx}
                      className={`font-medium ${
                        score >= student.targetScore ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      Q{idx + 1}: {score}%
                    </span>
                  ))}
                </div>
                {student.consecutiveAboveThreshold === 2 && (
                  <p className="text-xs text-purple-700 mt-2 font-medium">
                    ⚡ 1 more quiz above {student.targetScore}% for automatic promotion!
                  </p>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Gap to Promotion</span>
                  <span className="font-bold text-orange-600">{student.gap}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                    style={{ width: `${(student.currentScore / student.targetScore) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mb-4 pb-4 border-b border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">Weak Areas:</p>
                <div className="flex flex-wrap gap-1">
                  {student.weakAreas.map((area, idx) => (
                    <span key={idx} className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Strengths:</p>
                <div className="flex flex-wrap gap-1">
                  {student.strengths.map((strength, idx) => (
                    <span key={idx} className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <Target className="w-4 h-4 text-yellow-700 mt-0.5" />
                  <p className="text-xs font-medium text-yellow-900">Recommended Actions:</p>
                </div>
                <ul className="space-y-1">
                  {student.recommendedActions.map((action, idx) => (
                    <li key={idx} className="text-xs text-yellow-800 flex items-start gap-1">
                      <span>•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Assign Level-Appropriate Quiz
              </button>
              
              <p className="text-xs text-center text-gray-500 mt-2 italic">
                Promotion is automatic upon meeting criteria
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Promotion History */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ArrowUp className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Level Promotions</h3>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Sophia Chen', from: 'Intermediate', to: 'Advanced', date: '2026-01-28', score: 85.5 },
            { name: 'Ryan Martinez', from: 'Beginner', to: 'Intermediate', date: '2026-01-27', score: 68.2 },
            { name: 'Olivia Davis', from: 'Intermediate', to: 'Advanced', date: '2026-01-25', score: 83.8 },
            { name: 'Daniel Garcia', from: 'Beginner', to: 'Intermediate', date: '2026-01-24', score: 67.5 },
          ].map((promotion, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <ArrowUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{promotion.name}</p>
                  <p className="text-sm text-gray-600">
                    {promotion.from} → <span className="font-semibold text-green-600">{promotion.to}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{promotion.score}%</p>
                <p className="text-xs text-gray-500">{new Date(promotion.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}