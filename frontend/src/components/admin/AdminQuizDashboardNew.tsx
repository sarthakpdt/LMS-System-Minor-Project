import { useState, useEffect } from 'react';
import { Shield, Users, TrendingUp, CheckCircle, FileText, BarChart3, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Card,
  Button,
  StatCard,
  Badge,
  Alert,
  ProgressRing,
} from '../../theme/components';
import { animationVariants, AnimatedContainer, StaggerList, StaggerItem, PageTransition, SpinningLoader } from '../../theme/animations';
import { colorPalette } from '../../theme/colors';

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

export function AdminQuizDashboardNew() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'quizzes'>('overview');

  useEffect(() => {
    loadData();
  }, []);

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
        ).length,
      }));
      setChartData(data);

      // Mock performance trend data
      const performanceData = [
        { month: 'Jan', avg: 65, completed: 120 },
        { month: 'Feb', avg: 72, completed: 135 },
        { month: 'Mar', avg: 78, completed: 155 },
        { month: 'Apr', avg: 75, completed: 148 },
        { month: 'May', avg: 82, completed: 172 },
        { month: 'Jun', avg: 85, completed: 198 },
      ];
      setPerformanceData(performanceData);
    } catch (err) {
      console.error('Failed to load quiz data', err);
    } finally {
      setLoading(false);
    }
  };

  const published = quizzes.filter(q => q.isPublished).length;
  const drafts = quizzes.filter(q => !q.isPublished).length;
  const totalQuestions = quizzes.reduce((s, q) => s + q.questions.length, 0);
  const avgQuestionsPerQuiz = quizzes.length > 0 ? (totalQuestions / quizzes.length).toFixed(1) : 0;

  if (loading) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <SpinningLoader size="lg" className="mb-4 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading quiz data...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
      <div className="p-8">
        {/* Header Section */}
        <motion.div
          variants={animationVariants.slideInDown}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Quiz Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Comprehensive quiz analytics and administration
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          variants={animationVariants.slideInUp}
          initial="initial"
          animate="animate"
          className="flex gap-3 mb-8 border-b border-gray-200 dark:border-gray-700"
        >
          {[
            { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
            { id: 'analytics' as const, label: 'Analytics', icon: TrendingUp },
            { id: 'quizzes' as const, label: 'All Quizzes', icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all duration-200 ${
                activeTab === id
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
          ))}
        </motion.div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div
            variants={animationVariants.slideInUp}
            initial="initial"
            animate="animate"
            className="space-y-8"
          >
            {/* Key Stats */}
            <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StaggerItem>
                <StatCard
                  icon={<Shield className="w-5 h-5" />}
                  label="Total Quizzes"
                  value={quizzes.length}
                  gradient="from-purple-500 to-indigo-600"
                  change={{ value: 12, isPositive: true }}
                />
              </StaggerItem>

              <StaggerItem>
                <StatCard
                  icon={<CheckCircle className="w-5 h-5" />}
                  label="Published"
                  value={published}
                  gradient="from-green-500 to-emerald-600"
                  change={{ value: 5, isPositive: true }}
                />
              </StaggerItem>

              <StaggerItem>
                <StatCard
                  icon={<FileText className="w-5 h-5" />}
                  label="Drafts"
                  value={drafts}
                  gradient="from-orange-500 to-amber-600"
                  change={{ value: 2, isPositive: false }}
                />
              </StaggerItem>

              <StaggerItem>
                <StatCard
                  icon={<Users className="w-5 h-5" />}
                  label="Total Questions"
                  value={totalQuestions}
                  gradient="from-blue-500 to-cyan-600"
                  change={{ value: 18, isPositive: true }}
                />
              </StaggerItem>
            </StaggerList>

            {/* Quick Insights */}
            <motion.div
              variants={animationVariants.slideInUp}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Avg Questions */}
              <Card gradient role="admin" className="flex flex-col items-center justify-center py-8">
                <ProgressRing progress={Math.min((parseFloat(avgQuestionsPerQuiz) / 10) * 100, 100)} size="md" color="purple" />
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">Average Questions per Quiz</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgQuestionsPerQuiz}</p>
              </Card>

              {/* Publication Rate */}
              <Card gradient role="admin" className="flex flex-col items-center justify-center py-8">
                <ProgressRing progress={(published / quizzes.length) * 100} size="md" color="green" />
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">Publication Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{quizzes.length > 0 ? ((published / quizzes.length) * 100).toFixed(0) : 0}%</p>
              </Card>

              {/* Status Overview */}
              <Card gradient role="admin">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Status Overview</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Published</span>
                    <Badge variant="success">{published}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Drafts</span>
                    <Badge variant="warning">{drafts}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                    <Badge variant="info">{quizzes.length}</Badge>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Quizzes per Course Chart */}
            {chartData.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Quiz Distribution by Course
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="quizzes" fill="url(#barGradient)" radius={[8, 8, 0, 0]} name="Quizzes" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </motion.div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <motion.div
            variants={animationVariants.slideInUp}
            initial="initial"
            animate="animate"
            className="space-y-8"
          >
            {/* Performance Trend */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Performance Trend (6 Months)
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    name="Avg Score (%)"
                    stroke="url(#lineGradient)"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Quiz Difficulty Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Quiz Completion Status
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Published', value: published },
                        { name: 'Drafts', value: drafts },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Completion Metrics
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Publication Rate</span>
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {quizzes.length > 0 ? ((published / quizzes.length) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                        initial={{ width: 0 }}
                        animate={{ width: `${(published / quizzes.length) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* QUIZZES TAB */}
        {activeTab === 'quizzes' && (
          <motion.div
            variants={animationVariants.slideInUp}
            initial="initial"
            animate="animate"
          >
            {quizzes.length === 0 ? (
              <Card className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No quizzes created yet</p>
              </Card>
            ) : (
              <StaggerList className="space-y-4">
                {quizzes.map((quiz, idx) => (
                  <StaggerItem key={quiz._id}>
                    <Card hover className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{quiz.title}</h4>
                            <Badge
                              variant={quiz.isPublished ? 'success' : 'warning'}
                              size="sm"
                            >
                              {quiz.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {typeof quiz.courseId === 'object'
                              ? `${quiz.courseId.courseName} (${quiz.courseId.courseCode})`
                              : 'Unknown Course'}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="text-gray-700 dark:text-gray-300">
                              <span className="font-semibold">{quiz.questions.length}</span> Questions
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              <span className="font-semibold">{quiz.timeLimit}</span> min limit
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              <span className="font-semibold">{quiz.totalMarks}</span> Marks
                            </span>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm">
                          Edit Quiz
                        </Button>
                      </div>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
