import { useState } from 'react';
import { Search, Filter, Download, Mail, MoreVertical, TrendingUp, TrendingDown, Award, Target } from 'lucide-react';

const studentsData = [
  // Advanced Level Students (82-100%)
  { id: 1, name: 'Sarah Johnson', email: 'sarah.j@school.edu', avatar: 'SJ', enrolled: 6, avgScore: 96.5, attendance: 97, status: 'Excellent', trend: 'up', level: 'Advanced', consecutiveAboveThreshold: 5, lastQuizzes: [94, 96, 97, 95, 98] },
  { id: 2, name: 'David Lee', email: 'david.l@school.edu', avatar: 'DL', enrolled: 5, avgScore: 94.2, attendance: 96, status: 'Excellent', trend: 'up', level: 'Advanced', consecutiveAboveThreshold: 6, lastQuizzes: [92, 94, 95, 93, 96] },
  { id: 3, name: 'Emily White', email: 'emily.w@school.edu', avatar: 'EW', enrolled: 6, avgScore: 92.8, attendance: 95, status: 'Excellent', trend: 'up', level: 'Advanced', consecutiveAboveThreshold: 4, lastQuizzes: [90, 92, 94, 93, 92] },
  { id: 4, name: 'Sophia Chen', email: 'sophia.c@school.edu', avatar: 'SC', enrolled: 7, avgScore: 91.2, attendance: 96, status: 'Excellent', trend: 'up', level: 'Advanced', consecutiveAboveThreshold: 7, lastQuizzes: [89, 91, 92, 90, 93] },
  { id: 5, name: 'Ryan Martinez', email: 'ryan.m@school.edu', avatar: 'RM', enrolled: 4, avgScore: 88.4, attendance: 94, status: 'Excellent', trend: 'up', level: 'Advanced', consecutiveAboveThreshold: 3, lastQuizzes: [86, 88, 90, 87, 89] },

  // Intermediate Level Students (66-81%)
  { id: 6, name: 'Emma Thompson', email: 'emma.t@school.edu', avatar: 'ET', enrolled: 6, avgScore: 79.5, attendance: 94, status: 'Good', trend: 'up', level: 'Intermediate', consecutiveAboveThreshold: 2, lastQuizzes: [75, 78, 80, 82, 81] },
  { id: 7, name: 'Michael Chen', email: 'michael.c@school.edu', avatar: 'MC', enrolled: 5, avgScore: 77.3, attendance: 88, status: 'Good', trend: 'up', level: 'Intermediate', consecutiveAboveThreshold: 2, lastQuizzes: [74, 76, 78, 79, 77] },
  { id: 8, name: 'Olivia Davis', email: 'olivia.d@school.edu', avatar: 'OD', enrolled: 6, avgScore: 76.9, attendance: 91, status: 'Good', trend: 'up', level: 'Intermediate', consecutiveAboveThreshold: 1, lastQuizzes: [72, 75, 77, 79, 80] },
  { id: 9, name: 'Daniel Garcia', email: 'daniel.g@school.edu', avatar: 'DG', enrolled: 5, avgScore: 74.4, attendance: 88, status: 'Good', trend: 'up', level: 'Intermediate', consecutiveAboveThreshold: 0, lastQuizzes: [70, 73, 75, 76, 72] },
  { id: 10, name: 'Ava Martinez', email: 'ava.m@school.edu', avatar: 'AM', enrolled: 6, avgScore: 72.6, attendance: 85, status: 'Good', trend: 'down', level: 'Intermediate', consecutiveAboveThreshold: 0, lastQuizzes: [75, 74, 72, 70, 71] },
  { id: 11, name: 'Ethan Taylor', email: 'ethan.t@school.edu', avatar: 'ET', enrolled: 4, avgScore: 70.1, attendance: 85, status: 'Good', trend: 'up', level: 'Intermediate', consecutiveAboveThreshold: 1, lastQuizzes: [68, 69, 71, 72, 70] },
  { id: 12, name: 'Noah Anderson', email: 'noah.a@school.edu', avatar: 'NA', enrolled: 5, avgScore: 68.3, attendance: 89, status: 'Good', trend: 'up', level: 'Intermediate', consecutiveAboveThreshold: 0, lastQuizzes: [65, 67, 69, 70, 68] },

  // Beginner Level Students (0-65%)
  { id: 13, name: 'James Wilson', email: 'james.w@school.edu', avatar: 'JW', enrolled: 5, avgScore: 62.3, attendance: 78, status: 'Needs Attention', trend: 'up', level: 'Beginner', consecutiveAboveThreshold: 1, lastQuizzes: [58, 60, 63, 65, 64] },
  { id: 14, name: 'Michael Brown', email: 'michael.b@school.edu', avatar: 'MB', enrolled: 4, avgScore: 58.7, attendance: 82, status: 'Needs Attention', trend: 'up', level: 'Beginner', consecutiveAboveThreshold: 2, lastQuizzes: [55, 57, 60, 62, 59] },
  { id: 15, name: 'Isabella Lee', email: 'isabella.l@school.edu', avatar: 'IL', enrolled: 7, avgScore: 55.8, attendance: 75, status: 'Needs Attention', trend: 'down', level: 'Beginner', consecutiveAboveThreshold: 0, lastQuizzes: [58, 56, 54, 55, 53] },
  { id: 16, name: 'Liam Harris', email: 'liam.h@school.edu', avatar: 'LH', enrolled: 5, avgScore: 52.4, attendance: 70, status: 'Needs Attention', trend: 'down', level: 'Beginner', consecutiveAboveThreshold: 0, lastQuizzes: [55, 53, 51, 50, 52] },
  { id: 17, name: 'Mia Johnson', email: 'mia.j@school.edu', avatar: 'MJ', enrolled: 4, avgScore: 48.9, attendance: 68, status: 'Critical', trend: 'down', level: 'Beginner', consecutiveAboveThreshold: 0, lastQuizzes: [50, 49, 48, 47, 49] },
];

// Promotion thresholds
const promotionCriteria = {
  beginner: {
    threshold: 66,
    consecutiveRequired: 3,
    promoteTo: 'Intermediate'
  },
  intermediate: {
    threshold: 82,
    consecutiveRequired: 3,
    promoteTo: 'Advanced'
  }
};

export function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  const filteredStudents = studentsData.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterLevel === 'all' || student.level === filterLevel;
    return matchesSearch && matchesFilter;
  });

  const levelCounts = {
    Advanced: studentsData.filter(s => s.level === 'Advanced').length,
    Intermediate: studentsData.filter(s => s.level === 'Intermediate').length,
    Beginner: studentsData.filter(s => s.level === 'Beginner').length,
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Advanced': return 'bg-green-100 text-green-700 border-green-200';
      case 'Intermediate': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Beginner': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPromotionStatus = (student: typeof studentsData[0]) => {
    if (student.level === 'Advanced') return null;
    
    const criteria = student.level === 'Beginner' ? promotionCriteria.beginner : promotionCriteria.intermediate;
    const progress = (student.consecutiveAboveThreshold / criteria.consecutiveRequired) * 100;
    
    return {
      threshold: criteria.threshold,
      required: criteria.consecutiveRequired,
      current: student.consecutiveAboveThreshold,
      progress: progress,
      nextLevel: criteria.promoteTo,
    };
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Students by Performance Level</h2>
        <p className="text-gray-600">Automatic level assignment and promotion based on consistent performance.</p>
      </div>

      {/* Level Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">82-100%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Advanced Level</p>
          <p className="text-4xl font-bold">{levelCounts.Advanced}</p>
          <p className="text-xs opacity-75 mt-2">{((levelCounts.Advanced / studentsData.length) * 100).toFixed(0)}% of total students</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Target className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">66-81%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Intermediate Level</p>
          <p className="text-4xl font-bold">{levelCounts.Intermediate}</p>
          <p className="text-xs opacity-75 mt-2">{((levelCounts.Intermediate / studentsData.length) * 100).toFixed(0)}% of total students</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">0-65%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Beginner Level</p>
          <p className="text-4xl font-bold">{levelCounts.Beginner}</p>
          <p className="text-xs opacity-75 mt-2">{((levelCounts.Beginner / studentsData.length) * 100).toFixed(0)}% of total students</p>
        </div>
      </div>

      {/* Promotion Rules Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-3">Automatic Promotion Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-blue-200 rounded flex items-center justify-center mt-0.5 flex-shrink-0">
              <span className="text-xs font-bold">1</span>
            </div>
            <div>
              <p className="font-medium">Beginner → Intermediate:</p>
              <p>Score ≥ 66% in <strong>3 consecutive quizzes</strong></p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-blue-200 rounded flex items-center justify-center mt-0.5 flex-shrink-0">
              <span className="text-xs font-bold">2</span>
            </div>
            <div>
              <p className="font-medium">Intermediate → Advanced:</p>
              <p>Score ≥ 82% in <strong>3 consecutive quizzes</strong></p>
            </div>
          </div>
        </div>
        <p className="text-xs text-blue-700 mt-3 italic">
          ⚠️ Promotion is automatic and cannot be manually overridden by teachers or admins. Students must meet the consistency requirements.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="Advanced">Advanced</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Beginner">Beginner</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last 5 Quizzes</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Promotion Progress</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                const promotionStatus = getPromotionStatus(student);
                return (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">{student.avatar}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getLevelColor(student.level)}`}>
                        {student.level === 'Advanced' && <Award className="w-3 h-3" />}
                        {student.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{student.avgScore}%</span>
                        {student.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {student.lastQuizzes.map((score, idx) => (
                          <div
                            key={idx}
                            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                              promotionStatus && score >= promotionStatus.threshold
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}
                            title={`Quiz ${idx + 1}: ${score}%`}
                          >
                            {score}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {promotionStatus ? (
                        <div className="max-w-xs mx-auto">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">To {promotionStatus.nextLevel}</span>
                            <span className="font-medium text-gray-900">
                              {promotionStatus.current}/{promotionStatus.required} quizzes
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                promotionStatus.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(promotionStatus.progress, 100)}%` }}
                            />
                          </div>
                          {promotionStatus.progress >= 100 && (
                            <p className="text-xs text-green-600 font-medium mt-1 text-center">
                              ✓ Ready for promotion!
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1 text-center">
                            Need ≥{promotionStatus.threshold}% consistently
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Highest Level</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                        student.status === 'Good' ? 'bg-blue-100 text-blue-800' :
                        student.status === 'Needs Attention' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No students found matching your search criteria.
        </div>
      )}
    </div>
  );
}
