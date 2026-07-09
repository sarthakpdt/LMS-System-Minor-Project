import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, AlertCircle, BarChart3, TrendingUp,
  Award, ShieldAlert, CheckCircle2, PieChart as PieIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Badge } from '../ui/badge';

const API_BASE = 'http://localhost:5000/api';

type StudentRow = {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
  department?: string;
  semester?: string;
  level?: string;
  gpa?: number;
  score: number;
  bucket: 'Weak' | 'Medium' | 'Advanced';
};

const scoreToBucket = (score: number): 'Weak' | 'Medium' | 'Advanced' => {
  if (score < 50) return 'Weak';
  if (score < 75) return 'Medium';
  return 'Advanced';
};

const normalizeLevel = (level?: string): 'Weak' | 'Medium' | 'Advanced' | null => {
  if (!level) return null;
  const v = level.toLowerCase();
  if (v === 'beginner') return 'Weak';
  if (v === 'intermediate' || v === 'medium') return 'Medium';
  if (v === 'advanced') return 'Advanced';
  return null;
};

const DEPT_LABELS: Record<string, string> = {
  CS: 'Computer Science', IT: 'Information Technology',
  ECE: 'Electronics & Comm.', EE: 'Electrical Eng.',
  ME: 'Mechanical Eng.', CE: 'Civil Eng.',
  CH: 'Chemical Eng.', BT: 'Biotechnology',
  MBA: 'MBA', MCA: 'MCA',
  Other: 'Other'
};

const Analytics: React.FC = () => {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/admin/students/approved`);
        const data = await res.json();
        if (!data?.success) throw new Error(data?.message || 'Failed to load students');

        const rows: StudentRow[] = (data.data || []).map((s: any) => {
          const gpa = Number(s.gpa || 0);
          const scoreFromGpa = Math.max(0, Math.min(100, Math.round((gpa / 4) * 100)));
          const scoreFromCourses = Array.isArray(s.courses) && s.courses.length > 0
            ? Math.round(
                s.courses.reduce((sum: number, c: any) => sum + Number(c.marks || 0), 0) / s.courses.length
              )
            : null;
          const score = scoreFromCourses ?? scoreFromGpa;
          const levelBucket = normalizeLevel(s.level);
          const bucket = levelBucket || scoreToBucket(score);

          return {
            _id: s._id,
            name: s.name || 'Student',
            email: s.email || '',
            studentId: s.studentId || '',
            department: s.department || '',
            semester: s.semester || '',
            level: s.level || '',
            gpa,
            score,
            bucket,
          };
        });

        setStudents(rows);
      } catch (e: any) {
        setError(e?.message || 'Could not load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totals = useMemo(() => {
    const weak = students.filter(s => s.bucket === 'Weak');
    const medium = students.filter(s => s.bucket === 'Medium');
    const advanced = students.filter(s => s.bucket === 'Advanced');
    const sortedAll = [...students].sort((a, b) => b.score - a.score);
    return {
      weak,
      medium,
      advanced,
      sortedAll,
      avgScore: students.length ? Math.round(students.reduce((sum, s) => sum + s.score, 0) / students.length) : 0,
    };
  }, [students]);

  const topN = (arr: StudentRow[], n = 5) => [...arr].sort((a, b) => b.score - a.score).slice(0, n);

  const topWeak = topN(totals.weak, 5);
  const topMedium = topN(totals.medium, 5);
  const topAdvanced = topN(totals.advanced, 5);
  const topOverall = topN(totals.sortedAll, 10);

  // Chart configs
  const barChartData = [
    { name: 'Weak', count: totals.weak.length, fill: '#ef4444' },
    { name: 'Medium', count: totals.medium.length, fill: '#f59e0b' },
    { name: 'Advanced', count: totals.advanced.length, fill: '#10b981' }
  ];

  const pieChartData = [
    { name: 'Weak (< 50%)', value: totals.weak.length, color: '#ef4444' },
    { name: 'Medium (50%-75%)', value: totals.medium.length, color: '#f59e0b' },
    { name: 'Advanced (>= 75%)', value: totals.advanced.length, color: '#10b981' }
  ].filter(item => item.value > 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32 dynamic-text-muted gap-2">
      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <span>Loading analytics console...</span>
    </div>
  );

  if (error) return (
    <div className="p-8 max-w-lg mx-auto mt-12 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-3xl flex items-center gap-3">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{error}</span>
    </div>
  );

  const ListCard = ({ title, subtitle, rows, gradientHeader, borderStyle, icon: Icon }: { title: string; subtitle: string; rows: StudentRow[]; gradientHeader: string; borderStyle: string; icon: any }) => (
    <div className="premium-glass neon-glow rounded-[2rem] overflow-hidden flex flex-col justify-between border border-white/10 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <div className={`p-5 text-white ${gradientHeader} flex items-center justify-between`}>
        <div>
          <h3 className="text-sm font-black tracking-wide">{title}</h3>
          <p className="text-[10px] text-white/80 font-medium mt-0.5">{subtitle}</p>
        </div>
        <Icon className="w-5 h-5 text-white/90" />
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-center text-xs dynamic-text-muted">No students in this bucket.</div>
      ) : (
        <div className="p-5 space-y-3">
          {rows.map((s, i) => (
            <div key={s._id} className={`flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-900/30 border border-transparent ${borderStyle} transition-all`}>
              <div className="min-w-0">
                <div className="text-xs font-bold dynamic-text-white truncate">
                  {i + 1}. {s.name}
                </div>
                <div className="text-[10px] dynamic-text-muted font-mono mt-0.5">
                  {s.studentId || 'N/A'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black dynamic-text-white">{s.score}%</div>
                <div className="text-[10px] dynamic-text-muted font-medium mt-0.5">GPA {s.gpa?.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black dynamic-text-white tracking-wide flex items-center gap-3">
          📊 Student Performance Analytics
        </h1>
        <p className="dynamic-text-muted text-sm mt-1.5">
          Global academic health metrics, score aggregates, and student bucket distributions.
        </p>
      </div>

      {/* Metric Cards Row */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { label: 'Total Approved Students', value: students.length, icon: Users, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30 border-purple-200/50 dark:border-purple-800/20' },
          { label: 'Weak Bucket Students', value: totals.weak.length, icon: ShieldAlert, color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30 border-red-200/50 dark:border-red-800/20' },
          { label: 'Medium Bucket Students', value: totals.medium.length, icon: TrendingUp, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30 border-amber-200/50 dark:border-amber-800/20' },
          { label: 'Advanced Bucket Students', value: totals.advanced.length, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30 border-emerald-200/50 dark:border-emerald-800/20' },
        ].map((c, idx) => (
          <div key={idx} className="premium-glass neon-glow rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 border border-white/10 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-3xl font-black dynamic-text-white leading-none mb-1.5">{c.value}</p>
              <p className="text-[10px] font-bold dynamic-text-muted uppercase tracking-wider">{c.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Score Snapshot Banner */}
      <motion.div
        variants={itemVariants}
        className="premium-glass neon-glow p-5 rounded-2xl flex items-center justify-between gap-4 flex-wrap hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-xl">
            ✨
          </div>
          <div>
            <h3 className="text-sm font-bold dynamic-text-white">Class Academic Snapshot</h3>
            <p className="text-xs dynamic-text-muted mt-0.5">
              The overall average score of the approved student cohort is <strong className="text-indigo-600 dark:text-indigo-400">{totals.avgScore}%</strong>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Visual Analytics Graphs */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Bar Chart Bucket Count */}
        <div className="premium-glass neon-glow p-6 rounded-[2rem] space-y-4 border border-white/10 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div>
            <h3 className="font-bold text-base dynamic-text-white">Bucket Distribution</h3>
            <p className="text-xs dynamic-text-muted">Student enrollment counts per evaluation bucket</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={45}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart Bucket Ratio */}
        <div className="premium-glass neon-glow p-6 rounded-[2rem] space-y-4 flex flex-col justify-between border border-white/10 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div>
            <h3 className="font-bold text-base dynamic-text-white">Bucket Ratios</h3>
            <p className="text-xs dynamic-text-muted">Comparative percentages of student levels</p>
          </div>
          <div className="h-44 relative flex items-center justify-center">
            {pieChartData.length === 0 ? (
              <p className="text-xs text-gray-400">No chart data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute text-center">
              <PieIcon className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="text-[10px] uppercase font-bold text-gray-400">Ratios</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-gray-50 dark:border-slate-700/30 pt-4">
            {pieChartData.map((item, idx) => (
              <div key={idx}>
                <p className="font-bold dynamic-text-white">{item.value}</p>
                <p className="text-[10px] dynamic-text-muted truncate mt-0.5">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Top Bucket Performers Row */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <ListCard
          title="Top Weak Students"
          subtitle="Highest scores in Weak bucket"
          rows={topWeak}
          gradientHeader="bg-gradient-to-r from-red-500 to-rose-600 shadow-md shadow-red-500/10"
          borderStyle="hover:border-red-500/20"
          icon={ShieldAlert}
        />
        <ListCard
          title="Top Medium Students"
          subtitle="Highest scores in Medium bucket"
          rows={topMedium}
          gradientHeader="bg-gradient-to-r from-amber-500 to-orange-600 shadow-md shadow-amber-500/10"
          borderStyle="hover:border-amber-500/20"
          icon={TrendingUp}
        />
        <ListCard
          title="Top Advanced Students"
          subtitle="Highest scores in Advanced bucket"
          rows={topAdvanced}
          gradientHeader="bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/10"
          borderStyle="hover:border-emerald-500/20"
          icon={CheckCircle2}
        />
      </motion.div>

      {/* Top Students Overall Table */}
      <motion.div
        variants={itemVariants}
        className="premium-glass rounded-[2.5rem] overflow-hidden neon-glow border border-white/10 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
      >
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base dynamic-text-white">🏆 Overall Leaderboard</h3>
            <p className="text-xs dynamic-text-muted mt-0.5">Top 10 performing students across all courses</p>
          </div>
          <Award className="w-5 h-5 text-amber-500" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-900/30 dynamic-text-muted border-b border-gray-100 dark:border-slate-700/50 font-semibold text-xs uppercase tracking-wider text-left">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Bucket</th>
                <th className="px-6 py-4">Avg. Score</th>
                <th className="px-6 py-4 text-right">GPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/30">
              {topOverall.map((s, i) => (
                <tr key={s._id} className="hover:bg-gray-50/40 dark:hover:bg-slate-900/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-purple-600 dark:text-purple-400">#{i + 1}</td>
                  <td className="px-6 py-4 font-bold dynamic-text-white">{s.name}</td>
                  <td className="px-6 py-4 font-mono text-xs dynamic-text-muted">{s.studentId || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-400">
                    {DEPT_LABELS[s.department || ''] || s.department || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={
                        s.bucket === 'Advanced' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' :
                        s.bucket === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' :
                        'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'
                      }
                    >
                      {s.bucket}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-bold dynamic-text-white">{s.score}%</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-slate-300">
                    {s.gpa?.toFixed(2) || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Analytics;