// File: src/components/attendance/PredictionPanel.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge'; // shadcn/ui Badge

interface PredictionPanelProps {
  predictedAttendance?: number;
  safeLeavesRemaining?: number;
  classesNeededFor75?: number;
  risk?: string;
}

/**
 * Displays smart attendance predictor details for a course.
 * Uses badges styled with Tailwind/shadcn UI.
 */
export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  predictedAttendance,
  safeLeavesRemaining,
  classesNeededFor75,
  risk,
}) => {
  const renderValue = (value?: number) => (value !== undefined ? value : '—');

  const riskColor =
    risk === 'low'
      ? 'text-emerald-600'
      : risk === 'medium'
      ? 'text-amber-600'
      : risk === 'high'
      ? 'text-red-600'
      : 'text-gray-600';

  return (
    <div className="mt-4 space-y-2 rounded border border-gray-100 bg-gray-50 p-3">
      <h4 className="text-sm font-medium text-gray-700">Prediction</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Projected %</span>
          <Badge variant="outline" className="ml-2">
            {renderValue(predictedAttendance)}%
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Safe Leaves</span>
          <Badge variant="outline" className="ml-2">
            {renderValue(safeLeavesRemaining)}
          </Badge>
        </div>
        <div className="flex items-center justify-between col-span-2">
          <span className="text-gray-600">Classes needed to reach 75%</span>
          <Badge variant="outline" className="ml-2">
            {renderValue(classesNeededFor75)}
          </Badge>
        </div>
        {risk && (
          <div className="flex items-center justify-between col-span-2">
            <span className="text-gray-600">Risk</span>
            <span className={riskColor}>{risk.charAt(0).toUpperCase() + risk.slice(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
