import { useState, useEffect } from 'react';
import { Activity, RefreshCw, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { PageTransition, SpinningLoader, animationVariants } from '../../theme/animations';
import { Card, Button, StatCard, EmptyState } from '../../theme/components';
import { HealthScoreCard } from './academic-health/HealthScoreCard';
import { AttendanceHealthSection } from './academic-health/AttendanceHealthSection';
import { PerformancePredictorSection } from './academic-health/PerformancePredictorSection';
import { SubjectStrengthSection } from './academic-health/SubjectStrengthSection';
import { RiskDetectionSection } from './academic-health/RiskDetectionSection';
import { RecommendationsSection } from './academic-health/RecommendationsSection';
import { TrendChartsSection } from './academic-health/TrendChartsSection';
import type { AcademicHealthData, AcademicHealthResponse } from './academic-health/types';

const API = 'http://localhost:5000/api';

export function StudentAcademicHealth() {
  const { user } = useAuth();
  const [data, setData] = useState<AcademicHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/academic-health/student/${user.id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const json: AcademicHealthResponse = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message || 'Failed to load academic health data');
      }
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [user?.id]);

  if (loading) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
        <div className="text-center">
          <SpinningLoader size="lg" className="mb-4 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Analyzing your academic health...</p>
        </div>
      </PageTransition>
    );
  }

  if (error || !data) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 p-8">
        <Card className="max-w-md w-full text-center">
          <EmptyState
            icon={Activity}
            title="Unable to load Academic Health"
            description={error || 'No data available. Please try again later.'}
          />
          <Button variant="primary" onClick={fetchHealth} className="mt-4 mx-auto">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          variants={animationVariants.slideInDown}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg text-white">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Academic Health
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Intelligent insights powered by your LMS data
                </p>
              </div>
            </div>
            <Button variant="secondary" size="md" onClick={fetchHealth}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Health Score Hero */}
        <motion.div
          variants={animationVariants.slideInUp}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <HealthScoreCard
            score={data.healthScore}
            level={data.healthLevel}
            studentName={data.student.name}
          />
        </motion.div>

        {/* Quick Summary Stats */}
        <motion.div
          variants={animationVariants.slideInUp}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <StatCard
            role="student"
            icon={<BookOpen className="w-5 h-5" />}
            label="Assignments Done"
            value={`${data.summaries.assignments.submitted}/${data.summaries.assignments.total}`}
          />
          <StatCard
            role="student"
            icon={<Activity className="w-5 h-5" />}
            label="Quiz Avg Score"
            value={`${data.summaries.quizzes.averageScore}%`}
          />
          <StatCard
            role="student"
            icon={<Activity className="w-5 h-5" />}
            label="Attendance"
            value={`${data.attendance.currentPercentage}%`}
          />
          <StatCard
            role="student"
            icon={<Activity className="w-5 h-5" />}
            label="Courses Tracked"
            value={data.summaries.progress.coursesTracked}
          />
        </motion.div>

        {/* Sections */}
        <div className="space-y-10">
          <motion.section variants={animationVariants.slideInUp} initial="initial" animate="animate">
            <AttendanceHealthSection attendance={data.attendance} />
          </motion.section>

          <motion.section variants={animationVariants.slideInUp} initial="initial" animate="animate">
            <PerformancePredictorSection predictor={data.performancePredictor} />
          </motion.section>

          <motion.section variants={animationVariants.slideInUp} initial="initial" animate="animate">
            <SubjectStrengthSection
              strong={data.subjectStrengths.strong}
              average={data.subjectStrengths.average}
              weak={data.subjectStrengths.weak}
            />
          </motion.section>

          <motion.section variants={animationVariants.slideInUp} initial="initial" animate="animate">
            <RiskDetectionSection risks={data.risks} />
          </motion.section>

          <motion.section variants={animationVariants.slideInUp} initial="initial" animate="animate">
            <RecommendationsSection recommendations={data.recommendations} />
          </motion.section>

          <motion.section variants={animationVariants.slideInUp} initial="initial" animate="animate">
            <TrendChartsSection trends={data.trends} />
          </motion.section>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-10">
          Last updated: {new Date(data.generatedAt).toLocaleString()}
        </p>
      </div>
    </PageTransition>
  );
}
