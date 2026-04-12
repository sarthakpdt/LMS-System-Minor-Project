import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Clock, FileText, CheckCircle, Lock, Play, Shield, ShieldAlert, AlertTriangle, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Quiz {
  _id: string;
  title: string;
  courseId: string;
  timeLimit: number;
  totalMarks: number;
  isPublished: boolean;
  dueDate?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | null;
  questions: { _id: string; questionText: string; type: string; options: string[]; marks: number }[];
}

interface QuizResult {
  quizId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  plagiarismEvents?: { type: string; severity: 'low' | 'medium' | 'high'; timestamp: string }[];
}

interface StudentBucket {
  courseId: string;
  bucket: 'Easy' | 'Medium' | 'Hard';
}

const API = 'http://localhost:5000';

const BUCKET_BADGE: Record<string, string> = {
  Easy:   'bg-green-100 text-green-700 border border-green-200',
  Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  Hard:   'bg-red-100 text-red-700 border border-red-200',
};

export function StudentQuizList() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [buckets, setBuckets] = useState<StudentBucket[]>([]);  // NEW
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // 1. Courses for this student's semester
      const cRes = await fetch(`${API}/api/courses/semester/${user?.semester}`);
      const coursesData = await cRes.json();
      setCourses(coursesData);

      // 2. Student buckets (NEW) — fetch once, all courses
      let studentBuckets: StudentBucket[] = [];
      try {
        const bRes = await fetch(`${API}/api/buckets/student/${user?.id}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        if (bRes.ok) {
          const bData = await bRes.json();
          studentBuckets = bData.map((b: any) => ({
            courseId: b.courseId?._id || b.courseId,
            bucket: b.bucket,
          }));
          setBuckets(studentBuckets);
        }
      } catch { /* bucket fetch optional */ }

      // 3. Quizzes per course — pass student's bucket so backend filters by difficulty
      const allQuizzes: Quiz[] = [];
      for (const course of coursesData) {
        const studentBucket = studentBuckets.find(b => b.courseId === course._id);
        const bucketParam = studentBucket ? `?bucket=${studentBucket.bucket}` : '';
        const qRes = await fetch(`${API}/api/quizzes/course/${course._id}${bucketParam}`);
        if (qRes.ok) {
          const qs: Quiz[] = await qRes.json();
          qs.filter(q => q.isPublished).forEach(q => allQuizzes.push(q));
        }
      }
      setQuizzes(allQuizzes);

      // 4. Results for attempted quizzes
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
  const getStudentBucketForCourse = (courseId: string) =>
    buckets.find(b => b.courseId === courseId)?.bucket ?? null;

  const available = quizzes.filter(q => !isAttempted(q._id) && !isExpired(q));
  const attempted = quizzes.filter(q => isAttempted(q._id));
  const expired  = quizzes.filter(q => !isAttempted(q._id) && isExpired(q));

  const getViolationSummary = (result: QuizResult) => {
    const events = result.plagiarismEvents || [];
    const high   = events.filter(e => e.severity === 'high').length;
    const medium = events.filter(e => e.severity === 'medium').length;
    return { total: events.length, high, medium };
  };

  if (loading) return (
    <div className="p-8 text-center text-gray-500">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      Loading quizzes...
    </div>
  );

  const QuizCard = ({ quiz, mode }: { quiz: Quiz; mode: 'available' | 'attempted' | 'expired' }) => {
    const result = getResult(quiz._id);
    const bucket = getStudentBucketForCourse(quiz.courseId);
    return (
      <div className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow ${
        mode === 'expired' ? 'opacity-60' : ''
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
              {quiz.difficulty && (() => {
                const starCount = quiz.difficulty === 'Easy' ? 1 : quiz.difficulty === 'Medium' ? 3 : 5;
                return (
                  <span
                    className="inline-flex items-center gap-0.5 text-amber-400 text-sm"
                    title={`${quiz.difficulty} – ${starCount}/5 stars`}
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i}>{i < starCount ? '★' : '☆'}</span>
                    ))}
                  </span>
                );
              })()}
              {quiz.difficulty && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BUCKET_BADGE[quiz.difficulty]}`}>
                  {quiz.difficulty}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-2">{getCourseName(quiz.courseId)}</p>

            {/* Student's current bucket for this course */}
            {bucket && (
              <p className="text-xs text-gray-400 mb-2">
                Your level: <span className={`font-semibold ${BUCKET_BADGE[bucket]} px-1.5 py-0.5 rounded-full`}>{bucket}</span>
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{quiz.timeLimit} min</span>
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{quiz.questions?.length || 0} Qs</span>
              <span className="flex items-center gap-1"><Award className="w-3 h-3" />{quiz.totalMarks} marks</span>
              {quiz.dueDate && <span>Due: {new Date(quiz.dueDate).toLocaleDateString()}</span>}
            </div>
          </div>

          <div className="flex-shrink-0">
            {mode === 'available' && (
              <Link
                to={`/quiz/${quiz._id}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <Play className="w-4 h-4" /> Start
              </Link>
            )}
            {mode === 'attempted' && result && (
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  result.percentage >= 80 ? 'text-green-600' :
                  result.percentage >= 60 ? 'text-yellow-600' : 'text-red-500'
                }`}>{result.percentage}%</div>
                <div className="text-xs text-gray-500">{result.score}/{result.totalMarks}</div>
                {getViolationSummary(result).total > 0 && (
                  <div className={`mt-1 text-xs flex items-center gap-1 ${
                    getViolationSummary(result).high > 0 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {getViolationSummary(result).high > 0
                      ? <ShieldAlert className="w-3 h-3" />
                      : <AlertTriangle className="w-3 h-3" />
                    }
                    {getViolationSummary(result).total} flag{getViolationSummary(result).total > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
            {mode === 'expired' && (
              <Lock className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Quizzes</h2>
        <p className="text-sm text-gray-500 mt-1">
          Quizzes are filtered to match your difficulty level per subject.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Available', count: available.length, color: 'text-green-600 bg-green-50 border-green-200' },
          { label: 'Completed', count: attempted.length, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: 'Expired',   count: expired.length,   color: 'text-gray-500 bg-gray-50 border-gray-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Available quizzes */}
      {available.length > 0 && (
        <section className="mb-8">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-green-600" /> Available ({available.length})
          </h3>
          <div className="space-y-3">
            {available.map(q => <QuizCard key={q._id} quiz={q} mode="available" />)}
          </div>
        </section>
      )}

      {/* Completed */}
      {attempted.length > 0 && (
        <section className="mb-8">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" /> Completed ({attempted.length})
          </h3>
          <div className="space-y-3">
            {attempted.map(q => <QuizCard key={q._id} quiz={q} mode="attempted" />)}
          </div>
        </section>
      )}

      {/* Expired */}
      {expired.length > 0 && (
        <section className="mb-8">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" /> Expired ({expired.length})
          </h3>
          <div className="space-y-3">
            {expired.map(q => <QuizCard key={q._id} quiz={q} mode="expired" />)}
          </div>
        </section>
      )}

      {quizzes.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No quizzes available for your current level yet.</p>
        </div>
      )}
    </div>
  );
}
