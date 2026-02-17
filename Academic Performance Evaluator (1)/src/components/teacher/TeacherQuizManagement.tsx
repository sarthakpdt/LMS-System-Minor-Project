import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Copy, Calendar, Users, Clock, Shield, Award } from 'lucide-react';
import { Link } from 'react-router';
import { LevelBasedQuizCreator } from './LevelBasedQuizCreator';

const quizzesData = [
  {
    id: 1,
    title: 'Calculus Integration Quiz',
    course: 'Mathematics 101',
    questions: 20,
    duration: 45,
    totalMarks: 100,
    scheduledDate: '2026-02-05',
    scheduledTime: '10:00 AM',
    status: 'scheduled',
    enrolled: 156,
    completed: 0,
    antiCheat: true,
    proctoring: true,
    level: 'Intermediate',
  },
  {
    id: 2,
    title: 'Newton\'s Laws Quiz',
    course: 'Physics 202',
    questions: 15,
    duration: 30,
    totalMarks: 75,
    scheduledDate: '2026-02-03',
    scheduledTime: '2:00 PM',
    status: 'active',
    enrolled: 124,
    completed: 89,
    antiCheat: true,
    proctoring: true,
    level: 'Advanced',
  },
  {
    id: 3,
    title: 'Organic Reactions Test',
    course: 'Chemistry 301',
    questions: 25,
    duration: 60,
    totalMarks: 100,
    scheduledDate: '2026-01-28',
    scheduledTime: '11:00 AM',
    status: 'completed',
    enrolled: 98,
    completed: 98,
    antiCheat: true,
    proctoring: false,
    level: 'Beginner',
  },
];

export function TeacherQuizManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredQuizzes = quizzesData.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || quiz.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-orange-100 text-orange-700';
      case 'Intermediate': return 'bg-blue-100 text-blue-700';
      case 'Advanced': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">Quiz Management</h2>
          <p className="text-gray-600">Create level-based quizzes, manage, and monitor with anti-cheating features.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create Level-Based Quiz
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{quizzesData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{quizzesData.filter(q => q.status === 'scheduled').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Now</p>
              <p className="text-2xl font-bold text-gray-900">{quizzesData.filter(q => q.status === 'active').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Attempts</p>
              <p className="text-2xl font-bold text-gray-900">{quizzesData.reduce((sum, q) => sum + q.completed, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search quizzes by title or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Quiz List */}
      <div className="space-y-4">
        {filteredQuizzes.map((quiz) => (
          <div key={quiz.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{quiz.title}</h3>
                    <p className="text-sm text-gray-600">{quiz.course}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      quiz.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      quiz.status === 'active' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {quiz.status.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(quiz.level)}`}>
                      <Award className="w-3 h-3" />
                      {quiz.level}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Questions</p>
                    <p className="text-sm font-medium text-gray-900">{quiz.questions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-medium text-gray-900">{quiz.duration} min</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Marks</p>
                    <p className="text-sm font-medium text-gray-900">{quiz.totalMarks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date & Time</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(quiz.scheduledDate).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">{quiz.scheduledTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Completion</p>
                    <p className="text-sm font-medium text-gray-900">{quiz.completed}/{quiz.enrolled}</p>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(quiz.completed / quiz.enrolled) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {quiz.antiCheat && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <Shield className="w-3 h-3" />
                      Anti-Cheat Enabled
                    </span>
                  )}
                  {quiz.proctoring && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      AI Proctoring
                    </span>
                  )}
                </div>
              </div>

              <div className="flex lg:flex-col gap-2">
                {quiz.status === 'active' && (
                  <Link
                    to={`/quiz-monitor/${quiz.id}`}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Monitor Live
                  </Link>
                )}
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredQuizzes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No quizzes found matching your search criteria.
        </div>
      )}

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Create Level-Based Quiz</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-gray-500 text-2xl">×</span>
              </button>
            </div>
            
            <LevelBasedQuizCreator />
          </div>
        </div>
      )}
    </div>
  );
}