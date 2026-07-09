// File: frontend/src/components/attendance/AttendanceDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Loader2, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceCard } from './AttendanceCard';
import { getDemoAttendancePayload, getDemoSmartPredictorPayload } from './getDemoAttendancePayload';
import { toast } from 'sonner';

interface PredictorCardProps {
  subject: string;
  courseCode: string;
  current: number;
  predicted: number;
  leavesRemaining: number;
  trend: string;
  riskLevel: 'low' | 'medium' | 'high' | string;
  insights: string;
  recovery: string;
  planner: string;
}

const PredictorCard: React.FC<PredictorCardProps> = ({
  subject,
  courseCode,
  current,
  predicted,
  leavesRemaining,
  trend,
  riskLevel,
  insights,
  recovery,
  planner
}) => {
  let cardBorder = 'border-emerald-200 dark:border-emerald-900/40';
  let cardBg = 'bg-emerald-50/10 dark:bg-emerald-950/5';
  let riskTextClass = 'text-emerald-600 dark:text-emerald-400 font-bold';
  let riskLabel = 'Low';

  if (riskLevel === 'medium') {
    cardBorder = 'border-yellow-255 dark:border-yellow-900/40';
    cardBg = 'bg-yellow-50/10 dark:bg-yellow-950/5';
    riskTextClass = 'text-yellow-600 dark:text-yellow-400 font-bold';
    riskLabel = 'Medium';
  } else if (riskLevel === 'high') {
    cardBorder = 'border-red-200 dark:border-red-900/40';
    cardBg = 'bg-red-50/10 dark:bg-red-950/5';
    riskTextClass = 'text-red-600 dark:text-red-400 font-bold';
    riskLabel = 'High';
  }

  return (
    <div className={`rounded-2xl border ${cardBorder} ${cardBg} p-5 shadow-sm hover:shadow-md transition-all duration-300`}>
      {/* Course Title */}
      <h4 className="text-base font-bold text-gray-800 dark:text-white mb-4">
        {subject} <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">({courseCode})</span>
      </h4>

      {/* Grid columns */}
      <div className="grid grid-cols-3 gap-2 text-center pb-4 border-b border-gray-250/60 dark:border-gray-800/60 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Current</p>
          <p className="text-lg font-extrabold text-gray-800 dark:text-white mt-1">{current}%</p>
        </div>
        <div className="border-x border-gray-250/60 dark:border-gray-800/60">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Predicted</p>
          <p className="text-lg font-extrabold text-gray-800 dark:text-white mt-1 flex items-center justify-center gap-1">
            {predicted}%
            <span className={`text-sm font-extrabold ${riskLevel === 'high' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {trend}
            </span>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {riskLevel === 'high' ? 'Trend' : riskLevel === 'medium' ? 'Trend' : 'Leaves remaining'}
          </p>
          <p className="text-lg font-extrabold text-gray-800 dark:text-white mt-1">
            {riskLevel === 'high' ? 'Buffer —' : riskLevel === 'medium' ? `Buffer ${leavesRemaining}` : leavesRemaining}
          </p>
        </div>
      </div>

      {/* Row details */}
      <div className="space-y-2.5 text-xs">
        <div className="flex items-start gap-1">
          <span className="font-bold text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Risk:</span>
          <span className={riskTextClass}>{riskLabel}</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="font-bold text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Insights:</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">{insights}</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="font-bold text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Recovery:</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">{recovery}</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="font-bold text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Planner:</span>
          <span className="text-gray-700 dark:text-gray-300 font-semibold">{planner}</span>
        </div>
      </div>
    </div>
  );
};

export const AttendanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [overall, setOverall] = useState<any>(null);
  const [demoMode, setDemoMode] = useState<boolean>(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/attendance/student/${user.id}`
        );
        const data = await res.json();

        if (data.success) {
          setSubjects(data.subjects || []);
          setOverall(data.analytics || null);
          if (data.subjects && data.subjects.length > 0) {
            setDemoMode(false);
          }
        }
      } catch (e) {
        console.error('Attendance fetch error', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const handleExport = () => {
    toast.success('Exporting Data', {
      description: 'Preparing your PDF/Excel report. Downloading shortly...',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-600">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-600" /> Loading attendance dashboard…
      </div>
    );
  }

  const cardsData = demoMode ? getDemoAttendancePayload() : subjects;
  const predictorData = demoMode
    ? getDemoSmartPredictorPayload()
    : subjects
        .filter((sub: any) => sub.attendancePercentage !== undefined)
        .map((sub: any) => {
          const pct = sub.attendancePercentage;
          const risk = pct >= 75 ? 'low' : pct >= 65 ? 'medium' : 'high';
          const leaves = sub.safeLeavesRemaining ?? 0;
          const needed = sub.classesNeededFor75 ?? 0;
          return {
            subject: sub.subject,
            courseCode: sub.courseCode,
            current: Math.round(pct),
            predicted: Math.round(sub.predictedAttendance ?? pct),
            leavesRemaining: leaves,
            trend: pct >= (sub.predictedAttendance ?? pct) ? '↓' : '~',
            riskLevel: risk,
            insights: risk === 'low' ? 'Excellent consistency, likely above 85%' : risk === 'medium' ? 'Decline, avoid missing >1' : 'Decline, attendance below 75%',
            recovery: risk === 'low' ? 'None' : risk === 'medium' ? 'Maintain presents' : `Need ${needed} consecutive presents to reach 75%`,
            planner: risk === 'low' ? `Can safely miss ${leaves} classes` : risk === 'medium' ? `Can safely miss ${leaves} class` : 'Cannot miss any class'
          };
        });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-900/5 rounded-3xl">
      {/* Dynamic Header matching Mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap">
            <span>Student Portal</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <span className="text-gray-800 dark:text-gray-200">Course Attendance</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            My Course-wise Attendance & AI Predictor
          </p>
        </div>

        {/* Action items: Mode Toggle & Student Avatar */}
        <div className="flex items-center gap-4 mt-4 sm:mt-0 flex-wrap">
          {/* Demo Mode / Real Data toggle pill */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                if (subjects.length > 0) {
                  setDemoMode(false);
                  toast.info('Switched to Live database data.');
                } else {
                  toast.error('No live attendance data found in backend.');
                }
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                !demoMode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer'
              }`}
            >
              Live Data
            </button>
            <button
              onClick={() => {
                setDemoMode(true);
                toast.info('Loaded demo examples from design mockup.');
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                demoMode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer'
              }`}
            >
              Demo Examples
            </button>
          </div>

          <div className="flex items-center gap-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-2xl shadow-xs max-w-fit">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-sm shadow-blue-500/20 uppercase">
              {user?.name?.slice(0, 1) || 'S'}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-none">
                {user?.name || 'Student A'}
              </p>
              <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                Student
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Course-wise Attendance Cards Section */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cardsData.map((sub, i) => (
          <AttendanceCard key={i} subject={sub} />
        ))}
      </div>

      {/* Course-wise Smart Attendance Predictor Section */}
      {predictorData.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Course-wise Smart Attendance Predictor
            </h3>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-750 dark:text-gray-200 font-bold px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs transition-all active:scale-[0.98] text-sm"
            >
              <span>Export (PDF/Excel)</span>
            </button>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {predictorData.map((pred, i) => (
              <PredictorCard
                key={i}
                subject={pred.subject}
                courseCode={pred.courseCode}
                current={pred.current}
                predicted={pred.predicted}
                leavesRemaining={pred.leavesRemaining}
                trend={pred.trend}
                riskLevel={pred.riskLevel}
                insights={pred.insights}
                recovery={pred.recovery}
                planner={pred.planner}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
