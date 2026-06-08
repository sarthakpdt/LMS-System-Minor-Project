import { useState } from 'react';
import { Sparkles, CheckCircle, Clock, AlertCircle, TrendingUp, FileText } from 'lucide-react';

const gradingQueue = [
  { 
    id: 1, 
    assignment: 'Calculus Problem Set 3',
    course: 'Mathematics 101',
    submissions: 142,
    graded: 142,
    pending: 0,
    avgScore: 84.5,
    status: 'completed',
    autoGraded: true,
    gradedDate: '2026-01-28'
  },
  { 
    id: 2, 
    assignment: 'Python Programming Project',
    course: 'Computer Science 101',
    submissions: 89,
    graded: 89,
    pending: 0,
    avgScore: 91.2,
    status: 'completed',
    autoGraded: true,
    gradedDate: '2026-01-27'
  },
  { 
    id: 3, 
    assignment: 'Physics Lab Report',
    course: 'Physics 202',
    submissions: 98,
    graded: 45,
    pending: 53,
    avgScore: 78.3,
    status: 'in-progress',
    autoGraded: false,
    gradedDate: null
  },
  { 
    id: 4, 
    assignment: 'Chemistry Quiz 5',
    course: 'Chemistry 301',
    submissions: 88,
    graded: 88,
    pending: 0,
    avgScore: 86.7,
    status: 'completed',
    autoGraded: true,
    gradedDate: '2026-01-26'
  },
];

const gradingRules = [
  { 
    type: 'Multiple Choice', 
    method: 'Instant Auto-Grading',
    accuracy: '100%',
    timeReduction: '95%',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-600'
  },
  { 
    type: 'Programming Code', 
    method: 'Test Case Execution',
    accuracy: '98%',
    timeReduction: '90%',
    icon: FileText,
    color: 'bg-blue-100 text-blue-600'
  },
  { 
    type: 'Math Problems', 
    method: 'Step-by-Step Analysis',
    accuracy: '95%',
    timeReduction: '85%',
    icon: Sparkles,
    color: 'bg-purple-100 text-purple-600'
  },
  { 
    type: 'Fill in Blanks', 
    method: 'Pattern Matching',
    accuracy: '92%',
    timeReduction: '88%',
    icon: CheckCircle,
    color: 'bg-yellow-100 text-yellow-600'
  },
];

export function AutoGrading() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredQueue = gradingQueue.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.status === selectedFilter;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Automated Grading System</h2>
        <p className="text-gray-600">AI-powered automated grading to reduce teacher workload and provide instant feedback.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">Auto</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Auto-Graded</p>
          <p className="text-3xl font-bold">319</p>
          <p className="text-xs opacity-75 mt-2">Submissions this week</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">90%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Time Saved</p>
          <p className="text-3xl font-bold">42 hrs</p>
          <p className="text-xs opacity-75 mt-2">Compared to manual grading</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">+15%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Avg Accuracy</p>
          <p className="text-3xl font-bold">96.3%</p>
          <p className="text-xs opacity-75 mt-2">AI grading accuracy</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">Live</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Instant Feedback</p>
          <p className="text-3xl font-bold">100%</p>
          <p className="text-xs opacity-75 mt-2">Students receive instant results</p>
        </div>
      </div>

      {/* Grading Methods */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Automated Grading Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gradingRules.map((rule, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className={`w-12 h-12 ${rule.color} rounded-lg flex items-center justify-center mb-4`}>
                <rule.icon className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{rule.type}</h4>
              <p className="text-sm text-gray-600 mb-3">{rule.method}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Accuracy:</span>
                  <span className="font-medium text-green-600">{rule.accuracy}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Time Saved:</span>
                  <span className="font-medium text-blue-600">{rule.timeReduction}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex gap-2">
            {['all', 'completed', 'in-progress'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grading Queue */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Grading Queue</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredQueue.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{item.assignment}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.course}</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">{item.submissions}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-full max-w-[120px] h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${(item.graded / item.submissions) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {item.graded}/{item.submissions}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.avgScore > 0 ? (
                      <span className="text-sm font-medium text-gray-900">{item.avgScore}%</span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {item.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.autoGraded ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        <Sparkles className="w-3 h-3" />
                        Auto-Graded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        Manual Review
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
