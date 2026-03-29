import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Clock, FileText, CheckCircle, Lock, Play, Shield, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Quiz {
  _id: string;
  title: string;
  courseId: string;
  timeLimit: number;
  totalMarks: number;
  isPublished: boolean;
  dueDate?: string;
  questions: { _id: string; questionText: string; type: string; options: string[]; marks: number }[];
}

interface QuizResult {
  quizId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  plagiarismEvents?: { type: string; severity: 'low' | 'medium' | 'high'; timestamp: string }[];
}

const API = 'http://localhost:5000';

export function StudentQuizList() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const cRes = await fetch(`${API}/api/courses/semester/${user?.semester}`);
      const coursesData = await cRes.json();
      setCourses(coursesData);

      const allQuizzes: Quiz[] = [];
      for (const course of coursesData) {
        const qRes = await fetch(`${API}/api/quizzes/course/${course._id}`);
        if (qRes.ok) {
          const qs: Quiz[] = await qRes.json();
          qs.filter(q => q.isPublished).forEach(q => allQuizzes.push(q));
        }
      }
      setQuizzes(allQuizzes);

      const allResults: QuizResult[] = [];
      for (const quiz of allQuizzes) {
        try {
          const rRes = await fetch(`${API}/api/quizzes/${quiz._id}/result/${user?.id}`);
          if (rRes.ok) {
            const r = await rRes.json();
            allResults.push({
              quizId: quiz._id,
              score: r.score,
              totalMarks: r.totalMarks,
              percentage: r.percentage,
              plagiarismEvents: r.plagiarismEvents || [],
            });
          }
        } catch { /* not attempted yet */ }
      }
      setResults(allResults);
    } catch (err) {
      console.error('Failed to load quizzes', err);
    } finally {
      setLoading(false);
    }
  };

  const getResult = (quizId: string) => results.find(r => r.quizId === quizId);
  const isAttempted = (quizId: string) => !!getResult(quizId);
  const isExpired = (quiz: Quiz) => quiz.dueDate ? new Date(quiz.dueDate) < new Date() : false;
  const getCourseName = (courseId: string) => {
    const c = courses.find(c => c._id === courseId);
    return c ? `${c.courseName} (${c.courseCode})` : 'Unknown Course';
  };

  const available = quizzes.filter(q => !isAttempted(q._id) && !isExpired(q));
  const attempted = quizzes.filter(q => isAttempted(q._id));
  const expired = quizzes.filter(q => !isAttempted(q._id) && isExpired(q));

  // Proctoring helpers
  const getViolationSummary = (result: QuizResult) => {
    const events = result.plagiarismEvents || [];
    const high = events.filter(e => e.severity === 'high').length;
    const medium = events.filter(e => e.severity === 'medium').length;
    return { total: events.length, high, medium };
  };

  if (loading) return (
    <div className="p-8 text-center text-gray-500">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      Loading quizzes...
    </div>
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">My Quizzes & Tests</h2>
        <p className="text-gray-600">Quizzes for your enrolled courses this semester.</p>
      </div>

      {/* Proctoring notice */}
      <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <span>All quizzes are AI-proctored. Camera access is required before starting. Violations are logged and reviewed by your instructor.</span>
      </div>

      {quizzes.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No quizzes available yet. Check back later.</p>
        </div>
      )}

      {/* ── Available ──────────────────────────────────────────────────────────── */}
      {available.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-green-600" /> Available Now ({available.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {available.map(quiz => (
              <div key={quiz._id} className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 mb-1">{quiz.title}</h4>
                <p className="text-sm text-gray-500 mb-4">{getCourseName(quiz.courseId)}</p>

                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Questions</p>
                    <p className="font-bold text-gray-900">{quiz.questions.length}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-bold text-gray-900">{quiz.timeLimit}m</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Marks</p>
                    <p className="font-bold text-gray-900">{quiz.totalMarks}</p>
                  </div>
                </div>

                {quiz.dueDate && (
                  <p className="text-xs text-orange-600 mb-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Due: {new Date(quiz.dueDate).toLocaleString()}
                  </p>
                )}

                {/* Proctoring requirement notice */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg px-3 py-2">
                  <Shield className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  Camera & proctoring required
                </div>

                <Link
                  to={`/quiz/${quiz._id}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  <Play className="w-4 h-4" /> Start Quiz
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Completed ──────────────────────────────────────────────────────────── */}
      {attempted.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" /> Completed ({attempted.length})
          </h3>
          <div className="space-y-3">
            {attempted.map(quiz => {
              const result = getResult(quiz._id)!;
              const { total, high } = getViolationSummary(result);
              return (
                <div key={quiz._id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900">{quiz.title}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{getCourseName(quiz.courseId)}</p>

                      {/* Proctoring status badge */}
                      {total === 0 ? (
                        <div className="mt-2 inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                          <Shield className="w-3 h-3" />
                          No violations
                        </div>
                      ) : (
                        <div className={`mt-2 inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${
                          high > 0
                            ? 'text-red-700 bg-red-50 border-red-200'
                            : 'text-orange-700 bg-orange-50 border-orange-200'
                        }`}>
                          {high > 0
                            ? <ShieldAlert className="w-3 h-3" />
                            : <AlertTriangle className="w-3 h-3" />}
                          {total} violation{total > 1 ? 's' : ''} detected
                          {high > 0 && ` (${high} high severity)`}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-gray-900">
                        {result.score}
                        <span className="text-sm font-normal text-gray-500">/{result.totalMarks}</span>
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        result.percentage >= 80 ? 'bg-green-100 text-green-700' :
                        result.percentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {result.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Expired ────────────────────────────────────────────────────────────── */}
      {expired.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-400" /> Expired ({expired.length})
          </h3>
          <div className="space-y-3">
            {expired.map(quiz => (
              <div key={quiz._id} className="bg-gray-50 border border-gray-200 rounded-xl p-5 opacity-60">
                <h4 className="font-semibold text-gray-700">{quiz.title}</h4>
                <p className="text-sm text-gray-500">{getCourseName(quiz.courseId)}</p>
                <p className="text-xs text-red-500 mt-1">Expired: {new Date(quiz.dueDate!).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}