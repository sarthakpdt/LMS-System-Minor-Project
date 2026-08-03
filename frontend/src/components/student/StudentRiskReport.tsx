import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Award, AlertTriangle, BookOpen, Clock, CheckCircle, RefreshCw, Activity, ShieldAlert, AlertCircle } from 'lucide-react';
import { Card, Badge, ProgressRing } from '../../theme/components';
import { PageTransition, SpinningLoader, AnimatedProgressBar } from '../../theme/animations';

interface CourseMetric {
  attendancePct: number;
  quizAvg: number;
  assignmentAvg: number;
}

interface AreaNeedingAttention {
  courseName: string;
  courseCode: string;
  metric: string;
  value: number;
  target: number;
  message: string;
}

interface CourseReport {
  courseId: string;
  courseName: string;
  courseCode: string;
  metrics: CourseMetric;
  academicHealthScore: number;
  riskScore: number;
  riskLevel: 'Safe' | 'Warning' | 'Critical';
  areasNeedingAttention: {
    metric: string;
    value: number;
    target: number;
    message: string;
  }[];
}

interface RiskSummary {
  academicHealthScore: number;
  riskScore: number;
  riskLevel: 'Safe' | 'Warning' | 'Critical';
  areasNeedingAttention: AreaNeedingAttention[];
}

const API = 'http://localhost:5000/api';

export function StudentRiskReport() {
  const { user } = useAuth();
  const [report, setReport] = useState<{ summary: RiskSummary; courses: CourseReport[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRiskReport = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/analytics/student/${user.id}/risk`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (data.success) {
        setReport(data);
      } else {
        setError(data.message || 'Failed to fetch academic risk report.');
      }
    } catch (err: any) {
      setError('Connection error. Could not load risk prediction details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskReport();
  }, [user]);

  if (loading) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <SpinningLoader size="lg" className="mb-4 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Evaluating academic risk data...</p>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition className="p-8">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-750 dark:text-red-400 rounded-xl p-5 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error Loading Report</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!report) return null;

  const { summary, courses } = report;

  const getRiskColor = (level: string) => {
    if (level === 'Safe') return 'text-green-600 dark:text-green-400';
    if (level === 'Warning') return 'text-amber-500 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getRiskBg = (level: string) => {
    if (level === 'Safe') return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30';
    if (level === 'Warning') return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30';
    return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30';
  };

  const ringColorMap = {
    Safe: 'green' as const,
    Warning: 'orange' as const,
    Critical: 'red' as const,
  };

  return (
    <PageTransition className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Academic Risk &amp; Health Report
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Calculated from Attendance, Quiz Scores, and Assignment Submissions.
          </p>
        </div>
        <button
          onClick={fetchRiskReport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Recalculate
        </button>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Academic Health Score Ring */}
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <ProgressRing
            progress={summary.academicHealthScore}
            size="md"
            color={ringColorMap[summary.riskLevel]}
          />
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-4">
            {summary.academicHealthScore}%
          </h4>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Academic Health Score</p>
        </Card>

        {/* Risk Score Status */}
        <Card className={`p-6 flex flex-col justify-between border ${getRiskBg(summary.riskLevel)}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Overall Status</span>
              <Badge variant={summary.riskLevel === 'Safe' ? 'success' : summary.riskLevel === 'Warning' ? 'warning' : 'error'} size="md">
                {summary.riskLevel}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Overall Risk Score</p>
            <p className={`text-4xl font-extrabold ${getRiskColor(summary.riskLevel)}`}>
              {summary.riskScore}
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
            {summary.riskLevel === 'Safe' && 'Your academic health is in good standing. Maintain your attendance and scores to remain safe.'}
            {summary.riskLevel === 'Warning' && 'Your risk is rising. Try to improve attendance or complete pending submissions to avoid critical status.'}
            {summary.riskLevel === 'Critical' && 'Urgent attention required. High risk of course failure. Check the attention areas below.'}
          </p>
        </Card>

        {/* Metric Averages */}
        <Card className="p-6 flex flex-col justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Core Averages
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Attendance Average</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {Math.round(courses.reduce((sum, c) => sum + c.metrics.attendancePct, 0) / (courses.length || 1))}%
                </span>
              </div>
              <AnimatedProgressBar progress={Math.round(courses.reduce((sum, c) => sum + c.metrics.attendancePct, 0) / (courses.length || 1))} />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Quiz Average</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {Math.round(courses.reduce((sum, c) => sum + c.metrics.quizAvg, 0) / (courses.length || 1))}%
                </span>
              </div>
              <AnimatedProgressBar progress={Math.round(courses.reduce((sum, c) => sum + c.metrics.quizAvg, 0) / (courses.length || 1))} />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Assignment Average</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {Math.round(courses.reduce((sum, c) => sum + c.metrics.assignmentAvg, 0) / (courses.length || 1))}%
                </span>
              </div>
              <AnimatedProgressBar progress={Math.round(courses.reduce((sum, c) => sum + c.metrics.assignmentAvg, 0) / (courses.length || 1))} />
            </div>
          </div>
        </Card>
      </div>

      {/* Areas Needing Attention Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          Areas Needing Attention
        </h3>
        {summary.areasNeedingAttention.length === 0 ? (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-xl p-5 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm font-medium">All clear! No metric currently falls below target guidelines.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.areasNeedingAttention.map((area, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/20 rounded-xl p-4 shadow-sm"
              >
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900 dark:text-red-400">
                    {area.courseName} ({area.courseCode})
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300/80 mt-1">
                    {area.message} (Target: {area.target}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subject-Wise Academic Breakdown */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          Course-Wise Breakdown
        </h3>
        <div className="space-y-4">
          {courses.map((c) => (
            <Card key={c.courseId} hover className="p-5 border border-gray-150 dark:border-gray-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
                <div>
                  <h4 className="font-bold text-gray-950 dark:text-white text-base">{c.courseName}</h4>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{c.courseCode}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Health / Risk Score</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {c.academicHealthScore}% / {c.riskScore}
                    </p>
                  </div>
                  <Badge variant={c.riskLevel === 'Safe' ? 'success' : c.riskLevel === 'Warning' ? 'warning' : 'error'} size="md">
                    {c.riskLevel}
                  </Badge>
                </div>
              </div>

              {/* Course Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Attendance Rate</span>
                    <span className={`font-semibold ${c.metrics.attendancePct < 75 ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>
                      {c.metrics.attendancePct}%
                    </span>
                  </div>
                  <AnimatedProgressBar progress={c.metrics.attendancePct} />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Quiz Average Score</span>
                    <span className={`font-semibold ${c.metrics.quizAvg < 60 ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>
                      {c.metrics.quizAvg}%
                    </span>
                  </div>
                  <AnimatedProgressBar progress={c.metrics.quizAvg} />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Assignment Performance</span>
                    <span className={`font-semibold ${c.metrics.assignmentAvg < 60 ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>
                      {c.metrics.assignmentAvg}%
                    </span>
                  </div>
                  <AnimatedProgressBar progress={c.metrics.assignmentAvg} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
