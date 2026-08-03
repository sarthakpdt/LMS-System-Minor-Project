import { TrendingUp, GraduationCap, Info } from 'lucide-react';
import { Card, StatCard } from '../../../theme/components';
import type { AcademicHealthData } from './types';

interface PerformancePredictorSectionProps {
  predictor: AcademicHealthData['performancePredictor'];
}

export function PerformancePredictorSection({ predictor }: PerformancePredictorSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Performance Predictor</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          role="student"
          icon={<TrendingUp className="w-5 h-5" />}
          label="Expected Semester %"
          value={`${predictor.expectedSemesterPercentage}%`}
        />
        <StatCard
          role="student"
          icon={<GraduationCap className="w-5 h-5" />}
          label="Expected GPA"
          value={predictor.expectedGpa.toFixed(1)}
        />
        <StatCard
          role="student"
          icon={<GraduationCap className="w-5 h-5" />}
          label="Current GPA"
          value={predictor.currentGpa.toFixed(1)}
        />
      </div>

      <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">How this prediction works</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {predictor.explanation}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
