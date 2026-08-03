import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, ProgressRing } from '../../../theme/components';
import type { HealthLevel } from './types';

const LEVEL_COLORS: Record<HealthLevel, { ring: 'blue' | 'green' | 'orange' | 'red' | 'purple'; badge: string; gradient: string }> = {
  Excellent: { ring: 'green', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', gradient: 'from-emerald-500 to-teal-600' },
  Good: { ring: 'blue', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', gradient: 'from-blue-500 to-cyan-600' },
  Moderate: { ring: 'orange', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', gradient: 'from-amber-500 to-orange-500' },
  Warning: { ring: 'orange', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', gradient: 'from-orange-500 to-red-500' },
  Critical: { ring: 'red', badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', gradient: 'from-red-500 to-rose-600' },
};

interface HealthScoreCardProps {
  score: number;
  level: HealthLevel;
  studentName: string;
}

export function HealthScoreCard({ score, level, studentName }: HealthScoreCardProps) {
  const colors = LEVEL_COLORS[level];

  return (
    <Card role="student" gradient className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-[0.06]`} />
      <div className="relative flex flex-col md:flex-row items-center gap-8">
        <div className="flex-shrink-0">
          <ProgressRing
            progress={score}
            size="lg"
            color={colors.ring}
            label={`${score}`}
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <div className={`p-2 bg-gradient-to-br ${colors.gradient} rounded-lg text-white`}>
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Health Score</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Comprehensive assessment for <span className="font-semibold text-gray-900 dark:text-white">{studentName}</span>
          </p>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${colors.badge}`}>
              {level}
            </span>
          </motion.div>
          <div className="mt-4 grid grid-cols-5 gap-1 text-xs text-gray-500 dark:text-gray-400">
            {[
              { range: '0-39', label: 'Critical' },
              { range: '40-59', label: 'Warning' },
              { range: '60-74', label: 'Moderate' },
              { range: '75-89', label: 'Good' },
              { range: '90-100', label: 'Excellent' },
            ].map((item) => (
              <div
                key={item.label}
                className={`text-center py-1 rounded ${item.label === level ? 'bg-gray-100 dark:bg-gray-700 font-semibold text-gray-900 dark:text-white' : ''}`}
              >
                <div>{item.range}</div>
                <div className="truncate">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
