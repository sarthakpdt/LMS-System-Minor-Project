import { Link } from 'react-router';
import { Clock, Calendar, FileText, CheckCircle, AlertCircle, Lock, Play, Award } from 'lucide-react';

const quizzesForStudent = [
  {
    id: 1,
    title: 'Intermediate Level - Calculus Integration Quiz',
    course: 'Mathematics 101',
    instructor: 'Dr. Sarah Johnson',
    questions: 20,
    duration: 45,
    totalMarks: 100,
    scheduledDate: '2026-02-05',
    scheduledTime: '10:00 AM',
    status: 'upcoming',
    attempts: 0,
    maxAttempts: 1,
    level: 'Intermediate',
    passingThreshold: 60,
    promotionThreshold: 82,
  },
  {
    id: 2,
    title: 'Intermediate Level - Newton\'s Laws Quiz',
    course: 'Physics 202',
    instructor: 'Prof. Michael Chen',
    questions: 15,
    duration: 30,
    totalMarks: 75,
    scheduledDate: '2026-02-03',
    scheduledTime: '2:00 PM',
    status: 'available',
    attempts: 0,
    maxAttempts: 1,
    level: 'Intermediate',
    passingThreshold: 60,
    promotionThreshold: 82,
  },
  {
    id: 3,
    title: 'Intermediate Level - Python Basics Test',
    course: 'Computer Science 101',
    instructor: 'Dr. David Lee',
    questions: 25,
    duration: 60,
    totalMarks: 100,
    scheduledDate: '2026-02-01',
    scheduledTime: '3:00 PM',
    status: 'available',
    attempts: 0,
    maxAttempts: 2,
    level: 'Intermediate',
    passingThreshold: 60,
    promotionThreshold: 82,
  },
  {
    id: 4,
    title: 'Intermediate Level - Organic Reactions Test',
    course: 'Chemistry 301',
    instructor: 'Dr. Emily White',
    questions: 18,
    duration: 45,
    totalMarks: 90,
    scheduledDate: '2026-01-28',
    scheduledTime: '11:00 AM',
    status: 'completed',
    attempts: 1,
    maxAttempts: 1,
    score: 85,
    level: 'Intermediate',
    passingThreshold: 60,
    promotionThreshold: 82,
    countedForPromotion: true,
  },
  {
    id: 5,
    title: 'Intermediate Level - History Quiz',
    course: 'History 201',
    instructor: 'Prof. Robert Garcia',
    questions: 15,
    duration: 30,
    totalMarks: 75,
    scheduledDate: '2026-01-25',
    scheduledTime: '2:00 PM',
    status: 'completed',
    attempts: 1,
    maxAttempts: 1,
    score: 83,
    level: 'Intermediate',
    passingThreshold: 60,
    promotionThreshold: 82,
    countedForPromotion: true,
  },
];

// Student's current promotion status
const promotionStatus = {
  currentLevel: 'Intermediate',
  nextLevel: 'Advanced',
  threshold: 82,
  requiredConsecutive: 3,
  currentConsecutive: 2,
  lastThreeScores: [85, 83],
};

export function StudentQuizList() {
  const availableQuizzes = quizzesForStudent.filter(q => q.status === 'available');
  const upcomingQuizzes = quizzesForStudent.filter(q => q.status === 'upcoming');
  const completedQuizzes = quizzesForStudent.filter(q => q.status === 'completed');

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
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">My Quizzes & Tests</h2>
        <p className="text-gray-600">Take level-appropriate quizzes, view results, and track your promotion progress.</p>
      </div>

      {/* Promotion Progress Card */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-8 h-8" />
          <div>
            <h3 className="text-xl font-bold">Promotion Progress Tracker</h3>
            <p className="text-sm text-purple-100">Current Level: {promotionStatus.currentLevel}</p>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress to {promotionStatus.nextLevel} Level</span>
            <span className="text-sm font-bold">{promotionStatus.currentConsecutive}/{promotionStatus.requiredConsecutive} consecutive quizzes</span>
          </div>
          <div className="flex gap-2 mb-3">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className={`flex-1 h-3 rounded-full ${
                  idx < promotionStatus.currentConsecutive ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-purple-100">
            {promotionStatus.lastThreeScores.map((score, idx) => (
              <span key={idx} className={score >= promotionStatus.threshold ? 'text-green-300 font-bold' : ''}>
                Quiz {idx + 1}: {score}%
              </span>
            ))}
            {promotionStatus.currentConsecutive < 3 && (
              <span className="text-yellow-300">Next: ?</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-purple-100 text-xs mb-1">Required Score</p>
            <p className="text-2xl font-bold">≥{promotionStatus.threshold}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-purple-100 text-xs mb-1">Quizzes Needed</p>
            <p className="text-2xl font-bold">{promotionStatus.requiredConsecutive - promotionStatus.currentConsecutive}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-purple-100 text-xs mb-1">Next Level</p>
            <p className="text-lg font-bold">{promotionStatus.nextLevel}</p>
          </div>
        </div>

        <p className="text-xs text-purple-100 mt-4 italic">
          ⚠️ Score below {promotionStatus.threshold}% in any quiz will reset your progress to 0. Maintain consistency!
        </p>
      </div>

      {/* Alert Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Level-Based Quiz System</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You are currently on <strong>{promotionStatus.currentLevel} Level</strong> - all available quizzes match your level</li>
              <li>• Each quiz has a <strong>passing threshold ({quizzesForStudent[0]?.passingThreshold}%)</strong> and a <strong>promotion threshold ({quizzesForStudent[0]?.promotionThreshold}%)</strong></li>
              <li>• Score ≥{promotionStatus.threshold}% in <strong>3 consecutive quizzes</strong> to automatically advance to {promotionStatus.nextLevel} level</li>
              <li>• Ensure your webcam is working for proctored quizzes</li>
              <li>• Do not switch tabs during the quiz or you may be flagged</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Available Quizzes */}
      {availableQuizzes.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Now</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableQuizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white border-2 border-green-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getLevelColor(quiz.level)}`}>
                        <Award className="w-3 h-3" />
                        {quiz.level} Level
                      </span>
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Available
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">{quiz.title}</h4>
                    <p className="text-sm text-gray-600">{quiz.course}</p>
                    <p className="text-xs text-gray-500">{quiz.instructor}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{quiz.questions} Questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{quiz.duration} Minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(quiz.scheduledDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">{quiz.totalMarks} Marks</span>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-purple-700 font-medium">Thresholds:</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Pass: <strong>{quiz.passingThreshold}%</strong></span>
                    <span className="text-purple-700">Promotion: <strong>≥{quiz.promotionThreshold}%</strong></span>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-yellow-800">
                    <strong>Counts toward promotion:</strong> Score ≥{quiz.promotionThreshold}% will count as 1 of {promotionStatus.requiredConsecutive} required consecutive quizzes.
                  </p>
                </div>

                <Link
                  to={`/quiz/${quiz.id}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-md"
                >
                  <Play className="w-5 h-5" />
                  Start Quiz Now
                </Link>
                
                <p className="text-xs text-center text-gray-500 mt-2">
                  Attempts: {quiz.attempts}/{quiz.maxAttempts}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Quizzes */}
      {upcomingQuizzes.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Upcoming</h3>
          <div className="space-y-4">
            {upcomingQuizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Lock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(quiz.level)}`}>
                          {quiz.level}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900">{quiz.title}</h4>
                      <p className="text-sm text-gray-600">{quiz.course}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{new Date(quiz.scheduledDate).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">{quiz.scheduledTime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Quizzes */}
      {completedQuizzes.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Completed</h3>
          <div className="space-y-4">
            {completedQuizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(quiz.level)}`}>
                          {quiz.level}
                        </span>
                        {quiz.countedForPromotion && quiz.score! >= quiz.promotionThreshold && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            <Award className="w-3 h-3" />
                            Counted for Promotion
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900">{quiz.title}</h4>
                      <p className="text-sm text-gray-600">{quiz.course}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-1">
                      <span className="text-2xl font-bold text-gray-900">{quiz.score}</span>
                      <span className="text-sm text-gray-600">/{quiz.totalMarks}</span>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      quiz.score! >= quiz.promotionThreshold ? 'bg-purple-100 text-purple-700' :
                      quiz.score! >= quiz.passingThreshold ? 'bg-green-100 text-green-700' :
                      quiz.score! >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {quiz.score! >= quiz.promotionThreshold ? 'Promotion Level' :
                       quiz.score! >= quiz.passingThreshold ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}