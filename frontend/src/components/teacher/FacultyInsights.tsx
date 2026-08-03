import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users, CheckCircle, AlertTriangle, TrendingDown,
  BookOpen, Bell, Loader2, RefreshCw, AlertCircle, Send
} from 'lucide-react';
import { Card, Button, Badge } from '../../theme/components';
import { PageTransition, AnimatedContainer, SpinningLoader } from '../../theme/animations';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
  department: string;
  semester: string;
}

interface StudentInsight {
  id: string;
  studentId: string;
  name: string;
  email: string;
  academicHealthScore: number;
  riskScore: number;
  riskLevel: 'Safe' | 'Warning' | 'Critical';
  attendancePct: number;
  performanceScore: number;
  quizAvg: number;
  assignmentAvg: number;
}

const API = 'http://localhost:5000/api';

export function FacultyInsights() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Intervention Modal State
  const [interventionStudent, setInterventionStudent] = useState<StudentInsight | null>(null);
  const [interventionMessage, setInterventionMessage] = useState<string>('');
  const [sendingIntervention, setSendingIntervention] = useState(false);
  const [interventionSuccess, setInterventionSuccess] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API}/teachers/me/courses`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCourses(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    }
  };

  const fetchInsights = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      let url = `${API}/analytics/teacher/${user.id}/insights`;
      if (selectedCourse) {
        url += `?courseId=${selectedCourse}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (data.success) {
        setInsights(data);
      } else {
        setError(data.message || 'Failed to fetch insights data.');
      }
    } catch (err) {
      setError('Connection error. Could not retrieve teacher dashboard insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchInsights();
    }
  }, [user, selectedCourse]);

  const handleInterveneClick = (student: StudentInsight) => {
    setInterventionStudent(student);
    setInterventionMessage(
      `Hello ${student.name.split(' ')[0]}, I noticed your overall grades or class attendance are currently falling below our standard target guidelines. Let's schedule a brief chat during my office hours to discuss how we can get you back on track.`
    );
    setInterventionSuccess(false);
    setInterventionMessage((prev) => prev.trim());
  };

  const handleSendIntervention = async () => {
    if (!interventionStudent || !user?.id) return;
    setSendingIntervention(true);
    try {
      const res = await fetch(`${API}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          title: `Academic Support Intervention Notice`,
          message: interventionMessage,
          type: 'warning',
          targetRole: 'student',
          targetUserId: interventionStudent.id,
          createdBy: user.id,
          createdByName: user.name || 'Faculty Advisor',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInterventionSuccess(true);
        setTimeout(() => {
          setInterventionStudent(null);
        }, 1500);
      } else {
        alert(data.message || 'Failed to send alert notification.');
      }
    } catch (err) {
      alert('Could not submit intervention alert.');
    } finally {
      setSendingIntervention(false);
    }
  };

  if (loading && !insights) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <SpinningLoader size="lg" className="mb-4 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading faculty dashboard data...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Faculty Insights Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Real-time student academic risk classification and performance aggregates.
          </p>
        </div>

        {/* Dropdowns & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Subject:</span>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">All Assigned Subjects</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.courseName} ({c.courseCode})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchInsights}
            className="flex items-center justify-center p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
            title="Refresh Insights"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/20 text-red-700 dark:text-red-450 p-4 rounded-xl flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {insights && (
        <AnimatedContainer>
          {/* Key Metrics Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {insights.totalStudents}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Enrolled Students</p>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-950/30 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {insights.safeCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium text-green-700 dark:text-green-400">Safe Standing</p>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {insights.warningCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium text-amber-700 dark:text-amber-400">Warning Status</p>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {insights.criticalCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium text-red-700 dark:text-red-450">Critical Risk</p>
              </div>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Risk Distribution Pie Chart */}
            <Card className="p-6 lg:col-span-1 flex flex-col justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Risk Distribution Matrix
              </h3>
              <div className="h-64 flex items-center justify-center">
                {insights.totalStudents === 0 ? (
                  <p className="text-sm text-gray-500">No student risk records found.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={insights.riskDistribution.filter((d: any) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {insights.riskDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Student(s)`]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Attendance vs Performance Scatter Plot */}
            <Card className="p-6 lg:col-span-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Attendance Rate vs Academic Performance Score
              </h3>
              <div className="h-64">
                {insights.totalStudents === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">
                    No academic data to scatter.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        type="number"
                        dataKey="attendance"
                        name="Attendance"
                        unit="%"
                        domain={[0, 100]}
                        stroke="#888888"
                        tickFormatter={(v) => `${v}%`}
                      />
                      <YAxis
                        type="number"
                        dataKey="performance"
                        name="Performance Score"
                        unit="%"
                        domain={[0, 100]}
                        stroke="#888888"
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-gray-900 text-white rounded-lg p-3 text-xs border border-gray-700 shadow-lg leading-relaxed">
                                <p className="font-bold">{data.name}</p>
                                <p>Attendance: {data.attendance}%</p>
                                <p>Performance Score: {data.performance}%</p>
                                <p>
                                  Risk Status:{' '}
                                  <span
                                    className={
                                      data.riskLevel === 'Safe'
                                        ? 'text-green-400'
                                        : data.riskLevel === 'Warning'
                                        ? 'text-amber-400'
                                        : 'text-red-400'
                                    }
                                  >
                                    {data.riskLevel}
                                  </span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter name="Students" data={insights.attendanceVsPerformance}>
                        {insights.attendanceVsPerformance.map((entry: any, index: number) => {
                          const fill =
                            entry.riskLevel === 'Safe'
                              ? '#10B981'
                              : entry.riskLevel === 'Warning'
                              ? '#F59E0B'
                              : '#EF4444';
                          return <Cell key={`cell-${index}`} fill={fill} />;
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Critical Students Requiring Intervention Table */}
          <Card className="p-6 mb-8 border border-red-150 dark:border-red-950 bg-red-50/10 dark:bg-red-950/5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                ⚠️ Critical Students Requiring Intervention
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-xs uppercase font-semibold">
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Student ID</th>
                    <th className="py-2.5 text-center">Attendance</th>
                    <th className="py-2.5 text-center">Quiz Avg</th>
                    <th className="py-2.5 text-center">Assignment Avg</th>
                    <th className="py-2.5 text-center">Risk Score</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                  {insights.criticalStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-gray-500 font-medium">
                        🎉 Great! No students are currently listed as Critical risk.
                      </td>
                    </tr>
                  ) : (
                    insights.criticalStudents.map((s: StudentInsight) => (
                      <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-3 font-semibold text-gray-950 dark:text-white">{s.name}</td>
                        <td className="py-3 font-mono text-xs text-gray-500">{s.studentId}</td>
                        <td className={`py-3 text-center font-bold ${s.attendancePct < 75 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {s.attendancePct}%
                        </td>
                        <td className={`py-3 text-center ${s.quizAvg < 60 ? 'text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {s.quizAvg}%
                        </td>
                        <td className={`py-3 text-center ${s.assignmentAvg < 60 ? 'text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {s.assignmentAvg}%
                        </td>
                        <td className="py-3 text-center font-black text-red-500">{s.riskScore}</td>
                        <td className="py-3 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleInterveneClick(s)}
                            className="bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 flex items-center gap-1.5 ml-auto border border-red-200 dark:border-red-900/30"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            Send Alert
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Full Students Risk Breakdown Grid */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                All Students Risk Breakdown
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-xs uppercase font-semibold">
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5 text-center">Attendance</th>
                    <th className="py-2.5 text-center">Quiz Avg</th>
                    <th className="py-2.5 text-center">Assignment Avg</th>
                    <th className="py-2.5 text-center">Health Score</th>
                    <th className="py-2.5 text-center">Risk Score</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                  {insights.students.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-gray-500">
                        No student risk reports compiled for this selection.
                      </td>
                    </tr>
                  ) : (
                    insights.students.map((s: StudentInsight) => (
                      <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-3 font-semibold text-gray-950 dark:text-white">{s.name}</td>
                        <td className="py-3 text-center">{s.attendancePct}%</td>
                        <td className="py-3 text-center">{s.quizAvg}%</td>
                        <td className="py-3 text-center">{s.assignmentAvg}%</td>
                        <td className="py-3 text-center font-bold text-gray-800 dark:text-gray-200">
                          {s.academicHealthScore}%
                        </td>
                        <td className="py-3 text-center font-bold">{s.riskScore}</td>
                        <td className="py-3 text-right">
                          <Badge
                            variant={
                              s.riskLevel === 'Safe'
                                ? 'success'
                                : s.riskLevel === 'Warning'
                                ? 'warning'
                                : 'error'
                            }
                            size="sm"
                          >
                            {s.riskLevel}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </AnimatedContainer>
      )}

      {/* Intervention Message Alert Dialog Modal */}
      {interventionStudent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl p-6 border dark:border-gray-700 bg-white dark:bg-gray-800 animate-in fade-in zoom-in-95 duration-250">
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-700 pb-3 mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-500" />
                Intervention Notice - {interventionStudent.name}
              </h3>
              <button
                onClick={() => setInterventionStudent(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
              >
                ✕
              </button>
            </div>

            {interventionSuccess ? (
              <div className="py-6 text-center text-green-600 dark:text-green-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 animate-bounce" />
                <p className="font-semibold text-base">Alert Notice Sent Successfully!</p>
                <p className="text-xs text-gray-500 mt-1">
                  Alert message logged in student's notifications center.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                    Customize Advisory Alert Message
                  </label>
                  <textarea
                    rows={6}
                    value={interventionMessage}
                    onChange={(e) => setInterventionMessage(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-850 dark:text-white resize-none"
                    placeholder="Enter academic support message alert..."
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button variant="secondary" size="md" onClick={() => setInterventionStudent(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSendIntervention}
                    disabled={sendingIntervention || !interventionMessage.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 shadow-md"
                  >
                    {sendingIntervention ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Send Support Alert</span>
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </PageTransition>
  );
}
