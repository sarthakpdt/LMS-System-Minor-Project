import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Card } from '../../../theme/components';
import type { AcademicHealthData } from './types';

interface TrendChartsSectionProps {
  trends: AcademicHealthData['trends'];
}

const CHART_COLORS = {
  attendance: '#3b82f6',
  quiz: '#8b5cf6',
  assignment: '#10b981',
  overall: '#06b6d4',
};

function TrendChart({
  title,
  data,
  dataKey,
  color,
  suffix = '%',
}: {
  title: string;
  data: Array<{ week: string; score?: number; percentage?: number }>;
  dataKey: 'score' | 'percentage';
  color: string;
  suffix?: string;
}) {
  const chartData = data.length > 0 ? data : [{ week: 'N/A', [dataKey]: 0 }];

  return (
    <Card noPadding className="overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</p>
      </div>
      <div className="p-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11 }}
              className="text-gray-500 dark:text-gray-400"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              className="text-gray-500 dark:text-gray-400"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #fff)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value}${suffix}`, title]}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={`url(#gradient-${title})`}
              strokeWidth={2}
              dot={{ r: 3, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function TrendChartsSection({ trends }: TrendChartsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Academic Trend Visualization</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrendChart
          title="Attendance Trend"
          data={trends.attendance}
          dataKey="percentage"
          color={CHART_COLORS.attendance}
        />
        <TrendChart
          title="Quiz Trend"
          data={trends.quiz}
          dataKey="score"
          color={CHART_COLORS.quiz}
        />
        <TrendChart
          title="Assignment Trend"
          data={trends.assignment}
          dataKey="score"
          color={CHART_COLORS.assignment}
        />
        <TrendChart
          title="Overall Progress Trend"
          data={trends.overall}
          dataKey="score"
          color={CHART_COLORS.overall}
        />
      </div>

      <Card className="mt-2">
        <div className="h-56">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Combined Trend Overview</p>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={trends.overall.length > 0 ? trends.overall : [{ week: 'N/A', score: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" name="Overall" stroke={CHART_COLORS.overall} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
