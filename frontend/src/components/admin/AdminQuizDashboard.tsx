import { useState, useEffect } from 'react';
import { Shield, Users, TrendingUp, CheckCircle, FileText } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Quiz {
  _id: string;
  title: string;
  courseId: { courseName: string; courseCode: string } | string;
  questions: any[];
  timeLimit: number;
  totalMarks: number;
  isPublished: boolean;
  createdAt: string;
}

interface QuizResult {
  _id: string;
  studentId: { name: string; email: string } | null;
  quizId: { title: string } | null;
  score: number;
  totalMarks: number;
  percentage: number;
  submittedAt: string;
}

const API = 'http://localhost:5000';

export function AdminQuizDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const cRes = await fetch(`${API}/api/courses`);
      const courses = await cRes.json();

      const allQuizzes: Quiz[] = [];
      for (const course of courses) {
        const qRes = await fetch(`${API}/api/quizzes/course/${course._id}`);
        if (qRes.ok) {
          const qs: Quiz[] = await qRes.json();
          qs.forEach(q => allQuizzes.push({ ...q, courseId: course }));
        }
      }
      setQuizzes(allQuizzes);

      // Build chart data per course
      const data = courses.slice(0, 6).map((c: any) => ({
        name: c.courseCode,
        quizzes: allQuizzes.filter(q =>
          typeof q.courseId === 'object'
            ? (q.courseId as any)._id === c._id
            : q.courseId === c._id
        ).length
      }));
      setChartData(data);
    } catch (err) {
      console.error('Failed to load quiz data', err);
    } finally {
      setLoading(false);
    }
  };

  const published = quizzes.filter(q => q.isPublished).length;
  const drafts = quizzes.filter(q => !q.isPublished).length;
  const totalQuestions = quizzes.reduce((s, q) => s + q.questions.length, 0);

  if (loading) return (
    <div className="p-8 text-center text-gray-500">Loading quiz data...</div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">
          Quiz System Administration
        </h2>
        <p className="text-gray-600">
          Overview of all quizzes across courses.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: 'Total Quizzes',
            value: quizzes.length,
            icon: Shield,
            gradient: 'from-purple-500 to-purple-600'
          },
          {
            label: 'Published',
            value: published,
            icon: CheckCircle,
            gradient: 'from-green-500 to-green-600'
          },
          {
            label: 'Drafts',
            value: drafts,
            icon: FileText,
            gradient: 'from-yellow-500 to-yellow-600'
          },
          {
            label: 'Total Questions',
            value: totalQuestions,
            icon: Users,
            gradient: 'from-blue-500 to-blue-600'
          },
        ].map(({ label, value, icon: Icon, gradient }) => (
          <div key={label}
            className={`bg-gradient-to-br ${gradient} rounded-xl p-6 text-white shadow-lg`}>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <Icon className="w-6 h-6" />
            </div>
            <p className="text-sm opacity-90 mb-1">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quizzes per Course
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="quizzes" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Quizzes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* All Quizzes Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">All Quizzes</h3>
        </div>
        {quizzes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            No quizzes created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Title', 'Course', 'Questions',
                    'Marks', 'Time', 'Status', 'Created'].map(h => (
                    <th key={h}
                      className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quizzes.map(quiz => {
                  const course = typeof quiz.courseId === 'object'
                    ? quiz.courseId : null;
                  return (
                    <tr key={quiz._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{quiz.title}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course
                          ? `${course.courseName} (${course.courseCode})`
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {quiz.questions.length}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {quiz.totalMarks}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {quiz.timeLimit}m
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          quiz.isPublished
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {quiz.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}